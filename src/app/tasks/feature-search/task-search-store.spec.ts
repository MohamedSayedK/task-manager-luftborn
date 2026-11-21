import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ApplicationRef } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Paginated, Task } from '../data/task';
import { TaskSearchStore } from './task-search-store';

const task = (overrides: Partial<Task>): Task => ({
  id: 'task-001',
  title: 'Title',
  description: 'Description',
  status: 'todo',
  priority: 'high',
  dueDate: '2026-12-01',
  assignee: { id: 'user-001', name: 'John Doe', avatar: 'JD', email: 'john.doe@company.com' },
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

describe('TaskSearchStore', () => {
  let store: InstanceType<typeof TaskSearchStore>;
  let http: HttpTestingController;

  /** Waits until the resource has applied the flushed response. */
  const settle = () => TestBed.inject(ApplicationRef).whenStable();
  const expectSearch = () => http.expectOne((req) => req.url === '/api/tasks');

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    store = TestBed.inject(TaskSearchStore);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('requests the whole board without filters', () => {
    TestBed.tick();

    const req = expectSearch();
    expect(req.request.params.get('_page')).toBe('1');
    expect(req.request.params.get('_per_page')).toBe('200');
    expect(req.request.params.has('_where')).toBe(false);
  });

  it('groups the loaded tasks into status columns', async () => {
    TestBed.tick();
    expectSearch().flush(
      page([
        task({ id: 'a', status: 'todo' }),
        task({ id: 'b', status: 'in_progress' }),
        task({ id: 'c', status: 'todo' }),
        task({ id: 'd', status: 'done' }),
      ]),
    );
    await settle();

    expect(store.columns().todo.map((t) => t.id)).toEqual(['a', 'c']);
    expect(store.columns().in_progress.map((t) => t.id)).toEqual(['b']);
    expect(store.columns().done.map((t) => t.id)).toEqual(['d']);
    expect(store.tasks()).toHaveLength(4);
  });

  it('starts with empty columns', () => {
    expect(store.columns()).toEqual({ todo: [], in_progress: [], done: [] });
  });

  it('requests again with the new filters', async () => {
    TestBed.tick();
    expectSearch().flush(page([]));
    await settle();

    store.setFilters({ status: 'done', search: 'login' });
    TestBed.tick();

    const where = JSON.parse(expectSearch().request.params.get('_where') as string);
    expect(where).toEqual({
      or: [{ title: { contains: 'login' } }, { description: { contains: 'login' } }],
      status: { eq: 'done' },
    });
  });

  it('merges partial filter updates', () => {
    store.setFilters({ priority: 'high' });
    store.setFilters({ assigneeId: 'user-003' });

    expect(store.priority()).toBe('high');
    expect(store.assigneeId()).toBe('user-003');
    expect(store.search()).toBe('');
  });

  it('keeps the previous tasks when a reload fails', async () => {
    TestBed.tick();
    expectSearch().flush(page([task({ id: 'a' })]));
    await settle();

    store.reload();
    TestBed.tick();
    expectSearch().flush('boom', { status: 500, statusText: 'Server Error' });
    await settle();

    expect(store.pageError()).toBeDefined();
    expect(store.tasks().map((t) => t.id)).toEqual(['a']);
  });
});
