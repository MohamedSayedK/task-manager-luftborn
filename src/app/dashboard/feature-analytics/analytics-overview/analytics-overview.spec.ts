import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Component, input } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { TranslocoService } from '@jsverse/transloco';
import { UIChart } from 'primeng/chart';
import { TaskSummary } from '../../data/dashboard';
import { AnalyticsOverview } from './analytics-overview';

/** jsdom has no canvas, so the chart component is replaced. */
@Component({ selector: 'p-chart', template: '' })
class ChartStub {
  readonly type = input<string>();
  readonly data = input<unknown>();
  readonly options = input<unknown>();
}

const task = (overrides: Partial<TaskSummary>): TaskSummary => ({
  status: 'todo',
  priority: 'medium',
  dueDate: '2999-01-01',
  ...overrides,
});

describe('AnalyticsOverview', () => {
  let http: HttpTestingController;
  let fixture: ComponentFixture<AnalyticsOverview>;

  async function render(tasks: TaskSummary[]): Promise<HTMLElement> {
    fixture = TestBed.createComponent(AnalyticsOverview);
    fixture.detectChanges();
    http.expectOne('/api/statistics').flush([]);
    http.expectOne((req) => req.url === '/api/tasks').flush({ data: tasks, items: tasks.length });
    await fixture.whenStable();
    fixture.detectChanges();
    return fixture.nativeElement;
  }

  const section = (root: HTMLElement, name: string) =>
    root.querySelector<HTMLElement>(`section[aria-label="${name}"]`);

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

  it('lists the number of tasks per priority and per status next to the charts', async () => {
    const root = await render([
      task({ status: 'todo', priority: 'high' }),
      task({ status: 'todo', priority: 'low' }),
      task({ status: 'done', priority: 'high' }),
    ]);

    const priority = section(root, 'Tasks by priority')?.textContent;
    expect(priority).toMatch(/High\s*2/);
    expect(priority).toMatch(/Medium\s*0/);
    expect(priority).toMatch(/Low\s*1/);
    const status = section(root, 'Tasks by status')?.textContent;
    expect(status).toMatch(/To Do\s*2/);
    expect(status).toMatch(/In Progress\s*0/);
    expect(status).toMatch(/Done\s*1/);
  });

  describe('in Arabic', () => {
    beforeEach(() => TestBed.inject(TranslocoService).setActiveLang('ar'));

    it('words the titles of the two sections', async () => {
      const root = await render([task({})]);

      expect(section(root, 'المهام حسب الأولوية')?.querySelector('h2')?.textContent?.trim()).toBe(
        'المهام حسب الأولوية',
      );
      expect(section(root, 'المهام حسب الحالة')?.querySelector('h2')?.textContent?.trim()).toBe(
        'المهام حسب الحالة',
      );
    });

    it('words the legend next to each chart', async () => {
      const root = await render([
        task({ status: 'todo', priority: 'high' }),
        task({ status: 'done', priority: 'high' }),
      ]);

      const priority = section(root, 'المهام حسب الأولوية')?.textContent;
      expect(priority).toMatch(/عالية\s*2/);
      expect(priority).toMatch(/متوسطة\s*0/);
      expect(priority).toMatch(/منخفضة\s*0/);
      const status = section(root, 'المهام حسب الحالة')?.textContent;
      expect(status).toMatch(/للتنفيذ\s*1/);
      expect(status).toMatch(/قيد التنفيذ\s*0/);
      expect(status).toMatch(/مكتملة\s*1/);
    });

    it('words the labels of the chart data and keeps them in step with the language', async () => {
      await render([task({})]);

      const labels = () =>
        fixture.debugElement
          .queryAll(By.directive(ChartStub))
          .map((chart) => (chart.componentInstance.data() as { labels: string[] }).labels);
      expect(labels()).toEqual([
        ['عالية', 'متوسطة', 'منخفضة'],
        ['للتنفيذ', 'قيد التنفيذ', 'مكتملة'],
      ]);

      TestBed.inject(TranslocoService).setActiveLang('en');
      fixture.detectChanges();

      expect(labels()[0]).toEqual(['High', 'Medium', 'Low']);
    });

    it('words the error message and the retry button', async () => {
      fixture = TestBed.createComponent(AnalyticsOverview);
      fixture.detectChanges();
      http.expectOne('/api/statistics').flush([]);
      http
        .expectOne((req) => req.url === '/api/tasks')
        .flush('boom', { status: 500, statusText: 'Server Error' });
      await fixture.whenStable();
      fixture.detectChanges();
      const root: HTMLElement = fixture.nativeElement;

      expect(root.querySelector('[role="alert"]')?.textContent).toContain(
        'تعذر تحميل الرسوم البيانية.',
      );
      expect(
        Array.from(root.querySelectorAll('button')).some(
          (item) => item.textContent?.trim() === 'إعادة المحاولة',
        ),
      ).toBe(true);
    });
  });

  it('draws one chart for each distribution', async () => {
    const root = await render([task({})]);

    expect(root.querySelectorAll('p-chart')).toHaveLength(2);
  });
});
