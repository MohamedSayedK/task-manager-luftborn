import { withDevtools, withResource } from '@angular-architects/ngrx-toolkit';
import { httpResource } from '@angular/common/http';
import { computed, inject } from '@angular/core';
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';
import { Paginated, Task, TaskPriority, TaskStatus } from '../data/task';
import { TaskClient } from '../data/task-client';

export interface TaskFilters {
  status: TaskStatus | undefined;
  priority: TaskPriority | undefined;
  assigneeId: string | undefined;
  /** Matched against title and description. */
  search: string;
}

export type TaskColumns = Record<TaskStatus, Task[]>;

/**
 * The board shows every task grouped by status, so there is no page navigation. The store
 * requests page 1 with a page size large enough for the whole board.
 */
const BOARD_PAGE_SIZE = 200;

const EMPTY_PAGE: Paginated<Task> = {
  data: [],
  first: 1,
  prev: null,
  next: null,
  last: 1,
  pages: 1,
  items: 0,
};

/** Search/list state of tasks: the active filters and the matching tasks. */
export const TaskSearchStore = signalStore(
  { providedIn: 'root' },
  withState<TaskFilters>({
    status: undefined,
    priority: undefined,
    assigneeId: undefined,
    search: '',
  }),
  withResource(
    (store) => {
      const client = inject(TaskClient);
      // Named resource: an unnamed one would add a `status` member that collides with the
      // `status` filter above.
      return {
        page: httpResource<Paginated<Task>>(
          () =>
            client.searchRequest({
              page: 1,
              pageSize: BOARD_PAGE_SIZE,
              status: store.status(),
              priority: store.priority(),
              assigneeId: store.assigneeId(),
              search: store.search(),
            }),
          { defaultValue: EMPTY_PAGE },
        ),
      };
    },
    { errorHandling: 'previous value' },
  ),
  withComputed((store) => ({
    tasks: computed(() => store.pageValue.data()),
    columns: computed(() => groupByStatus(store.pageValue.data())),
  })),
  withMethods((store) => ({
    setFilters(filters: Partial<TaskFilters>): void {
      patchState(store, filters);
    },
    reload: () => store._pageReload(),
  })),
  withDevtools('taskSearch'),
);

function groupByStatus(tasks: Task[]): TaskColumns {
  const columns: TaskColumns = { todo: [], in_progress: [], done: [] };
  for (const task of tasks) {
    columns[task.status].push(task);
  }
  return columns;
}
