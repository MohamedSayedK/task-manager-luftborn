import { HttpInterceptorFn } from '@angular/common/http';

/**
 * Interceptors that stand in for the backend. The normal build has none: the requests for
 * `/api/...` go to a real server, the dev proxy or nginx, which forward them to JSON Server.
 *
 * The `demo` build configuration of `angular.json` replaces this file with `api-backend.demo.ts`,
 * which answers the requests inside the browser. That is how the app runs on GitHub Pages, where
 * there is no server.
 */
export const apiBackend: HttpInterceptorFn[] = [];
