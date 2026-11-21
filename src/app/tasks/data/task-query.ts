import { TaskPriority, TaskStatus } from './task';

export interface TaskQuery {
  page: number;
  pageSize: number;
  status?: TaskStatus;
  priority?: TaskPriority;
  assigneeId?: string;
  /** Matched case-insensitively against title and description. */
  search?: string;
}

/**
 * Builds the JSON Server query params for a task search.
 *
 * JSON Server ignores plain filter params (`status=todo`) as soon as `_where` is present,
 * so every filter and the search term go into one `_where` object. Top-level keys are
 * combined with AND. Without filters, `_where` is omitted.
 */
export function toTaskParams(query: TaskQuery): Record<string, string | number> {
  const params: Record<string, string | number> = {
    _page: query.page,
    _per_page: query.pageSize,
  };

  const where: Record<string, unknown> = {};
  const search = query.search?.trim();
  if (search) {
    where['or'] = [{ title: { contains: search } }, { description: { contains: search } }];
  }
  if (query.status) {
    where['status'] = { eq: query.status };
  }
  if (query.priority) {
    where['priority'] = { eq: query.priority };
  }
  if (query.assigneeId) {
    where['assignee'] = { id: { eq: query.assigneeId } };
  }

  if (Object.keys(where).length > 0) {
    params['_where'] = JSON.stringify(where);
  }
  return params;
}
