import { ChangeDetectionStrategy, Component, inject, signal, viewChild } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRouteSnapshot, NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { TranslocoPipe } from '@jsverse/transloco';
import { filter, map, startWith } from 'rxjs';
import { AppHeader } from './feature-shell/app-header/app-header';
import { AppSidebar } from './feature-shell/app-sidebar/app-sidebar';

@Component({
  imports: [RouterOutlet, TranslocoPipe, AppHeader, AppSidebar],
  selector: 'app-root',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './app.scss',
  templateUrl: './app.html',
  host: { '(document:keydown.escape)': 'closeMenuWithKeyboard()' },
})
export class App {
  private readonly router = inject(Router);
  private readonly header = viewChild.required(AppHeader);

  /** Whether the navigation drawer is open. Only has an effect on small screens. */
  protected readonly menuOpen = signal(false);

  /**
   * The title key of the open screen. Translated, it is the level-one heading, visible to screen
   * readers only.
   */
  protected readonly heading = toSignal(
    this.router.events.pipe(
      filter((event) => event instanceof NavigationEnd),
      startWith(null),
      map(() => screenTitle(this.router.routerState.snapshot.root)),
    ),
    { initialValue: '' },
  );

  /** Escape closes an open drawer and puts the focus back where the user opened it. */
  protected closeMenuWithKeyboard(): void {
    if (this.menuOpen()) {
      this.menuOpen.set(false);
      this.header().focusMenuButton();
    }
  }

  constructor() {
    // Following a link of the drawer shows the new screen, so the drawer gets out of the way.
    this.router.events
      .pipe(
        filter((event) => event instanceof NavigationEnd),
        takeUntilDestroyed(),
      )
      .subscribe(() => this.menuOpen.set(false));
  }
}

function screenTitle(route: ActivatedRouteSnapshot): string {
  let current = route;
  while (current.firstChild) {
    current = current.firstChild;
  }
  return typeof current.title === 'string' ? current.title : '';
}
