import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { Button } from 'primeng/button';
import { Skeleton } from 'primeng/skeleton';
import { DashboardCoordinator } from '../data/dashboard-coordinator';
import { StatCardView } from '../ui/stat-card';

/** The row of statistic cards, with placeholders while loading and a retry on failure. */
@Component({
  selector: 'app-statistics-overview',
  imports: [Button, Skeleton, TranslocoPipe, StatCardView],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '[attr.aria-busy]': 'coordinator.loading() || null' },
  styles: `
    :host {
      display: grid;
      grid-template-columns: repeat(4, minmax(0, 1fr));
      gap: 1rem;
      padding: 1.5rem 1.5rem 0;
    }

    .error {
      grid-column: 1 / -1;
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

    @media (max-width: 1100px) {
      :host {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }
    }

    @media (max-width: 560px) {
      :host {
        grid-template-columns: minmax(0, 1fr);
        padding: 1rem 1rem 0;
      }
    }
  `,
  templateUrl: './statistics-overview.html',
})
export class StatisticsOverview {
  protected readonly coordinator = inject(DashboardCoordinator);
  protected readonly placeholders = [1, 2, 3, 4];
}
