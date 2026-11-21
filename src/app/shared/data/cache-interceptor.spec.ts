import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { cacheInterceptor } from './cache-interceptor';
import { HttpResponseCache } from '../util/http-response-cache';

describe('cacheInterceptor', () => {
  let client: HttpClient;
  let backend: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([cacheInterceptor])),
        provideHttpClientTesting(),
      ],
    });
    client = TestBed.inject(HttpClient);
    backend = TestBed.inject(HttpTestingController);
  });

  afterEach(() => backend.verify());

  describe('expiry', () => {
    beforeEach(() => vi.useFakeTimers({ toFake: ['Date'] }));
    afterEach(() => vi.useRealTimers());

    it('asks the server again once an entry is 60 seconds old', () => {
      client.get('/api/tasks').subscribe();
      backend.expectOne('/api/tasks').flush([]);

      vi.advanceTimersByTime(59_999);
      client.get('/api/tasks').subscribe();
      backend.expectNone('/api/tasks');

      vi.advanceTimersByTime(1);
      client.get('/api/tasks').subscribe();
      backend.expectOne('/api/tasks').flush([]);
    });
  });

  describe('change counter for readers', () => {
    it('counts a change of a collection after a successful write, and only of that one', () => {
      const cache = TestBed.inject(HttpResponseCache);
      expect(cache.changes('/api/tasks')).toBe(0);

      client.patch('/api/tasks/a', {}).subscribe();
      backend.expectOne({ method: 'PATCH', url: '/api/tasks/a' }).flush({});

      expect(cache.changes('/api/tasks')).toBe(1);
      expect(cache.changes('/api/users')).toBe(0);
    });

    it('does not count a failed write', () => {
      const cache = TestBed.inject(HttpResponseCache);

      client.delete('/api/tasks/a').subscribe({ error: () => undefined });
      backend
        .expectOne({ method: 'DELETE', url: '/api/tasks/a' })
        .flush('boom', { status: 500, statusText: 'Server Error' });

      expect(cache.changes('/api/tasks')).toBe(0);
    });
  });

  describe('invalidation by writes', () => {
    /** Fills the cache with the task list, one task and the user list. */
    function warmCache(): void {
      for (const url of ['/api/tasks', '/api/tasks/a', '/api/users']) {
        client.get(url).subscribe();
        backend.expectOne(url).flush([]);
      }
    }

    it('drops the cached entries of the collection that was written to', () => {
      warmCache();

      client.patch('/api/tasks/a', { title: 'new' }).subscribe();
      backend.expectOne({ method: 'PATCH', url: '/api/tasks/a' }).flush({});
      client.get('/api/tasks').subscribe();
      client.get('/api/tasks/a').subscribe();

      backend.expectOne('/api/tasks').flush([]);
      backend.expectOne('/api/tasks/a').flush({});
    });

    it('keeps the entries of other collections', () => {
      warmCache();

      client.patch('/api/tasks/a', {}).subscribe();
      backend.expectOne({ method: 'PATCH', url: '/api/tasks/a' }).flush({});
      client.get('/api/users').subscribe();

      backend.expectNone('/api/users');
    });

    it.each([
      ['POST', () => client.post('/api/tasks', {}), '/api/tasks'],
      ['DELETE', () => client.delete('/api/tasks/a'), '/api/tasks/a'],
    ])('is also triggered by a %s', (method, write, url) => {
      warmCache();

      write().subscribe();
      backend.expectOne({ method, url }).flush({});
      client.get('/api/tasks').subscribe();

      backend.expectOne('/api/tasks').flush([]);
    });

    it('keeps the entries when the write failed, because nothing changed', () => {
      warmCache();

      client.patch('/api/tasks/a', {}).subscribe({ error: () => undefined });
      backend
        .expectOne({ method: 'PATCH', url: '/api/tasks/a' })
        .flush('boom', { status: 500, statusText: 'Server Error' });
      client.get('/api/tasks').subscribe();

      backend.expectNone('/api/tasks');
    });
  });

  it('keeps separate entries for different query params', () => {
    client.get('/api/tasks', { params: { status: 'todo' } }).subscribe();
    backend.expectOne('/api/tasks?status=todo').flush([]);

    client.get('/api/tasks', { params: { status: 'done' } }).subscribe();

    backend.expectOne('/api/tasks?status=done').flush([]);
  });

  it('does not cache a failed request, so a retry reaches the server', () => {
    client.get('/api/tasks').subscribe({ error: () => undefined });
    backend.expectOne('/api/tasks').flush('boom', { status: 500, statusText: 'Server Error' });

    client.get('/api/tasks').subscribe();

    backend.expectOne('/api/tasks').flush([]);
  });

  it('never answers a write from the cache', () => {
    client.post('/api/tasks', { title: 'a' }).subscribe();
    backend.expectOne({ method: 'POST', url: '/api/tasks' }).flush({ id: 'a' });

    client.post('/api/tasks', { title: 'a' }).subscribe();

    backend.expectOne({ method: 'POST', url: '/api/tasks' }).flush({ id: 'b' });
  });

  it('serves a repeated GET from the cache instead of asking the server again', () => {
    const bodies: unknown[] = [];

    client.get('/api/tasks').subscribe((body) => bodies.push(body));
    backend.expectOne('/api/tasks').flush([{ id: 'a' }]);
    client.get('/api/tasks').subscribe((body) => bodies.push(body));

    backend.expectNone('/api/tasks');
    expect(bodies).toEqual([[{ id: 'a' }], [{ id: 'a' }]]);
  });
});
