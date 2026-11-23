import { withDevtools, withResource } from '@angular-architects/ngrx-toolkit';
import { httpResource } from '@angular/common/http';
import { inject } from '@angular/core';
import { signalStore, withMethods } from '@ngrx/signals';
import { Statistic } from './dashboard';
import { DashboardClient } from './dashboard-client';

/** The statistic card definitions (title, icon, color) from `/statistics`. */
export const StatisticsStore = signalStore(
  { providedIn: 'root' },
  withResource(
    () => {
      const client = inject(DashboardClient);
      return {
        statistics: httpResource<Statistic[]>(() => client.statisticsRequest(), {
          defaultValue: [],
        }),
      };
    },
    { errorHandling: 'previous value' },
  ),
  withMethods((store) => ({
    reload: () => store._statisticsReload(),
  })),
  withDevtools('dashboardStatistics'),
);
