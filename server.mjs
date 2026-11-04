import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
export const CSP = "default-src 'none'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'none'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'; object-src 'none'";
const root = fileURLToPath(new URL('.', import.meta.url));
const files = new Map([['/', ['index.html', 'text/html; charset=utf-8']], ['/index.html', ['index.html', 'text/html; charset=utf-8']], ['/styles.css', ['styles.css', 'text/css; charset=utf-8']], ['/app.mjs', ['app.mjs', 'text/javascript; charset=utf-8']], ['/crypto.mjs', ['crypto.mjs', 'text/javascript; charset=utf-8']], ['/vault.mjs', ['vault.mjs', 'text/javascript; charset=utf-8']], ['/icon.svg', ['icon.svg', 'image/svg+xml']]]);
files.set('/csv.mjs', ['csv.mjs', 'text/javascript; charset=utf-8']);
export function createServer() {
  return http.createServer(async (req, res) => {
    res.setHeader('Content-Security-Policy', CSP); res.setHeader('X-Content-Type-Options', 'nosniff'); res.setHeader('Referrer-Policy', 'no-referrer'); res.setHeader('Cache-Control', 'no-store'); res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()'); res.setHeader('X-Frame-Options', 'DENY');
    if (!['GET', 'HEAD'].includes(req.method)) { res.writeHead(405); res.end(); return; }
    const asset = files.get(new URL(req.url, 'http://localhost').pathname);
    if (!asset) { res.writeHead(404); res.end('Not found'); return; }
    try { const data = await readFile(path.join(root, asset[0])); res.writeHead(200, { 'Content-Type': asset[1] }); res.end(req.method === 'HEAD' ? undefined : data); }
    catch { res.writeHead(500); res.end('Unable to load app'); }
  });
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const port = Number(process.env.PORT || 4173);
  const server = createServer();
  server.on('error', error => { console.error(`Unable to start: ${error.message}`); process.exitCode = 1; });
  server.listen(port, '127.0.0.1', () => console.log(`Password Manager: http://localhost:${port}`));
}
