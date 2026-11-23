/**
 * The cards get their title from `/statistics`, in English. These map a statistic to the message
 * key of its title so a card can be translated. A statistic that is not known has no key, and the
 * card then shows the title from the API.
 */
const TITLE_KEYS: Record<string, string> = {
  'stat-001': 'dashboard.stats.total',
  'stat-002': 'dashboard.stats.completed',
  'stat-003': 'dashboard.stats.inProgress',
  'stat-004': 'dashboard.stats.todo',
};

/** The message key for the title of a statistic, by its id. */
export function statTitleKey(id: string): string | undefined {
  return TITLE_KEYS[id];
}
