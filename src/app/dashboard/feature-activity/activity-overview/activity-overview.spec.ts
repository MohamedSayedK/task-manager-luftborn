import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslocoService } from '@jsverse/transloco';
import { ActivityItem } from '../../data/dashboard';
import { ActivityOverview } from './activity-overview';

const entry = (overrides: Partial<ActivityItem>): ActivityItem => ({
  id: '1',
  type: 'created',
  taskId: 'task-001',
  taskTitle: 'Write docs',
  timestamp: new Date().toISOString(),
  ...overrides,
});

describe('ActivityOverview', () => {
  let http: HttpTestingController;
  let fixture: ComponentFixture<ActivityOverview>;

  async function render(items: ActivityItem[]): Promise<HTMLElement> {
    fixture = TestBed.createComponent(ActivityOverview);
    fixture.detectChanges();
    http
      .expectOne((req) => req.url === '/api/activity')
      .flush({ data: items, items: items.length });
    await fixture.whenStable();
    fixture.detectChanges();
    return fixture.nativeElement;
  }

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('lists the entries in the order received with a sentence and how long ago', async () => {
    const root = await render([
      entry({ id: '2', type: 'deleted', taskTitle: 'Old task' }),
      entry({
        id: '1',
        type: 'created',
        taskTitle: 'Write docs',
        timestamp: new Date(Date.now() - 3 * 3_600_000).toISOString(),
      }),
    ]);

    const items = Array.from(root.querySelectorAll('li')).map((item) => item.textContent);
    expect(items).toHaveLength(2);
    expect(items[0]).toContain('Task "Old task" was deleted');
    expect(items[0]).toContain('just now');
    expect(items[1]).toContain('Task "Write docs" was created');
    expect(items[1]).toContain('3 hours ago');
  });

  it('writes the sentence and the time in Arabic when that language is active', async () => {
    TestBed.inject(TranslocoService).setActiveLang('ar');
    const root = await render([
      entry({
        taskTitle: 'Write docs',
        type: 'deleted',
        timestamp: new Date(Date.now() - 2 * 3_600_000).toISOString(),
      }),
    ]);

    const item = root.querySelector('li')?.textContent;
    expect(item).toContain('تم حذف المهمة "Write docs"');
    expect(item).toContain('منذ ساعتين');
  });

  it('says there is no activity yet when the feed is empty', async () => {
    const root = await render([]);

    expect(root.textContent).toContain('No activity yet.');
    expect(root.querySelector('li')).toBeNull();
  });

  it('words the empty feed in Arabic', async () => {
    TestBed.inject(TranslocoService).setActiveLang('ar');
    const root = await render([]);

    expect(root.textContent).toContain('لا يوجد نشاط بعد.');
  });

  it('words the error message and the retry button in Arabic', async () => {
    TestBed.inject(TranslocoService).setActiveLang('ar');
    fixture = TestBed.createComponent(ActivityOverview);
    fixture.detectChanges();
    http
      .expectOne((req) => req.url === '/api/activity')
      .flush('boom', { status: 500, statusText: 'Server Error' });
    await fixture.whenStable();
    fixture.detectChanges();
    const root: HTMLElement = fixture.nativeElement;

    expect(root.querySelector('[role="alert"]')?.textContent).toContain('تعذر تحميل النشاط.');
    expect(
      Array.from(root.querySelectorAll('button')).some(
        (item) => item.textContent?.trim() === 'إعادة المحاولة',
      ),
    ).toBe(true);
  });

  it('says so and offers a retry when loading fails', async () => {
    fixture = TestBed.createComponent(ActivityOverview);
    fixture.detectChanges();
    http
      .expectOne((req) => req.url === '/api/activity')
      .flush('boom', { status: 500, statusText: 'Server Error' });
    await fixture.whenStable();
    fixture.detectChanges();
    const root: HTMLElement = fixture.nativeElement;

    expect(root.querySelector('[role="alert"]')?.textContent).toContain(
      'Could not load the activity.',
    );
    Array.from(root.querySelectorAll('button'))
      .find((item) => item.textContent?.trim() === 'Retry')
      ?.click();
    TestBed.tick();
    http.expectOne((req) => req.url === '/api/activity').flush({ data: [entry({})], items: 1 });
    await fixture.whenStable();
    fixture.detectChanges();

    expect(root.querySelector('[role="alert"]')).toBeNull();
    expect(root.querySelectorAll('li')).toHaveLength(1);
  });
});
