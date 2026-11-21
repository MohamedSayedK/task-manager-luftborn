import { readFile, stat } from 'node:fs/promises';
import { request as httpRequest, createServer } from 'node:http';
import { extname, join, normalize, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import { brotliCompress, constants, gzip } from 'node:zlib';

/**
 * Serves the production build (`dist/task-manager/browser`) the way a real host would: files are
 * compressed, scripts and styles with a hash in their name are cached for a year, the entry page
 * is never cached, unknown routes fall back to the entry page (it is a single page app) and
 * `/api/*` goes to the mock backend.
 *
 * `ng serve` cannot stand in for this. Its dev server sends the bundle unminified and
 * uncompressed (about 3.5 MB instead of 650 kB), which is also what a Lighthouse run on it sees.
 *
 * Environment: `PORT` (default 4200) and `API_URL` (default http://localhost:3000).
 */
const root = fileURLToPath(new URL('../dist/task-manager/browser', import.meta.url));
const port = Number(process.env.PORT ?? 4200);
const api = new URL(process.env.API_URL ?? 'http://localhost:3000');

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.txt': 'text/plain; charset=utf-8',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.ico': 'image/x-icon',
  '.png': 'image/png',
};
const COMPRESSIBLE = new Set(['.html', '.js', '.css', '.json', '.svg', '.txt', '.ico']);
/**
 * The build puts a content hash in these names, so a file never changes under the same name. The
 * hash is base64url, so it may contain `-` and `_`.
 */
const HASHED = /-[A-Za-z0-9_-]{8}\.(?:js|css|woff2?)$/;

const brotli = promisify(brotliCompress);
const gzipAsync = promisify(gzip);

/** Files already read and compressed. Each is prepared once, on first use. */
const files = new Map();

async function load(path) {
  let entry = files.get(path);
  if (!entry) {
    const body = await readFile(path);
    const type = extname(path).toLowerCase();
    const canCompress = COMPRESSIBLE.has(type) && body.length > 1024;
    entry = {
      type: TYPES[type] ?? 'application/octet-stream',
      body,
      br: canCompress
        ? await brotli(body, { params: { [constants.BROTLI_PARAM_QUALITY]: 9 } })
        : undefined,
      gzip: canCompress ? await gzipAsync(body, { level: 9 }) : undefined,
    };
    files.set(path, entry);
  }
  return entry;
}

async function isFile(path) {
  try {
    return (await stat(path)).isFile();
  } catch {
    return false;
  }
}

function cacheControl(path) {
  if (path.endsWith(`${sep}index.html`)) {
    return 'no-cache';
  }
  return HASHED.test(path) ? 'public, max-age=31536000, immutable' : 'public, max-age=3600';
}

/** Sends a request on to the mock backend, without the `/api` prefix. */
function proxy(req, res) {
  const upstream = httpRequest(
    {
      protocol: api.protocol,
      hostname: api.hostname,
      port: api.port,
      method: req.method,
      path: req.url.slice('/api'.length) || '/',
      headers: { ...req.headers, host: api.host },
    },
    (response) => {
      res.writeHead(response.statusCode ?? 502, response.headers);
      response.pipe(res);
    },
  );
  upstream.on('error', () => {
    res.writeHead(502, { 'Content-Type': 'text/plain' });
    res.end('The mock API is not running. Start it with: npm run mock:api');
  });
  req.pipe(upstream);
}

async function serveFile(req, res, path, status = 200) {
  const entry = await load(path);
  const accepted = String(req.headers['accept-encoding'] ?? '');
  const headers = {
    'Content-Type': entry.type,
    'Cache-Control': cacheControl(path),
    Vary: 'Accept-Encoding',
  };
  let body = entry.body;
  if (entry.br && /\bbr\b/.test(accepted)) {
    headers['Content-Encoding'] = 'br';
    body = entry.br;
  } else if (entry.gzip && /\bgzip\b/.test(accepted)) {
    headers['Content-Encoding'] = 'gzip';
    body = entry.gzip;
  }
  headers['Content-Length'] = body.length;
  res.writeHead(status, headers);
  res.end(req.method === 'HEAD' ? undefined : body);
}

const server = createServer(async (req, res) => {
  try {
    if (req.url === '/api' || req.url.startsWith('/api/')) {
      return proxy(req, res);
    }
    const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    const path = normalize(join(root, pathname));
    if (path !== root && !path.startsWith(root + sep)) {
      res.writeHead(403);
      return res.end('Forbidden');
    }
    if (await isFile(path)) {
      return await serveFile(req, res, path);
    }
    // A path with a file extension that does not exist is a missing file. Any other path is a
    // route of the app, which the entry page handles.
    if (extname(pathname)) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      return res.end('Not found');
    }
    return await serveFile(req, res, join(root, 'index.html'));
  } catch (error) {
    console.error(error);
    res.writeHead(500, { 'Content-Type': 'text/plain' });
    res.end('Server error');
  }
});

if (!(await isFile(join(root, 'index.html')))) {
  console.error('There is no build yet. Run: npm run build');
  process.exit(1);
}

server.listen(port, () => {
  console.log(`Serving the production build on http://localhost:${port}`);
  console.log(`/api goes to ${api.origin}. Start the mock API with: npm run mock:api`);
});
