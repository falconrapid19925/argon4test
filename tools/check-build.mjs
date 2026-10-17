import { readFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import assert from 'node:assert/strict';
const output = 'assets/vendor/tailwind/commonplace.css';
const before = await readFile(output);
execFileSync('npm', ['run', 'build:styles'], { stdio: 'inherit' });
assert.deepEqual(
  await readFile(output),
  before,
  'Generated CSS is stale. Run npm run build:styles and commit the result.',
);
