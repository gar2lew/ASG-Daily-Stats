// Local test server: serves the repo root and stubs the API routes for Browser-pane checks.
// Run with: node test/e2e-server.mjs   (PORT defaults to 4173). Not deployed.
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = fileURLToPath(new URL('../', import.meta.url));
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png' };
const REPS = [
  { name: 'Jaide', state: 'WA', timezone: 'Australia/Perth', tiers: ['FC', 'FR', 'PS'] },
  { name: 'Joe Smith', state: 'QLD', timezone: 'Australia/Brisbane', tiers: ['FC', 'SMSF'] },
];

const json = (res, code, body) => {
  res.writeHead(code, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(body));
};

export function createE2EServer() {
  return createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost');
  if (url.pathname === '/api/reps' && req.method === 'GET') return json(res, 200, { ok: true, reps: REPS });
  if (url.pathname === '/api/publish' && req.method === 'POST') {
    let body = '';
    for await (const chunk of req) body += chunk;
    const target = JSON.parse(body || '{}').target;
    return json(res, 200, { ok: true, results: {
      weekly: target === 'daily' ? { ok: null, skipped: true } : { ok: true, mode: 'added' },
      daily: target === 'weekly' ? { ok: null, skipped: true } : { ok: true, mode: 'added' },
    } });
  }
  if (url.pathname === '/api/email') return json(res, 200, { ok: true, mode: 'sent' });
  if (url.pathname.startsWith('/api/')) return json(res, 404, { ok: false, error: 'Not stubbed' });

  const rel = url.pathname === '/' ? 'index.html' : url.pathname.slice(1);
  const file = normalize(join(ROOT, rel));
  if (!file.startsWith(ROOT)) return json(res, 403, { ok: false, error: 'Forbidden' });
  try {
    const body = await readFile(file);
    res.writeHead(200, { 'Content-Type': TYPES[extname(file)] || 'application/octet-stream' });
    res.end(body);
  } catch {
    json(res, 404, { ok: false, error: 'Not found' });
  }
  });
}

// Run directly (node test/e2e-server.mjs): bind to loopback only, so the repo is not visible on the local network.
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const port = Number(process.env.PORT) || 4173;
  createE2EServer().listen(port, '127.0.0.1', () => {
    console.log(`e2e server on http://localhost:${port}`);
  });
}
