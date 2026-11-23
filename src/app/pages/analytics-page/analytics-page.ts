import { ChangeDetectionStrategy, Component } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { ActivityOverview } from '../../dashboard/feature-activity/activity-overview/activity-overview';
import { AnalyticsOverview } from '../../dashboard/feature-analytics/analytics-overview/analytics-overview';

/** The analytics screen: charts by priority and status, and the recent activity feed. */
@Component({
  selector: 'app-analytics-page',
  imports: [TranslocoPipe, AnalyticsOverview, ActivityOverview],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './analytics-page.scss',
  templateUrl: './analytics-page.html',
})
export class AnalyticsPage {}
