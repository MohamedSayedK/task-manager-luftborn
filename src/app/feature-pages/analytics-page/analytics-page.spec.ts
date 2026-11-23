import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Component, input } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { TranslocoService } from '@jsverse/transloco';
import { UIChart } from 'primeng/chart';
import { AnalyticsOverview } from '../../dashboard/feature-analytics/analytics-overview/analytics-overview';
import { AnalyticsPage } from './analytics-page';

/** jsdom has no canvas, so the chart component is replaced. */
@Component({ selector: 'p-chart', template: '' })
class ChartStub {
  readonly type = input<string>();
  readonly data = input<unknown>();
  readonly options = input<unknown>();
}

describe('AnalyticsPage', () => {
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    TestBed.overrideComponent(AnalyticsOverview, {
      remove: { imports: [UIChart] },
      add: { imports: [ChartStub] },
    });
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('words the title of the recent activity in Arabic', async () => {
    TestBed.inject(TranslocoService).setActiveLang('ar');
    const fixture = TestBed.createComponent(AnalyticsPage);
    fixture.detectChanges();
    http.match((req) => req.url === '/api/statistics').forEach((req) => req.flush([]));
    http
      .match((req) => req.url === '/api/tasks')
      .forEach((req) => req.flush({ data: [], items: 0 }));
    http.expectOne((req) => req.url === '/api/activity').flush({ data: [], items: 0 });
    await fixture.whenStable();
    fixture.detectChanges();

    const section = fixture.nativeElement.querySelector('section[aria-label="آخر النشاطات"]');
    expect(section?.querySelector('h2')?.textContent?.trim()).toBe('آخر النشاطات');
  });

  it('shows the charts and the recent activity', async () => {
    const fixture = TestBed.createComponent(AnalyticsPage);
    fixture.detectChanges();
    http.match((req) => req.url === '/api/statistics').forEach((req) => req.flush([]));
    http
      .match((req) => req.url === '/api/tasks')
      .forEach((req) => req.flush({ data: [], items: 0 }));
    http
      .expectOne((req) => req.url === '/api/activity')
      .flush({
        data: [
          {
            id: '1',
            type: 'created',
            taskId: 'task-001',
            taskTitle: 'Write docs',
            timestamp: new Date().toISOString(),
          },
        ],
        items: 1,
      });
    await fixture.whenStable();
    fixture.detectChanges();

    const root: HTMLElement = fixture.nativeElement;
    expect(root.querySelector('section[aria-label="Tasks by priority"]')).not.toBeNull();
    expect(root.querySelector('section[aria-label="Tasks by status"]')).not.toBeNull();
    expect(root.querySelector('section[aria-label="Recent activity"]')?.textContent).toContain(
      'Task "Write docs" was created',
    );
  });
});
