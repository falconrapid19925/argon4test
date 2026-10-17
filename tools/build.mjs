import { cp, mkdir, readdir, rm, stat } from 'node:fs/promises';
import path from 'node:path';
import { root } from './serve.mjs';

export const siteFiles = [
  'LICENSE',
  'index.html',
  'second_brain_landing_pages.html',
  'cairn_second_brain_iterations.html',
  'second_brain_five_landing_page_iterations.html',
  'assets',
];
if (process.argv.includes('--dry-run')) {
  for (const name of siteFiles) {
    await stat(path.join(root, name));
    console.log(`Would copy ${name} → dist/${name}`);
  }
} else {
  const destination = path.join(root, 'dist');
  await rm(destination, { recursive: true, force: true });
  await mkdir(destination);
  for (const name of siteFiles)
    await cp(path.join(root, name), path.join(destination, name), { recursive: true });
  console.log(`Built ${(await readdir(destination)).length} site entries in dist/`);
}
