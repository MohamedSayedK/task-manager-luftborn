import { completedLabel, dueLabel, isOverdue, overdueFirst } from './task-due';

describe('isOverdue', () => {
  const today = '2026-11-21';

  it('is true for an unfinished task whose due date has passed', () => {
    expect(isOverdue({ dueDate: '2026-11-19', status: 'todo' }, today)).toBe(true);
  });

  it('is never true for a done task, even past its due date', () => {
    expect(isOverdue({ dueDate: '2026-11-19', status: 'done' }, today)).toBe(false);
  });

  it('is false on the due date itself and before it', () => {
    expect(isOverdue({ dueDate: today, status: 'in_progress' }, today)).toBe(false);
    expect(isOverdue({ dueDate: '2026-11-25', status: 'todo' }, today)).toBe(false);
  });
});

describe('dueLabel', () => {
  const today = '2026-11-21';

  it('counts the days left for an upcoming task', () => {
    expect(dueLabel({ dueDate: '2026-11-24', status: 'todo' }, today)).toEqual({
      key: 'card.dueIn',
      params: { count: 3 },
    });
  });

  it('counts the days overdue for a late task', () => {
    expect(dueLabel({ dueDate: '2026-11-19', status: 'todo' }, today)).toEqual({
      key: 'card.overdueBy',
      params: { count: 2 },
    });
  });

  it('uses its own key on the due date and passes one day as a count of 1', () => {
    expect(dueLabel({ dueDate: today, status: 'todo' }, today)).toEqual({ key: 'card.dueToday' });
    expect(dueLabel({ dueDate: '2026-11-22', status: 'todo' }, today)).toEqual({
      key: 'card.dueIn',
      params: { count: 1 },
    });
    expect(dueLabel({ dueDate: '2026-11-20', status: 'todo' }, today)).toEqual({
      key: 'card.overdueBy',
      params: { count: 1 },
    });
  });

  it('has no label for a done task', () => {
    expect(dueLabel({ dueDate: '2026-11-19', status: 'done' }, today)).toBeNull();
  });
});

describe('completedLabel', () => {
  const today = '2026-11-21';
  /** Noon local time on `date`, as the ISO string the API would send. */
  const at = (date: string) => new Date(`${date}T12:00:00`).toISOString();

  it('uses its own key for a task completed today', () => {
    expect(completedLabel({ status: 'done', completedAt: at(today) }, today)).toEqual({
      key: 'card.completedToday',
    });
  });

  it('counts back for earlier completions, with its own key for one day', () => {
    expect(completedLabel({ status: 'done', completedAt: at('2026-11-20') }, today)).toEqual({
      key: 'card.completedYesterday',
    });
    expect(completedLabel({ status: 'done', completedAt: at('2026-11-17') }, today)).toEqual({
      key: 'card.completedAgo',
      params: { count: 4 },
    });
  });

  it('has no label for an unfinished task or one without a completion date', () => {
    expect(completedLabel({ status: 'todo', completedAt: at(today) }, today)).toBeNull();
    expect(completedLabel({ status: 'done' }, today)).toBeNull();
  });
});

describe('overdueFirst', () => {
  const today = '2026-11-21';
  const open = (id: string, dueDate: string) => ({ id, dueDate, status: 'todo' });

  it('does not treat a done task past its due date as overdue', () => {
    const tasks = [
      open('upcoming', '2026-12-01'),
      { id: 'done', dueDate: '2026-11-01', status: 'done' },
    ];

    expect(overdueFirst(tasks, today).map((task) => task.id)).toEqual(['upcoming', 'done']);
  });

  it('returns a new array and leaves the input untouched', () => {
    const tasks = [open('upcoming', '2026-12-01'), open('late', '2026-11-01')];

    const result = overdueFirst(tasks, today);

    expect(result.map((task) => task.id)).toEqual(['late', 'upcoming']);
    expect(tasks.map((task) => task.id)).toEqual(['upcoming', 'late']);
  });
});
