import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { CdkDragDrop, CdkDropList } from '@angular/cdk/drag-drop';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { TranslocoService } from '@jsverse/transloco';
import { Assignee, Paginated, Task, TaskStatus } from '../../data/task';
import { TaskDetailStore } from '../../data/task-detail-store';
import { expectAccessible } from '../../../testing/a11y';
import { TaskSearch } from './task-search';
import { TaskSearchStore } from './task-search-store';

const JOHN: Assignee = {
  id: 'user-001',
  name: 'John Doe',
  avatar: 'JD',
  email: 'john.doe@company.com',
};
const SARAH: Assignee = {
  id: 'user-002',
  name: 'Sarah Smith',
  avatar: 'SS',
  email: 'sarah.smith@company.com',
};

const task = (overrides: Partial<Task>): Task => ({
  id: 'task-001',
  title: 'Title',
  description: 'Description',
  status: 'todo',
  priority: 'high',
  dueDate: '2026-12-01',
  assignee: JOHN,
  tags: [],
  createdAt: '2026-11-01T00:00:00.000Z',
  updatedAt: '2026-11-01T00:00:00.000Z',
  ...overrides,
});

const page = (data: Task[]): Paginated<Task> => ({
  data,
  first: 1,
  prev: null,
  next: null,
  last: 1,
  pages: 1,
  items: data.length,
});

