import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter, withComponentInputBinding } from '@angular/router';
import { TranslocoService } from '@jsverse/transloco';
import { App } from './app';
import { routes } from './app.routes';
import { Language } from './i18n/language';
import { expectAccessible } from './testing/a11y';

describe('App', () => {
  let http: HttpTestingController;
  /** What the task requests answer with. Tests that need cards set it before opening a screen. */
  let boardTasks: unknown[] = [];

  /** Answers every request the screen made with empty data. */
  function answerAll(): void {
    http
      .match(() => true)
      .filter((req) => !req.cancelled)
      .forEach((req) => {
        const url = req.request.url;
        if (url.endsWith('/statistics')) {
          req.flush([
            {
              id: 'stat-001',
              title: 'Total Tasks',
              icon: '📊',
              value: 1,
              change: '+1',
              changeLabel: 'this week',
              changeType: 'positive',
              color: '#1976D2',
            },
          ]);
        } else if (url.endsWith('/users')) {
          req.flush([]);
        } else {
          req.flush({ data: boardTasks, items: boardTasks.length });
        }
      });
  }

  /** Renders the whole app and opens a screen inside it. */
  async function openApp(url: string): Promise<ComponentFixture<App>> {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    await TestBed.inject(Router).navigateByUrl(url);
    fixture.detectChanges();
    answerAll();
    await fixture.whenStable();
    fixture.detectChanges();
    return fixture;
  }

  beforeEach(() => {
    boardTasks = [];
    TestBed.configureTestingModule({
      imports: [App],
      providers: [
        provideRouter(routes, withComponentInputBinding()),
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    answerAll();
    http.verify();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('frames every screen with the header and the sidebar', async () => {
    const fixture = await openApp('/');

    const root: HTMLElement = fixture.nativeElement;
    expect(root.querySelector('app-header')?.textContent).toContain('Task Manager');
    expect(root.querySelector('app-sidebar nav')).not.toBeNull();
  });

  describe('menu on small screens', () => {
    const burger = (fixture: ComponentFixture<App>) =>
      fixture.nativeElement.querySelector('button[aria-label="Menu"]') as HTMLButtonElement;

    it('starts with a closed menu button in the header', async () => {
      const fixture = await openApp('/');

      expect(burger(fixture).closest('app-header')).not.toBeNull();
      expect(burger(fixture).getAttribute('aria-expanded')).toBe('false');
    });

    it('opens and closes with the menu button', async () => {
      const fixture = await openApp('/');

      burger(fixture).click();
      fixture.detectChanges();
      expect(burger(fixture).getAttribute('aria-expanded')).toBe('true');

      burger(fixture).click();
      fixture.detectChanges();
      expect(burger(fixture).getAttribute('aria-expanded')).toBe('false');
    });

    it('closes when the dimmed area next to the menu is clicked', async () => {
      const fixture = await openApp('/');
      const root: HTMLElement = fixture.nativeElement;
      expect(root.querySelector('.backdrop')).toBeNull();
      burger(fixture).click();
      fixture.detectChanges();

      root.querySelector<HTMLElement>('.backdrop')?.click();
      fixture.detectChanges();

      expect(burger(fixture).getAttribute('aria-expanded')).toBe('false');
      expect(root.querySelector('.backdrop')).toBeNull();
    });

    it('closes with Escape and gives focus back to the menu button', async () => {
      const fixture = await openApp('/');
      burger(fixture).click();
      fixture.detectChanges();

      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
      fixture.detectChanges();

      expect(burger(fixture).getAttribute('aria-expanded')).toBe('false');
      expect(document.activeElement).toBe(burger(fixture));
    });

    it('closes after a link of the menu was followed', async () => {
      const fixture = await openApp('/');
      burger(fixture).click();
      fixture.detectChanges();

      const root: HTMLElement = fixture.nativeElement;
      const tasks = Array.from(root.querySelectorAll<HTMLAnchorElement>('app-sidebar a')).find(
        (item) => item.textContent?.trim() === 'Tasks',
      );
      tasks?.click();
      await fixture.whenStable();
      answerAll();
      await fixture.whenStable();
      fixture.detectChanges();

      expect(burger(fixture).getAttribute('aria-expanded')).toBe('false');
    });
  });

  it('shows the statistic cards above the task board on the home route', async () => {
    const fixture = await openApp('/');

    const screen: HTMLElement = fixture.nativeElement.querySelector('main');
    expect(screen.querySelector('app-statistics-overview')).not.toBeNull();
    for (const column of ['To Do', 'In Progress', 'Done']) {
      expect(screen.querySelector(`section[aria-label="${column}"]`)).not.toBeNull();
    }
  });

  it('shows only the task board on the tasks route', async () => {
    const fixture = await openApp('/tasks');

    const screen: HTMLElement = fixture.nativeElement.querySelector('main');
    expect(screen.querySelector('app-statistics-overview')).toBeNull();
    expect(screen.querySelector('section[aria-label="To Do"]')).not.toBeNull();
  });

  it('names each screen with a level-one heading', async () => {
    const fixture = await openApp('/tasks');
    const heading = () => fixture.nativeElement.querySelector('h1')?.textContent?.trim();
    expect(heading()).toBe('Tasks');

    await TestBed.inject(Router).navigateByUrl('/');
    fixture.detectChanges();
    answerAll();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(heading()).toBe('Dashboard');
  });

  it('writes the level-one heading in Arabic, also after the language changed', async () => {
    const fixture = await openApp('/tasks');
    const heading = () => fixture.nativeElement.querySelector('h1')?.textContent?.trim();
    expect(heading()).toBe('Tasks');

    TestBed.inject(TranslocoService).setActiveLang('ar');
    await fixture.whenStable();
    fixture.detectChanges();

    expect(heading()).toBe('المهام');
  });

  describe('accessibility', () => {
    it('passes the axe checks on the home screen', async () => {
      // The real index.html declares the language. The test page does not.
      document.documentElement.lang = 'en';
      await openApp('/');

      await expectAccessible(document.documentElement, { page: true });
    });

    it('passes the axe checks with the menu of a task card open', async () => {
      document.documentElement.lang = 'en';
      boardTasks = [
        {
          id: 'task-001',
          title: 'Fix login bug',
          description: 'Users cannot log in',
          status: 'todo',
          priority: 'high',
          dueDate: '2999-01-01',
          assignee: { id: 'user-001', name: 'John Doe', avatar: 'JD', email: 'j@company.com' },
          tags: [],
          createdAt: '2026-11-01T00:00:00.000Z',
          updatedAt: '2026-11-01T00:00:00.000Z',
        },
      ];
      const fixture = await openApp('/tasks');

      fixture.nativeElement.querySelector('button[aria-label="Actions for Fix login bug"]').click();
      fixture.detectChanges();

      expect(document.querySelector('[role="menuitem"]')).not.toBeNull();
      await expectAccessible(document.documentElement, { page: true });
    });

    it('passes the axe checks on the tasks screen', async () => {
      document.documentElement.lang = 'en';
      await openApp('/tasks');

      await expectAccessible(document.documentElement, { page: true });
    });

    describe('in Arabic', () => {
      // The header creates `Language`, which sets the active language itself, so the switch to
      // Arabic goes through it. It also sets `lang` and `dir` of the page.
      beforeEach(() => TestBed.inject(Language).toggle());

      afterEach(() => {
        document.documentElement.lang = '';
        document.documentElement.dir = '';
      });

      it.each(['/', '/tasks', '/analytics'])('passes the axe checks on %s', async (url) => {
        const fixture = await openApp(url);

        expect(fixture.nativeElement.querySelector('app-header')?.textContent).toContain(
          'مدير المهام',
        );
        expect(document.documentElement.dir).toBe('rtl');
        await expectAccessible(document.documentElement, { page: true });
      });

      it('passes the axe checks with the menu of a task card open', async () => {
        boardTasks = [
          {
            id: 'task-001',
            title: 'Fix login bug',
            description: 'Users cannot log in',
            status: 'todo',
            priority: 'high',
            dueDate: '2999-01-01',
            assignee: { id: 'user-001', name: 'John Doe', avatar: 'JD', email: 'j@company.com' },
            tags: [],
            createdAt: '2026-11-01T00:00:00.000Z',
            updatedAt: '2026-11-01T00:00:00.000Z',
          },
        ];
        const fixture = await openApp('/tasks');

        fixture.nativeElement.querySelector('button[aria-label="إجراءات Fix login bug"]').click();
        fixture.detectChanges();

        expect(document.querySelector('[role="menuitem"]')).not.toBeNull();
        await expectAccessible(document.documentElement, { page: true });
      });
    });
  });
});
