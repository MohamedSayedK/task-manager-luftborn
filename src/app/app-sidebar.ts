import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { TranslocoPipe } from '@jsverse/transloco';

/** Navigation on the left. Calendar, Team and Settings have no feature yet and stay disabled. */
@Component({
  selector: 'app-sidebar',
  imports: [RouterLink, RouterLinkActive, TranslocoPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '[class.open]': 'open()' },
  styles: `
    :host {
      display: block;
      padding: 1rem 0.75rem;
      background: var(--app-surface);
      border-inline-end: 1px solid var(--app-border);
    }

    nav {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    a,
    .disabled {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.625rem 0.75rem;
      border-radius: 0.5rem;
      font-size: 0.9375rem;
      color: var(--app-text-secondary);
      text-decoration: none;
      transition: background-color 120ms ease;
    }

    a:hover {
      background: var(--app-surface-hover);
    }

    a[aria-current='page'] {
      background: var(--p-primary-color);
      color: var(--p-primary-contrast-color);
      font-weight: 600;
    }

    .disabled {
      color: var(--app-text-subtle);
      cursor: not-allowed;
    }

    .soon {
      margin-inline-start: auto;
      font-size: 0.6875rem;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }

    a.new-task {
      margin-top: 0.75rem;
      justify-content: center;
      background: var(--p-primary-color);
      color: var(--p-primary-contrast-color);
      font-weight: 600;
    }

    a.new-task:hover {
      background: var(--p-primary-hover-color);
    }

    // On narrow screens this is a drawer over the page, used only for navigation. While it is
    // closed it is invisible, so keyboard and screen reader users do not reach its links.
    @media (max-width: 800px) {
      :host {
        position: fixed;
        inset-block: 0;
        inset-inline-start: 0;
        z-index: 50;
        width: min(16rem, 85vw);
        overflow-y: auto;
        visibility: hidden;
        transform: translateX(-100%);
        transition:
          transform 0.2s ease,
          visibility 0.2s;
      }

      // The drawer comes from the right in right-to-left text. The open rule below has the same
      // specificity and comes later, so it wins in both directions.
      :host-context([dir='rtl']) {
        transform: translateX(100%);
      }

      :host(.open) {
        visibility: visible;
        transform: none;
      }

      a.new-task {
        display: none;
      }
    }

    @media (prefers-reduced-motion: reduce) {
      :host,
      a {
        transition: none;
      }
    }
  `,
  template: `
    <nav [attr.aria-label]="'nav.label' | transloco">
      <a
        routerLink="/"
        queryParamsHandling="preserve"
        routerLinkActive
        ariaCurrentWhenActive="page"
        [routerLinkActiveOptions]="{ exact: true }"
      >
        <i class="pi pi-home" aria-hidden="true"></i>{{ 'screens.dashboard' | transloco }}
      </a>
      <a
        routerLink="/tasks"
        queryParamsHandling="preserve"
        routerLinkActive
        ariaCurrentWhenActive="page"
      >
        <i class="pi pi-list-check" aria-hidden="true"></i>{{ 'screens.tasks' | transloco }}
      </a>
      <span class="disabled" aria-disabled="true">
        <i class="pi pi-calendar" aria-hidden="true"></i>{{ 'nav.calendar' | transloco
        }}<span class="soon">{{ 'nav.soon' | transloco }}</span>
      </span>
      <a routerLink="/analytics" routerLinkActive ariaCurrentWhenActive="page">
        <i class="pi pi-chart-bar" aria-hidden="true"></i>{{ 'screens.analytics' | transloco }}
      </a>
      <span class="disabled" aria-disabled="true">
        <i class="pi pi-users" aria-hidden="true"></i>{{ 'nav.team' | transloco
        }}<span class="soon">{{ 'nav.soon' | transloco }}</span>
      </span>
      <span class="disabled" aria-disabled="true">
        <i class="pi pi-cog" aria-hidden="true"></i>{{ 'nav.settings' | transloco
        }}<span class="soon">{{ 'nav.soon' | transloco }}</span>
      </span>
      <a class="new-task" routerLink="/tasks" [queryParams]="{ newTask: true }">
        <i class="pi pi-plus" aria-hidden="true"></i>{{ 'nav.newTask' | transloco }}
      </a>
    </nav>
  `,
})
export class AppSidebar {
  /** On small screens the sidebar is a drawer. This is whether it is open. */
  readonly open = input(false);
}
