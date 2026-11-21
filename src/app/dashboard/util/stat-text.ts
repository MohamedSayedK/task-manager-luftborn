/**
 * The cards get their title and change text from `/statistics`, in English. These map that text
 * to message keys so a card can be translated. A text that is not known has no key, and the card
 * then shows the text from the API.
 */
const TITLE_KEYS: Record<string, string> = {
  'stat-001': 'dashboard.stats.total',
  'stat-002': 'dashboard.stats.completed',
  'stat-003': 'dashboard.stats.inProgress',
  'stat-004': 'dashboard.stats.overdue',
};

const CHANGE_KEYS: Record<string, string> = {
  'this week': 'dashboard.changes.thisWeek',
  today: 'dashboard.changes.today',
  'Same as yesterday': 'dashboard.changes.sameAsYesterday',
};

/** The message key for the title of a statistic, by its id. */
export function statTitleKey(id: string): string | undefined {
  return TITLE_KEYS[id];
}

/** The message key for the text after a change value, e.g. "this week". */
export function changeLabelKey(label: string): string | undefined {
  return CHANGE_KEYS[label];
}
