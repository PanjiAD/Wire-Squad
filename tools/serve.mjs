// Minimal static file server for local UI checks.
//
//   node tools/serve.mjs [port]
//
// Serves the project root so index.html, build/bundle.js and app/ can be
// opened over http:// instead of file:// (browsers block module imports from
// file://). No dependencies, read-only.

import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const port = Number(process.argv[2] || 8123);

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
};

const server = http.createServer((request, response) => {
  const raw = decodeURIComponent((request.url || '/').split('?')[0]);
  const relative = raw === '/' ? 'index.html' : raw.replace(/^\/+/, '');
  const full = path.resolve(root, relative);
  if (!full.startsWith(root)) {
    response.writeHead(403).end('forbidden');
    return;
  }
  fs.readFile(full, (error, data) => {
    if (error) {
      response.writeHead(404, { 'content-type': 'text/plain' }).end('not found');
      return;
    }
    response.writeHead(200, {
      'content-type': TYPES[path.extname(full).toLowerCase()] || 'application/octet-stream',
      'cache-control': 'no-store',
    });
    response.end(data);
  });
});

server.listen(port, '127.0.0.1', () => {
  console.log(`serving ${root} at http://127.0.0.1:${port}/`);
});
