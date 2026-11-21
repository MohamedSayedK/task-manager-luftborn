import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ApplicationRef } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Task, TaskDraft } from './task';
import { TaskDetailStore } from './task-detail-store';

const ASSIGNEE = { id: 'user-001', name: 'John Doe', avatar: 'JD', email: 'john.doe@company.com' };
const DRAFT: TaskDraft = {
  title: 'Write docs',
  description: 'Document the API',
  status: 'todo',
  priority: 'medium',
  dueDate: '2026-12-01',
  assignee: ASSIGNEE,
  tags: [],
};
const TASK: Task = {
  ...DRAFT,
  id: 'task-001',
  createdAt: '2026-11-01T00:00:00.000Z',
  updatedAt: '2026-11-01T00:00:00.000Z',
};

describe('TaskDetailStore', () => {
  let store: InstanceType<typeof TaskDetailStore>;
  let http: HttpTestingController;

  /** Waits until the resource or mutation has applied the flushed response. */
  const settle = () => TestBed.inject(ApplicationRef).whenStable();

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    store = TestBed.inject(TaskDetailStore);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    // Writes log an activity entry in the background. Answer it, then check nothing else is open.
    http.match((req) => req.url === '/api/activity').forEach((req) => req.flush({}));
    http.verify();
  });

  it('requests nothing until a task is selected', () => {
    TestBed.tick();

    http.expectNone(() => true);
    expect(store.editId()).toBeNull();
    expect(store.taskValue()).toBeUndefined();
  });

  it('loads the task when editing starts', async () => {
    store.startEdit('task-001');
    TestBed.tick();
    http.expectOne('/api/tasks/task-001').flush(TASK);
    await settle();

    expect(store.editId()).toBe('task-001');
    expect(store.taskValue()).toEqual(TASK);
  });

  it('starts creating a task', () => {
    store.startCreate();

    expect(store.creating()).toBe(true);
    expect(store.editId()).toBeNull();
  });

  it('stops creating when the dialog is cancelled', () => {
    store.startCreate();

    store.cancelEdit();

    expect(store.creating()).toBe(false);
  });

  it('clears the task when editing is cancelled', async () => {
    store.startEdit('task-001');
    TestBed.tick();
    http.expectOne('/api/tasks/task-001').flush(TASK);
    await settle();

    store.cancelEdit();
    TestBed.tick();
    await settle();

    expect(store.editId()).toBeNull();
    expect(store.taskValue()).toBeUndefined();
  });

  it('exposes no task when loading fails', async () => {
    store.startEdit('missing');
    TestBed.tick();
    http.expectOne('/api/tasks/missing').flush('nope', { status: 404, statusText: 'Not Found' });
    await settle();

    expect(store.taskError()).toBeDefined();
    expect(store.taskValue()).toBeUndefined();
  });

  it('creates a task', async () => {
    const result = store.create(DRAFT);
    TestBed.tick();
    http.expectOne({ method: 'POST', url: '/api/tasks' }).flush(TASK);

    expect(await result).toEqual({ status: 'success', value: TASK });
    expect(store.createIsPending()).toBe(false);
  });

  describe('activity log', () => {
    it('records that a task was created, using the id the server gave it', async () => {
      const result = store.create(DRAFT);
      TestBed.tick();
      http.expectOne({ method: 'POST', url: '/api/tasks' }).flush({ ...TASK, id: 'task-099' });
      await result;

      const entry = http.expectOne({ method: 'POST', url: '/api/activity' });
      expect(entry.request.body).toMatchObject({
        type: 'created',
        taskId: 'task-099',
        taskTitle: 'Write docs',
      });
      expect(Number.isNaN(Date.parse(entry.request.body.timestamp))).toBe(false);
      entry.flush({});
    });
  });

  describe('activity log (continued)', () => {
    it('records an update with the new title', async () => {
      const result = store.update({ id: 'task-001', draft: { ...DRAFT, title: 'Renamed' } });
      TestBed.tick();
      http.expectOne({ method: 'PATCH', url: '/api/tasks/task-001' }).flush(TASK);
      await result;

      const entry = http.expectOne({ method: 'POST', url: '/api/activity' });
      expect(entry.request.body).toMatchObject({
        type: 'updated',
        taskId: 'task-001',
        taskTitle: 'Renamed',
      });
      entry.flush({});
    });

    it('records a deletion with the title the task had', async () => {
      const result = store.remove({ id: 'task-001', title: 'Old title' });
      TestBed.tick();
      http.expectOne({ method: 'DELETE', url: '/api/tasks/task-001' }).flush({});
      await result;

      const entry = http.expectOne({ method: 'POST', url: '/api/activity' });
      expect(entry.request.body).toMatchObject({
        type: 'deleted',
        taskId: 'task-001',
        taskTitle: 'Old title',
      });
      entry.flush({});
    });

    it('logs nothing when the write failed', async () => {
      const result = store.remove({ id: 'task-001', title: 'Old title' });
      TestBed.tick();
      http
        .expectOne({ method: 'DELETE', url: '/api/tasks/task-001' })
        .flush('boom', { status: 500, statusText: 'Server Error' });
      await result;

      http.expectNone({ method: 'POST', url: '/api/activity' });
    });

    it('still counts the write as done when logging it fails', async () => {
      const result = store.create(DRAFT);
      TestBed.tick();
      http.expectOne({ method: 'POST', url: '/api/tasks' }).flush(TASK);
      http
        .expectOne({ method: 'POST', url: '/api/activity' })
        .flush('boom', { status: 500, statusText: 'Server Error' });

      expect((await result).status).toBe('success');
      expect(store.changeCount()).toBe(1);
    });
  });

  describe('move', () => {
    const REORDER = {
      writes: [
        { id: 'task-001', changes: { order: 1 } },
        { id: 'task-002', changes: { order: 0 } },
      ],
    };
    const CHANGE_COLUMN = {
      writes: [{ id: 'task-001', changes: { status: 'done' as const, order: 0 } }],
      statusChange: { id: 'task-001', title: 'Write docs' },
    };

    it('saves each changed task with its own patch', async () => {
      const result = store.move(REORDER);
      TestBed.tick();
      const first = http.expectOne({ method: 'PATCH', url: '/api/tasks/task-001' });
      const second = http.expectOne({ method: 'PATCH', url: '/api/tasks/task-002' });
      expect(first.request.body).toEqual({ order: 1 });
      expect(second.request.body).toEqual({ order: 0 });
      first.flush({});
      second.flush({});

      expect((await result).status).toBe('success');
    });

    it('counts one change, however many tasks were written', async () => {
      const result = store.move(REORDER);
      TestBed.tick();
      http.match({ method: 'PATCH' }).forEach((req) => req.flush({}));
      await result;

      expect(store.changeCount()).toBe(1);
    });

    it('logs an update when the task changed column', async () => {
      const result = store.move(CHANGE_COLUMN);
      TestBed.tick();
      http.expectOne({ method: 'PATCH', url: '/api/tasks/task-001' }).flush({});
      await result;

      const entry = http.expectOne({ method: 'POST', url: '/api/activity' });
      expect(entry.request.body).toMatchObject({
        type: 'updated',
        taskId: 'task-001',
        taskTitle: 'Write docs',
      });
      entry.flush({});
    });

    it('logs nothing for a plain reorder', async () => {
      const result = store.move(REORDER);
      TestBed.tick();
      http.match({ method: 'PATCH' }).forEach((req) => req.flush({}));
      await result;

      http.expectNone({ method: 'POST', url: '/api/activity' });
    });

    it('counts no change and reports the error when a write fails', async () => {
      const result = store.move(CHANGE_COLUMN);
      TestBed.tick();
      http
        .expectOne({ method: 'PATCH', url: '/api/tasks/task-001' })
        .flush('boom', { status: 500, statusText: 'Server Error' });

      expect((await result).status).toBe('error');
      expect(store.changeCount()).toBe(0);
      expect(store.moveError()).toBeDefined();
      http.expectNone({ method: 'POST', url: '/api/activity' });
    });
  });

  it('closes the dialog and counts a change after a task was created', async () => {
    store.startCreate();
    const result = store.create(DRAFT);
    TestBed.tick();
    http.expectOne({ method: 'POST', url: '/api/tasks' }).flush(TASK);
    await result;

    expect(store.creating()).toBe(false);
    expect(store.changeCount()).toBe(1);
  });

  it('updates a task', async () => {
    const result = store.update({ id: 'task-001', draft: DRAFT });
    TestBed.tick();
    http.expectOne({ method: 'PATCH', url: '/api/tasks/task-001' }).flush(TASK);

    expect(await result).toEqual({ status: 'success', value: TASK });
  });

  it('removes a task', async () => {
    const result = store.remove({ id: 'task-001', title: 'Write docs' });
    TestBed.tick();
    http.expectOne({ method: 'DELETE', url: '/api/tasks/task-001' }).flush({ id: 'task-001' });

    expect(await result).toEqual({ status: 'success', value: undefined });
  });

  it('stops editing and counts a change after a task was updated', async () => {
    store.startEdit('task-001');
    TestBed.tick();
    http.expectOne('/api/tasks/task-001').flush(TASK);
    await settle();

    const result = store.update({ id: 'task-001', draft: DRAFT });
    TestBed.tick();
    http.expectOne({ method: 'PATCH', url: '/api/tasks/task-001' }).flush(TASK);
    await result;

    expect(store.editId()).toBeNull();
    expect(store.changeCount()).toBe(1);
  });

  it('counts a change after a task was removed', async () => {
    const result = store.remove({ id: 'task-001', title: 'Write docs' });
    TestBed.tick();
    http.expectOne({ method: 'DELETE', url: '/api/tasks/task-001' }).flush({ id: 'task-001' });
    await result;

    expect(store.changeCount()).toBe(1);
  });

  it('keeps the dialog open and counts no change when a write fails', async () => {
    store.startCreate();
    const result = store.create(DRAFT);
    TestBed.tick();
    http
      .expectOne({ method: 'POST', url: '/api/tasks' })
      .flush('boom', { status: 500, statusText: 'Server Error' });
    await result;

    expect(store.creating()).toBe(true);
    expect(store.changeCount()).toBe(0);
    expect(store.createError()).toBeDefined();
  });

  it('reports a failed mutation', async () => {
    const result = store.remove({ id: 'task-001', title: 'Write docs' });
    TestBed.tick();
    http
      .expectOne({ method: 'DELETE', url: '/api/tasks/task-001' })
      .flush('boom', { status: 500, statusText: 'Server Error' });

    expect((await result).status).toBe('error');
    expect(store.removeError()).toBeDefined();
  });
});
