import { TestBed } from '@angular/core/testing';
import { provideTestTranslations } from './app/testing/translations';

// jsdom does not implement scrollIntoView, which the PrimeNG select calls for its selected item.
Element.prototype.scrollIntoView ??= () => undefined;

// jsdom does not implement matchMedia, which PrimeNG overlays (select, dialog) call.
window.matchMedia ??= (query: string) =>
  ({
    matches: false,
    media: query,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
  }) as unknown as MediaQueryList;

// Every test gets the real texts of both languages, already loaded, so templates render English
// text without each spec setting translations up. A test switches language through `Language`.
beforeEach(() => TestBed.configureTestingModule({ providers: [provideTestTranslations()] }));
