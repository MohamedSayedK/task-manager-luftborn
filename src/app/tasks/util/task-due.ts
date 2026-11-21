/** The part of a task this util needs. Declared here because `util` may not import `data`. */
interface Due {
  /** ISO date, `YYYY-MM-DD`. */
  dueDate: string;
  status: string;
}

/**
 * A text to translate: a message key and its values. Declared here because `util` may not import
 * from the root.
 */
export interface Label {
  key: string;
  params?: Record<string, string | number>;
}

/**
 * Describes a task's due date relative to `today` (`YYYY-MM-DD`), e.g. "Due in 3 days" or
 * "Overdue by 1 day", as a key plus its count. Done tasks have no label.
 */
export function dueLabel(task: Due, today: string): Label | null {
  if (task.status === 'done') {
    return null;
  }
  const days = daysBetween(today, task.dueDate);
  if (days === 0) {
    return { key: 'card.dueToday' };
  }
  return days > 0
    ? { key: 'card.dueIn', params: { count: days } }
    : { key: 'card.overdueBy', params: { count: -days } };
}

export function completedLabel(
  task: { status: string; completedAt?: string },
  today: string,
): Label | null {
  if (task.status !== 'done' || !task.completedAt) {
    return null;
  }
  const completedOn = new Date(task.completedAt).toLocaleDateString('en-CA');
  const days = daysBetween(completedOn, today);
  if (days === 0) {
    return { key: 'card.completedToday' };
  }
  return days === 1
    ? { key: 'card.completedYesterday' }
    : { key: 'card.completedAgo', params: { count: days } };
}

/** A task is overdue when it is not done and its due date is before `today` (`YYYY-MM-DD`). */
export function isOverdue(task: Due, today: string): boolean {
  return task.status !== 'done' && task.dueDate < today;
}

/** Moves overdue tasks to the front. The order inside both groups stays as it was. */
export function overdueFirst<T extends Due>(tasks: T[], today: string): T[] {
  const rank = (task: T) => (isOverdue(task, today) ? 0 : 1);
  return [...tasks].sort((a, b) => rank(a) - rank(b));
}

/** Whole days from `from` to `to`, both `YYYY-MM-DD`. Negative when `to` is earlier. */
function daysBetween(from: string, to: string): number {
  return Math.round((Date.parse(to) - Date.parse(from)) / 86_400_000);
}
