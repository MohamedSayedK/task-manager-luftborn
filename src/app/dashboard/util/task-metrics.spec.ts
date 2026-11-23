import { countByPriority, countByStatus, countTasks, TaskSummary } from './task-metrics';

const summary = (overrides: Partial<TaskSummary>): TaskSummary => ({
  status: 'todo',
  priority: 'medium',
  dueDate: '2999-01-01',
  ...overrides,
});

describe('countTasks', () => {
  it('counts all, to do, in progress and completed tasks', () => {
    const tasks = [
      summary({ status: 'todo' }),
      summary({ status: 'todo', dueDate: '2026-11-01' }),
      summary({ status: 'in_progress' }),
      summary({ status: 'in_progress' }),
      summary({ status: 'done' }),
      summary({ status: 'done', dueDate: '2026-10-01' }),
    ];

    expect(countTasks(tasks)).toEqual({ total: 6, todo: 2, inProgress: 2, completed: 2 });
  });

  it('counts nothing for no tasks', () => {
    expect(countTasks([])).toEqual({ total: 0, todo: 0, inProgress: 0, completed: 0 });
  });
});

describe('distributions', () => {
  const tasks = [
    summary({ status: 'todo', priority: 'high' }),
    summary({ status: 'todo', priority: 'low' }),
    summary({ status: 'done', priority: 'high' }),
  ];

  it('counts tasks per status, including statuses without tasks', () => {
    expect(countByStatus(tasks)).toEqual({ todo: 2, in_progress: 0, done: 1 });
  });

  it('counts tasks per priority, including priorities without tasks', () => {
    expect(countByPriority(tasks)).toEqual({ high: 2, medium: 0, low: 1 });
  });
});
