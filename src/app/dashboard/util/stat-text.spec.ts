import { statTitleKey } from './stat-text';

describe('statTitleKey', () => {
  it.each([
    ['stat-001', 'dashboard.stats.total'],
    ['stat-002', 'dashboard.stats.completed'],
    ['stat-003', 'dashboard.stats.inProgress'],
    ['stat-004', 'dashboard.stats.todo'],
  ])('maps the statistic %s to %s', (id, key) => {
    expect(statTitleKey(id)).toBe(key);
  });

  it('has no key for a statistic it does not know', () => {
    expect(statTitleKey('stat-999')).toBeUndefined();
  });
});
