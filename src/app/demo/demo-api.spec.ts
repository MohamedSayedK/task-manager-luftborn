import { DemoDb, DemoRequest, handleDemoRequest } from './demo-api';

describe('handleDemoRequest', () => {
  const makeDb = (): DemoDb => ({
    tasks: [
      {
        id: 'a',
        title: 'Fix login bug',
        description: 'Users cannot log in',
        status: 'todo',
        assignee: { id: 'u1' },
      },
      {
        id: 'b',
        title: 'Write docs',
        description: 'Document the API',
        status: 'done',
        assignee: { id: 'u2' },
      },
      {
        id: 'c',
        title: 'Design homepage',
        description: 'Wireframes',
        status: 'todo',
        assignee: { id: 'u2' },
      },
    ],
    users: [{ id: 'u1', name: 'John' }],
    activity: [
      { id: '1', timestamp: '2026-01-01T10:00:00Z' },
      { id: '2', timestamp: '2026-01-03T10:00:00Z' },
      { id: '3', timestamp: '2026-01-02T10:00:00Z' },
    ],
  });

  /** A request with a query string, as the app sends it. */
  const request = (method: string, url: string, body?: unknown): DemoRequest => {
    const parsed = new URL(url, 'http://localhost');
    return { method, path: parsed.pathname, params: parsed.searchParams, body };
  };
  const get = (db: DemoDb, url: string) => handleDemoRequest(db, request('GET', url));
  const ids = (response: { body: unknown } | null) =>
    (
      (response?.body as { data?: { id: string }[] }).data ?? (response?.body as { id: string }[])
    ).map((row) => row.id);
  const where = (filter: unknown) =>
    `/api/tasks?_page=1&_per_page=50&_where=${encodeURIComponent(JSON.stringify(filter))}`;

  it('leaves a request that is not for the API to the caller', () => {
    expect(get(makeDb(), '/index.html')).toBeNull();
  });

  it('lists a whole collection as an array when no page is asked for', () => {
    const response = get(makeDb(), '/api/users');

    expect(response).toEqual({ status: 200, body: [{ id: 'u1', name: 'John' }] });
  });

  it('answers a missing collection with 404', () => {
    expect(get(makeDb(), '/api/nothing')?.status).toBe(404);
  });

  describe('pages', () => {
    it('cuts a page and describes the others, as JSON Server does', () => {
      const response = get(makeDb(), '/api/tasks?_page=2&_per_page=2');

      expect(response?.body).toEqual({
        first: 1,
        prev: 1,
        next: null,
        last: 2,
        pages: 2,
        items: 3,
        data: [expect.objectContaining({ id: 'c' })],
      });
    });
  });

  describe('sorting', () => {
    it('sorts by a field, and newest first with a leading minus', () => {
      const db = makeDb();

      expect(ids(get(db, '/api/activity?_sort=timestamp'))).toEqual(['1', '3', '2']);
      expect(ids(get(db, '/api/activity?_sort=-timestamp&_page=1&_per_page=2'))).toEqual([
        '2',
        '3',
      ]);
    });
  });

  describe('_where', () => {
    it('matches a field exactly with eq', () => {
      expect(ids(get(makeDb(), where({ status: { eq: 'todo' } })))).toEqual(['a', 'c']);
    });

    it('reaches into a nested object', () => {
      expect(ids(get(makeDb(), where({ assignee: { id: { eq: 'u2' } } })))).toEqual(['b', 'c']);
    });

    it('matches a part of a text without regard to case, in any alternative of or', () => {
      const filter = {
        or: [{ title: { contains: 'LOGIN' } }, { description: { contains: 'wire' } }],
      };

      expect(ids(get(makeDb(), where(filter)))).toEqual(['a', 'c']);
    });

    it('needs every condition at the top level to hold', () => {
      const filter = { status: { eq: 'todo' }, assignee: { id: { eq: 'u2' } } };

      expect(ids(get(makeDb(), where(filter)))).toEqual(['c']);
    });

    it('compares with lt, gt, ne and in', () => {
      const db: DemoDb = {
        tasks: [
          { id: '1', n: 1 },
          { id: '2', n: 2 },
          { id: '3', n: 3 },
        ],
      };

      expect(ids(get(db, where({ n: { gt: 1, lt: 3 } })))).toEqual(['2']);
      expect(ids(get(db, where({ n: { ne: 2 } })))).toEqual(['1', '3']);
      expect(ids(get(db, where({ n: { in: [1, 3] } })))).toEqual(['1', '3']);
    });
  });

  describe('one item', () => {
    it('reads it by id, or says 404', () => {
      const db = makeDb();

      expect(get(db, '/api/tasks/b')?.body).toMatchObject({ title: 'Write docs' });
      expect(get(db, '/api/tasks/zzz')?.status).toBe(404);
    });

    it('creates an item with an id and keeps it', () => {
      const db = makeDb();

      const created = handleDemoRequest(db, request('POST', '/api/tasks', { title: 'New' }));

      expect(created?.status).toBe(201);
      const id = (created?.body as { id: string }).id;
      expect(id).toBeTruthy();
      expect(ids(get(db, '/api/tasks'))).toContain(id);
    });

    it('keeps the id a client gives', () => {
      const created = handleDemoRequest(makeDb(), request('POST', '/api/activity', { id: 'mine' }));

      expect((created?.body as { id: string }).id).toBe('mine');
    });

    it('changes only the fields it is given with PATCH', () => {
      const db = makeDb();

      const patched = handleDemoRequest(db, request('PATCH', '/api/tasks/a', { status: 'done' }));

      expect(patched?.body).toMatchObject({ id: 'a', title: 'Fix login bug', status: 'done' });
      expect(get(db, '/api/tasks/a')?.body).toMatchObject({ status: 'done' });
      expect(handleDemoRequest(db, request('PATCH', '/api/tasks/zzz', {}))?.status).toBe(404);
    });

    it('removes an item with DELETE', () => {
      const db = makeDb();

      const removed = handleDemoRequest(db, request('DELETE', '/api/tasks/a'));

      expect(removed?.status).toBe(200);
      expect(ids(get(db, '/api/tasks'))).toEqual(['b', 'c']);
      expect(handleDemoRequest(db, request('DELETE', '/api/tasks/a'))?.status).toBe(404);
    });

    it('does not accept other methods', () => {
      expect(handleDemoRequest(makeDb(), request('PUT', '/api/tasks/a', {}))?.status).toBe(405);
    });
  });
});
