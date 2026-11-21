import {
  rxMutation,
  withDevtools,
  withMutations,
  withResource,
} from '@angular-architects/ngrx-toolkit';
import { httpResource } from '@angular/common/http';
import { inject } from '@angular/core';
import { forkJoin } from 'rxjs';
import { patchState, signalStore, withMethods, withState } from '@ngrx/signals';
import { ActivityType } from './activity';
import { ActivityClient } from './activity-client';
import { Task, TaskDraft } from './task';
import { TaskClient } from './task-client';
import { MovePlan } from '../util/task-order';

/** Detail/edit state of a single task: the task being edited and create, update, delete. */
export const TaskDetailStore = signalStore(
  { providedIn: 'root' },
  withState({
    editId: null as string | null,
    creating: false,
    /** Grows after every successful write, so a list can reload without knowing this store. */
    changeCount: 0,
  }),
  withResource(
    ({ editId }) => {
      const client = inject(TaskClient);
      return {
        task: httpResource<Task>(() => {
          const id = editId();
          return id === null ? undefined : client.detailRequest(id);
        }),
      };
    },
    { errorHandling: 'undefined value' },
  ),
  withMutations((store) => {
    const client = inject(TaskClient);
    const activity = inject(ActivityClient);
    /** The log is a side effect: if it fails, the task change itself still counts as done. */
    const logActivity = (type: ActivityType, taskId: string, taskTitle: string) =>
      activity
        .record({ type, taskId, taskTitle, timestamp: new Date().toISOString() })
        .subscribe({ error: () => undefined });
    /** Closes the dialog, tells lists that the data changed and logs the change. */
    const onSuccess = (type: ActivityType, taskId: string, taskTitle: string) => {
      patchState(store, {
        editId: null,
        creating: false,
        changeCount: store.changeCount() + 1,
      });
      logActivity(type, taskId, taskTitle);
    };
    return {
      create: rxMutation({
        operation: (draft: TaskDraft) => client.create(draft),
        onSuccess: (task, draft) => onSuccess('created', task.id, draft.title),
      }),
      update: rxMutation({
        operation: (change: { id: string; draft: TaskDraft }) =>
          client.update(change.id, change.draft),
        onSuccess: (_task, change) => onSuccess('updated', change.id, change.draft.title),
      }),
      /**
       * Saves a card dropped on the board: one patch for every task whose place or status
       * changed. A move is one change, however many tasks it writes, and it is only logged when
       * the task changed column. A plain reorder is not an edit of the task.
       */
      move: rxMutation({
        operation: (plan: Pick<MovePlan<unknown>, 'writes' | 'statusChange'>) =>
          forkJoin(plan.writes.map((write) => client.reposition(write.id, write.changes))),
        onSuccess: (_tasks, plan) => {
          patchState(store, { changeCount: store.changeCount() + 1 });
          if (plan.statusChange) {
            logActivity('updated', plan.statusChange.id, plan.statusChange.title);
          }
        },
      }),
      remove: rxMutation({
        operation: (task: Pick<Task, 'id' | 'title'>) => client.remove(task.id),
        onSuccess: (_result, task) => onSuccess('deleted', task.id, task.title),
      }),
    };
  }),
  withMethods((store) => ({
    startEdit(id: string): void {
      patchState(store, { editId: id });
    },
    startCreate(): void {
      patchState(store, { editId: null, creating: true });
    },
    cancelEdit(): void {
      patchState(store, { editId: null, creating: false });
    },
  })),
  withDevtools('taskDetail'),
);
