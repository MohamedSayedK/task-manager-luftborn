import { DOCUMENT } from '@angular/common';
import { computed, effect, inject, Injectable, signal } from '@angular/core';
import { TranslocoService } from '@jsverse/transloco';

export type LanguageCode = 'en' | 'ar';

interface LanguageInfo {
  code: LanguageCode;
  /** The name in its own language, so a reader can find it whatever the page language is. */
  name: string;
  direction: 'ltr' | 'rtl';
}

const LANGUAGES: LanguageInfo[] = [
  { code: 'en', name: 'English', direction: 'ltr' },
  { code: 'ar', name: 'العربية', direction: 'rtl' },
];

const STORAGE_KEY = 'language';

/**
 * The language of the app. It starts with the saved choice, else the browser language, else
 * English. It sets the language and the reading direction of the page and tells Transloco.
 */
@Injectable({ providedIn: 'root' })
export class Language {
  private readonly document = inject(DOCUMENT);
  private readonly transloco = inject(TranslocoService);

  readonly current = signal<LanguageCode>(this.initialLanguage());

  /** The language the switch button would change to. */
  readonly other = computed(() => {
    const { code, name } = LANGUAGES.find((language) => language.code !== this.current())!;
    return { code, name };
  });

  constructor() {
    effect(() => {
      const { code, direction } = LANGUAGES.find((language) => language.code === this.current())!;
      this.transloco.setActiveLang(code);
      const root = this.document.documentElement;
      root.lang = code;
      root.dir = direction;
    });
  }

  toggle(): void {
    const next = this.other().code;
    this.current.set(next);
    try {
      this.document.defaultView?.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Storage can be blocked (private window). The choice then only lasts for this visit.
    }
  }

  private initialLanguage(): LanguageCode {
    const view = this.document.defaultView;
    try {
      const saved = view?.localStorage.getItem(STORAGE_KEY);
      const known = LANGUAGES.find((language) => language.code === saved);
      if (known) {
        return known.code;
      }
    } catch {
      // Storage can be blocked. Fall back to the browser language.
    }
    return view?.navigator.language.toLowerCase().startsWith('ar') ? 'ar' : 'en';
  }
}
