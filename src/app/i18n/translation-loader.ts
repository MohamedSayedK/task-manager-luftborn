import { Injectable } from '@angular/core';
import { Translation, TranslocoLoader } from '@jsverse/transloco';
import { en } from './en';

/**
 * Gives the texts of a language. English is part of the main bundle: it is the default and it is
 * small, and a separate chunk would add a request before the first screen can show any text.
 * Arabic is its own chunk, so only a visitor who needs it downloads it. No HTTP request is
 * involved.
 */
@Injectable({ providedIn: 'root' })
export class TranslationLoader implements TranslocoLoader {
  getTranslation(lang: string): Promise<Translation> {
    return lang === 'ar' ? import('./ar').then((m) => m.ar) : Promise.resolve(en);
  }
}
