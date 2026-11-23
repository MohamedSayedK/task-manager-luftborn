import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslocoService } from '@jsverse/transloco';
import { Assignee, Task } from '../../data/task';
import { TaskDetailStore } from '../../data/task-detail-store';
import { expectAccessible } from '../../../testing/a11y';
import { TaskEdit } from './task-edit';

const JOHN: Assignee = {
  id: 'user-001',
  name: 'John Doe',
  avatar: 'JD',
  email: 'john.doe@company.com',
};
const SARAH: Assignee = {
  id: 'user-002',
  name: 'Sarah Smith',
  avatar: 'SS',
  email: 'sarah.smith@company.com',
};

describe('TaskEdit', () => {
  let http: HttpTestingController;
  let store: InstanceType<typeof TaskDetailStore>;
  let fixture: ComponentFixture<TaskEdit>;

  /** Creates the component and answers the assignee request. */
  async function render(): Promise<void> {
    fixture = TestBed.createComponent(TaskEdit);
    fixture.detectChanges();
    http.match((req) => req.url === '/api/users').forEach((req) => req.flush([JOHN, SARAH]));
    await fixture.whenStable();
  }

  const dialog = () => document.body.querySelector<HTMLElement>('[role="dialog"]');

  function type(label: string, text: string): void {
    const labelElement = Array.from(dialog()!.querySelectorAll('label')).find(
      (item) => item.textContent?.trim() === label,
    );
    const control = dialog()!.querySelector<HTMLInputElement>(`#${labelElement?.htmlFor}`)!;
    control.value = text;
    control.dispatchEvent(new Event('input'));
  }

  function pickOption(dropdown: string, option: string): void {
    dialog()!.querySelector<HTMLElement>(`[aria-label="${dropdown}"]`)?.click();
    fixture.detectChanges();
    Array.from(document.body.querySelectorAll<HTMLElement>('[role="option"]'))
      .find((item) => item.textContent?.trim() === option)
      ?.click();
    fixture.detectChanges();
  }

  const button = (label: string) =>
    Array.from(dialog()!.querySelectorAll('button')).find(
      (item) => item.textContent?.trim() === label,
    );

  /** Fills in the open form with valid values for a new task. */
  function fillNewTask(): void {
    type('Title', 'Write docs');
    type('Description', 'Document the API');
    type('Due date', '2999-01-01');
    pickOption('Assignee', 'Sarah Smith');
  }

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    http = TestBed.inject(HttpTestingController);
    store = TestBed.inject(TaskDetailStore);
  });

  afterEach(() => {
    // Writes log an activity entry in the background. Answer it, then check nothing else is open.
    http.match((req) => req.url === '/api/activity').forEach((req) => req.flush({}));
    http.verify();
  });

  it('shows no dialog while nothing is being created or edited', async () => {
    await render();

    expect(dialog()).toBeNull();
  });

  it('has an accessible create dialog, with validation errors showing', async () => {
    await render();
    store.startCreate();
    fixture.detectChanges();
    button('Save')?.click();
    fixture.detectChanges();

    await expectAccessible(dialog()!);
  });

  it('closes the dialog when the Escape key is pressed', async () => {
    await render();
    store.startCreate();
    fixture.detectChanges();
    await fixture.whenStable();

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    fixture.detectChanges();

    expect(store.creating()).toBe(false);
    expect(dialog()).toBeNull();
  });

  describe('focus', () => {
    /** A button outside the dialog, like the New Task button that opens it. */
    function addOpener(): HTMLButtonElement {
      const opener = document.createElement('button');
      opener.textContent = 'Opener';
      document.body.append(opener);
      opener.focus();
      return opener;
    }

    it('returns to the element that opened the dialog when the user cancels', async () => {
      await render();
      const opener = addOpener();
      store.startCreate();
      fixture.detectChanges();

      button('Cancel')?.click();
      fixture.detectChanges();

      expect(document.activeElement).toBe(opener);
      opener.remove();
    });

    it('returns to the element that opened the dialog after a successful save', async () => {
      await render();
      const opener = addOpener();
      store.startCreate();
      fixture.detectChanges();

      fillNewTask();
      button('Save')?.click();
      TestBed.tick();
      http.expectOne({ method: 'POST', url: '/api/tasks' }).flush({ id: 'task-099' });
      await fixture.whenStable();
      fixture.detectChanges();

      expect(document.activeElement).toBe(opener);
      opener.remove();
    });
  });

  it('opens a New Task dialog when creating starts', async () => {
    await render();

    store.startCreate();
    fixture.detectChanges();

    expect(dialog()?.textContent).toContain('New Task');
  });

  describe('editing', () => {
    const TASK: Task = {
      id: 'task-001',
      title: 'Fix login bug',
      description: 'Users cannot log in',
      status: 'in_progress',
      priority: 'high',
      dueDate: '2020-01-01',
      assignee: SARAH,
      tags: ['Backend'],
      createdAt: '2020-01-01T00:00:00.000Z',
      updatedAt: '2020-01-01T00:00:00.000Z',
    };

    /** Starts editing and answers the request that loads the task. */
    async function startEditing(): Promise<void> {
      store.startEdit('task-001');
      TestBed.tick();
      http.expectOne('/api/tasks/task-001').flush(TASK);
      await fixture.whenStable();
      fixture.detectChanges();
    }

    it('shows a loading message until the task has arrived', async () => {
      await render();

      store.startEdit('task-001');
      fixture.detectChanges();

      expect(dialog()?.textContent).toContain('Edit Task');
      expect(dialog()?.textContent).toContain('Loading task...');
      TestBed.tick();
      http.expectOne('/api/tasks/task-001').flush(TASK);
    });

    it('fills the form with the task and updates it with the changes', async () => {
      await render();
      await startEditing();

      expect(dialog()?.querySelector<HTMLInputElement>('#task-title')?.value).toBe('Fix login bug');
      type('Title', 'Fix login redirect');
      button('Save')?.click();
      TestBed.tick();
      const request = http.expectOne({ method: 'PATCH', url: '/api/tasks/task-001' });
      request.flush(TASK);
      await fixture.whenStable();
      fixture.detectChanges();

      expect(request.request.body).toMatchObject({
        title: 'Fix login redirect',
        status: 'in_progress',
        priority: 'high',
        dueDate: '2020-01-01',
        assignee: SARAH,
        tags: ['Backend'],
      });
      expect(dialog()).toBeNull();
    });

    it('says so when the task cannot be loaded', async () => {
      await render();

      store.startEdit('missing');
      TestBed.tick();
      http.expectOne('/api/tasks/missing').flush('nope', { status: 404, statusText: 'Not Found' });
      await fixture.whenStable();
      fixture.detectChanges();

      expect(dialog()?.textContent).toContain('Could not load the task.');
    });
  });

  it('keeps the dialog open and says so when saving fails', async () => {
    await render();
    store.startCreate();
    fixture.detectChanges();

    fillNewTask();
    button('Save')?.click();
    TestBed.tick();
    http
      .expectOne({ method: 'POST', url: '/api/tasks' })
      .flush('boom', { status: 500, statusText: 'Server Error' });
    await fixture.whenStable();
    fixture.detectChanges();

    expect(dialog()?.textContent).toContain('Could not save the task. Try again.');
    expect(dialog()?.querySelector<HTMLInputElement>('#task-title')?.value).toBe('Write docs');
  });

  describe('in Arabic', () => {
    beforeEach(() => TestBed.inject(TranslocoService).setActiveLang('ar'));

    it('words the header of a new task and the close button', async () => {
      await render();

      store.startCreate();
      fixture.detectChanges();

      expect(dialog()?.textContent).toContain('مهمة جديدة');
      expect(dialog()?.querySelector('[aria-label="إغلاق النافذة"]')).not.toBeNull();
    });

    it('words the header and the loading message of an edit', async () => {
      await render();

      store.startEdit('task-001');
      fixture.detectChanges();

      expect(dialog()?.textContent).toContain('تعديل المهمة');
      expect(dialog()?.textContent).toContain('جارٍ تحميل المهمة...');
      TestBed.tick();
      http.expectOne('/api/tasks/task-001').flush('nope', { status: 404, statusText: 'Not Found' });
    });

    it('words the message when the task cannot be loaded', async () => {
      await render();

      store.startEdit('missing');
      TestBed.tick();
      http.expectOne('/api/tasks/missing').flush('nope', { status: 404, statusText: 'Not Found' });
      await fixture.whenStable();
      fixture.detectChanges();

      expect(dialog()?.textContent).toContain('تعذر تحميل المهمة.');
    });
  });

  it('words the failed save in Arabic once the language changes', async () => {
    await render();
    store.startCreate();
    fixture.detectChanges();
    fillNewTask();
    button('Save')?.click();
    TestBed.tick();
    http
      .expectOne({ method: 'POST', url: '/api/tasks' })
      .flush('boom', { status: 500, statusText: 'Server Error' });
    await fixture.whenStable();
    fixture.detectChanges();

    TestBed.inject(TranslocoService).setActiveLang('ar');
    fixture.detectChanges();

    expect(dialog()?.textContent).toContain('تعذر حفظ المهمة. حاول مرة أخرى.');
  });

  it('disables Save while the task is being sent', async () => {
    await render();
    store.startCreate();
    fixture.detectChanges();

    fillNewTask();
    button('Save')?.click();
    TestBed.tick();
    fixture.detectChanges();

    expect(button('Save')?.disabled).toBe(true);
    http.expectOne({ method: 'POST', url: '/api/tasks' }).flush({ id: 'task-099' });
  });

  it('closes the dialog without sending anything when the user cancels', async () => {
    await render();
    store.startCreate();
    fixture.detectChanges();

    button('Cancel')?.click();
    fixture.detectChanges();

    expect(dialog()).toBeNull();
    expect(store.creating()).toBe(false);
  });

  it('starts with an empty form each time a new task is created', async () => {
    await render();
    store.startCreate();
    fixture.detectChanges();
    type('Title', 'Half written');
    button('Cancel')?.click();
    fixture.detectChanges();

    store.startCreate();
    fixture.detectChanges();

    expect(dialog()?.querySelector<HTMLInputElement>('#task-title')?.value).toBe('');
  });

  it('creates the task with the values of the form and closes the dialog', async () => {
    await render();
    store.startCreate();
    fixture.detectChanges();

    fillNewTask();
    button('Save')?.click();
    TestBed.tick();
    const request = http.expectOne({ method: 'POST', url: '/api/tasks' });
    request.flush({ id: 'task-099' });
    await fixture.whenStable();
    fixture.detectChanges();

    expect(request.request.body).toMatchObject({
      title: 'Write docs',
      description: 'Document the API',
      status: 'todo',
      priority: 'medium',
      dueDate: '2999-01-01',
      assignee: SARAH,
      tags: [],
    });
    expect(dialog()).toBeNull();
  });
});
