import { TestBed } from '@angular/core/testing';
import { TranslocoService } from '@jsverse/transloco';
import { provideTestTranslations } from '../testing/translations';
import { Language } from './language';

describe('Language', () => {
  const html = () => document.documentElement;

  /** What the browser keeps between visits. jsdom has no storage of its own. */
  let saved: Map<string, string>;

  function browserLanguage(language: string): void {
    vi.spyOn(window.navigator, 'language', 'get').mockReturnValue(language);
  }

  function create(): Language {
    const language = TestBed.inject(Language);
    TestBed.tick();
    return language;
  }

  beforeEach(() => {
    saved = new Map();
    Object.defineProperty(window, 'localStorage', {
      configurable: true,
      value: {
        getItem: (key: string) => saved.get(key) ?? null,
        setItem: (key: string, value: string) => void saved.set(key, value),
      },
    });
    browserLanguage('en-US');
  });

  afterEach(() => {
    vi.restoreAllMocks();
    Reflect.deleteProperty(window, 'localStorage');
    html().lang = '';
    html().dir = '';
  });

  it('starts in English, left to right, when the browser is not set to Arabic', () => {
    const language = create();

    expect(language.current()).toBe('en');
    expect(html().lang).toBe('en');
    expect(html().dir).toBe('ltr');
  });

  it('starts in Arabic, right to left, when the browser is set to Arabic', () => {
    browserLanguage('ar-EG');

    const language = create();

    expect(language.current()).toBe('ar');
    expect(html().lang).toBe('ar');
    expect(html().dir).toBe('rtl');
  });

  it('switches to the other language and updates the page and the texts', () => {
    const language = create();

    language.toggle();
    TestBed.tick();

    expect(language.current()).toBe('ar');
    expect(html().lang).toBe('ar');
    expect(html().dir).toBe('rtl');
    expect(TestBed.inject(TranslocoService).getActiveLang()).toBe('ar');
  });

  it('names the language it would switch to, in that language', () => {
    const language = create();
    expect(language.other()).toEqual({ code: 'ar', name: 'العربية' });

    language.toggle();
    expect(language.other()).toEqual({ code: 'en', name: 'English' });
  });

  it('remembers the choice for the next visit, ahead of the browser language', () => {
    const first = create();
    first.toggle();
    TestBed.tick();
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ providers: [provideTestTranslations()] });
    browserLanguage('en-US');

    expect(create().current()).toBe('ar');
  });

  it('ignores a saved value it does not know', () => {
    saved.set('language', 'klingon');

    expect(create().current()).toBe('en');
  });

  it('still works for this visit when the browser blocks storage', () => {
    const blocked = () => {
      throw new DOMException('blocked', 'SecurityError');
    };
    Object.defineProperty(window, 'localStorage', {
      configurable: true,
      value: { getItem: blocked, setItem: blocked },
    });
    const language = create();

    language.toggle();

    expect(language.current()).toBe('ar');
  });
});
