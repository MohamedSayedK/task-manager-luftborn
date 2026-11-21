import { withDevtools, withResource } from '@angular-architects/ngrx-toolkit';
import { httpResource } from '@angular/common/http';
import { computed, inject } from '@angular/core';
import { signalStore, withComputed, withMethods } from '@ngrx/signals';
import { HttpResponseCache } from '../../shared/util/http-response-cache';
import { Paginated, TaskSummary } from './dashboard';
import { DashboardClient } from './dashboard-client';

const EMPTY_PAGE: Paginated<TaskSummary> = { data: [], items: 0 };

/** All tasks in the small shape the dashboard counts from. Reloads when tasks are written. */
export const TaskSummaryStore = signalStore(
  { providedIn: 'root' },
  withResource(
    () => {
      const client = inject(DashboardClient);
      const cache = inject(HttpResponseCache);
      return {
        page: httpResource<Paginated<TaskSummary>>(
          () => {
            // Reading the change counter makes the resource load again after a task write.
            cache.changes('/api/tasks');
            return client.taskSummariesRequest();
          },
          { defaultValue: EMPTY_PAGE },
        ),
      };
    },
    { errorHandling: 'previous value' },
  ),
  withComputed((store) => ({
    tasks: computed(() => store.pageValue.data()),
  })),
  withMethods((store) => ({
    reload: () => store._pageReload(),
  })),
  withDevtools('dashboardTasks'),
);
