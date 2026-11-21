import { HttpErrorResponse, HttpInterceptorFn, HttpResponse } from '@angular/common/http';
import { delay, from, of, switchMap, throwError } from 'rxjs';
import { DemoDb, handleDemoRequest } from './demo-api';

/** Where the starting data is, next to the app. The `demo` build configuration puts it there. */
const SEED_URL = 'demo/db.json';

/** A short wait, so that loading states show for a moment, as they would with a real server. */
const LATENCY_MS = 150;

/**
 * Builds the interceptor that answers every request for `/api/...` itself, from data kept in
 * memory, instead of passing it on to a server. The data is loaded on the first request and
 * lives as long as the page, so writes last until a reload. Other requests pass through.
 */
export function createDemoBackend(
  loadSeed: () => Promise<DemoDb>,
  latencyMs = 0,
): HttpInterceptorFn {
  let database: Promise<DemoDb> | undefined;

  return (req, next) => {
    if (!req.url.startsWith('/api/')) {
      return next(req);
    }
    const parsed = new URL(req.url, 'http://localhost');
    database ??= loadSeed();

    return from(database).pipe(
      delay(latencyMs),
      switchMap((db) => {
        const response = handleDemoRequest(db, {
          method: req.method,
          path: parsed.pathname,
          params: { get: (name) => req.params.get(name) ?? parsed.searchParams.get(name) },
          body: req.body,
        });
        if (!response) {
          return next(req);
        }
        // A copy, so that code which changes what it received does not change the stored rows.
        const body = structuredClone(response.body);
        return response.status >= 400
          ? throwError(
              () => new HttpErrorResponse({ status: response.status, url: req.url, error: body }),
            )
          : of(new HttpResponse({ status: response.status, url: req.url, body }));
      }),
    );
  };
}

/** The interceptor of the published demo: the starting data is `db.json` of the mock backend. */
export const demoBackendInterceptor = createDemoBackend(async () => {
  const response = await fetch(new URL(SEED_URL, document.baseURI));
  if (!response.ok) {
    throw new Error(`Could not load the demo data (${response.status})`);
  }
  return (await response.json()) as DemoDb;
}, LATENCY_MS);
