/** The part of an activity entry this util needs. */
interface Described {
  type: 'created' | 'updated' | 'deleted';
  taskTitle: string;
}

/**
 * A text to translate: a message key and its values. Declared here because `util` may not import
 * from the root.
 */
export interface Label {
  key: string;
  params?: Record<string, string | number>;
}

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

/** One sentence for the feed, e.g. `Task "Write docs" was created`, as a key plus values. */
export function describeActivity(entry: Described): Label {
  return { key: 'activity.entry', params: { type: entry.type, title: entry.taskTitle } };
}

/**
 * How long ago `timestamp` (ISO) was, relative to `now` (milliseconds), in the largest whole
 * unit: "just now", "5 minutes ago", "3 hours ago", "yesterday", "4 days ago". Returned as a key
 * plus its count.
 */
export function timeAgo(timestamp: string, now: number): Label {
  const elapsed = Math.max(0, now - Date.parse(timestamp));
  if (elapsed < MINUTE) {
    return { key: 'activity.justNow' };
  }
  if (elapsed < HOUR) {
    return { key: 'activity.minutesAgo', params: { count: Math.floor(elapsed / MINUTE) } };
  }
  if (elapsed < DAY) {
    return { key: 'activity.hoursAgo', params: { count: Math.floor(elapsed / HOUR) } };
  }
  const days = Math.floor(elapsed / DAY);
  return days === 1
    ? { key: 'activity.yesterday' }
    : { key: 'activity.daysAgo', params: { count: days } };
}
