export type TaskStatus = 'todo' | 'in_progress' | 'done';
export type TaskPriority = 'high' | 'medium' | 'low';

export interface Assignee {
  id: string;
  name: string;
  /** Initials shown in the avatar, e.g. "JD". */
  avatar: string;
  email: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  /** ISO date, `YYYY-MM-DD`. */
  dueDate: string;
  /** Only present on some tasks in the mock data. Derive overdue from `dueDate` and `status`. */
  isOverdue?: boolean;
  /** Only present on done tasks in the mock data. */
  completedAt?: string;
  assignee: Assignee;
  tags: string[];
  /**
   * Place in its column, set when a user drags the card. Not part of the generated data, so most
   * tasks have none. A column lists tasks with an order first (see `sortColumn`).
   */
  order?: number;
  createdAt: string;
  updatedAt: string;
}

/** The fields a user edits when creating or updating a task. */
export type TaskDraft = Pick<
  Task,
  'title' | 'description' | 'status' | 'priority' | 'dueDate' | 'assignee' | 'tags'
>;

/** JSON Server response when `_page` is sent. `items` is the total count after filters. */
export interface Paginated<T> {
  data: T[];
  first: number;
  prev: number | null;
  next: number | null;
  last: number;
  pages: number;
  items: number;
}
