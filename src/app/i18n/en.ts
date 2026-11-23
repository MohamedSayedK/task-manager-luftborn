/**
 * English texts, the source of all translations. Plurals and values use the ICU message format,
 * e.g. `{count, plural, one {{count} day} other {{count} days}}`. Other languages have the same
 * keys, which the compiler checks through the `Messages` type. Avoid apostrophes: in ICU they
 * escape braces.
 */
export const en = {
  common: {
    retry: 'Retry',
    cancel: 'Cancel',
    save: 'Save',
    edit: 'Edit',
    delete: 'Delete',
    closeDialog: 'Close dialog',
    priority: { high: 'High', medium: 'Medium', low: 'Low' },
    status: { todo: 'To Do', inProgress: 'In Progress', done: 'Done' },
  },
  /** Texts that PrimeNG's own components show. See `PrimeNgTranslation`. */
  primeng: {
    emptyMessage: 'No results found',
    listLabel: 'Option List',
    close: 'Close',
  },
  header: {
    appName: 'Task Manager',
    menu: 'Menu',
    searchLabel: 'Search tasks',
    searchPlaceholder: 'Search tasks...',
    darkMode: 'Dark mode',
    notifications: 'Notifications',
    // The messages of the bell, an Easter egg. They come one after the other.
    bellFirst: 'Hope you like my task! 🙂',
    bellSecond: 'No new notifications. Just a developer hoping the review goes well.',
    bellThird: 'You found the Easter egg! 🥚 Now please be kind in the review.',
    signedInAs: 'Signed in as {name}',
  },
  screens: {
    dashboard: 'Dashboard',
    tasks: 'Tasks',
    analytics: 'Analytics',
  },
  nav: {
    label: 'Main',
    calendar: 'Calendar',
    team: 'Team',
    settings: 'Settings',
    soon: 'Soon',
    newTask: 'New Task',
  },
  board: {
    all: 'All',
    filterByStatus: 'Filter by status',
    filterByPriority: 'Filter by priority',
    filterByAssignee: 'Filter by assignee',
    allPriorities: 'All priorities',
    allAssignees: 'All assignees',
    newTask: 'New Task',
    loadError: 'Could not load tasks.',
    emptyColumn: 'No tasks here',
    emptyColumnHint: 'Drag a card here',
    moveError: 'Could not save the move. The board was loaded again.',
    deleteHeader: 'Delete task',
    deleteQuestion: 'Delete "{title}"? This cannot be undone.',
    taskWord: '{count, plural, one {task} other {tasks}}',
  },
  card: {
    actions: 'Actions for {title}',
    dueToday: 'Due today',
    dueIn: '{count, plural, one {Due in {count} day} other {Due in {count} days}}',
    overdueBy: '{count, plural, one {Overdue by {count} day} other {Overdue by {count} days}}',
    completedToday: 'Completed today',
    completedYesterday: 'Completed yesterday',
    completedAgo:
      '{count, plural, one {Completed {count} day ago} other {Completed {count} days ago}}',
  },
  form: {
    title: 'Title',
    description: 'Description',
    priority: 'Priority',
    status: 'Status',
    dueDate: 'Due date',
    assignee: 'Assignee',
    tags: 'Tags',
    addTag: 'Add tag',
    tagN: 'Tag {n}',
    removeTagN: 'Remove tag {n}',
    errors: {
      titleRequired: 'Title is required',
      titleMin: 'Title needs at least 3 characters',
      titleMax: 'Title can have at most 100 characters',
      descriptionMax: 'Description can have at most 500 characters',
      dueRequired: 'Due date is required',
      dueInPast: 'Due date cannot be in the past',
      assigneeRequired: 'Assignee is required',
    },
  },
  edit: {
    newTask: 'New Task',
    editTask: 'Edit Task',
    saveFailed: 'Could not save the task. Try again.',
    loadFailed: 'Could not load the task.',
    loading: 'Loading task...',
  },
  dashboard: {
    heading: 'Statistics',
    loadError: 'Could not load the statistics.',
    stats: {
      total: 'Total Tasks',
      completed: 'Completed',
      inProgress: 'In Progress',
      todo: 'To Do',
    },
    changes: {
      thisWeek: 'this week',
      today: 'today',
      sameAsYesterday: 'Same as yesterday',
    },
  },
  analytics: {
    loadError: 'Could not load the charts.',
    byPriority: 'Tasks by priority',
    byStatus: 'Tasks by status',
    recentActivity: 'Recent activity',
  },
  activity: {
    loadError: 'Could not load the activity.',
    empty: 'No activity yet.',
    entry:
      '{type, select, created {Task "{title}" was created} updated {Task "{title}" was updated} deleted {Task "{title}" was deleted} other {Task "{title}" was changed}}',
    justNow: 'just now',
    minutesAgo: '{count, plural, one {{count} minute ago} other {{count} minutes ago}}',
    hoursAgo: '{count, plural, one {{count} hour ago} other {{count} hours ago}}',
    yesterday: 'yesterday',
    daysAgo: '{count, plural, one {{count} day ago} other {{count} days ago}}',
  },
};

type Deep<T> = { [K in keyof T]: T[K] extends string ? string : Deep<T[K]> };

/** The shape every language must have. */
export type Messages = Deep<typeof en>;
