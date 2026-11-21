import { Injectable } from '@angular/core';
import { Translation, TranslocoLoader } from '@jsverse/transloco';

/**
 * Loads the texts of a language when it is first needed. Each language is its own chunk, so a
 * visitor only downloads the one they use. No HTTP request is involved.
 */
@Injectable({ providedIn: 'root' })
export class TranslationLoader implements TranslocoLoader {
  getTranslation(lang: string): Promise<Translation> {
    return lang === 'ar' ? import('./ar').then((m) => m.ar) : import('./en').then((m) => m.en);
  }
}
