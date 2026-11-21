import { toTaskParams } from './task-query';

describe('toTaskParams', () => {
  it('sends only paging when there are no filters', () => {
    expect(toTaskParams({ page: 2, pageSize: 5 })).toEqual({ _page: 2, _per_page: 5 });
  });

  it('puts every filter into one _where object', () => {
    const params = toTaskParams({
      page: 1,
      pageSize: 10,
      status: 'todo',
      priority: 'high',
      assigneeId: 'user-003',
    });

    expect(Object.keys(params).sort()).toEqual(['_page', '_per_page', '_where']);
    expect(JSON.parse(params['_where'] as string)).toEqual({
      status: { eq: 'todo' },
      priority: { eq: 'high' },
      assignee: { id: { eq: 'user-003' } },
    });
  });

  it('searches title or description with a trimmed term', () => {
    const params = toTaskParams({ page: 1, pageSize: 10, search: '  mobile ' });

    expect(JSON.parse(params['_where'] as string)).toEqual({
      or: [{ title: { contains: 'mobile' } }, { description: { contains: 'mobile' } }],
    });
  });

  it('combines search with filters in the same _where', () => {
    const params = toTaskParams({ page: 1, pageSize: 10, search: 'api', status: 'done' });

    expect(JSON.parse(params['_where'] as string)).toEqual({
      or: [{ title: { contains: 'api' } }, { description: { contains: 'api' } }],
      status: { eq: 'done' },
    });
  });

  it('ignores a blank search term', () => {
    expect(toTaskParams({ page: 1, pageSize: 10, search: '   ' })).toEqual({
      _page: 1,
      _per_page: 10,
    });
  });
});
