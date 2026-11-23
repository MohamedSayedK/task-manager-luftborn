import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ApplicationRef } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { cacheInterceptor } from '../../shared/data/cache-interceptor';
import { Statistic, TaskSummary } from './dashboard';
import { DashboardCoordinator } from './dashboard-coordinator';

const statistic = (id: string, title: string, overrides: Partial<Statistic> = {}): Statistic => ({
  id,
  title,
  icon: '📊',
  value: 999,
  color: '#1976D2',
  ...overrides,
});

const STATISTICS = [
  statistic('stat-001', 'Total Tasks'),
  statistic('stat-002', 'Completed', { color: '#388E3C' }),
  statistic('stat-003', 'In Progress'),
  statistic('stat-004', 'To Do', { color: '#7B1FA2' }),
];

const task = (overrides: Partial<TaskSummary>): TaskSummary => ({
  status: 'todo',
  priority: 'medium',
  dueDate: '2999-01-01',
  ...overrides,
});

describe('DashboardCoordinator', () => {
  let http: HttpTestingController;
  let coordinator: DashboardCoordinator;

  /** Answers the statistics and the task request and waits until the data is applied. */
  async function load(tasks: TaskSummary[], statistics: Statistic[] = STATISTICS): Promise<void> {
    TestBed.tick();
    http.expectOne('/api/statistics').flush(statistics);
    http.expectOne((req) => req.url === '/api/tasks').flush({ data: tasks, items: tasks.length });
    await TestBed.inject(ApplicationRef).whenStable();
  }

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([cacheInterceptor])),
        provideHttpClientTesting(),
      ],
    });
    http = TestBed.inject(HttpTestingController);
    coordinator = TestBed.inject(DashboardCoordinator);
  });

  afterEach(() => http.verify());

  it('shows counts of the real tasks on cards that keep the look of the statistics', async () => {
    await load([
      task({ status: 'todo' }),
      task({ status: 'in_progress' }),
      task({ status: 'done' }),
      task({ status: 'done' }),
    ]);

    expect(coordinator.cards().map((card) => [card.title, card.value])).toEqual([
      ['Total Tasks', 4],
      ['Completed', 2],
      ['In Progress', 1],
      ['To Do', 1],
    ]);
    const todo = coordinator.cards()[3];
    expect(todo).toMatchObject({
      icon: '📊',
      color: '#7B1FA2',
    });
  });

  it('counts tasks per status and per priority for the charts', async () => {
    await load([
      task({ status: 'todo', priority: 'high' }),
      task({ status: 'todo', priority: 'low' }),
      task({ status: 'done', priority: 'high' }),
    ]);

    expect(coordinator.statusDistribution()).toEqual({ todo: 2, in_progress: 0, done: 1 });
    expect(coordinator.priorityDistribution()).toEqual({ high: 2, medium: 0, low: 1 });
  });

  it('counts again after a task was written, without being asked', async () => {
    await load([task({ status: 'todo' })]);
    expect(coordinator.cards()[0].value).toBe(1);

    TestBed.inject(HttpClient).post('/api/tasks', {}).subscribe();
    http.expectOne({ method: 'POST', url: '/api/tasks' }).flush({});
    TestBed.tick();
    http
      .expectOne((req) => req.method === 'GET' && req.url === '/api/tasks')
      .flush({ data: [task({}), task({}), task({})], items: 3 });
    await TestBed.inject(ApplicationRef).whenStable();

    expect(coordinator.cards()[0].value).toBe(3);
  });
});
