import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import v8toIstanbul from 'v8-to-istanbul';
import libCoverage from 'istanbul-lib-coverage';
import libReport from 'istanbul-lib-report';
import reports from 'istanbul-reports';

const map = libCoverage.createCoverageMap({});
const sourcePath = path.resolve('assets/motion/motion.js');
const source = await readFile(sourcePath, 'utf8');
for (const file of await readdir('coverage/raw')) {
  for (const entry of JSON.parse(await readFile(path.join('coverage/raw', file), 'utf8'))) {
    if (!new URL(entry.url).pathname.endsWith('/assets/motion/motion.js')) continue;
    const converter = v8toIstanbul(sourcePath, 0, { source });
    await converter.load();
    converter.applyCoverage(entry.functions);
    map.merge(converter.toIstanbul());
  }
}
assert.ok(map.files().includes(sourcePath), 'Coverage must include the shared motion runtime');
const context = libReport.createContext({ dir: 'coverage', coverageMap: map });
for (const format of ['text', 'html', 'lcovonly', 'json-summary'])
  reports.create(format).execute(context);
const totals = map.getCoverageSummary().toJSON();
for (const [metric, minimum] of Object.entries({
  lines: 90,
  statements: 90,
  functions: 85,
  branches: 80,
})) {
  assert.ok(
    totals[metric].pct >= minimum,
    `${metric}: ${totals[metric].pct}% is below ${minimum}%`,
  );
}
