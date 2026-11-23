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
  styleUrl: './app-header.scss',
  templateUrl: './app-header.html',
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
