import { inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { TranslocoService } from '@jsverse/transloco';
import { map, switchMap } from 'rxjs';

/**
 * Returns a function that translates a message key. A `computed` value that calls it is worked
 * out again after a language change, once the texts of that language are loaded. Use it for
 * labels that are data (dropdown options) and so cannot use the `transloco` pipe. Call it in an
 * injection context, for example in a field initializer.
 */
export function injectTranslate(): (key: string, params?: Record<string, unknown>) => string {
  const transloco = inject(TranslocoService);
  const language = toSignal(
    transloco.langChanges$.pipe(switchMap((lang) => transloco.load(lang).pipe(map(() => lang)))),
  );
  return (key, params) => {
    language();
    return transloco.translate(key, params);
  };
}
