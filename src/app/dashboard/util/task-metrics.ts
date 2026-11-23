/** The part of a task the dashboard needs. The dashboard keeps its own view of tasks. */
export interface TaskSummary {
  status: 'todo' | 'in_progress' | 'done';
  priority: 'high' | 'medium' | 'low';
  /** ISO date, `YYYY-MM-DD`. */
  dueDate: string;
}

export interface TaskCounts {
  total: number;
  todo: number;
  inProgress: number;
  completed: number;
}

/** Counts for the statistic cards. They match the three board columns and the total. */
export function countTasks(tasks: TaskSummary[]): TaskCounts {
  return {
    total: tasks.length,
    todo: tasks.filter((task) => task.status === 'todo').length,
    inProgress: tasks.filter((task) => task.status === 'in_progress').length,
    completed: tasks.filter((task) => task.status === 'done').length,
  };
}

/** Task count per status, with 0 for a status that has no tasks. */
export function countByStatus(tasks: TaskSummary[]): Record<TaskSummary['status'], number> {
  const counts = { todo: 0, in_progress: 0, done: 0 };
  for (const task of tasks) {
    counts[task.status]++;
  }
  return counts;
}

/** Task count per priority, with 0 for a priority that has no tasks. */
export function countByPriority(tasks: TaskSummary[]): Record<TaskSummary['priority'], number> {
  const counts = { high: 0, medium: 0, low: 0 };
  for (const task of tasks) {
    counts[task.priority]++;
  }
  return counts;
}
