import { HttpInterceptorFn, HttpResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { of, tap } from 'rxjs';
import { HttpResponseCache } from '../util/http-response-cache';

/**
 * Answers repeated GET requests from memory for a short time. A successful write (POST, PATCH,
 * PUT, DELETE) drops the cached entries of the collection it changed, so the next read is fresh.
 */
export const cacheInterceptor: HttpInterceptorFn = (request, next) => {
  const cache = inject(HttpResponseCache);

  if (request.method !== 'GET') {
    return next(request).pipe(
      tap((event) => {
        if (event instanceof HttpResponse) {
          cache.invalidate(request);
        }
      }),
    );
  }

  const cached = cache.get(request);
  if (cached) {
    return of(cached);
  }
  return next(request).pipe(
    tap((event) => {
      if (event instanceof HttpResponse) {
        cache.set(request, event);
      }
    }),
  );
};
