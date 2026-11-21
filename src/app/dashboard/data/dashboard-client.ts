import { HttpResourceRequest } from '@angular/common/http';
import { Injectable } from '@angular/core';

const API = '/api';

/**
 * Stateless data access for the dashboard. Reads are request descriptors for `httpResource`.
 * Only stores may use this class.
 */
@Injectable({ providedIn: 'root' })
export class DashboardClient {
  /** Responds with `Statistic[]`. */
  statisticsRequest(): HttpResourceRequest {
    return { url: `${API}/statistics` };
  }

  /** Responds with `Paginated<TaskSummary>`: every task on one page. */
  taskSummariesRequest(): HttpResourceRequest {
    return { url: `${API}/tasks`, params: { _page: 1, _per_page: 200 } };
  }

  /** Responds with `Paginated<ActivityItem>`, newest first. */
  activityRequest(limit: number): HttpResourceRequest {
    return {
      url: `${API}/activity`,
      params: { _sort: '-timestamp', _page: 1, _per_page: limit },
    };
  }
}
