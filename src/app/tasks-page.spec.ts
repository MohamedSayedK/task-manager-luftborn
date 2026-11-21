import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter, withComponentInputBinding } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { Assignee, Paginated, Task } from './tasks/data/task';
import { TasksPage } from './tasks-page';

const SARAH: Assignee = {
  id: 'user-002',
  name: 'Sarah Smith',
  avatar: 'SS',
  email: 'sarah.smith@company.com',
};

const task = (overrides: Partial<Task>): Task => ({
  id: 'task-001',
  title: 'Title',
  description: 'Description',
  status: 'todo',
  priority: 'high',
  dueDate: '2999-01-01',
  assignee: SARAH,
  tags: [],
  createdAt: '2026-11-01T00:00:00.000Z',
  updatedAt: '2026-11-01T00:00:00.000Z',
  ...overrides,
});

const page = (data: Task[]): Paginated<Task> => ({
  data,
  first: 1,
  prev: null,
  next: null,
  last: 1,
  pages: 1,
  items: data.length,
});

describe('TasksPage', () => {
  let http: HttpTestingController;
  let fixture: ComponentFixture<TasksPage>;

  const dialog = () => document.body.querySelector<HTMLElement>('[role="dialog"]');
  const button = (root: ParentNode, label: string) =>
    Array.from(root.querySelectorAll('button')).find((item) => item.textContent?.trim() === label);

  function type(label: string, text: string): void {
    const labelElement = Array.from(dialog()!.querySelectorAll('label')).find(
      (item) => item.textContent?.trim() === label,
    );
    const control = dialog()!.querySelector<HTMLInputElement>(`#${labelElement?.htmlFor}`)!;
    control.value = text;
    control.dispatchEvent(new Event('input'));
  }

  function pickAssignee(name: string): void {
    dialog()!.querySelector<HTMLElement>('[aria-label="Assignee"]')?.click();
    fixture.detectChanges();
    Array.from(document.body.querySelectorAll<HTMLElement>('[role="option"]'))
      .find((item) => item.textContent?.trim() === name)
      ?.click();
    fixture.detectChanges();
  }

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([{ path: 'tasks', component: TasksPage }], withComponentInputBinding()),
      ],
    });
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    // Writes log an activity entry in the background. Answer it, then check nothing else is open.
    http.match((req) => req.url === '/api/activity').forEach((req) => req.flush({}));
    http.verify();
  });

  it('shows the new title on the board after the edit dialog saved a task', async () => {
    const original = task({ id: 'task-007', title: 'Fix login bug' });
    fixture = TestBed.createComponent(TasksPage);
    fixture.detectChanges();
    http.expectOne((req) => req.url === '/api/tasks').flush(page([original]));
    http.match((req) => req.url === '/api/users').forEach((req) => req.flush([SARAH]));
    await fixture.whenStable();
    const root: HTMLElement = fixture.nativeElement;

    root.querySelector<HTMLElement>('button[aria-label="Actions for Fix login bug"]')?.click();
    fixture.detectChanges();
    Array.from(document.body.querySelectorAll<HTMLElement>('[role="menuitem"]'))
      .find((item) => item.textContent?.trim() === 'Edit')
      ?.querySelector<HTMLElement>('a, button, .p-menu-item-link')
      ?.click();
    fixture.detectChanges();
    TestBed.tick();
    http.expectOne('/api/tasks/task-007').flush(original);
    await fixture.whenStable();
    fixture.detectChanges();
    type('Title', 'Fix login redirect');
    button(dialog()!, 'Save')?.click();
    TestBed.tick();
    http
      .expectOne({ method: 'PATCH', url: '/api/tasks/task-007' })
      .flush({ ...original, title: 'Fix login redirect' });
    TestBed.tick();
    http
      .expectOne((req) => req.url === '/api/tasks')
      .flush(page([{ ...original, title: 'Fix login redirect' }]));
    await fixture.whenStable();
    fixture.detectChanges();

    expect(dialog()).toBeNull();
    expect(root.textContent).toContain('Fix login redirect');
    expect(root.textContent).not.toContain('Fix login bug');
  });

  it('lists a newly created task on the board after the dialog saved it', async () => {
    fixture = TestBed.createComponent(TasksPage);
    fixture.detectChanges();
    http.expectOne((req) => req.url === '/api/tasks').flush(page([]));
    http.match((req) => req.url === '/api/users').forEach((req) => req.flush([SARAH]));
    await fixture.whenStable();
    const root: HTMLElement = fixture.nativeElement;

    button(root, 'New Task')?.click();
    fixture.detectChanges();
    type('Title', 'Write docs');
    type('Due date', '2999-01-01');
    pickAssignee('Sarah Smith');
    button(dialog()!, 'Save')?.click();
    TestBed.tick();
    http.expectOne({ method: 'POST', url: '/api/tasks' }).flush(task({ title: 'Write docs' }));
    TestBed.tick();
    http.expectOne((req) => req.url === '/api/tasks').flush(page([task({ title: 'Write docs' })]));
    await fixture.whenStable();
    fixture.detectChanges();

    expect(dialog()).toBeNull();
    expect(root.textContent).toContain('Write docs');
  });
  describe('query parameters', () => {
    it('searches the board for the term in the q parameter', async () => {
      const harness = await RouterTestingHarness.create();
      const navigation = harness.navigateByUrl('/tasks?q=api', TasksPage);
      await navigation;
      harness.detectChanges();
      TestBed.tick();

      // The first request (before the term arrived) is cancelled by the second.
      const [request] = http
        .match((req) => req.url === '/api/tasks')
        .filter((candidate) => !candidate.cancelled);
      expect(JSON.parse(request.request.params.get('_where')!)).toEqual({
        or: [{ title: { contains: 'api' } }, { description: { contains: 'api' } }],
      });
      request.flush(page([]));
      http.match((req) => req.url === '/api/users').forEach((req) => req.flush([]));
    });

    it('opens the New Task dialog for newTask=true and then removes the parameter', async () => {
      const harness = await RouterTestingHarness.create();
      await harness.navigateByUrl('/tasks?newTask=true', TasksPage);
      harness.detectChanges();
      TestBed.tick();
      harness.detectChanges();
      http
        .match(() => true)
        .filter((req) => !req.cancelled)
        .forEach((req) => req.flush(req.request.url.includes('users') ? [] : page([])));
      await harness.fixture.whenStable();

      expect(dialog()?.textContent).toContain('New Task');
      expect(TestBed.inject(Router).url).toBe('/tasks');
    });
  });
});
