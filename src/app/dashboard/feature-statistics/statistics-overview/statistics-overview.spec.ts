import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslocoService } from '@jsverse/transloco';
import { Statistic, TaskSummary } from '../../data/dashboard';
import { StatisticsOverview } from './statistics-overview';

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
  statistic('stat-002', 'Completed'),
  statistic('stat-003', 'In Progress'),
  statistic('stat-004', 'To Do'),
];

const task = (overrides: Partial<TaskSummary>): TaskSummary => ({
  status: 'todo',
  priority: 'medium',
  dueDate: '2999-01-01',
  ...overrides,
});

describe('StatisticsOverview', () => {
  let http: HttpTestingController;
  let fixture: ComponentFixture<StatisticsOverview>;

  /** Renders the cards and answers the statistics and task requests. */
  async function render(tasks: TaskSummary[]): Promise<HTMLElement> {
    fixture = TestBed.createComponent(StatisticsOverview);
    fixture.detectChanges();
    http.expectOne('/api/statistics').flush(STATISTICS);
    http.expectOne((req) => req.url === '/api/tasks').flush({ data: tasks, items: tasks.length });
    await fixture.whenStable();
    fixture.detectChanges();
    return fixture.nativeElement;
  }

  const card = (root: HTMLElement, title: string) =>
    root.querySelector<HTMLElement>(`article[aria-label="${title}"]`);

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('shows the counted value on each card and no change text', async () => {
    const root = await render([
      task({ status: 'todo', dueDate: '2020-01-01' }),
      task({ status: 'in_progress' }),
      task({ status: 'done' }),
      task({ status: 'done' }),
    ]);

    expect(card(root, 'Total Tasks')?.querySelector('.value')?.textContent).toBe('4');
    expect(card(root, 'Completed')?.querySelector('.value')?.textContent).toBe('2');
    expect(card(root, 'In Progress')?.querySelector('.value')?.textContent).toBe('1');
    expect(card(root, 'To Do')?.querySelector('.value')?.textContent).toBe('1');
    expect(root.querySelector('.change')).toBeNull();
  });

  describe('in Arabic', () => {
    beforeEach(() => TestBed.inject(TranslocoService).setActiveLang('ar'));

    it('words the title of each card', async () => {
      const root = await render([task({})]);

      for (const title of ['إجمالي المهام', 'المكتملة', 'قيد التنفيذ', 'للتنفيذ']) {
        expect(card(root, title)?.querySelector('h3')?.textContent?.trim()).toBe(title);
      }
    });

    it('keeps the title of the API for a statistic it does not know', async () => {
      fixture = TestBed.createComponent(StatisticsOverview);
      fixture.detectChanges();
      http.expectOne('/api/statistics').flush([statistic('stat-999', 'Custom')]);
      http.expectOne((req) => req.url === '/api/tasks').flush({ data: [], items: 0 });
      await fixture.whenStable();
      fixture.detectChanges();

      expect(card(fixture.nativeElement, 'Custom')).not.toBeNull();
    });
  });

  it('shows busy placeholders instead of cards until the data has arrived', async () => {
    fixture = TestBed.createComponent(StatisticsOverview);
    fixture.detectChanges();
    const root: HTMLElement = fixture.nativeElement;

    expect(root.getAttribute('aria-busy')).toBe('true');
    expect(root.querySelector('article')).toBeNull();

    http.expectOne('/api/statistics').flush(STATISTICS);
    http.expectOne((req) => req.url === '/api/tasks').flush({ data: [], items: 0 });
    await fixture.whenStable();
    fixture.detectChanges();

    expect(root.getAttribute('aria-busy')).not.toBe('true');
    expect(root.querySelectorAll('article')).toHaveLength(4);
  });

  describe('when loading fails', () => {
    const retry = (root: HTMLElement) =>
      Array.from(root.querySelectorAll('button')).find(
        (item) => item.textContent?.trim() === 'Retry',
      );

    async function renderFailed(): Promise<HTMLElement> {
      fixture = TestBed.createComponent(StatisticsOverview);
      fixture.detectChanges();
      http.expectOne('/api/statistics').flush(STATISTICS);
      http
        .expectOne((req) => req.url === '/api/tasks')
        .flush('boom', { status: 500, statusText: 'Server Error' });
      await fixture.whenStable();
      fixture.detectChanges();
      return fixture.nativeElement;
    }

    it('says so and offers a retry', async () => {
      const root = await renderFailed();

      expect(root.querySelector('[role="alert"]')?.textContent).toContain(
        'Could not load the statistics.',
      );
      expect(retry(root)).toBeDefined();
    });

    it('words the heading, the error message and the retry button in Arabic', async () => {
      TestBed.inject(TranslocoService).setActiveLang('ar');
      const root = await renderFailed();

      expect(root.querySelector('h2')?.textContent?.trim()).toBe('الإحصائيات');
      expect(root.querySelector('[role="alert"]')?.textContent).toContain('تعذر تحميل الإحصائيات.');
      expect(
        Array.from(root.querySelectorAll('button')).some(
          (item) => item.textContent?.trim() === 'إعادة المحاولة',
        ),
      ).toBe(true);
    });

    it('shows the cards once a retry works', async () => {
      const root = await renderFailed();

      retry(root)?.click();
      TestBed.tick();
      http.expectOne((req) => req.url === '/api/tasks').flush({ data: [task({})], items: 1 });
      await fixture.whenStable();
      fixture.detectChanges();

      expect(root.querySelector('[role="alert"]')).toBeNull();
      expect(card(root, 'Total Tasks')?.textContent).toContain('1');
    });
  });
});