describe('TaskSearch', () => {
  let http: HttpTestingController;
  let fixture: ComponentFixture<TaskSearch>;

  /** Renders the board and answers the task request with `tasks` and the user request with `assignees`. */
  async function renderBoard(tasks: Task[], assignees: Assignee[] = []): Promise<HTMLElement> {
    fixture = TestBed.createComponent(TaskSearch);
    fixture.detectChanges();
    http.expectOne((req) => req.url === '/api/tasks').flush(page(tasks));
    http.match((req) => req.url === '/api/users').forEach((req) => req.flush(assignees));
    await fixture.whenStable();
    return fixture.nativeElement as HTMLElement;
  }

  /** Answers the request a filter change triggered and returns its `_where` filter. */
  async function answerSearch(tasks: Task[]): Promise<Record<string, unknown>> {
    TestBed.tick();
    const request = http.expectOne((req) => req.url === '/api/tasks');
    request.flush(page(tasks));
    await fixture.whenStable();
    const where = request.request.params.get('_where');
    return where ? JSON.parse(where) : {};
  }

  const column = (board: HTMLElement, name: string) =>
    board.querySelector<HTMLElement>(`section[aria-label="${name}"]`);

  /** Opens the dropdown with the given aria-label and clicks the option with the given label. */
  function pickOption(board: HTMLElement, dropdown: string, option: string): void {
    board.querySelector<HTMLElement>(`[aria-label="${dropdown}"]`)?.click();
    fixture.detectChanges();
    Array.from(document.body.querySelectorAll<HTMLElement>('[role="option"]'))
      .find((item) => item.textContent?.trim() === option)
      ?.click();
    fixture.detectChanges();
  }

  const statusTab = (board: HTMLElement, label: string) =>
    Array.from(
      board.querySelectorAll<HTMLElement>('[aria-label="Filter by status"] [role="button"]'),
    ).find((tab) => tab.textContent?.trim() === label);

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    // Writes log an activity entry in the background. Answer it, then check nothing else is open.
    http.match((req) => req.url === '/api/activity').forEach((req) => req.flush({}));
    http.verify();
  });

  it('asks only for tasks of the status picked in the status tabs', async () => {
    const board = await renderBoard([
      task({ id: 'a', title: 'Design homepage', status: 'todo' }),
      task({ id: 'b', title: 'Build API', status: 'in_progress' }),
    ]);

    statusTab(board, 'In Progress')?.click();
    const where = await answerSearch([
      task({ id: 'b', title: 'Build API', status: 'in_progress' }),
    ]);

    expect(where).toEqual({ status: { eq: 'in_progress' } });
    expect(column(board, 'To Do')?.textContent).not.toContain('Design homepage');
    expect(column(board, 'In Progress')?.textContent).toContain('Build API');
  });

  it('asks for tasks of every status again when the All tab is picked', async () => {
    const board = await renderBoard([]);
    statusTab(board, 'Done')?.click();
    await answerSearch([]);

    statusTab(board, 'All')?.click();
    const where = await answerSearch([]);

    expect(where).toEqual({});
  });

  it('marks the picked status tab as selected', async () => {
    const board = await renderBoard([]);

    statusTab(board, 'To Do')?.click();
    await answerSearch([]);
    fixture.detectChanges();

    expect(statusTab(board, 'To Do')?.getAttribute('aria-pressed')).toBe('true');
    expect(statusTab(board, 'All')?.getAttribute('aria-pressed')).toBe('false');
  });

  it('asks only for tasks of the priority picked in the priority dropdown', async () => {
    const board = await renderBoard([
      task({ id: 'a', title: 'Design homepage', priority: 'low' }),
      task({ id: 'b', title: 'Fix login bug', priority: 'high' }),
    ]);

    pickOption(board, 'Filter by priority', 'High');
    const where = await answerSearch([task({ id: 'b', title: 'Fix login bug', priority: 'high' })]);

    expect(where).toEqual({ priority: { eq: 'high' } });
    expect(board.textContent).not.toContain('Design homepage');
    expect(board.textContent).toContain('Fix login bug');
  });

  it('asks for tasks of every priority again when All priorities is picked', async () => {
    const board = await renderBoard([]);
    pickOption(board, 'Filter by priority', 'Low');
    await answerSearch([]);

    pickOption(board, 'Filter by priority', 'All priorities');
    const where = await answerSearch([]);

    expect(where).toEqual({});
  });

  it('combines the status tab and the priority dropdown', async () => {
    const board = await renderBoard([]);
    statusTab(board, 'Done')?.click();
    await answerSearch([]);

    pickOption(board, 'Filter by priority', 'Medium');
    const where = await answerSearch([]);

    expect(where).toEqual({ status: { eq: 'done' }, priority: { eq: 'medium' } });
  });

  it('asks only for tasks of the assignee picked in the assignee dropdown', async () => {
    const board = await renderBoard([], [JOHN, SARAH]);

    pickOption(board, 'Filter by assignee', 'Sarah Smith');
    const where = await answerSearch([]);

    expect(where).toEqual({ assignee: { id: { eq: 'user-002' } } });
  });

  it('asks for tasks of every assignee again when All assignees is picked', async () => {
    const board = await renderBoard([], [JOHN, SARAH]);
    pickOption(board, 'Filter by assignee', 'John Doe');
    await answerSearch([]);

    pickOption(board, 'Filter by assignee', 'All assignees');
    const where = await answerSearch([]);

    expect(where).toEqual({});
  });

  describe('search term from the page', () => {
    /** The page (not this component) owns the search box, so it hands the term in as an input. */
    function giveSearchTerm(term: string): void {
      fixture.componentRef.setInput('search', term);
      fixture.detectChanges();
    }

    it('asks for tasks matching the term the page gives', async () => {
      await renderBoard([]);

      giveSearchTerm('api');
      const where = await answerSearch([]);

      expect(where).toEqual({
        or: [{ title: { contains: 'api' } }, { description: { contains: 'api' } }],
      });
    });

    it('asks for all tasks again when the term is cleared', async () => {
      await renderBoard([]);
      giveSearchTerm('api');
      await answerSearch([]);

      giveSearchTerm('');
      const where = await answerSearch([]);

      expect(where).toEqual({});
    });

    it('combines the term with the other filters', async () => {
      const board = await renderBoard([], [JOHN]);
      statusTab(board, 'To Do')?.click();
      await answerSearch([]);
      pickOption(board, 'Filter by priority', 'High');
      await answerSearch([]);
      pickOption(board, 'Filter by assignee', 'John Doe');
      await answerSearch([]);

      giveSearchTerm('api');
      const where = await answerSearch([]);

      expect(where).toEqual({
        or: [{ title: { contains: 'api' } }, { description: { contains: 'api' } }],
        status: { eq: 'todo' },
        priority: { eq: 'high' },
        assignee: { id: { eq: 'user-001' } },
      });
    });
  });

  it('shows the filters the store already holds when the board is shown again', async () => {
    TestBed.inject(TaskSearchStore).setFilters({
      status: 'done',
      priority: 'low',
      assigneeId: 'user-002',
    });

    const board = await renderBoard([], [JOHN, SARAH]);
    fixture.detectChanges();

    expect(statusTab(board, 'Done')?.getAttribute('aria-pressed')).toBe('true');
    expect(board.querySelector('[aria-label="Filter by priority"]')?.textContent).toContain('Low');
    expect(board.querySelector('[aria-label="Filter by assignee"]')?.textContent).toContain(
      'Sarah Smith',
    );
  });

  describe('when loading fails', () => {
    /** Renders the board and lets the task request fail. */
    async function renderFailedBoard(): Promise<HTMLElement> {
      fixture = TestBed.createComponent(TaskSearch);
      fixture.detectChanges();
      http
        .expectOne((req) => req.url === '/api/tasks')
        .flush('boom', { status: 500, statusText: 'Server Error' });
      http.match((req) => req.url === '/api/users').forEach((req) => req.flush([]));
      await fixture.whenStable();
      fixture.detectChanges();
      return fixture.nativeElement;
    }

    const retryButton = (board: HTMLElement) =>
      Array.from(board.querySelectorAll('button')).find(
        (item) => item.textContent?.trim() === 'Retry',
      );

    it('says so and offers a retry instead of showing busy columns', async () => {
      const board = await renderFailedBoard();

      expect(board.querySelector('[role="alert"]')?.textContent).toContain('Could not load tasks.');
      expect(retryButton(board)).toBeDefined();
      expect(column(board, 'To Do')?.getAttribute('aria-busy')).not.toBe('true');
    });

    it('words the error message and the retry button in Arabic', async () => {
      TestBed.inject(TranslocoService).setActiveLang('ar');
      const board = await renderFailedBoard();

      expect(board.querySelector('[role="alert"]')?.textContent).toContain('تعذر تحميل المهام.');
      expect(
        Array.from(board.querySelectorAll('button')).some(
          (item) => item.textContent?.trim() === 'إعادة المحاولة',
        ),
      ).toBe(true);
    });

    it('loads the tasks again when Retry is clicked and clears the message', async () => {
      const board = await renderFailedBoard();

      retryButton(board)?.click();
      await answerSearch([task({ title: 'Recovered task' })]);
      fixture.detectChanges();

      expect(board.querySelector('[role="alert"]')).toBeNull();
      expect(board.textContent).toContain('Recovered task');
    });

    it('keeps the tasks that were already shown when a plain reload fails', async () => {
      const board = await renderBoard([task({ title: 'Already shown' })]);

      TestBed.inject(TaskSearchStore).reload();
      TestBed.tick();
      http
        .expectOne((req) => req.url === '/api/tasks')
        .flush('boom', { status: 500, statusText: 'Server Error' });
      await fixture.whenStable();
      fixture.detectChanges();

      expect(board.querySelector('[role="alert"]')?.textContent).toContain('Could not load tasks.');
      expect(board.textContent).toContain('Already shown');
    });

    it('does not show tasks of another filter when a filter change fails', async () => {
      const board = await renderBoard([task({ title: 'Already shown' })]);

      statusTab(board, 'Done')?.click();
      TestBed.tick();
      http
        .expectOne((req) => req.url === '/api/tasks')
        .flush('boom', { status: 500, statusText: 'Server Error' });
      await fixture.whenStable();
      fixture.detectChanges();

      expect(board.querySelector('[role="alert"]')).not.toBeNull();
      expect(board.textContent).not.toContain('Already shown');
    });
  });

  describe('loading', () => {
    it('keeps showing the cards while a reload is in progress', async () => {
      const board = await renderBoard([task({ title: 'Stays visible' })]);

      TestBed.inject(TaskSearchStore).reload();
      TestBed.tick();
      fixture.detectChanges();

      expect(column(board, 'To Do')?.getAttribute('aria-busy')).not.toBe('true');
      expect(board.textContent).toContain('Stays visible');
      http.expectOne((req) => req.url === '/api/tasks').flush(page([]));
    });

    it('shows busy columns without cards until the tasks have arrived', async () => {
      fixture = TestBed.createComponent(TaskSearch);
      fixture.detectChanges();
      const board: HTMLElement = fixture.nativeElement;

      expect(column(board, 'To Do')?.getAttribute('aria-busy')).toBe('true');
      expect(board.querySelector('article')).toBeNull();

      http.expectOne((req) => req.url === '/api/tasks').flush(page([task({ title: 'Loaded' })]));
      http.expectOne((req) => req.url === '/api/users').flush([]);
      await fixture.whenStable();
      fixture.detectChanges();

      expect(column(board, 'To Do')?.getAttribute('aria-busy')).not.toBe('true');
      expect(board.textContent).toContain('Loaded');
    });
  });

  describe('an empty column', () => {
    /** The lines of the message of a column, or `undefined` when it shows none. */
    const empty = (board: HTMLElement, name: string) => {
      const lines = column(board, name)?.querySelectorAll('.empty p');
      return lines?.length
        ? Array.from(lines)
            .map((line) => line.textContent?.trim())
            .join(' ')
        : undefined;
    };

    it('says it has no tasks and invites a card, while a column with cards says nothing', async () => {
      const board = await renderBoard([task({ status: 'todo' })]);

      expect(empty(board, 'To Do')).toBeUndefined();
      expect(empty(board, 'In Progress')).toBe('No tasks here Drag a card here');
      expect(empty(board, 'Done')).toBe('No tasks here Drag a card here');
    });

    it('keeps the message inside the area where a card can be dropped', async () => {
      const board = await renderBoard([]);

      expect(column(board, 'Done')?.querySelector('.cards .empty')).not.toBeNull();
    });

    it('does not say a column is empty while the tasks are still loading', async () => {
      fixture = TestBed.createComponent(TaskSearch);
      fixture.detectChanges();
      const board: HTMLElement = fixture.nativeElement;

      expect(board.querySelector('.empty')).toBeNull();

      http.expectOne((req) => req.url === '/api/tasks').flush(page([]));
      http.expectOne((req) => req.url === '/api/users').flush([]);
      await fixture.whenStable();
      fixture.detectChanges();
      expect(board.querySelectorAll('.empty')).toHaveLength(3);
    });

    it('is worded in Arabic when that language is active', async () => {
      TestBed.inject(TranslocoService).setActiveLang('ar');
      const board = await renderBoard([]);

      expect(empty(board, 'للتنفيذ')).toBe('لا توجد مهام هنا اسحب بطاقة إلى هنا');
    });
  });

  it('starts creating a task when the New Task button is clicked', async () => {
    const board = await renderBoard([]);

    const newTask = Array.from(board.querySelectorAll('button')).find(
      (item) => item.textContent?.trim() === 'New Task',
    );
    newTask?.click();

    expect(TestBed.inject(TaskDetailStore).creating()).toBe(true);
  });

  /** Opens the kebab menu of the card with this title and clicks the given menu item. */
  function pickCardAction(board: HTMLElement, title: string, action: string): void {
    board.querySelector<HTMLElement>(`button[aria-label="Actions for ${title}"]`)?.click();
    fixture.detectChanges();
    Array.from(document.body.querySelectorAll<HTMLElement>('[role="menuitem"]'))
      .find((item) => item.textContent?.trim() === action)
      ?.querySelector<HTMLElement>('a, button, .p-menu-item-link')
      ?.click();
    fixture.detectChanges();
    // Overlays opened by the menu command render on the next pass.
    fixture.detectChanges();
  }

  it('starts editing the task whose Edit action was picked', async () => {
    const board = await renderBoard([
      task({ id: 'a', title: 'Design homepage' }),
      task({ id: 'b', title: 'Fix login bug' }),
    ]);

    pickCardAction(board, 'Fix login bug', 'Edit');

    expect(TestBed.inject(TaskDetailStore).editId()).toBe('b');
    TestBed.tick();
    http.expectOne('/api/tasks/b');
  });

  /** PrimeNG leaves an empty host element behind and moves the overlay itself to the body. */
  const confirmDialog = () =>
    Array.from(document.body.querySelectorAll<HTMLElement>('[role="alertdialog"]')).find((item) =>
      item.textContent?.trim(),
    );
  const confirmButton = (label: string) =>
    Array.from(confirmDialog()?.querySelectorAll('button') ?? []).find(
      (item) => item.textContent?.trim() === label,
    );

  it('has an accessible delete confirmation', async () => {
    const board = await renderBoard([task({ id: 'b', title: 'Fix login bug' })]);

    pickCardAction(board, 'Fix login bug', 'Delete');

    await expectAccessible(document.body);
  });

  it('asks for confirmation before deleting and sends nothing yet', async () => {
    const board = await renderBoard([task({ id: 'b', title: 'Fix login bug' })]);

    pickCardAction(board, 'Fix login bug', 'Delete');

    expect(confirmDialog()?.textContent).toContain('Fix login bug');
    TestBed.tick();
    http.expectNone((req) => req.method === 'DELETE');
  });

  it('deletes the task once confirmed and reloads the board without it', async () => {
    const board = await renderBoard([task({ id: 'b', title: 'Fix login bug' })]);
    pickCardAction(board, 'Fix login bug', 'Delete');

    confirmButton('Delete')?.click();
    TestBed.tick();
    http.expectOne({ method: 'DELETE', url: '/api/tasks/b' }).flush({ id: 'b' });
    await answerSearch([]);
    fixture.detectChanges();

    expect(board.textContent).not.toContain('Fix login bug');
  });

  it('declines the deletion when the Escape key is pressed', async () => {
    const board = await renderBoard([task({ id: 'b', title: 'Fix login bug' })]);
    pickCardAction(board, 'Fix login bug', 'Delete');

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    fixture.detectChanges();
    TestBed.tick();

    http.expectNone((req) => req.method === 'DELETE');
    expect(TestBed.inject(TaskDetailStore).changeCount()).toBe(0);
    expect(
      Array.from(document.body.querySelectorAll('[role="alertdialog"]')).some((item) =>
        item.textContent?.includes('Fix login bug'),
      ),
    ).toBe(false);
  });

  it('returns focus to the card menu button when the deletion is declined', async () => {
    const board = await renderBoard([task({ id: 'b', title: 'Fix login bug' })]);
    pickCardAction(board, 'Fix login bug', 'Delete');

    confirmButton('Cancel')?.click();
    fixture.detectChanges();

    expect(document.activeElement).toBe(
      board.querySelector('button[aria-label="Actions for Fix login bug"]'),
    );
  });

  it('keeps the task and sends nothing when the deletion is declined', async () => {
    const board = await renderBoard([task({ id: 'b', title: 'Fix login bug' })]);
    pickCardAction(board, 'Fix login bug', 'Delete');

    confirmButton('Cancel')?.click();
    fixture.detectChanges();
    TestBed.tick();

    http.expectNone((req) => req.method === 'DELETE');
    expect(board.textContent).toContain('Fix login bug');
  });

  describe('drag and drop', () => {
    /** Drops the card of `dropped` on the column `to`, at `index`, as the CDK would report it. */
    function drop(dropped: Task, to: TaskStatus, index: number): void {
      const list = fixture.debugElement
        .queryAll(By.directive(CdkDropList))
        .map((element) => element.injector.get(CdkDropList))
        .find((candidate) => candidate.data === to)!;
      list.dropped.emit({
        item: { data: dropped },
        container: { data: to },
        currentIndex: index,
      } as unknown as CdkDragDrop<TaskStatus, TaskStatus, Task>);
      fixture.detectChanges();
    }

    const titles = (board: HTMLElement, name: string) =>
      Array.from(column(board, name)!.querySelectorAll('h3')).map((item) =>
        item.textContent?.trim(),
      );

    it('shows the card in the column it was dropped on, before anything is saved', async () => {
      const a = task({ id: 'a', title: 'Design homepage', status: 'todo' });
      const board = await renderBoard([a, task({ id: 'b', title: 'Build API', status: 'done' })]);

      drop(a, 'in_progress', 0);

      expect(titles(board, 'In Progress')).toEqual(['Design homepage']);
      expect(titles(board, 'To Do')).toEqual([]);
      TestBed.tick();
      http.match({ method: 'PATCH' }).forEach((req) => req.flush({}));
    });

    it('reorders a column and saves only the cards whose place changed', async () => {
      const a = task({ id: 'a', title: 'First', order: 0 });
      const b = task({ id: 'b', title: 'Second', order: 1 });
      const c = task({ id: 'c', title: 'Third', order: 2 });
      const board = await renderBoard([a, b, c]);

      drop(c, 'todo', 0);

      expect(titles(board, 'To Do')).toEqual(['Third', 'First', 'Second']);
      TestBed.tick();
      const bodies = http
        .match({ method: 'PATCH' })
        .map((req) => ({ url: req.request.url, body: req.request.body }));
      expect(bodies).toEqual([
        { url: '/api/tasks/c', body: { order: 0 } },
        { url: '/api/tasks/a', body: { order: 1 } },
        { url: '/api/tasks/b', body: { order: 2 } },
      ]);
    });

    it('lists the cards that were placed by hand in their saved order', async () => {
      const board = await renderBoard([
        task({ id: 'a', title: 'Placed second', order: 1 }),
        task({ id: 'b', title: 'Never moved' }),
        task({ id: 'c', title: 'Placed first', order: 0 }),
      ]);

      expect(titles(board, 'To Do')).toEqual(['Placed first', 'Placed second', 'Never moved']);
    });

    it('does not let a card be dragged while a move is being saved', async () => {
      const a = task({ id: 'a', title: 'First', status: 'todo' });
      const board = await renderBoard([a, task({ id: 'b', title: 'Second', status: 'todo' })]);
      const dragging = () => board.querySelectorAll('app-task-card.cdk-drag-disabled').length;
      expect(dragging()).toBe(0);

      drop(a, 'done', 0);
      TestBed.tick();
      fixture.detectChanges();
      expect(dragging()).toBe(2);

      http.expectOne({ method: 'PATCH', url: '/api/tasks/a' }).flush({});
      http.match((req) => req.url === '/api/activity').forEach((req) => req.flush({}));
      await new Promise((resolve) => setTimeout(resolve));
      fixture.detectChanges();
      expect(dragging()).toBe(0);
      await answerSearch([]);
    });

    it('saves nothing when a card is dropped where it already was', async () => {
      const a = task({ id: 'a', title: 'First', order: 0 });
      const board = await renderBoard([a, task({ id: 'b', title: 'Second', order: 1 })]);

      drop(a, 'todo', 0);
      TestBed.tick();

      http.expectNone({ method: 'PATCH' });
      expect(titles(board, 'To Do')).toEqual(['First', 'Second']);
    });

    describe('when the move cannot be saved', () => {
      const a = task({ id: 'a', title: 'Design homepage', status: 'todo' });

      /** Drops the card on Done, fails the save and answers the reload with the real board. */
      async function failToMove(): Promise<HTMLElement> {
        const board = await renderBoard([a]);
        drop(a, 'done', 0);
        TestBed.tick();
        http
          .expectOne({ method: 'PATCH', url: '/api/tasks/a' })
          .flush('boom', { status: 500, statusText: 'Server Error' });
        await new Promise((resolve) => setTimeout(resolve));
        await answerSearch([a]);
        fixture.detectChanges();
        return board;
      }

      it('puts the card back by loading the board again', async () => {
        const board = await failToMove();

        expect(titles(board, 'To Do')).toEqual(['Design homepage']);
        expect(titles(board, 'Done')).toEqual([]);
      });

      it('says so', async () => {
        const board = await failToMove();

        expect(board.querySelector('[role="alert"]')?.textContent).toContain(
          'Could not save the move. The board was loaded again.',
        );
      });

      it('says so in Arabic', async () => {
        TestBed.inject(TranslocoService).setActiveLang('ar');
        const board = await failToMove();

        expect(board.querySelector('[role="alert"]')?.textContent).toContain(
          'تعذر حفظ النقل. تم تحميل اللوحة مرة أخرى.',
        );
      });

      it('stops saying so after the next move was saved', async () => {
        const board = await failToMove();

        drop(a, 'done', 0);
        TestBed.tick();
        http.expectOne({ method: 'PATCH', url: '/api/tasks/a' }).flush({});
        http.match((req) => req.url === '/api/activity').forEach((req) => req.flush({}));
        await new Promise((resolve) => setTimeout(resolve));
        fixture.detectChanges();

        expect(board.querySelector('[role="alert"]')).toBeNull();
        await answerSearch([{ ...a, status: 'done', order: 0 }]);
      });
    });

    it('saves the new status and place of the card, then loads the board again', async () => {
      const a = task({ id: 'a', title: 'Design homepage', status: 'todo' });
      const board = await renderBoard([a]);

      drop(a, 'done', 0);
      TestBed.tick();
      const request = http.expectOne({ method: 'PATCH', url: '/api/tasks/a' });
      expect(request.request.body).toMatchObject({ status: 'done', order: 0 });
      request.flush({});
      // A new status is logged as an update.
      http.match((req) => req.url === '/api/activity').forEach((req) => req.flush({}));
      await answerSearch([{ ...a, status: 'done', order: 0 }]);
      fixture.detectChanges();

      expect(titles(board, 'Done')).toEqual(['Design homepage']);
    });
  });

  it('shows each task in the column of its status', async () => {
    const board = await renderBoard([
      task({ id: 'a', title: 'Design homepage', status: 'todo' }),
      task({ id: 'b', title: 'Build API', status: 'in_progress' }),
      task({ id: 'c', title: 'Fix login bug', status: 'done' }),
    ]);

    expect(column(board, 'To Do')?.textContent).toContain('Design homepage');
    expect(column(board, 'In Progress')?.textContent).toContain('Build API');
    expect(column(board, 'Done')?.textContent).toContain('Fix login bug');
    expect(column(board, 'To Do')?.textContent).not.toContain('Build API');
  });

  it('shows how many tasks each column holds', async () => {
    const board = await renderBoard([
      task({ id: 'a', status: 'todo' }),
      task({ id: 'b', status: 'todo' }),
      task({ id: 'c', status: 'in_progress' }),
    ]);

    const count = (name: string) =>
      column(board, name)?.querySelector('.count')?.textContent?.trim();
    expect(count('To Do')).toBe('2 tasks');
    expect(count('In Progress')).toBe('1 task');
    expect(count('Done')).toBe('0 tasks');
  });

  it('shows description, priority and assignee on a task card', async () => {
    const board = await renderBoard([
      task({
        title: 'Design homepage',
        description: 'Create wireframes for the redesign',
        priority: 'medium',
        assignee: { id: 'user-002', name: 'Sarah Smith', avatar: 'SS', email: 's@company.com' },
      }),
    ]);

    const card = board.querySelector('article')?.textContent;
    expect(card).toContain('Create wireframes for the redesign');
    expect(card).toContain('Medium');
    expect(card).toContain('@Sarah');
    expect(card).toContain('SS');
  });

  describe('in Arabic', () => {
    beforeEach(() => TestBed.inject(TranslocoService).setActiveLang('ar'));

    it('words the priority and the actions button of a card', async () => {
      const board = await renderBoard([task({ title: 'Fix login bug', priority: 'high' })]);

      const card = board.querySelector('article')!;
      expect(card.querySelector('p-tag')?.textContent?.trim()).toBe('عالية');
      expect(card.querySelector('button[aria-label="إجراءات Fix login bug"]')).not.toBeNull();
    });

    it('words the status tabs and the labels of the three filters', async () => {
      const board = await renderBoard([]);

      const tabs = Array.from(
        board.querySelectorAll('[aria-label="تصفية حسب الحالة"] [role="button"]'),
      ).map((tab) => tab.textContent?.trim());
      expect(tabs).toEqual(['الكل', 'للتنفيذ', 'قيد التنفيذ', 'مكتملة']);
      expect(board.querySelector('[aria-label="تصفية حسب الأولوية"]')).not.toBeNull();
      expect(board.querySelector('[aria-label="تصفية حسب المسؤول"]')).not.toBeNull();
    });

    it('words the options of the priority and assignee dropdowns', async () => {
      const board = await renderBoard([]);

      const dropdown = (label: string) => board.querySelector(`[aria-label="${label}"]`);
      expect(dropdown('تصفية حسب الأولوية')?.textContent).toContain('كل الأولويات');
      expect(dropdown('تصفية حسب المسؤول')?.textContent).toContain('كل المسؤولين');
      (dropdown('تصفية حسب الأولوية') as HTMLElement).click();
      fixture.detectChanges();
      const options = Array.from(document.body.querySelectorAll('[role="option"]')).map((item) =>
        item.textContent?.trim(),
      );
      expect(options).toEqual(['كل الأولويات', 'عالية', 'متوسطة', 'منخفضة']);
    });

    it('words the column names and the New Task button', async () => {
      const board = await renderBoard([]);

      for (const name of ['للتنفيذ', 'قيد التنفيذ', 'مكتملة']) {
        expect(column(board, name)?.querySelector('h2')?.textContent?.trim()).toBe(name);
      }
      expect(
        Array.from(board.querySelectorAll('button')).some(
          (item) => item.textContent?.trim() === 'مهمة جديدة',
        ),
      ).toBe(true);
    });

    it('words the option list of a dropdown with the Arabic PrimeNG text', async () => {
      const board = await renderBoard([]);

      board.querySelector<HTMLElement>('[aria-label="تصفية حسب الأولوية"]')?.click();
      fixture.detectChanges();

      expect(document.body.querySelector('[role="listbox"]')?.getAttribute('aria-label')).toBe(
        'قائمة الخيارات',
      );
    });

    it('words the task count of a column with the Arabic plural', async () => {
      const board = await renderBoard([
        task({ id: 'a', status: 'todo' }),
        task({ id: 'b', status: 'todo' }),
        task({ id: 'c', status: 'in_progress' }),
      ]);

      const count = (status: string) =>
        board.querySelectorAll('.count')[status === 'todo' ? 0 : 1]?.textContent?.trim();
      expect(count('todo')).toBe('2 مهمتان');
      expect(count('in_progress')).toBe('1 مهمة');
    });

    /** Opens the delete question of the card with this title, using the Arabic menu. */
    function askToDelete(board: HTMLElement, title: string): void {
      board.querySelector<HTMLElement>(`button[aria-label="إجراءات ${title}"]`)?.click();
      fixture.detectChanges();
      Array.from(document.body.querySelectorAll<HTMLElement>('[role="menuitem"]'))
        .find((item) => item.textContent?.trim() === 'حذف')
        ?.querySelector<HTMLElement>('a, button, .p-menu-item-link')
        ?.click();
      fixture.detectChanges();
      fixture.detectChanges();
    }

    it('words the delete question, its buttons and its close button', async () => {
      const board = await renderBoard([task({ id: 'b', title: 'Fix login bug' })]);

      askToDelete(board, 'Fix login bug');

      const dialog = confirmDialog();
      expect(dialog?.textContent).toContain('حذف المهمة');
      expect(dialog?.textContent).toContain('هل تريد حذف "Fix login bug"؟');
      expect(confirmButton('إلغاء')).toBeDefined();
      expect(confirmButton('حذف')).toBeDefined();
      expect(dialog?.querySelector('[aria-label="إغلاق النافذة"]')).not.toBeNull();
    });

    it('returns focus to the card menu button when the deletion is declined', async () => {
      const board = await renderBoard([task({ id: 'b', title: 'Fix login bug' })]);
      askToDelete(board, 'Fix login bug');

      confirmButton('إلغاء')?.click();
      fixture.detectChanges();

      expect(document.activeElement).toBe(
        board.querySelector('button[aria-label="إجراءات Fix login bug"]'),
      );
    });

    it('isolates the assignee handle so the @ stays in front of the name in right-to-left text', async () => {
      const board = await renderBoard([
        task({
          assignee: { id: 'user-002', name: 'Sarah Smith', avatar: 'SS', email: 's@company.com' },
        }),
      ]);

      expect(board.querySelector('article footer bdi')?.textContent).toBe('@Sarah');
    });

    it('words the actions in the menu of a card', async () => {
      const board = await renderBoard([task({ title: 'Fix login bug' })]);

      board.querySelector<HTMLElement>('button[aria-label="إجراءات Fix login bug"]')?.click();
      fixture.detectChanges();

      const items = Array.from(document.body.querySelectorAll('[role="menuitem"]')).map((item) =>
        item.textContent?.trim(),
      );
      expect(items).toEqual(['تعديل', 'حذف']);
    });
  });

  it('shows the tags of a task', async () => {
    const board = await renderBoard([task({ tags: ['Backend', 'Critical'] })]);

    const card = board.querySelector('article')?.textContent;
    expect(card).toContain('Backend');
    expect(card).toContain('Critical');
  });

  it('shows how overdue a late task is and when an upcoming one is due', async () => {
    const board = await renderBoard([
      task({ id: 'late', title: 'Late task', dueDate: '2020-01-01' }),
      task({ id: 'soon', title: 'Upcoming task', dueDate: '2999-01-01' }),
    ]);

    const [late, soon] = Array.from(board.querySelectorAll('article'));
    expect(late.textContent).toContain('Overdue by');
    expect(soon.textContent).toContain('Due in');
  });

  it('words the due text in Arabic when that language is active', async () => {
    TestBed.inject(TranslocoService).setActiveLang('ar');
    const yesterday = new Date(Date.now() - 86_400_000).toLocaleDateString('en-CA');
    const board = await renderBoard([task({ dueDate: yesterday })]);

    expect(board.querySelector('article')?.textContent).toContain('متأخرة بيوم واحد');
  });

  it('shows when a done task was completed instead of a due date', async () => {
    const board = await renderBoard([
      task({
        status: 'done',
        dueDate: '2020-01-01',
        completedAt: new Date().toISOString(),
      }),
    ]);

    const card = board.querySelector('article')?.textContent;
    expect(card).toContain('Completed today');
    expect(card).not.toContain('Overdue');
  });

  it('lists overdue tasks first in a column and keeps the order of the rest', async () => {
    const board = await renderBoard([
      task({ id: 'a', title: 'Upcoming A', dueDate: '2999-01-01' }),
      task({ id: 'b', title: 'Late B', dueDate: '2020-01-01' }),
      task({ id: 'c', title: 'Upcoming C', dueDate: '2999-01-01' }),
      task({ id: 'd', title: 'Late D', dueDate: '2020-01-02' }),
    ]);

    const titles = Array.from(column(board, 'To Do')!.querySelectorAll('h3')).map((item) =>
      item.textContent?.trim(),
    );
    expect(titles).toEqual(['Late B', 'Late D', 'Upcoming A', 'Upcoming C']);
  });

  it('highlights overdue cards but not upcoming or done ones', async () => {
    const board = await renderBoard([
      task({ id: 'late', status: 'todo', dueDate: '2020-01-01' }),
      task({ id: 'soon', status: 'todo', dueDate: '2999-01-01' }),
      task({ id: 'finished', status: 'done', dueDate: '2020-01-01' }),
    ]);

    const [late, soon, finished] = Array.from(board.querySelectorAll('article'));
    expect(late.classList).toContain('overdue');
    expect(soon.classList).not.toContain('overdue');
    expect(finished.classList).not.toContain('overdue');
  });
});
