import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { DashboardPage } from './dashboard-page';

describe('DashboardPage', () => {
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    });
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('shows the statistic cards above the task board', async () => {
    const fixture = TestBed.createComponent(DashboardPage);
    fixture.detectChanges();
    http.expectOne('/api/statistics').flush([
      {
        id: 'stat-001',
        title: 'Total Tasks',
        icon: '📊',
        value: 1,
        change: '+1',
        changeLabel: 'this week',
        changeType: 'positive',
        color: '#1976D2',
      },
    ]);
    http
      .match((req) => req.url === '/api/tasks')
      .forEach((req) => req.flush({ data: [], items: 0 }));
    http.match((req) => req.url === '/api/users').forEach((req) => req.flush([]));
    await fixture.whenStable();
    fixture.detectChanges();

    const root: HTMLElement = fixture.nativeElement;
    const cards = root.querySelector('app-statistics-overview');
    const board = root.querySelector('app-task-search');
    expect(cards?.querySelector('article[aria-label="Total Tasks"]')).not.toBeNull();
    expect(board?.querySelector('section[aria-label="To Do"]')).not.toBeNull();
    expect(cards!.compareDocumentPosition(board!) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });
});
