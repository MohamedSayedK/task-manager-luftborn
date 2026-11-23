import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Button } from 'primeng/button';
import { ActivityStore } from '../../data/activity-store';
import { TranslocoPipe } from '@jsverse/transloco';
import { describeActivity, Label, timeAgo } from '../../util/activity-text';

/** The recent activity feed: the latest task changes, newest first. */
@Component({
  selector: 'app-activity-overview',
  imports: [Button, TranslocoPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '[attr.aria-busy]': "store.pageStatus() === 'loading' || null" },
  styleUrl: './activity-overview.scss',
  templateUrl: './activity-overview.html',
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
