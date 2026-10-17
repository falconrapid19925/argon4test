import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
const config = JSON.parse(
  readFileSync(new URL('../.github/repository.json', import.meta.url), 'utf8'),
);
const steps = [
  [
    'PATCH',
    `repos/${config.repository}`,
    { description: config.description, homepage: config.homepage },
  ],
  ['PUT', `repos/${config.repository}/topics`, { names: config.topics }],
  ['PUT', `repos/${config.repository}/pages`, { build_type: config.pages_build_type }],
  ['PUT', `repos/${config.repository}/private-vulnerability-reporting`, null],
];
let failed = false;
for (const [method, endpoint, body] of steps) {
  if (process.argv.includes('--dry-run')) {
    console.log(JSON.stringify({ method, endpoint, body }));
    continue;
  }
  const args = ['api', '--method', method, endpoint];
  if (body) args.push('--input', '-');
  const result = spawnSync('gh', args, {
    input: body ? JSON.stringify(body) : undefined,
    encoding: 'utf8',
  });
  if (result.status !== 0) {
    failed = true;
    console.error(`${method} ${endpoint}: ${result.stderr.trim()}`);
  } else console.log(`Configured ${endpoint}`);
}
if (failed) process.exitCode = 1;
