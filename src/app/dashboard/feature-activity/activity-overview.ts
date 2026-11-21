import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Button } from 'primeng/button';
import { ActivityStore } from '../data/activity-store';
import { TranslocoPipe } from '@jsverse/transloco';
import { describeActivity, Label, timeAgo } from '../util/activity-text';

/** The recent activity feed: the latest task changes, newest first. */
@Component({
  selector: 'app-activity-overview',
  imports: [Button, TranslocoPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '[attr.aria-busy]': "store.pageStatus() === 'loading' || null" },
  styles: `
    :host {
      display: block;
    }

    ul {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      margin: 0;
      padding: 0;
      list-style: none;
    }

    li {
      display: flex;
      flex-direction: column;
      gap: 0.125rem;
      padding-bottom: 0.75rem;
      border-bottom: 1px solid var(--app-border);
      font-size: 0.875rem;
      color: var(--app-text);
    }

    time,
    .empty {
      font-size: 0.75rem;
      color: var(--app-text-muted);
    }

    .error {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 0.75rem;
      padding: 0.75rem 1rem;
      border: 1px solid var(--app-error-border);
      border-radius: 0.5rem;
      background: var(--app-error-bg);
      color: var(--app-error-text);
    }
  `,
  template: `
    @if (store.pageError()) {
      <div class="error" role="alert">
        <span>{{ 'activity.loadError' | transloco }}</span>
        <p-button
          [label]="'common.retry' | transloco"
          icon="pi pi-refresh"
          severity="danger"
          size="small"
          [outlined]="true"
          (onClick)="store.reload()"
        />
      </div>
    } @else if (store.items().length > 0) {
      <ul>
        @for (item of store.items(); track item.id) {
          @let sentence = describe(item);
          @let age = ago(item.timestamp);
          <li>
            <span>{{ sentence.key | transloco: sentence.params }}</span>
            <time [attr.datetime]="item.timestamp">{{ age.key | transloco: age.params }}</time>
          </li>
        }
      </ul>
    } @else if (store.pageStatus() !== 'loading') {
      <p class="empty">{{ 'activity.empty' | transloco }}</p>
    }
  `,
})
export class ActivityOverview {
  protected readonly store = inject(ActivityStore);
  protected readonly describe = describeActivity;
  /** Read once, so every line is measured against the same moment. */
  private readonly now = Date.now();

  protected ago(timestamp: string): Label {
    return timeAgo(timestamp, this.now);
  }
}
