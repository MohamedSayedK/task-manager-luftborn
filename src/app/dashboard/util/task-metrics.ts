/** The part of a task the dashboard needs. The dashboard keeps its own view of tasks. */
export interface TaskSummary {
  status: 'todo' | 'in_progress' | 'done';
  priority: 'high' | 'medium' | 'low';
  /** ISO date, `YYYY-MM-DD`. */
  dueDate: string;
}

export interface TaskCounts {
  total: number;
  completed: number;
  inProgress: number;
  overdue: number;
}

/** Counts for the statistic cards. A task is overdue when it is not done and due before `today`. */
export function countTasks(tasks: TaskSummary[], today: string): TaskCounts {
  return {
    total: tasks.length,
    completed: tasks.filter((task) => task.status === 'done').length,
    inProgress: tasks.filter((task) => task.status === 'in_progress').length,
    overdue: tasks.filter((task) => task.status !== 'done' && task.dueDate < today).length,
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
