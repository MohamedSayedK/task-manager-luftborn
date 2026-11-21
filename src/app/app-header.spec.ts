import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { AppHeader } from './app-header';

@Component({ template: '' })
class Screen {}

describe('AppHeader', () => {
  let fixture: ComponentFixture<AppHeader>;

  /** Opens a route and renders the header next to it. */
  async function open(url: string): Promise<HTMLElement> {
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl(url);
    fixture = TestBed.createComponent(AppHeader);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    return fixture.nativeElement;
  }

  const searchBox = (header: HTMLElement) =>
    header.querySelector<HTMLInputElement>('input[aria-label="Search tasks"]');

  function type(header: HTMLElement, text: string): void {
    const input = searchBox(header)!;
    input.value = text;
    input.dispatchEvent(new Event('input'));
  }

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([
          { path: '', component: Screen, data: { search: true } },
          { path: 'tasks', component: Screen, data: { search: true } },
          { path: 'analytics', component: Screen },
        ]),
      ],
    });
  });

  it('shows the app name', async () => {
    const header = await open('/');

    expect(header.textContent).toContain('Task Manager');
  });

  describe('language button', () => {
    const languageButton = (header: HTMLElement) =>
      Array.from(header.querySelectorAll('button')).find((button) =>
        ['العربية', 'English'].includes(button.textContent?.trim() ?? ''),
      );

    afterEach(() => {
      document.documentElement.lang = '';
      document.documentElement.dir = '';
    });

    it('offers the other language by its own name', async () => {
      const header = await open('/');

      expect(languageButton(header)?.textContent?.trim()).toBe('العربية');
      expect(languageButton(header)?.getAttribute('lang')).toBe('ar');
    });

    it('switches the texts of the header to Arabic and back', async () => {
      const header = await open('/tasks');

      languageButton(header)?.click();
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();

      expect(header.querySelector('.brand')?.textContent).toContain('مدير المهام');
      const search = header.querySelector('input[type="search"]');
      expect(search?.getAttribute('aria-label')).toBe('البحث في المهام');
      expect(search?.getAttribute('placeholder')).toBe('ابحث في المهام...');
      expect(header.querySelector('button[aria-label="الوضع الداكن"]')).not.toBeNull();
      expect(languageButton(header)?.textContent?.trim()).toBe('English');
      expect(languageButton(header)?.getAttribute('lang')).toBe('en');

      languageButton(header)?.click();
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();

      expect(header.querySelector('.brand')?.textContent).toContain('Task Manager');
    });
  });

  describe('notification bell (an Easter egg)', () => {
    const bell = (header: HTMLElement) => header.querySelector<HTMLButtonElement>('button.bell');
    const message = (header: HTMLElement) =>
      header.querySelector('p-toast')?.textContent?.replace(/\s+/g, ' ').trim() ?? '';

    async function ring(header: HTMLElement): Promise<void> {
      bell(header)?.click();
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();
    }

    afterEach(() => {
      document.documentElement.lang = '';
      document.documentElement.dir = '';
    });

    it('is a working button, not a disabled one', async () => {
      const header = await open('/');

      expect(bell(header)?.getAttribute('aria-label')).toBe('Notifications');
      expect(bell(header)?.disabled).toBe(false);
    });

    it('answers a click with a friendly message', async () => {
      const header = await open('/');
      expect(message(header)).toBe('');

      await ring(header);

      expect(message(header)).toContain('Hope you like my task');
    });

    it('says something else on the next clicks, and starts over after the last one', async () => {
      const header = await open('/');

      await ring(header);
      await ring(header);
      expect(message(header)).toContain('No new notifications');
      await ring(header);
      expect(message(header)).toContain('Easter egg');
      await ring(header);
      expect(message(header)).toContain('Hope you like my task');
    });

    it('speaks Arabic when that language is active', async () => {
      const header = await open('/');
      Array.from(header.querySelectorAll('button'))
        .find((button) => button.textContent?.trim() === 'العربية')
        ?.click();
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();

      await ring(header);

      expect(message(header)).toContain('أتمنى أن تعجبك مهمتي');
    });

    it('asks for attention until it has been clicked once', async () => {
      const header = await open('/');
      expect(bell(header)?.classList.contains('attention')).toBe(true);

      await ring(header);

      expect(bell(header)?.classList.contains('attention')).toBe(false);
    });
  });

  describe('dark mode button', () => {
    const darkButton = (header: HTMLElement) =>
      header.querySelector<HTMLButtonElement>('button[aria-label="Dark mode"]');

    afterEach(() => document.documentElement.classList.remove('app-dark'));

    it('is a toggle that starts switched off', async () => {
      const header = await open('/');

      expect(darkButton(header)?.getAttribute('aria-pressed')).toBe('false');
    });

    it('switches the app to dark and back', async () => {
      const header = await open('/');

      darkButton(header)?.click();
      fixture.detectChanges();
      expect(darkButton(header)?.getAttribute('aria-pressed')).toBe('true');
      expect(document.documentElement.classList.contains('app-dark')).toBe(true);

      darkButton(header)?.click();
      fixture.detectChanges();
      expect(darkButton(header)?.getAttribute('aria-pressed')).toBe('false');
      expect(document.documentElement.classList.contains('app-dark')).toBe(false);
    });
  });

  it('shows the initials of the signed-in user', async () => {
    const header = await open('/');

    expect(header.querySelector('p-avatar')?.textContent?.trim()).toBe('MS');
    expect(header.querySelector('[aria-label="Signed in as Mohamed Sayed"]')).not.toBeNull();
  });

  it('offers the search box on screens with a task board', async () => {
    const header = await open('/tasks');

    expect(searchBox(header)).not.toBeNull();
  });

  it('hides the search box on screens without a task board', async () => {
    const header = await open('/analytics');

    expect(searchBox(header)).toBeNull();
  });

  it('shows a magnifying glass in the search box, hidden from screen readers', async () => {
    const header = await open('/tasks');

    const icon = searchBox(header)?.parentElement?.querySelector('.pi-search');
    expect(icon).not.toBeNull();
    expect(icon?.getAttribute('aria-hidden')).toBe('true');
  });

  it('starts with the term that is already in the address', async () => {
    const header = await open('/tasks?q=api');

    expect(searchBox(header)?.value).toBe('api');
  });

  it('fills in the term of an address that is opened after the header was created', async () => {
    fixture = TestBed.createComponent(AppHeader);
    fixture.detectChanges();
    const harness = await RouterTestingHarness.create();

    await harness.navigateByUrl('/tasks?q=api');
    await fixture.whenStable();
    fixture.detectChanges();

    expect(searchBox(fixture.nativeElement)?.value).toBe('api');
  });

  describe('typing', () => {
    // RxJS debounceTime schedules with setInterval and re-checks Date.now(). Angular's own
    // scheduler needs the real setTimeout, so only these are faked.
    beforeEach(() => vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval', 'Date'] }));
    afterEach(() => vi.useRealTimers());

    it('puts the term into the q parameter once typing has paused', async () => {
      const header = await open('/tasks');
      const router = TestBed.inject(Router);

      type(header, 'api');
      vi.advanceTimersByTime(299);
      await fixture.whenStable();
      expect(router.url).toBe('/tasks');

      vi.advanceTimersByTime(1);
      await fixture.whenStable();
      expect(router.url).toBe('/tasks?q=api');
    });

    it('uses only the last text when typing continues within the pause', async () => {
      const header = await open('/tasks');
      const router = TestBed.inject(Router);

      type(header, 'a');
      vi.advanceTimersByTime(200);
      type(header, 'ap');
      vi.advanceTimersByTime(200);
      type(header, 'api');
      vi.advanceTimersByTime(300);
      await fixture.whenStable();

      expect(router.url).toBe('/tasks?q=api');
    });

    it('does not overwrite text typed while an earlier term is still being applied', async () => {
      const header = await open('/tasks');

      type(header, 'ap');
      vi.advanceTimersByTime(300);
      type(header, 'api');
      await fixture.whenStable();

      expect(searchBox(header)?.value).toBe('api');
    });

    it('removes the parameter when the search box is cleared', async () => {
      const header = await open('/tasks?q=api');
      const router = TestBed.inject(Router);

      type(header, '');
      vi.advanceTimersByTime(300);
      await fixture.whenStable();

      expect(router.url).toBe('/tasks');
    });

    it('keeps other query parameters', async () => {
      const header = await open('/tasks?view=compact');
      const router = TestBed.inject(Router);

      type(header, 'api');
      vi.advanceTimersByTime(300);
      await fixture.whenStable();

      expect(router.url).toContain('view=compact');
      expect(router.url).toContain('q=api');
    });
  });
});
