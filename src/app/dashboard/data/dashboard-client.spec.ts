import { TestBed } from '@angular/core/testing';
import { DashboardClient } from './dashboard-client';

describe('DashboardClient', () => {
  const client = () => TestBed.inject(DashboardClient);

  it('describes the statistics request', () => {
    expect(client().statisticsRequest()).toEqual({ url: '/api/statistics' });
  });

  it('describes a request for all tasks on one page', () => {
    expect(client().taskSummariesRequest()).toEqual({
      url: '/api/tasks',
      params: { _page: 1, _per_page: 200 },
    });
  });

  it('describes a request for the newest activity first', () => {
    expect(client().activityRequest(10)).toEqual({
      url: '/api/activity',
      params: { _sort: '-timestamp', _page: 1, _per_page: 10 },
    });
  });
});
