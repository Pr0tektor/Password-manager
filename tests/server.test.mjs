import test from 'node:test';
import assert from 'node:assert/strict';
import { once } from 'node:events';
import { createServer } from '../server.mjs';
test('local server serves app assets with hardening headers and denies private files/mutations', async () => {
  const server = createServer(); server.listen(0, '127.0.0.1'); await once(server, 'listening');
  const base = `http://127.0.0.1:${server.address().port}`;
  try {
    for (const route of ['/', '/index.html', '/styles.css', '/app.mjs', '/crypto.mjs', '/csv.mjs', '/vault.mjs', '/icon.svg']) {
      const response = await fetch(base + route); assert.equal(response.status, 200); assert.equal(response.headers.get('x-content-type-options'), 'nosniff');
      assert.match(response.headers.get('content-security-policy'), /connect-src 'none'/); assert.match(response.headers.get('content-security-policy'), /frame-ancestors 'none'/);
    }
    for (const route of ['/.git/config', '/package.json', '/tests/vault.test.mjs', '/%2e%2e/README.md', '/not-found']) assert.equal((await fetch(base + route)).status, 404);
    assert.equal((await fetch(base, { method: 'POST', body: 'test' })).status, 405);
    const head = await fetch(base, { method: 'HEAD' }); assert.equal(head.status, 200); assert.equal(await head.text(), '');
  } finally { server.closeAllConnections(); await new Promise(resolve => server.close(resolve)); }
});
