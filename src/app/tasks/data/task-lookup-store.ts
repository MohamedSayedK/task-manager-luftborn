import { withDevtools, withResource } from '@angular-architects/ngrx-toolkit';
import { httpResource } from '@angular/common/http';
import { inject } from '@angular/core';
import { signalStore, withMethods } from '@ngrx/signals';
import { Assignee } from './task';
import { TaskClient } from './task-client';

/** Lookup data for the tasks domain, e.g. the assignee picker and the assignee filter. */
export const TaskLookupStore = signalStore(
  { providedIn: 'root' },
  withResource(
    () => {
      const client = inject(TaskClient);
      return {
        assignees: httpResource<Assignee[]>(() => client.assigneesRequest(), { defaultValue: [] }),
      };
    },
    { errorHandling: 'previous value' },
  ),
  withMethods((store) => ({
    reload: () => store._assigneesReload(),
  })),
  withDevtools('taskLookup'),
);
