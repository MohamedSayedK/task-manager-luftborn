import { computed, inject, Injectable } from '@angular/core';
import { countByPriority, countByStatus, countTasks, TaskCounts } from '../util/task-metrics';
import { Statistic } from './dashboard';
import { StatisticsStore } from './statistics-store';
import { TaskSummaryStore } from './task-summary-store';

/** One statistic card: the look from `/statistics` and the value counted from the tasks. */
export interface StatCard {
  id: string;
  title: string;
  icon: string;
  color: string;
  value: number;
}

/** Which count each statistic card shows, by statistic id. */
const COUNT_BY_ID: Record<string, keyof TaskCounts> = {
  'stat-001': 'total',
  'stat-002': 'completed',
  'stat-003': 'inProgress',
  'stat-004': 'todo',
};

/** Combines the statistics and task stores into the views the dashboard shows. */
@Injectable({ providedIn: 'root' })
export class DashboardCoordinator {
  private readonly statistics = inject(StatisticsStore);
  private readonly tasks = inject(TaskSummaryStore);

  readonly cards = computed(() =>
    toCards(this.statistics.statisticsValue(), countTasks(this.tasks.tasks())),
  );
  readonly statusDistribution = computed(() => countByStatus(this.tasks.tasks()));
  readonly priorityDistribution = computed(() => countByPriority(this.tasks.tasks()));

  /** `true` while the first data is on its way. A background reload does not count. */
  readonly loading = computed(
    () => this.statistics.statisticsStatus() === 'loading' || this.tasks.pageStatus() === 'loading',
  );
  readonly failed = computed(() => !!this.statistics.statisticsError() || !!this.tasks.pageError());

  /** Asks again for whatever failed. */
  reload(): void {
    if (this.statistics.statisticsError()) {
      this.statistics.reload();
    }
    if (this.tasks.pageError()) {
      this.tasks.reload();
    }
  }
}

function toCards(statistics: Statistic[], counts: TaskCounts): StatCard[] {
  return statistics.map((statistic) => {
    const count = COUNT_BY_ID[statistic.id];
    return { ...statistic, value: count ? counts[count] : statistic.value };
  });
}
