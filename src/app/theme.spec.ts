import { TestBed } from '@angular/core/testing';
import { Theme } from './theme';

describe('Theme', () => {
  const DARK_CLASS = 'app-dark';

  /** Makes the browser report whether the user's system prefers a dark appearance. */
  function systemPrefersDark(dark: boolean): void {
    vi.spyOn(window, 'matchMedia').mockImplementation(
      (query) =>
        ({
          matches: dark && query === '(prefers-color-scheme: dark)',
          media: query,
          addEventListener: () => undefined,
          removeEventListener: () => undefined,
        }) as unknown as MediaQueryList,
    );
  }

  function create(): Theme {
    const theme = TestBed.inject(Theme);
    TestBed.tick();
    return theme;
  }

  /** What the browser keeps between visits. jsdom has no storage of its own. */
  let saved: Map<string, string>;

  beforeEach(() => {
    saved = new Map();
    Object.defineProperty(window, 'localStorage', {
      configurable: true,
      value: {
        getItem: (key: string) => saved.get(key) ?? null,
        setItem: (key: string, value: string) => void saved.set(key, value),
      },
    });
    document.documentElement.classList.remove(DARK_CLASS);
    systemPrefersDark(false);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    Reflect.deleteProperty(window, 'localStorage');
    document.documentElement.classList.remove(DARK_CLASS);
  });

  it('starts light when the system does not ask for dark', () => {
    const theme = create();

    expect(theme.mode()).toBe('light');
    expect(document.documentElement.classList.contains(DARK_CLASS)).toBe(false);
  });

  it('starts dark when the system asks for dark', () => {
    systemPrefersDark(true);

    const theme = create();

    expect(theme.mode()).toBe('dark');
    expect(document.documentElement.classList.contains(DARK_CLASS)).toBe(true);
  });

  it('switches between light and dark and updates the page', () => {
    const theme = create();

    theme.toggle();
    TestBed.tick();
    expect(theme.mode()).toBe('dark');
    expect(document.documentElement.classList.contains(DARK_CLASS)).toBe(true);

    theme.toggle();
    TestBed.tick();
    expect(theme.mode()).toBe('light');
    expect(document.documentElement.classList.contains(DARK_CLASS)).toBe(false);
  });

  it('remembers the choice for the next visit, ahead of the system setting', () => {
    const first = create();
    first.toggle();
    TestBed.tick();
    TestBed.resetTestingModule();
    systemPrefersDark(false);

    const next = create();

    expect(next.mode()).toBe('dark');
  });

  it('still works for this visit when the browser blocks storage', () => {
    const blocked = () => {
      throw new DOMException('blocked', 'SecurityError');
    };
    Object.defineProperty(window, 'localStorage', {
      configurable: true,
      value: { getItem: blocked, setItem: blocked },
    });
    const theme = create();

    theme.toggle();
    TestBed.tick();

    expect(theme.mode()).toBe('dark');
    expect(document.documentElement.classList.contains(DARK_CLASS)).toBe(true);
  });

  it('ignores a saved value it does not know', () => {
    saved.set('theme', 'purple');

    const theme = create();

    expect(theme.mode()).toBe('light');
  });
});
