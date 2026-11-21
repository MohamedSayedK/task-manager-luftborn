import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ActivityEntry } from './activity';

/** Stateless data access that writes to the `/activity` collection. Only stores may use it. */
@Injectable({ providedIn: 'root' })
export class ActivityClient {
  private readonly http = inject(HttpClient);

  record(entry: ActivityEntry): Observable<unknown> {
    return this.http.post('/api/activity', entry);
  }
}
