import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { StatisticsOverview } from './dashboard/feature-statistics/statistics-overview';
import { TasksPage } from './tasks-page';

/** The home screen: the statistic cards above the task board, as in the design. */
@Component({
  selector: 'app-dashboard-page',
  imports: [StatisticsOverview, TasksPage],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-statistics-overview />
    <app-tasks-page [q]="q()" [newTask]="newTask()" />
  `,
})
export class DashboardPage {
  /** The search term from the header, filled in by the router from the `q` query parameter. */
  readonly q = input('');
  readonly newTask = input<string>();
}
