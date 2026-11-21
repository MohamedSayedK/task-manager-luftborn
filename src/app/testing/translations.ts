import {
  EnvironmentProviders,
  importProvidersFrom,
  inject,
  provideAppInitializer,
} from '@angular/core';
import { TranslocoTestingModule } from '@jsverse/transloco';
import { provideTranslocoMessageformat } from '@jsverse/transloco-messageformat';
import { ar } from '../i18n/ar';
import { en } from '../i18n/en';
import { PrimeNgTranslation } from '../i18n/primeng-translation';

/**
 * The real texts of both languages, already loaded, so templates render without a loader.
 * `src/test-setup.ts` adds these to every test. A test that resets the testing module adds them
 * again.
 */
export function provideTestTranslations(): EnvironmentProviders[] {
  return [
    importProvidersFrom(
      TranslocoTestingModule.forRoot({
        langs: { en, ar },
        translocoConfig: {
          availableLangs: ['en', 'ar'],
          defaultLang: 'en',
          fallbackLang: 'en',
          reRenderOnLangChange: true,
        },
        preloadLangs: true,
      }),
    ),
    provideTranslocoMessageformat(),
    // The app creates this at start, so tests get PrimeNG's texts in the active language too.
    provideAppInitializer(() => {
      inject(PrimeNgTranslation);
    }),
  ];
}
