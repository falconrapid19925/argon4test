import { chromium } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import { createServer } from './serve.mjs';

const server = createServer();
await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
const browser = await chromium.launch(
  process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {},
);
try {
  const page = await browser.newPage({
    viewport: { width: 1440, height: 1000 },
    reducedMotion: 'reduce',
  });
  const cards = [];
  for (const [name, file, description] of [
    ['Noema', 'second_brain_landing_pages.html', 'Editorial clarity / Neural workbenches'],
    ['Cairn', 'cairn_second_brain_iterations.html', 'Paper archives / Connected observations'],
    [
      'Commonplace',
      'second_brain_five_landing_page_iterations.html',
      'Spatial thinking / Everyday knowledge',
    ],
  ]) {
    await page.goto(`http://127.0.0.1:${server.address().port}/${file}#/pages/1`);
    await page.evaluate(() => document.fonts.ready);
    await page.waitForFunction(() => !!document.querySelector('[data-demo-page="1"].is-shown'));
    const image = await page.screenshot();
    cards.push(
      `<article><div class="label">${name}<span>01—05</span></div><div class="capture"><img src="data:image/png;base64,${image.toString('base64')}" alt="${name} browser screenshot"></div><p>${description}</p></article>`,
    );
  }
  await page.setViewportSize({ width: 1500, height: 820 });
  await page.setContent(`<!doctype html><html lang="en"><meta charset="utf-8"><style>
    *{box-sizing:border-box} body{margin:0;background:#eeeae1;color:#253b35;padding:64px;font:16px system-ui,sans-serif}
    header{display:flex;justify-content:space-between;align-items:start;border-bottom:1px solid #b7bdb2;padding-bottom:32px}
    .eyebrow{text-transform:uppercase;letter-spacing:.22em;font-size:13px} h1{font:60px/1.05 Georgia,serif;letter-spacing:-.04em;margin:20px 0 0}
    .badge{border:1px solid #a9b6a8;border-radius:100px;padding:12px 18px;font-size:12px} main{display:grid;grid-template-columns:repeat(3,1fr);gap:24px;margin-top:36px}
    article{min-width:0}.label{display:flex;justify-content:space-between;font:26px Georgia,serif;margin-bottom:18px}.label span{font:12px system-ui,sans-serif;opacity:.6;padding-top:8px}
    .capture{height:315px;overflow:hidden;border:1px solid #bfc6bb;border-radius:6px;box-shadow:0 12px 25px #253b3512} img{width:100%;display:block}
    p{font-size:12px;letter-spacing:.02em;opacity:.8;margin-top:18px} footer{display:flex;justify-content:space-between;font-size:12px;margin-top:36px;letter-spacing:.04em}
    </style><header><div><div class="eyebrow">Argon / Interaction & motion studies</div><h1>Fifteen ways to think<br>outside the page.</h1></div><div class="badge">3 collections · 15 interactive iterations</div></header><main>${cards.join('')}</main><footer><span>STATIC HTML · LOCAL ASSETS · REDUCED MOTION</span><span>Noema / Cairn / Commonplace</span></footer></html>`);
  await mkdir('docs', { recursive: true });
  await page.screenshot({ path: 'docs/preview.png' });
  console.log('Captured docs/preview.png from the real browser UI.');
} finally {
  await browser.close();
  await new Promise((resolve) => server.close(resolve));
}
