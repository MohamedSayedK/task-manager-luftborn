import { inject, Injectable } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TranslocoService } from '@jsverse/transloco';
import { PrimeNG } from 'primeng/config';
import { switchMap } from 'rxjs';

/**
 * PrimeNG components bring their own English texts, such as "No results found" and the label of
 * a select's option list. This gives PrimeNG the texts of the active language, again after every
 * language change. Nothing is set until it is created, so the app creates it at start.
 *
 * Not covered: the select's trigger button has a fixed `aria-label="dropdown trigger"` in the
 * PrimeNG template, which no setting changes.
 */
@Injectable({ providedIn: 'root' })
export class PrimeNgTranslation {
  constructor() {
    const primeng = inject(PrimeNG);
    const transloco = inject(TranslocoService);
    transloco.langChanges$
      .pipe(
        switchMap((lang) => transloco.load(lang)),
        takeUntilDestroyed(),
      )
      .subscribe(() => {
        const emptyMessage = transloco.translate('primeng.emptyMessage');
        primeng.setTranslation({
          emptyMessage,
          emptyFilterMessage: emptyMessage,
          // `setTranslation` replaces `aria` as a whole, so keep the other built-in texts.
          aria: {
            ...primeng.getTranslation('aria'),
            listLabel: transloco.translate('primeng.listLabel'),
            close: transloco.translate('primeng.close'),
          },
        });
      });
  }
}
