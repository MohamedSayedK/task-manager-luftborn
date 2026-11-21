import { describeActivity, timeAgo } from './activity-text';

describe('describeActivity', () => {
  it.each(['created', 'updated', 'deleted'] as const)(
    'passes the %s type and the task title to the entry message',
    (type) => {
      expect(describeActivity({ type, taskTitle: 'Write docs' })).toEqual({
        key: 'activity.entry',
        params: { type, title: 'Write docs' },
      });
    },
  );
});

describe('timeAgo', () => {
  const now = Date.parse('2026-11-21T12:00:00.000Z');
  const ago = (milliseconds: number) => new Date(now - milliseconds).toISOString();
  const MINUTE = 60_000;
  const HOUR = 60 * MINUTE;
  const DAY = 24 * HOUR;

  it.each([
    [30_000, { key: 'activity.justNow' }],
    [MINUTE, { key: 'activity.minutesAgo', params: { count: 1 } }],
    [5 * MINUTE, { key: 'activity.minutesAgo', params: { count: 5 } }],
    [HOUR, { key: 'activity.hoursAgo', params: { count: 1 } }],
    [3 * HOUR, { key: 'activity.hoursAgo', params: { count: 3 } }],
    [DAY, { key: 'activity.yesterday' }],
    [4 * DAY, { key: 'activity.daysAgo', params: { count: 4 } }],
  ])('turns %i ms into %o', (milliseconds, label) => {
    expect(timeAgo(ago(milliseconds), now)).toEqual(label);
  });
});
