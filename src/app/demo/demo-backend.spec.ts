import {
  HttpClient,
  HttpErrorResponse,
  provideHttpClient,
  withInterceptors,
} from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { DemoDb } from './demo-api';
import { createDemoBackend } from './demo-backend';

describe('demo backend', () => {
  let loads: number;
  let http: HttpClient;

  function setup(): void {
    loads = 0;
    const seed = (): DemoDb => ({
      tasks: [
        { id: 'a', title: 'First', status: 'todo' },
        { id: 'b', title: 'Second', status: 'done' },
      ],
      users: [{ id: 'u1', name: 'John' }],
    });
    const loadSeed = () => {
      loads++;
      return Promise.resolve(seed());
    };
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([createDemoBackend(loadSeed)])),
        provideHttpClientTesting(),
      ],
    });
    http = TestBed.inject(HttpClient);
  }

  beforeEach(setup);

  it('answers a request for the API from the starting data', async () => {
    const users = await firstValueFrom(http.get('/api/users'));

    expect(users).toEqual([{ id: 'u1', name: 'John' }]);
  });

  it('reads the query parameters, as the app sends them', async () => {
    const page = await firstValueFrom(
      http.get<{ data: { id: string }[]; items: number }>('/api/tasks', {
        params: { _page: 1, _per_page: 1, _where: JSON.stringify({ status: { eq: 'done' } }) },
      }),
    );

    expect(page.items).toBe(1);
    expect(page.data.map((row) => row.id)).toEqual(['b']);
  });

  it('loads the starting data once, however many requests follow', async () => {
    await firstValueFrom(http.get('/api/users'));
    await firstValueFrom(http.get('/api/tasks'));

    expect(loads).toBe(1);
  });

  it('keeps what a write changed for the requests that follow', async () => {
    await firstValueFrom(http.post('/api/tasks', { id: 'c', title: 'Third' }));
    await firstValueFrom(http.patch('/api/tasks/a', { status: 'done' }));
    await firstValueFrom(http.delete('/api/tasks/b'));

    const tasks = await firstValueFrom(http.get<{ id: string; status?: string }[]>('/api/tasks'));
    expect(tasks).toEqual([
      expect.objectContaining({ id: 'a', status: 'done' }),
      expect.objectContaining({ id: 'c' }),
    ]);
  });

  it('does not hand out the rows it keeps, so a caller cannot change them by accident', async () => {
    const first = await firstValueFrom(http.get<{ title: string }>('/api/tasks/a'));
    first.title = 'Changed by the caller';

    const again = await firstValueFrom(http.get<{ title: string }>('/api/tasks/a'));
    expect(again.title).toBe('First');
  });

  it('fails like a server would for an item that does not exist', async () => {
    const error = await firstValueFrom(http.get('/api/tasks/zzz')).catch((e: unknown) => e);

    expect(error).toBeInstanceOf(HttpErrorResponse);
    expect((error as HttpErrorResponse).status).toBe(404);
  });

  it('lets a request that is not for the API through, without loading anything', () => {
    const backend = TestBed.inject(HttpTestingController);

    http.get('/robots.txt', { responseType: 'text' }).subscribe();

    backend.expectOne('/robots.txt').flush('ok');
    expect(loads).toBe(0);
  });
});
