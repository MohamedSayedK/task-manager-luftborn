import { ChangeDetectionStrategy, Component } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { ActivityOverview } from './dashboard/feature-activity/activity-overview';
import { AnalyticsOverview } from './dashboard/feature-analytics/analytics-overview';

/** The analytics screen: charts by priority and status, and the recent activity feed. */
@Component({
  selector: 'app-analytics-page',
  imports: [TranslocoPipe, AnalyticsOverview, ActivityOverview],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    :host {
      display: flex;
      flex-direction: column;
      gap: 1rem;
      padding: 1.5rem;
    }

    section {
      display: flex;
      flex-direction: column;
      gap: 1rem;
      padding: 1.25rem;
      background: var(--app-surface);
      border: 1px solid var(--app-border);
      border-radius: 0.75rem;
    }

    h2 {
      margin: 0;
      font-size: 0.9375rem;
      font-weight: 700;
      color: var(--app-text);
    }

    @media (max-width: 560px) {
      :host {
        padding: 1rem;
      }
    }
  `,
  template: `
    <app-analytics-overview />
    <section [attr.aria-label]="'analytics.recentActivity' | transloco">
      <h2>{{ 'analytics.recentActivity' | transloco }}</h2>
      <app-activity-overview />
    </section>
  `,
})
export class AnalyticsPage {}
