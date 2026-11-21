import { DOCUMENT } from '@angular/common';
import { effect, inject, Injectable, signal } from '@angular/core';

export type ThemeMode = 'light' | 'dark';

/** The class that switches PrimeNG and the app styles to the dark appearance (`app.config.ts`). */
const DARK_CLASS = 'app-dark';

const STORAGE_KEY = 'theme';

/**
 * The appearance of the app: light or dark. It starts with the system setting and keeps what
 * the user chose. The choice is a class on the `<html>` element, which the styles react to.
 */
@Injectable({ providedIn: 'root' })
export class Theme {
  private readonly document = inject(DOCUMENT);

  readonly mode = signal<ThemeMode>(this.initialMode());

  constructor() {
    effect(() =>
      this.document.documentElement.classList.toggle(DARK_CLASS, this.mode() === 'dark'),
    );
  }

  toggle(): void {
    const mode = this.mode() === 'dark' ? 'light' : 'dark';
    this.mode.set(mode);
    try {
      this.document.defaultView?.localStorage.setItem(STORAGE_KEY, mode);
    } catch {
      // Storage can be blocked (private window). The choice then only lasts for this visit.
    }
  }

  private initialMode(): ThemeMode {
    const view = this.document.defaultView;
    try {
      const saved = view?.localStorage.getItem(STORAGE_KEY);
      if (saved === 'light' || saved === 'dark') {
        return saved;
      }
    } catch {
      // Storage can be blocked. Fall back to the system setting.
    }
    return view?.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
}
