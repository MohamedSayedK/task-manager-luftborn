import { withDevtools, withResource } from '@angular-architects/ngrx-toolkit';
import { httpResource } from '@angular/common/http';
import { computed, inject } from '@angular/core';
import { signalStore, withComputed, withMethods } from '@ngrx/signals';
import { HttpResponseCache } from '../../shared/util/http-response-cache';
import { ActivityItem, Paginated } from './dashboard';
import { DashboardClient } from './dashboard-client';

/** How many entries the recent activity feed shows. */
const FEED_SIZE = 10;

const EMPTY_PAGE: Paginated<ActivityItem> = { data: [], items: 0 };

/** The most recent task changes, newest first. Reloads when a new entry was recorded. */
export const ActivityStore = signalStore(
  { providedIn: 'root' },
  withResource(
    () => {
      const client = inject(DashboardClient);
      const cache = inject(HttpResponseCache);
      return {
        page: httpResource<Paginated<ActivityItem>>(
          () => {
            cache.changes('/api/activity');
            return client.activityRequest(FEED_SIZE);
          },
          { defaultValue: EMPTY_PAGE },
        ),
      };
    },
    { errorHandling: 'previous value' },
  ),
  withComputed((store) => ({
    items: computed(() => store.pageValue.data()),
  })),
  withMethods((store) => ({
    reload: () => store._pageReload(),
  })),
  withDevtools('dashboardActivity'),
);
