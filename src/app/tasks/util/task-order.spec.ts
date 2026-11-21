import { planMove, sortColumn } from './task-order';

const today = '2026-11-21';

describe('sortColumn', () => {
  const task = (id: string, extra: { order?: number; dueDate?: string; status?: string } = {}) => ({
    id,
    status: 'todo',
    dueDate: '2999-01-01',
    ...extra,
  });
  const ids = (tasks: { id: string }[]) => tasks.map((item) => item.id);

  it('lists tasks with an order first, from the lowest order to the highest', () => {
    const sorted = sortColumn(
      [task('c', { order: 2 }), task('a', { order: 0 }), task('b', { order: 1 })],
      today,
    );

    expect(ids(sorted)).toEqual(['a', 'b', 'c']);
  });

  it('puts tasks without an order after the ordered ones, overdue first', () => {
    const sorted = sortColumn(
      [
        task('plain'),
        task('late', { dueDate: '2020-01-01' }),
        task('first', { order: 0 }),
        task('other'),
      ],
      today,
    );

    expect(ids(sorted)).toEqual(['first', 'late', 'plain', 'other']);
  });

  it('leaves a column without any order in the overdue-first order of before', () => {
    const sorted = sortColumn(
      [task('a'), task('late', { dueDate: '2020-01-01' }), task('b')],
      today,
    );

    expect(ids(sorted)).toEqual(['late', 'a', 'b']);
  });

  it('keeps the incoming order of tasks that share an order, and the input untouched', () => {
    const input = [task('x', { order: 1 }), task('y', { order: 1 }), task('z', { order: 0 })];

    const sorted = sortColumn(input, today);

    expect(ids(sorted)).toEqual(['z', 'x', 'y']);
    expect(ids(input)).toEqual(['x', 'y', 'z']);
  });
});

describe('planMove', () => {
  type Status = 'todo' | 'in_progress' | 'done';
  interface Item {
    id: string;
    title: string;
    status: Status;
    order?: number;
  }
  const item = (id: string, status: Status, order?: number): Item => ({
    id,
    title: `Title ${id}`,
    status,
    order,
  });
  const board = (todo: Item[], inProgress: Item[] = [], done: Item[] = []) => ({
    todo,
    in_progress: inProgress,
    done,
  });
  const ids = (tasks: Item[]) => tasks.map((entry) => entry.id);

  describe('inside one column', () => {
    it('shows the task at its new place and numbers the column', () => {
      const plan = planMove(board([item('a', 'todo'), item('b', 'todo'), item('c', 'todo')]), {
        taskId: 'a',
        to: 'todo',
        index: 2,
      });

      expect(ids(plan!.columns.todo)).toEqual(['b', 'c', 'a']);
      expect(plan!.columns.todo.map((entry) => entry.order)).toEqual([0, 1, 2]);
    });

    it('writes only the tasks whose order changed', () => {
      const plan = planMove(
        board([
          item('a', 'todo', 0),
          item('b', 'todo', 1),
          item('c', 'todo', 2),
          item('d', 'todo', 3),
        ]),
        { taskId: 'c', to: 'todo', index: 1 },
      );

      expect(ids(plan!.columns.todo)).toEqual(['a', 'c', 'b', 'd']);
      expect(plan!.writes).toEqual([
        { id: 'c', changes: { order: 1 } },
        { id: 'b', changes: { order: 2 } },
      ]);
    });

    it('is not a change of status', () => {
      const plan = planMove(board([item('a', 'todo'), item('b', 'todo')]), {
        taskId: 'a',
        to: 'todo',
        index: 1,
      });

      expect(plan!.statusChange).toBeUndefined();
    });

    it('plans nothing when the task is dropped where it already was', () => {
      const columns = board([item('a', 'todo', 0), item('b', 'todo', 1)]);

      expect(planMove(columns, { taskId: 'b', to: 'todo', index: 1 })).toBeNull();
    });

    it('leaves the columns it was given untouched', () => {
      const columns = board([item('a', 'todo'), item('b', 'todo')]);

      planMove(columns, { taskId: 'a', to: 'todo', index: 1 });

      expect(ids(columns.todo)).toEqual(['a', 'b']);
      expect(columns.todo[0].order).toBeUndefined();
    });
  });

  describe('to another column', () => {
    it('shows the task in the other column with that status, at the place it was dropped', () => {
      const plan = planMove(
        board(
          [item('a', 'todo'), item('b', 'todo')],
          [item('x', 'in_progress'), item('y', 'in_progress')],
        ),
        { taskId: 'a', to: 'in_progress', index: 1 },
      );

      expect(ids(plan!.columns.todo)).toEqual(['b']);
      expect(ids(plan!.columns.in_progress)).toEqual(['x', 'a', 'y']);
      expect(plan!.columns.in_progress[1].status).toBe('in_progress');
    });

    it('writes the new status with the moved task, and the numbers that changed', () => {
      const plan = planMove(
        board([item('a', 'todo')], [item('x', 'in_progress', 0), item('y', 'in_progress', 1)]),
        { taskId: 'a', to: 'in_progress', index: 1 },
      );

      expect(plan!.writes).toEqual([
        { id: 'a', changes: { status: 'in_progress', order: 1 } },
        { id: 'y', changes: { order: 2 } },
      ]);
    });

    it('writes the moved task even when its old number already fits', () => {
      const plan = planMove(board([item('a', 'todo', 1)], [item('x', 'in_progress', 0)]), {
        taskId: 'a',
        to: 'in_progress',
        index: 1,
      });

      expect(plan!.writes).toEqual([{ id: 'a', changes: { status: 'in_progress', order: 1 } }]);
    });

    it('names the task whose status changed, for the activity log', () => {
      const plan = planMove(board([item('a', 'todo')]), { taskId: 'a', to: 'done', index: 0 });

      expect(plan!.statusChange).toEqual({ id: 'a', title: 'Title a' });
    });

    it('puts the task last when the place is beyond the end', () => {
      const plan = planMove(
        board([item('a', 'todo')], [], [item('x', 'done'), item('y', 'done')]),
        {
          taskId: 'a',
          to: 'done',
          index: 99,
        },
      );

      expect(ids(plan!.columns.done)).toEqual(['x', 'y', 'a']);
    });

    it('plans nothing for a task that is not on the board', () => {
      expect(
        planMove(board([item('a', 'todo')]), { taskId: 'zzz', to: 'done', index: 0 }),
      ).toBeNull();
    });
  });
});
