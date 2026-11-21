import { overdueFirst } from './task-due';

/** The part of a task this util needs. Declared here because `util` may not import `data`. */
interface Orderable {
  /** Position set by dragging. Tasks that were never moved have none. */
  order?: number;
  /** ISO date, `YYYY-MM-DD`. */
  dueDate: string;
  status: string;
}

/**
 * The order in which a column shows its tasks. Tasks that were moved by hand come first, by their
 * `order`. The rest follow, overdue ones first, as before dragging existed. So a column nobody
 * touched looks as it always did, and once a user places a card it stays where it was put.
 */
export function sortColumn<T extends Orderable>(tasks: T[], today: string): T[] {
  const placed = tasks
    .filter((task) => task.order !== undefined)
    .sort((a, b) => a.order! - b.order!);
  const rest = overdueFirst(
    tasks.filter((task) => task.order === undefined),
    today,
  );
  return [...placed, ...rest];
}

type BoardStatus = 'todo' | 'in_progress' | 'done';

/** The part of a task `planMove` needs. */
interface Movable {
  id: string;
  title: string;
  status: BoardStatus;
  order?: number;
}

/** A card dropped on a column: which task, which column, and the place in that column. */
export interface Move {
  taskId: string;
  to: BoardStatus;
  /** Where the task ends up in the column, counted as `moveItemInArray` of the CDK does. */
  index: number;
}

/** What to save for one task. */
export interface MoveWrite {
  id: string;
  changes: { status?: BoardStatus; order: number };
}

export interface MovePlan<T> {
  /** The board as it looks after the move. */
  columns: Record<BoardStatus, T[]>;
  /** The tasks that changed and what to send for each. */
  writes: MoveWrite[];
  /** Set when the moved task changed column, so the change can be logged. */
  statusChange?: { id: string; title: string };
}

/**
 * Works out what a drop means: the board after the move, and the smallest set of writes that
 * saves it. The column the task lands in is numbered 0, 1, 2, ..., and only the tasks whose
 * number changed are written. Returns `null` when nothing would change.
 */
export function planMove<T extends Movable>(
  columns: Record<BoardStatus, T[]>,
  move: Move,
): MovePlan<T> | null {
  const from = (Object.keys(columns) as BoardStatus[]).find((status) =>
    columns[status].some((task) => task.id === move.taskId),
  );
  if (!from) {
    return null;
  }
  const task = columns[from].find((entry) => entry.id === move.taskId)!;
  const target = (move.to === from ? columns[from] : columns[move.to]).filter(
    (entry) => entry.id !== task.id,
  );
  const index = Math.min(Math.max(move.index, 0), target.length);
  if (move.to === from && columns[from].indexOf(task) === index) {
    return null;
  }
  const changesColumn = move.to !== from;
  target.splice(index, 0, changesColumn ? { ...task, status: move.to } : task);

  const writes: MoveWrite[] = [];
  const numbered = target.map((entry, position) => {
    const statusChanged = changesColumn && entry.id === task.id;
    if (entry.order === position && !statusChanged) {
      return entry;
    }
    writes.push({
      id: entry.id,
      changes: statusChanged ? { status: move.to, order: position } : { order: position },
    });
    return { ...entry, order: position };
  });
  return {
    columns: {
      ...columns,
      // The column the task left only loses it. Gaps in its numbering do not matter.
      [from]: columns[from].filter((entry) => entry.id !== task.id),
      [move.to]: numbered,
    },
    writes,
    statusChange: changesColumn ? { id: task.id, title: task.title } : undefined,
  };
}
