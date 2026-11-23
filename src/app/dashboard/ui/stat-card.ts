import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { StatCard } from '../data/dashboard-coordinator';
import { changeLabelKey, statTitleKey } from '../util/stat-text';

/** One statistic: icon, title, value and the change text. */
@Component({
  selector: 'app-stat-card',
  imports: [TranslocoPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './stat-card.scss',
  templateUrl: './stat-card.html',
})
export class StatCardView {
  readonly card = input.required<StatCard>();

  /** The title and the change text come from the API in English. Known ones are translated. */
  protected readonly titleKey = computed(() => statTitleKey(this.card().id));
  protected readonly changeKey = computed(() => changeLabelKey(this.card().changeLabel));
}
