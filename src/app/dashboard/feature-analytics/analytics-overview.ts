import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { Button } from 'primeng/button';
import { UIChart } from 'primeng/chart';
import { DashboardCoordinator } from '../data/dashboard-coordinator';
import { injectTranslate } from '../util/inject-translate';

interface Slice {
  label: string;
  value: number;
  color: string;
}

const CHART_OPTIONS = {
  responsive: true,
  maintainAspectRatio: false,
  cutout: '62%',
  plugins: { legend: { display: false } },
};

/** The two distribution charts, each with a text legend that carries the same numbers. */
@Component({
  selector: 'app-analytics-overview',
  imports: [Button, TranslocoPipe, UIChart],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    :host {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 1rem;
    }

    @media (max-width: 800px) {
      :host {
        grid-template-columns: minmax(0, 1fr);
      }
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

    p-chart {
      display: block;
      height: 14rem;
    }

    dl {
      display: grid;
      grid-template-columns: 1fr auto;
      gap: 0.5rem 1rem;
      margin: 0;
      font-size: 0.875rem;
      color: var(--app-text);
    }

    dt {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    dd {
      margin: 0;
      font-weight: 600;
    }

    .swatch {
      width: 0.75rem;
      height: 0.75rem;
      border-radius: 0.1875rem;
      background: var(--swatch);
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
  `,
  templateUrl: './analytics-overview.html',
})
export class AnalyticsOverview {
  protected readonly coordinator = inject(DashboardCoordinator);
  protected readonly options = CHART_OPTIONS;

  private readonly translate = injectTranslate();

  protected readonly prioritySlices = computed(() => {
    const counts = this.coordinator.priorityDistribution();
    return [
      { label: this.translate('common.priority.high'), value: counts.high, color: '#dc2626' },
      { label: this.translate('common.priority.medium'), value: counts.medium, color: '#f59e0b' },
      { label: this.translate('common.priority.low'), value: counts.low, color: '#16a34a' },
    ];
  });
  protected readonly statusSlices = computed(() => {
    const counts = this.coordinator.statusDistribution();
    return [
      { label: this.translate('common.status.todo'), value: counts.todo, color: '#64748b' },
      {
        label: this.translate('common.status.inProgress'),
        value: counts.in_progress,
        color: '#2563eb',
      },
      { label: this.translate('common.status.done'), value: counts.done, color: '#16a34a' },
    ];
  });

  protected readonly priorityChart = computed(() => toChartData(this.prioritySlices()));
  protected readonly statusChart = computed(() => toChartData(this.statusSlices()));
}

function toChartData(slices: Slice[]) {
  return {
    labels: slices.map((slice) => slice.label),
    datasets: [
      {
        data: slices.map((slice) => slice.value),
        backgroundColor: slices.map((slice) => slice.color),
        // A gap shows the card behind it in either theme. A border would need one fixed color.
        borderWidth: 0,
        spacing: 2,
      },
    ],
  };
}
