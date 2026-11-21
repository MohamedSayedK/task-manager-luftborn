import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Task, TaskDraft } from './task';
import { TaskClient } from './task-client';

const ASSIGNEE = { id: 'user-001', name: 'John Doe', avatar: 'JD', email: 'john.doe@company.com' };
const DRAFT: TaskDraft = {
  title: 'Write docs',
  description: 'Document the API',
  status: 'todo',
  priority: 'medium',
  dueDate: '2026-12-01',
  assignee: ASSIGNEE,
  tags: ['Backend', 'Docs'],
};

describe('TaskClient', () => {
  let client: TaskClient;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    client = TestBed.inject(TaskClient);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  describe('request descriptors for httpResource', () => {
    it('describes a task search with query params', () => {
      expect(client.searchRequest({ page: 1, pageSize: 5, status: 'done' })).toEqual({
        url: '/api/tasks',
        params: {
          _page: 1,
          _per_page: 5,
          _where: JSON.stringify({ status: { eq: 'done' } }),
        },
      });
    });

    it('describes a task detail request and encodes the id', () => {
      expect(client.detailRequest('task 1')).toEqual({ url: '/api/tasks/task%201' });
    });

    it('describes the assignee lookup', () => {
      expect(client.assigneesRequest()).toEqual({ url: '/api/users' });
    });
  });

  describe('create', () => {
    it('posts the draft, including its tags, with timestamps', () => {
      let created: Task | undefined;
      client.create(DRAFT).subscribe((task) => (created = task));

      const req = http.expectOne('/api/tasks');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toMatchObject(DRAFT);
      expect(req.request.body.createdAt).toBe(req.request.body.updatedAt);
      expect(Number.isNaN(Date.parse(req.request.body.createdAt))).toBe(false);

      const response = { ...req.request.body, id: 'abc' };
      req.flush(response);
      expect(created).toEqual(response);
    });
  });

  describe('update', () => {
    it('patches the draft and refreshes updatedAt', () => {
      client.update('task-001', DRAFT).subscribe();

      const req = http.expectOne('/api/tasks/task-001');
      expect(req.request.method).toBe('PATCH');
      expect(req.request.body).toMatchObject(DRAFT);
      expect(Number.isNaN(Date.parse(req.request.body.updatedAt))).toBe(false);
      expect(req.request.body.createdAt).toBeUndefined();
      req.flush({});
    });
  });

  describe('reposition', () => {
    it('patches only the order of a task that stays in its column', () => {
      client.reposition('task-001', { order: 2 }).subscribe();

      const req = http.expectOne('/api/tasks/task-001');
      expect(req.request.method).toBe('PATCH');
      expect(req.request.body).toEqual({ order: 2 });
      req.flush({});
    });

    it('patches the status with the order and refreshes updatedAt', () => {
      client.reposition('task-001', { status: 'done', order: 0 }).subscribe();

      const req = http.expectOne('/api/tasks/task-001');
      expect(req.request.body).toMatchObject({ status: 'done', order: 0 });
      expect(Number.isNaN(Date.parse(req.request.body.updatedAt))).toBe(false);
      req.flush({});
    });
  });

  describe('remove', () => {
    it('deletes the task and completes without a value', () => {
      const emitted: unknown[] = [];
      let completed = false;
      client.remove('task-001').subscribe({
        next: (value) => emitted.push(value),
        complete: () => (completed = true),
      });

      const req = http.expectOne('/api/tasks/task-001');
      expect(req.request.method).toBe('DELETE');
      req.flush({ id: 'task-001' });

      expect(emitted).toEqual([undefined]);
      expect(completed).toBe(true);
    });
  });
});
