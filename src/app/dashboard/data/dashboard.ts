import { TaskSummary } from '../util/task-metrics';

/** A statistic card definition from `/statistics`. Only its title, icon and color are used. */
export interface Statistic {
  id: string;
  title: string;
  icon: string;
  /** Static sample value. The cards show counts from the real tasks instead. */
  value: number;
  color: string;
}

export interface ActivityItem {
  id: string;
  type: 'created' | 'updated' | 'deleted';
  taskId: string;
  taskTitle: string;
  /** ISO date and time. */
  timestamp: string;
}

/** JSON Server response when `_page` is sent. */
export interface Paginated<T> {
  data: T[];
  items: number;
}

export type { TaskSummary };
