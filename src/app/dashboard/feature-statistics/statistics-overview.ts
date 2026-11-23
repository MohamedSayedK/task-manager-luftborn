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
  styleUrl: './statistics-overview.scss',
  templateUrl: './statistics-overview.html',
})
export class StatisticsOverview {
  protected readonly coordinator = inject(DashboardCoordinator);
  protected readonly placeholders = [1, 2, 3, 4];
}
