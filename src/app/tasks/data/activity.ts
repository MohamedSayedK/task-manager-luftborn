export type ActivityType = 'created' | 'updated' | 'deleted';

/** One line of the activity feed. The title is copied so the entry survives a deleted task. */
export interface ActivityEntry {
  type: ActivityType;
  taskId: string;
  taskTitle: string;
  /** ISO date and time. */
  timestamp: string;
}
