import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { StatisticsOverview } from '../../dashboard/feature-statistics/statistics-overview/statistics-overview';
import { TasksPage } from '../tasks-page/tasks-page';

/** The home screen: the statistic cards above the task board, as in the design. */
@Component({
  selector: 'app-dashboard-page',
  imports: [StatisticsOverview, TasksPage],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './dashboard-page.html',
})
export class DashboardPage {
  /** The search term from the header, filled in by the router from the `q` query parameter. */
  readonly q = input('');
  readonly newTask = input<string>();
}
