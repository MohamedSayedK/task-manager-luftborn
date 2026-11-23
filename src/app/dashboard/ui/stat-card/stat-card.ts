import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { StatCard } from '../../data/dashboard-coordinator';
import { statTitleKey } from '../../util/stat-text';

/** One statistic: icon, title and value. */
@Component({
  selector: 'app-stat-card',
  imports: [TranslocoPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './stat-card.scss',
  templateUrl: './stat-card.html',
})
export class StatCardView {
  readonly card = input.required<StatCard>();

  /** The title comes from the API in English. A known one is translated. */
  protected readonly titleKey = computed(() => statTitleKey(this.card().id));
}
