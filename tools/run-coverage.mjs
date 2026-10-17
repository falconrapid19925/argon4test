import { rm } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
await rm('coverage', { recursive: true, force: true });
const tests = spawnSync('npx', ['--no-install', 'playwright', 'test', '--project=chromium'], {
  env: { ...process.env, COVERAGE: '1' },
  stdio: 'inherit',
});
if (tests.status !== 0) process.exit(tests.status || 1);
const report = spawnSync(process.execPath, ['tools/coverage-report.mjs'], { stdio: 'inherit' });
process.exit(report.status || 0);
