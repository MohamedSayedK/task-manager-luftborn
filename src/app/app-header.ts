import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  inject,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { ActivatedRouteSnapshot, NavigationEnd, Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { Avatar } from 'primeng/avatar';
import { IconField } from 'primeng/iconfield';
import { InputIcon } from 'primeng/inputicon';
import { InputText } from 'primeng/inputtext';
import { Toast } from 'primeng/toast';
import { debounceTime, filter, map, startWith } from 'rxjs';
import { Language } from './i18n/language';
import { Theme } from './theme';

/** Typing waits for this pause before the board is asked to search, so it is not hit per key. */
const SEARCH_DEBOUNCE_MS = 300;

/** What the bell says, one message per click, and then from the start again. */
const BELL_MESSAGES = ['header.bellFirst', 'header.bellSecond', 'header.bellThird'];

/**
 * Top bar: app name, the search box, the bell (an Easter egg) and the static avatar. The search box only writes
 * the `q` query parameter. The board reads it from the router, so header and board stay
 * independent. Screens without a board (route data `search` not set) have no search box.
 */
@Component({
  selector: 'app-header',
  imports: [ReactiveFormsModule, TranslocoPipe, Avatar, IconField, InputIcon, InputText, Toast],
  providers: [MessageService],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { role: 'banner' },
  styles: `
    // The height is fixed from the start. PrimeNG adds the styles of the search box a moment after
    // the first paint, and a header that then grows would push the whole page down.
    :host {
      display: flex;
      align-items: center;
      box-sizing: border-box;
      min-height: 4rem;
      gap: 1rem;
      padding: 0.75rem 1.5rem;
      background: var(--app-surface);
      border-bottom: 1px solid var(--app-border);
    }

    .brand {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 1.125rem;
      font-weight: 700;
      color: var(--app-brand-text);
    }

    .brand,
    .actions {
      flex: 1;
    }

    .logo {
      display: grid;
      place-items: center;
      width: 2rem;
      height: 2rem;
      border-radius: 0.5rem;
      background: var(--p-primary-color);
      color: var(--p-primary-contrast-color);
      font-size: 1rem;
    }

    .actions {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: 1rem;
    }

    p-iconfield {
      width: min(26rem, 100%);
    }

    input {
      width: 100%;
    }

    .burger {
      display: none;
      place-items: center;
      width: 2.25rem;
      height: 2.25rem;
      border: 0;
      border-radius: 0.5rem;
      background: transparent;
      color: var(--app-text-secondary);
      cursor: pointer;
    }

    .burger,
    .language,
    .bell {
      transition: background-color 120ms ease;
    }

    .burger:hover {
      background: var(--app-surface-hover);
    }

    .language {
      height: 2.25rem;
      padding: 0 0.75rem;
      border: 1px solid var(--app-border);
      border-radius: 0.5rem;
      background: transparent;
      color: var(--app-text-secondary);
      font: inherit;
      font-size: 0.875rem;
      cursor: pointer;
    }

    .language:hover {
      background: var(--app-surface-hover);
    }

    .bell,
    .theme-toggle {
      display: grid;
      place-items: center;
      width: 2.25rem;
      height: 2.25rem;
      border: 0;
      border-radius: 50%;
      background: transparent;
      color: var(--app-text-subtle);
    }

    .theme-toggle {
      cursor: pointer;
    }

    // The bell is an Easter egg. Until it is clicked it asks for it: a red dot, a glow that
    // pulses, and a shake of the bell now and then.
    .bell {
      position: relative;
      color: var(--app-brand-text);
      cursor: pointer;
    }

    .bell:hover {
      background: var(--app-surface-hover);
    }

    .bell.attention {
      animation: bell-glow 2.4s ease-out infinite;
    }

    .bell.attention i {
      transform-origin: 50% 0;
      animation: bell-shake 3.6s ease-in-out infinite;
    }

    .bell.attention::after {
      content: '';
      position: absolute;
      inset-block-start: 0.3rem;
      inset-inline-end: 0.35rem;
      width: 0.5rem;
      height: 0.5rem;
      border-radius: 50%;
      background: var(--app-error-accent);
      box-shadow: 0 0 0 2px var(--app-surface);
    }

    @keyframes bell-glow {
      0% {
        box-shadow: 0 0 0 0 color-mix(in srgb, var(--p-primary-color) 55%, transparent);
      }
      70%,
      100% {
        box-shadow: 0 0 0 0.6rem color-mix(in srgb, var(--p-primary-color) 0%, transparent);
      }
    }

    @keyframes bell-shake {
      0%,
      60%,
      100% {
        transform: rotate(0);
      }
      64% {
        transform: rotate(16deg);
      }
      68% {
        transform: rotate(-14deg);
      }
      72% {
        transform: rotate(10deg);
      }
      76% {
        transform: rotate(-8deg);
      }
      80% {
        transform: rotate(4deg);
      }
      84% {
        transform: rotate(0);
      }
    }

    // The message of the bell appears below the header, not over its buttons. PrimeNG sets the
    // position inline, so only !important can move it. Under 800px the header has two rows when
    // there is a search box.
    p-toast {
      top: 4.5rem !important;
      // PrimeNG gives the toast a fixed 25rem, which a phone is narrower than.
      max-width: calc(100vw - 2.5rem);
    }

    @media (max-width: 800px) {
      p-toast {
        top: 7.25rem !important;
      }
    }

    // No motion for people who ask for less of it: the dot and a still glow remain.
    @media (prefers-reduced-motion: reduce) {
      .burger,
      .language,
      .bell {
        transition: none;
      }

      .bell.attention,
      .bell.attention i {
        animation: none;
      }

      .bell.attention {
        box-shadow: 0 0 0 0.2rem color-mix(in srgb, var(--p-primary-color) 30%, transparent);
      }
    }

    p-avatar {
      --p-avatar-background: var(--p-blue-700);
      --p-avatar-color: #ffffff;
      font-weight: 700;
    }

    @media (max-width: 800px) {
      .burger {
        display: grid;
      }

      .brand,
      .actions {
        flex: none;
      }

      // Screens without a search box (analytics) have nothing else to push these to the right.
      .actions {
        margin-inline-start: auto;
      }

      // The search box gets a row of its own below the menu button, logo and actions, instead of
      // being squeezed between them.
      :host {
        flex-wrap: wrap;
        row-gap: 0.75rem;
      }

      p-iconfield {
        order: 1;
        flex: 1 1 100%;
        width: 100%;
      }
    }

    @media (max-width: 560px) {
      // Burger, logo and the four actions must fit in one row at 320px, so the gaps shrink.
      :host {
        gap: 0.5rem;
        padding: 0.75rem 1rem;
      }

      .actions {
        gap: 0.25rem;
      }

      .brand span:not(.logo) {
        display: none;
      }
    }
  `,
  template: `
    <button
      #menuButton
      type="button"
      class="burger"
      [attr.aria-label]="'header.menu' | transloco"
      [attr.aria-expanded]="menuOpen()"
      (click)="menuToggle.emit()"
    >
      <i class="pi pi-bars" aria-hidden="true"></i>
    </button>
    <div class="brand">
      <span class="logo"><i class="pi pi-check-square" aria-hidden="true"></i></span>
      <span>{{ 'header.appName' | transloco }}</span>
    </div>
    @if (showSearch()) {
      <p-iconfield>
        <p-inputicon class="pi pi-search" aria-hidden="true" />
        <input
          pInputText
          type="search"
          [attr.aria-label]="'header.searchLabel' | transloco"
          [placeholder]="'header.searchPlaceholder' | transloco"
          [formControl]="search"
        />
      </p-iconfield>
    }
    <div class="actions">
      <button
        type="button"
        class="language"
        [attr.lang]="language.other().code"
        (click)="language.toggle()"
      >
        {{ language.other().name }}
      </button>
      <button
        type="button"
        class="theme-toggle"
        [attr.aria-label]="'header.darkMode' | transloco"
        [attr.aria-pressed]="theme.mode() === 'dark'"
        (click)="theme.toggle()"
      >
        <i
          class="pi"
          [class.pi-moon]="theme.mode() === 'light'"
          [class.pi-sun]="theme.mode() === 'dark'"
          aria-hidden="true"
        ></i>
      </button>
      <button
        type="button"
        class="bell"
        [class.attention]="!found()"
        [attr.aria-label]="'header.notifications' | transloco"
        (click)="ringBell()"
      >
        <i class="pi pi-bell" aria-hidden="true"></i>
      </button>
      <p-avatar
        label="MS"
        shape="circle"
        [ariaLabel]="'header.signedInAs' | transloco: { name: 'Mohamed Sayed' }"
      />
    </div>
    <p-toast [position]="language.current() === 'ar' ? 'top-left' : 'top-right'" />
  `,
})
export class AppHeader {
  private readonly router = inject(Router);
  protected readonly theme = inject(Theme);
  protected readonly language = inject(Language);
  private readonly messages = inject(MessageService);
  private readonly transloco = inject(TranslocoService);

  /** `true` once the bell was clicked. Until then it asks for attention. */
  protected readonly found = signal(false);
  private rings = 0;

  /** The Easter egg: a friendly message for whoever is curious enough to click the bell. */
  protected ringBell(): void {
    const key = BELL_MESSAGES[this.rings++ % BELL_MESSAGES.length];
    this.messages.add({
      severity: 'info',
      summary: this.transloco.translate('header.notifications'),
      detail: this.transloco.translate(key),
      life: 5000,
    });
    this.found.set(true);
  }

  /** Whether the navigation drawer is open. Only shown on the menu button. */
  readonly menuOpen = input(false);
  readonly menuToggle = output<void>();
  private readonly menuButton = viewChild.required<ElementRef<HTMLButtonElement>>('menuButton');

  focusMenuButton(): void {
    this.menuButton().nativeElement.focus();
  }

  protected readonly search = new FormControl(
    this.router.routerState.snapshot.root.queryParams['q'] ?? '',
    { nonNullable: true },
  );

  protected readonly showSearch = toSignal(
    this.router.events.pipe(
      filter((event) => event instanceof NavigationEnd),
      startWith(null),
      map(() => hasBoard(this.router.routerState.snapshot.root)),
    ),
    { initialValue: hasBoard(this.router.routerState.snapshot.root) },
  );

  /** The term of the address as this header last saw it, sent by it or arrived from outside. */
  private knownTerm = this.search.value;

  constructor() {
    this.search.valueChanges
      .pipe(debounceTime(SEARCH_DEBOUNCE_MS), takeUntilDestroyed())
      .subscribe((term) => {
        this.knownTerm = term;
        void this.router.navigate([], {
          queryParams: { q: term || null },
          queryParamsHandling: 'merge',
          replaceUrl: true,
        });
      });

    // An address opened from outside (first load, back button, a link) brings its own term.
    // The term this header sent itself is skipped, so typing in progress is never overwritten.
    this.router.events
      .pipe(
        filter((event) => event instanceof NavigationEnd),
        takeUntilDestroyed(),
      )
      .subscribe(() => {
        const term: string = this.router.routerState.snapshot.root.queryParams['q'] ?? '';
        if (term !== this.knownTerm) {
          this.knownTerm = term;
          this.search.setValue(term, { emitEvent: false });
        }
      });
  }
}

/** `true` when the active screen is marked with route data `search: true`. */
function hasBoard(route: ActivatedRouteSnapshot): boolean {
  let current: ActivatedRouteSnapshot | null = route;
  while (current?.firstChild) {
    current = current.firstChild;
  }
  return current?.data['search'] === true;
}
