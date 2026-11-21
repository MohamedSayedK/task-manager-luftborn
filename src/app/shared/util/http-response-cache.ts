import { HttpRequest, HttpResponse } from '@angular/common/http';
import { Injectable, signal } from '@angular/core';

/** How long a cached response is served before the server is asked again. */
export const CACHE_TTL_MS = 60_000;

interface Entry {
  response: HttpResponse<unknown>;
  /** The resource a request belongs to, e.g. `api/tasks` for `/api/tasks/a?x=1`. */
  collection: string;
  expiresAt: number;
}

/** In-memory store of GET responses, used by `cacheInterceptor`. */
@Injectable({ providedIn: 'root' })
export class HttpResponseCache {
  private readonly entries = new Map<string, Entry>();
  private readonly changeCounts = signal<Record<string, number>>({});

  /**
   * How often the collection behind `url` was changed by a successful write. Read it inside a
   * resource request or a computed, and the reader reloads after every write to that collection.
   */
  changes(url: string): number {
    return this.changeCounts()[collectionOf(url)] ?? 0;
  }

  /** The cached response, or `undefined` when there is none or it has expired. */
  get(request: HttpRequest<unknown>): HttpResponse<unknown> | undefined {
    const entry = this.entries.get(request.urlWithParams);
    if (!entry) {
      return undefined;
    }
    if (Date.now() >= entry.expiresAt) {
      this.entries.delete(request.urlWithParams);
      return undefined;
    }
    return entry.response;
  }

  set(request: HttpRequest<unknown>, response: HttpResponse<unknown>): void {
    this.entries.set(request.urlWithParams, {
      response,
      collection: collectionOf(request.url),
      expiresAt: Date.now() + CACHE_TTL_MS,
    });
  }

  /** Drops every entry of the collection the request belongs to (list, details, filters). */
  invalidate(request: HttpRequest<unknown>): void {
    const collection = collectionOf(request.url);
    for (const [key, entry] of this.entries) {
      if (entry.collection === collection) {
        this.entries.delete(key);
      }
    }
    this.changeCounts.update((counts) => ({
      ...counts,
      [collection]: (counts[collection] ?? 0) + 1,
    }));
  }
}

/** The first two path segments: `/api/tasks/a?x=1` and `/api/tasks` are both `api/tasks`. */
function collectionOf(url: string): string {
  const { pathname } = new URL(url, 'http://localhost');
  return pathname.split('/').filter(Boolean).slice(0, 2).join('/');
}
