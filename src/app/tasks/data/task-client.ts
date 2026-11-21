import { HttpClient, HttpResourceRequest } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { Task, TaskDraft } from './task';
import { TaskQuery, toTaskParams } from './task-query';

const API = '/api';

/**
 * Stateless data access for the `/tasks` and `/users` collections.
 *
 * Reads are exposed as request descriptors so stores can feed them to `httpResource`
 * (via `withResource`). Writes are plain observables. Only stores may use this class.
 */
@Injectable({ providedIn: 'root' })
export class TaskClient {
  private readonly http = inject(HttpClient);

  /** Responds with `Paginated<Task>`. Always paged so the response shape stays constant. */
  searchRequest(query: TaskQuery): HttpResourceRequest {
    return { url: `${API}/tasks`, params: toTaskParams(query) };
  }

  /** Responds with `Task`. */
  detailRequest(id: string): HttpResourceRequest {
    return { url: `${API}/tasks/${encodeURIComponent(id)}` };
  }

  /** Responds with `Assignee[]`. */
  assigneesRequest(): HttpResourceRequest {
    return { url: `${API}/users` };
  }

  create(draft: TaskDraft): Observable<Task> {
    const now = new Date().toISOString();
    return this.http.post<Task>(`${API}/tasks`, {
      ...draft,
      createdAt: now,
      updatedAt: now,
    });
  }

  update(id: string, draft: TaskDraft): Observable<Task> {
    return this.http.patch<Task>(`${API}/tasks/${encodeURIComponent(id)}`, {
      ...draft,
      updatedAt: new Date().toISOString(),
    });
  }

  /**
   * Saves where a card was dropped: its place in the column and, when it changed column, its
   * status. Only a status change counts as an update of the task, so a plain reorder leaves
   * `updatedAt` alone.
   */
  reposition(id: string, changes: Pick<Task, 'order'> & Partial<Pick<Task, 'status'>>) {
    return this.http.patch<Task>(`${API}/tasks/${encodeURIComponent(id)}`, {
      ...changes,
      ...(changes.status ? { updatedAt: new Date().toISOString() } : {}),
    });
  }

  remove(id: string): Observable<void> {
    return this.http.delete(`${API}/tasks/${encodeURIComponent(id)}`).pipe(map(() => undefined));
  }
}
