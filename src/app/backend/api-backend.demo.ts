import { HttpInterceptorFn } from '@angular/common/http';
import { demoBackendInterceptor } from '../demo/demo-backend';

/** The demo build: the app answers its own `/api/...` requests. See `api-backend.ts`. */
export const apiBackend: HttpInterceptorFn[] = [demoBackendInterceptor];
