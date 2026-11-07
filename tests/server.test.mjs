import test from 'node:test';
import assert from 'node:assert/strict';
import { once } from 'node:events';
import { createServer } from '../server.mjs';
test('local server serves app assets with hardening headers and denies private files/mutations', async () => {
  const server = createServer(); server.listen(0, '127.0.0.1'); await once(server, 'listening');
  const base = `http://127.0.0.1:${server.address().port}`;
  try {
    for (const route of ['/', '/index.html', '/styles.css', '/app.mjs', '/crypto.mjs', '/csv.mjs', '/vault.mjs', '/icon.svg', '/i18n.mjs', '/pwa.mjs', '/drive.mjs', '/drive-ui.mjs', '/config.mjs', '/session.mjs', '/api-keys.mjs', '/sw.js', '/manifest.webmanifest', '/manifest.en.webmanifest', '/icons/icon-192.png', '/icons/icon-512.png', '/icons/icon-maskable-512.png', '/docs/guide.html', '/docs/USER_GUIDE_RU.md', '/docs/USER_GUIDE_EN.md']) {
      const response = await fetch(base + route); assert.equal(response.status, 200); assert.equal(response.headers.get('x-content-type-options'), 'nosniff');
      assert.match(response.headers.get('content-security-policy'), /connect-src 'self' https:\/\/accounts\.google\.com https:\/\/www\.googleapis\.com https:\/\/oauth2\.googleapis\.com;/); assert.match(response.headers.get('content-security-policy'), /frame-ancestors 'none'/);
      assert.match(response.headers.get('content-security-policy'), /worker-src 'self'/);
    }
    for (const route of ['/.git/config', '/package.json', '/tests/vault.test.mjs', '/%2e%2e/README.md', '/not-found']) assert.equal((await fetch(base + route)).status, 404);
    assert.equal((await fetch(base, { method: 'POST', body: 'test' })).status, 405);
    const head = await fetch(base, { method: 'HEAD' }); assert.equal(head.status, 200); assert.equal(await head.text(), '');
    assert.match((await fetch(base + '/manifest.webmanifest')).headers.get('content-type'), /application\/manifest\+json/);
    assert.equal((await fetch(base + '/sw.js')).headers.get('cache-control'), 'no-cache');
  } finally { server.closeAllConnections(); await new Promise(resolve => server.close(resolve)); }
});
