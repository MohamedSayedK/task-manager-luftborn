import { provideHttpClient, withInterceptors } from '@angular/common/http';
import {
  ApplicationConfig,
  inject,
  isDevMode,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import { provideRouter, TitleStrategy, withComponentInputBinding } from '@angular/router';
import { provideTransloco } from '@jsverse/transloco';
import { provideTranslocoMessageformat } from '@jsverse/transloco-messageformat';
import { definePreset } from '@primeuix/themes';
import avatar from '@primeuix/themes/aura/avatar';
import base from '@primeuix/themes/aura/base';
import button from '@primeuix/themes/aura/button';
import dialog from '@primeuix/themes/aura/dialog';
import iconfield from '@primeuix/themes/aura/iconfield';
import inputtext from '@primeuix/themes/aura/inputtext';
import menu from '@primeuix/themes/aura/menu';
import select from '@primeuix/themes/aura/select';
import selectbutton from '@primeuix/themes/aura/selectbutton';
import skeleton from '@primeuix/themes/aura/skeleton';
import tag from '@primeuix/themes/aura/tag';
import textarea from '@primeuix/themes/aura/textarea';
import toast from '@primeuix/themes/aura/toast';
import togglebutton from '@primeuix/themes/aura/togglebutton';
import { providePrimeNG } from 'primeng/config';
import { apiBackend } from './api-backend';
import { routes } from './app.routes';
import { PrimeNgTranslation } from './i18n/primeng-translation';
import { TranslationLoader } from './i18n/translation-loader';
import { cacheInterceptor } from './shared/data/cache-interceptor';
import { TranslatedTitleStrategy } from './translated-title-strategy';

/**
 * Aura with the blue brand color of the Figma design (the whole primary scale, see below) and
 * darker buttons. A blue-500 button (white
 * text) has a contrast of only 3.7:1 and red-500 about 3.8:1. Both need 4.5:1 (WCAG AA), which
 * blue-600 and red-700 give.
 */
/**
 * Aura, with the design tokens of only the PrimeNG components this app uses. The full Aura preset
 * carries the tokens of about 90 components, which cost about 100 kB in the main bundle and work
 * at start-up, because PrimeNG builds CSS variables for every component in the preset. A component
 * added to the app needs its tokens added here, or it looks unstyled.
 */
const Aura = {
  primitive: base.primitive,
  semantic: base.semantic,
  components: {
    avatar,
    button,
    dialog,
    iconfield,
    inputtext,
    menu,
    select,
    selectbutton,
    skeleton,
    tag,
    textarea,
    toast,
    togglebutton,
  },
};

const AppPreset = definePreset(Aura, {
  semantic: {
    // Aura's whole primary scale is emerald. The tints of a selected or hovered dropdown option
    // come from `primary.50`, `100` and `700`, so the scale must be blue too, not only `color`.
    primary: {
      50: '{blue.50}',
      100: '{blue.100}',
      200: '{blue.200}',
      300: '{blue.300}',
      400: '{blue.400}',
      500: '{blue.500}',
      600: '{blue.600}',
      700: '{blue.700}',
      800: '{blue.800}',
      900: '{blue.900}',
      950: '{blue.950}',
    },
    colorScheme: {
      light: {
        primary: {
          color: '{blue.600}',
          contrastColor: '#ffffff',
          hoverColor: '{blue.700}',
          activeColor: '{blue.800}',
        },
        // Options of a dropdown and items of a menu: hover, selected, and selected and hovered
        // are three steps of blue. Aura's hover is grey.
        list: {
          option: {
            focusBackground: '{primary.50}',
            selectedBackground: '{primary.100}',
            selectedFocusBackground: '{primary.200}',
          },
        },
      },
      dark: {
        // Aura's dark default is a light primary with dark text. The same blue button as in
        // light mode keeps the design and its 5.2:1 contrast with white text.
        primary: {
          color: '{blue.600}',
          contrastColor: '#ffffff',
          hoverColor: '{blue.700}',
          activeColor: '{blue.800}',
        },
        list: {
          option: {
            focusBackground: 'color-mix(in srgb, {primary.400}, transparent 88%)',
          },
        },
      },
    },
  },
  components: {
    button: {
      colorScheme: {
        light: {
          root: {
            danger: {
              background: '{red.700}',
              hoverBackground: '{red.800}',
              activeBackground: '{red.900}',
              borderColor: '{red.700}',
              hoverBorderColor: '{red.800}',
              activeBorderColor: '{red.900}',
            },
          },
        },
      },
    },
  },
});

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes, withComponentInputBinding()),
    { provide: TitleStrategy, useExisting: TranslatedTitleStrategy },
    provideHttpClient(withInterceptors([cacheInterceptor, ...apiBackend])),
    provideTransloco({
      config: {
        availableLangs: ['en', 'ar'],
        defaultLang: 'en',
        fallbackLang: 'en',
        reRenderOnLangChange: true,
        prodMode: !isDevMode(),
      },
      loader: TranslationLoader,
    }),
    provideTranslocoMessageformat(),
    provideAppInitializer(() => {
      inject(PrimeNgTranslation);
    }),
    providePrimeNG({
      theme: {
        preset: AppPreset,
        options: {
          // Dark mode is opt-in: add the `app-dark` class to <html> to enable it.
          darkModeSelector: '.app-dark',
        },
      },
    }),
  ],
};
