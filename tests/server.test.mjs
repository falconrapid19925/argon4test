import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from '../tools/serve.mjs';

test('static server serves site files and rejects traversal, tooling, and unsafe methods', async (t) => {
  const server = createServer();
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  t.after(() => new Promise((resolve) => server.close(resolve)));
  const base = `http://127.0.0.1:${server.address().port}`;
  for (const name of ['/', '/assets/motion/motion.js', '/second_brain_landing_pages.html']) {
    const response = await fetch(base + name);
    assert.equal(response.status, 200);
    assert.equal(response.headers.get('x-content-type-options'), 'nosniff');
  }
  for (const name of [
    '/.git/config',
    '/package.json',
    '/node_modules/eslint/package.json',
    '/assets/%2e%2e%2fpackage.json',
    '/missing.html',
  ]) {
    assert.equal((await fetch(base + name)).status, 404, name);
  }
  assert.equal((await fetch(base + '/%ZZ')).status, 400);
  assert.equal((await fetch(base, { method: 'POST' })).status, 405);
  assert.equal((await fetch(base, { method: 'HEAD' })).status, 200);
  assert.equal((await fetch(base, { method: 'HEAD' })).headers.get('content-type'), 'text/html');
});
