import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { StatCard } from '../data/dashboard-coordinator';
import { changeLabelKey, statTitleKey } from '../util/stat-text';

/** One statistic: icon, title, value and the change text. */
@Component({
  selector: 'app-stat-card',
  imports: [TranslocoPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    :host {
      display: block;
    }

    article {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      padding: 1.5rem;
      background: var(--app-surface);
      border-radius: 0.75rem;
      box-shadow: 0 1px 3px rgb(0 0 0 / 0.1);
    }

    .title {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .icon {
      font-size: 1rem;
    }

    h3 {
      margin: 0;
      font-size: 0.875rem;
      font-weight: 400;
      color: var(--app-text-muted);
    }

    .value {
      font-size: 2rem;
      font-weight: 700;
      line-height: 1.2;
      color: var(--app-text);
    }

    .change {
      font-size: 0.75rem;
      color: var(--app-text-muted);
    }

    .change.positive {
      color: var(--app-positive-text);
    }

    .change.negative {
      color: var(--app-error-text);
    }
  `,
  template: `
    @let title = titleKey() ? (titleKey() | transloco) : card().title;
    @let changeLabel = changeKey() ? (changeKey() | transloco) : card().changeLabel;
    <article [attr.aria-label]="title">
      <div class="title">
        <span class="icon" aria-hidden="true">{{ card().icon }}</span>
        <h3>{{ title }}</h3>
      </div>
      <div class="value">{{ card().value }}</div>
      <div class="change" [class]="'change ' + card().changeType">
        {{ card().change }} {{ changeLabel }}
      </div>
    </article>
  `,
})
export class StatCardView {
  readonly card = input.required<StatCard>();

  /** The title and the change text come from the API in English. Known ones are translated. */
  protected readonly titleKey = computed(() => statTitleKey(this.card().id));
  protected readonly changeKey = computed(() => changeLabelKey(this.card().changeLabel));
}
