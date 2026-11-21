/**
 * A small stand-in for the JSON Server mock backend, for the build that is published on GitHub
 * Pages, where there is no server to run. It answers the requests the app makes (`/api/...`)
 * from data held in memory, with the same rules as JSON Server 1.0: `_where` filters, `_sort`,
 * `_page` and `_per_page` paging, and create, patch and delete by id.
 *
 * The functions here are pure. The HTTP interceptor in `demo-backend.ts` feeds them.
 */
export type Row = Record<string, unknown>;

/** The collections, by name: `{ tasks: [...], users: [...] }`. */
export type DemoDb = Record<string, Row[]>;

export interface DemoRequest {
  method: string;
  /** The path without a query string, e.g. `/api/tasks/task-001`. */
  path: string;
  params: { get(name: string): string | null };
  body?: unknown;
}

export interface DemoResponse {
  status: number;
  body: unknown;
}

const PREFIX = '/api/';

/**
 * Answers a request for the API, or returns `null` when the request is not for it, so that the
 * caller can let it through.
 */
export function handleDemoRequest(db: DemoDb, request: DemoRequest): DemoResponse | null {
  if (!request.path.startsWith(PREFIX)) {
    return null;
  }
  const [collection, id] = request.path.slice(PREFIX.length).split('/');
  const rows = db[collection];
  if (!rows) {
    return { status: 404, body: { message: `No collection ${collection}` } };
  }

  if (id === undefined) {
    if (request.method === 'GET') {
      return { status: 200, body: list(rows, request.params) };
    }
    if (request.method === 'POST') {
      const row: Row = { ...(request.body as Row) };
      row['id'] ??= randomId();
      rows.push(row);
      return { status: 201, body: row };
    }
    return notAllowed();
  }

  const index = rows.findIndex((row) => String(row['id']) === id);
  if (index === -1) {
    return { status: 404, body: { message: `No ${collection} with id ${id}` } };
  }
  switch (request.method) {
    case 'GET':
      return { status: 200, body: rows[index] };
    case 'PATCH':
      rows[index] = { ...rows[index], ...(request.body as Row), id: rows[index]['id'] };
      return { status: 200, body: rows[index] };
    case 'DELETE':
      return { status: 200, body: rows.splice(index, 1)[0] };
    default:
      return notAllowed();
  }
}

function notAllowed(): DemoResponse {
  return { status: 405, body: { message: 'Method not allowed' } };
}

/** Like JSON Server, a request with `_page` answers with a page, any other with all the rows. */
function list(rows: Row[], params: DemoRequest['params']): unknown {
  const where = params.get('_where');
  let result = where ? rows.filter((row) => matchesWhere(row, JSON.parse(where))) : [...rows];

  const sort = params.get('_sort');
  if (sort) {
    result = sortRows(result, sort);
  }

  const page = params.get('_page');
  return page === null
    ? result
    : paginate(result, Number(page), Number(params.get('_per_page') ?? 10));
}

function sortRows(rows: Row[], sort: string): Row[] {
  const keys = sort.split(',').map((key) => ({
    field: key.replace(/^-/, ''),
    direction: key.startsWith('-') ? -1 : 1,
  }));
  return [...rows].sort((a, b) => {
    for (const { field, direction } of keys) {
      const left = a[field] as string | number;
      const right = b[field] as string | number;
      if (left < right) return -direction;
      if (left > right) return direction;
    }
    return 0;
  });
}

function paginate(rows: Row[], page: number, perPage: number) {
  const size = Number.isFinite(perPage) && perPage > 0 ? Math.floor(perPage) : 1;
  const pages = Math.max(1, Math.ceil(rows.length / size));
  const current = Math.max(1, Math.min(Number.isFinite(page) ? Math.floor(page) : 1, pages));
  return {
    first: 1,
    prev: current > 1 ? current - 1 : null,
    next: current < pages ? current + 1 : null,
    last: pages,
    pages,
    items: rows.length,
    data: rows.slice((current - 1) * size, current * size),
  };
}

const OPERATORS = [
  'lt',
  'lte',
  'gt',
  'gte',
  'eq',
  'ne',
  'in',
  'contains',
  'startsWith',
  'endsWith',
];

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

/**
 * Whether a row satisfies a `_where` filter. The conditions at the top level must all hold, `or`
 * holds when any of its alternatives does, and a nested object is matched against the nested
 * value. Text operators ignore case.
 */
function matchesWhere(row: Row, where: Record<string, unknown>): boolean {
  for (const [key, condition] of Object.entries(where)) {
    if (key === 'or') {
      const alternatives = Array.isArray(condition) ? condition : [];
      if (
        !alternatives.some((alternative) => isObject(alternative) && matchesWhere(row, alternative))
      ) {
        return false;
      }
      continue;
    }
    const value = row[key];
    if (!isObject(condition)) {
      return false;
    }
    const operators = OPERATORS.filter((operator) => operator in condition);
    if (operators.length === 0) {
      if (isObject(value) && !matchesWhere(value, condition)) {
        return false;
      }
      continue;
    }
    if (
      value === undefined ||
      !operators.every((operator) => satisfies(value, operator, condition[operator]))
    ) {
      return false;
    }
  }
  return true;
}

function satisfies(value: unknown, operator: string, expected: unknown): boolean {
  const left = value as string | number;
  const right = expected as string | number;
  switch (operator) {
    case 'lt':
      return left < right;
    case 'lte':
      return left <= right;
    case 'gt':
      return left > right;
    case 'gte':
      return left >= right;
    case 'eq':
      return value === expected;
    case 'ne':
      return value !== expected;
    case 'in':
      return (Array.isArray(expected) ? expected : [expected]).some((item) => item === value);
  }
  if (typeof value !== 'string') {
    return false;
  }
  const text = value.toLowerCase();
  const part = String(expected).toLowerCase();
  return operator === 'contains'
    ? text.includes(part)
    : operator === 'startsWith'
      ? text.startsWith(part)
      : text.endsWith(part);
}

/** Eleven characters from the same alphabet JSON Server uses for the ids it makes. */
function randomId(): string {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  return Array.from(
    { length: 11 },
    () => alphabet[Math.floor(Math.random() * alphabet.length)],
  ).join('');
}
