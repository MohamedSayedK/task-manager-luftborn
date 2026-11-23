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
      transition:
        transform 150ms ease,
        box-shadow 150ms ease;
    }

    article:hover {
      transform: translateY(-0.125rem);
      box-shadow: 0 0.25rem 0.75rem rgb(0 0 0 / 0.12);
    }

    @media (prefers-reduced-motion: reduce) {
      article {
        transition: none;
      }

      article:hover {
        transform: none;
      }
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
  templateUrl: './stat-card.html',
})
export class StatCardView {
  readonly card = input.required<StatCard>();

  /** The title and the change text come from the API in English. Known ones are translated. */
  protected readonly titleKey = computed(() => statTitleKey(this.card().id));
  protected readonly changeKey = computed(() => changeLabelKey(this.card().changeLabel));
}
