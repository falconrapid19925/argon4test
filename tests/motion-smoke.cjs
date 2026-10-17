/* Browser-level regression checks. Run: node tests/motion-smoke.cjs */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const { chromium } = require('playwright');

const root = path.resolve(__dirname, '..');
const screenshots = process.env.SCREENSHOT_DIR || '/tmp/argon-motion-screenshots';
const demos = {
  noema: 'second_brain_landing_pages.html',
  cairn: 'cairn_second_brain_iterations.html',
  commonplace: 'second_brain_five_landing_page_iterations.html'
};
const iteration = (demo, n) => demo === 'noema' ? `.switcher-num-btn[data-num="${n}"]`
  : demo === 'cairn' ? `.switcher-tab[data-target="${n}"]` : `#nav-btn-${n}`;
const errors = new Set();
const fontFailures = new Set();
const failures = [];
const filter = process.env.TEST_FILTER ? new RegExp(process.env.TEST_FILTER, 'i') : null;
let passed = 0;

async function check(name, fn) {
  if (filter && !filter.test(name)) return;
  try { await fn(); console.log(`PASS ${name}`); passed++; }
  catch (error) { failures.push(`${name}: ${error.message}`); console.error(`FAIL ${name}: ${error.message}`); }
}

function watch(page) {
  page.setDefaultTimeout(8000);
  page.on('pageerror', error => errors.add(error.message));
  page.on('console', message => {
    if (message.type() !== 'error') return;
    const source = message.location().url || '';
    if (/^https:\/\/fonts\.(googleapis|gstatic)\.com\//.test(source)) fontFailures.add(message.text());
    else errors.add(`Console: ${message.text()}`);
  });
  page.on('requestfailed', request => {
    const destination = new URL(request.url());
    const detail = `${destination.hostname}${destination.pathname}: ${request.failure()?.errorText}`;
    if (['fonts.googleapis.com', 'fonts.gstatic.com'].includes(destination.hostname)) fontFailures.add(detail);
    else errors.add(`Request failed ${detail}`);
  });
  page.on('response', response => {
    if (response.status() < 400) return;
    const destination = new URL(response.url());
    const detail = `HTTP ${response.status()} ${destination.hostname}${destination.pathname}`;
    if (['fonts.googleapis.com', 'fonts.gstatic.com'].includes(destination.hostname)) fontFailures.add(detail);
    else errors.add(detail);
  });
}

async function settle(page) { await page.waitForTimeout(780); }
async function state(page, demo, n) {
  await page.waitForFunction(n => {
    const active = [...document.querySelectorAll('[data-demo-page]')].filter(el => !el.inert);
    return active.length === 1 && active[0].dataset.demoPage === String(n);
  }, n, {timeout: 8000});
  assert.equal(new URL(page.url()).hash, `#/pages/${n}`);
  assert.equal(new URL(page.url()).pathname.split('/').pop(), demos[demo]);
  const visibility = await page.evaluate(() => [...document.querySelectorAll('[data-demo-page]')].map(el => ({
    n: +el.dataset.demoPage, inert: el.inert, hidden: el.getAttribute('aria-hidden'),
    rendered: !!el.getClientRects().length && getComputedStyle(el).display !== 'none'
  })));
  assert.equal(visibility.filter(el => el.rendered).length, 1, 'Exactly one page must render');
  for (const item of visibility) {
    assert.equal(item.inert, item.n !== n);
    assert.equal(item.hidden, item.n === n ? 'false' : 'true');
  }
  assert.equal(await page.locator(iteration(demo, n)).getAttribute('aria-current'), 'page');
  assert.equal(await page.locator('.motion-navigation [aria-current="page"]').getAttribute('data-collection'), demo);
}

async function visibleMotion(page, n) {
  const hooks = await page.locator(`[data-demo-page="${n}"] [data-motion]`).evaluateAll(elements => elements.map(el => ({
    text: el.textContent.trim().slice(0, 70), opacity: +getComputedStyle(el).opacity,
    hidden: getComputedStyle(el).visibility === 'hidden', rect: !!el.getClientRects().length
  })));
  assert.ok(hooks.length >= 2, 'Page needs meaningful motion targets');
  for (const hook of hooks) assert.ok(hook.rect && !hook.hidden && hook.opacity > .95, `Hidden content: ${hook.text}`);
}

async function changed(page, target, action) {
  const before = await page.locator(target).textContent();
  await action();
  await page.waitForFunction(({target, before}) => document.querySelector(target)?.textContent !== before, {target, before});
  assert.ok(await page.locator(target).isVisible(), `${target} must remain visible`);
}

async function interaction(page, demo, n) {
  const click = selector => page.locator(selector).first().click();
  if (demo === 'noema') {
    if (n === 1) await changed(page, '#p1-active-id', () => click('#p1-mini-1'));
    if (n === 2) await changed(page, '#p2-graph-telemetry', () => click('[onclick="window.addP2GraphNode()"]'));
    if (n === 3) await changed(page, '#p3-compiler-output', () => click('#p3-tab-query'));
    if (n === 4) await changed(page, '#p4-c1-title', () => click('#p4-lens-research'));
    if (n === 5) await changed(page, '#p5-summary-out', () => click('[onclick="window.loadP5Preset(1)"]'));
  } else if (demo === 'cairn') {
    if (n === 1) await changed(page, '#iter1-transclusion-text', () => click('[data-slip="0"]'));
    if (n === 2) await changed(page, '#iter2-synthesis-text', () => click('.iter-2-gloss-note[data-gloss="2"]'));
    if (n === 3) await changed(page, '#iter3-insp-title', () => click('.iter-3-cluster-btn[data-node="1"]'));
    if (n === 4) {
      await click('[onclick="filterSpecimens(\'Urbanism\', this)"]');
      const rows = page.locator('.iter-4-row-clickable:visible');
      assert.equal(await rows.count(), 1);
      assert.equal(await rows.first().getAttribute('data-domain'), 'Urbanism');
    }
    if (n === 5) {
      const count = await page.locator('#iter5-stream-list .iter-5-entry').count();
      await page.locator('#iter5-input').fill('Motion QA [[linked observation]]');
      await click('[onclick="appendNoteToStream()"]');
      assert.equal(await page.locator('#iter5-stream-list .iter-5-entry').count(), count + 1);
      assert.match(await page.locator('#iter5-stream-list .iter-5-entry').first().textContent(), /Motion QA/);
    }
  } else {
    if (n === 1) await changed(page, '#slip-title', () => click('[onclick="selectSlip(\'21b\')"]'));
    if (n === 2) {
      const before = await page.locator('#node-a').getAttribute('style');
      await click('[onclick="clusterSpatialNodes()"]');
      assert.notEqual(await page.locator('#node-a').getAttribute('style'), before);
      assert.ok(await page.locator('#node-a').isVisible());
    }
    if (n === 3) await changed(page, '#recall-source-body', () => click('[onclick="triggerRiverRecall(\'alexander\')"]'));
    if (n === 4) await changed(page, '#pressed-quote-display', () => click('#specimen-quote-1'));
    if (n === 5) {
      await page.locator('#reflex-search-input').fill('148 * 12');
      assert.ok(await page.locator('#reflex-calc-banner').isVisible());
      assert.match(await page.locator('#reflex-calc-output').textContent(), /1,776/);
      await click('#reflex-calc-banner button');
      assert.match(await page.locator('#reflex-results-list').textContent(), /148 \* 12/);
    }
  }
  if (!await page.evaluate(() => matchMedia('(prefers-reduced-motion: reduce)').matches)) {
    await page.waitForTimeout(25);
    const running = await page.evaluate(n => document.getAnimations().some(animation => {
      const target = animation.effect?.target;
      return target instanceof Element && !!target.closest(`[data-demo-page="${n}"]`)
        && ['running', 'pending'].includes(animation.playState);
    }), n);
    assert.ok(running, `${demo} ${n} interaction needs an actual browser animation`);
  }
}

async function navigation(page, base, demo) {
  await page.goto(`${base}/${demos[demo]}#/pages/1`);
  await page.locator(iteration(demo, 2)).click();
  await state(page, demo, 2);
  const animated = await page.evaluate(() => document.getAnimations().some(animation => {
    const target = animation.effect?.target;
    return target instanceof Element && (target.matches('[data-demo-page]') || target.closest('[data-demo-page="2"]'));
  }));
  assert.ok(animated, 'Iteration switch should have a real browser animation');
  await page.locator(iteration(demo, 4)).click();
  await state(page, demo, 4);
  await page.goBack(); await state(page, demo, 2);
  await page.goForward(); await state(page, demo, 4);
  await page.keyboard.press('3'); await state(page, demo, 3);
  await page.reload(); await state(page, demo, 3);
  await page.locator('[data-demo-page="3"] button').first().focus();
  await page.keyboard.press('4'); await state(page, demo, 4);
  assert.equal(await page.evaluate(() => document.activeElement.closest('[data-demo-page]')?.dataset.demoPage), '4',
    'Keyboard navigation should move focus out of the now inactive page');
  await page.locator(iteration(demo, 1)).click();
  // Real rapid button activations in one event loop task exercise interrupt handling.
  await page.evaluate(selectors => selectors.forEach(selector => document.querySelector(selector).click()),
    [2, 5, 3, 4, 2, 5].map(n => iteration(demo, n)));
  await state(page, demo, 5); await settle(page); await visibleMotion(page, 5);
  await page.keyboard.press(']'); await state(page, demo, 1);
  await page.keyboard.press('['); await state(page, demo, 5);
  await page.locator(iteration(demo, 2)).click();
  await page.waitForFunction(() => !!document.querySelector('.motion-position .char-slot'));
  assert.ok(await page.locator('.motion-position .motion-text-visual[aria-hidden="true"] .char-slot').count());
  assert.equal(await page.locator('.motion-position > .motion-text-visual').count(), 1);
  assert.equal(await page.locator('.motion-position > .motion-sr-only').count(), 1);
  assert.equal(await page.locator('.motion-position .motion-sr-only').textContent(), '2 / 5');
}

async function mobile(page, base, demo) {
  await page.goto(`${base}/${demos[demo]}#/pages/1`); await settle(page);
  const selectors = ['.motion-navigation', ...Object.keys(demos).map(key => `[data-collection="${key}"]`),
    ...[1, 2, 3, 4, 5].map(n => iteration(demo, n))];
  for (let n = 1; n <= 5; n++) {
    await page.locator(iteration(demo, n)).click(); await state(page, demo, n);
    for (const selector of selectors) {
      const bounds = await page.locator(selector).boundingBox();
      assert.ok(bounds && bounds.width > 0 && bounds.x >= -1 && bounds.x + bounds.width <= 391
        && bounds.y >= 0 && bounds.y + bounds.height <= 845, `Iteration ${n} control outside mobile viewport: ${selector} ${JSON.stringify(bounds)}`);
    }
    const width = await page.evaluate(() => document.documentElement.scrollWidth);
    assert.ok(width <= 391, `Iteration ${n} has horizontal document overflow: ${width}px`);
  }
  await page.locator(iteration(demo, 2)).click(); await state(page, demo, 2);
  await settle(page); await visibleMotion(page, 2);
  await page.screenshot({path: path.join(screenshots, `${demo}-mobile.png`), fullPage: true});
}

async function main() {
  fs.mkdirSync(screenshots, {recursive: true});
  const server = http.createServer((request, response) => {
    const pathname = decodeURIComponent(new URL(request.url, 'http://local').pathname);
    if (pathname === '/favicon.ico') { response.writeHead(204); response.end(); return; }
    const filename = path.resolve(root, `.${pathname}`);
    if (!filename.startsWith(root + path.sep)) { response.writeHead(403); response.end(); return; }
    const type = {'.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.json': 'application/json'}[path.extname(filename)];
    fs.readFile(filename, (error, data) => {
      response.writeHead(error ? 404 : 200, {'Content-Type': type || 'application/octet-stream'});
      response.end(error ? 'Not found' : data);
    });
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const base = process.env.BASE_URL || `http://127.0.0.1:${server.address().port}`;
  const browser = await chromium.launch({executablePath: process.env.CHROMIUM_PATH || '/usr/bin/chromium',
    headless: true, args: ['--no-sandbox']});
  try {
    const context = await browser.newContext({viewport: {width: 1440, height: 1000}});
    const page = await context.newPage(); watch(page);
    for (const [demo, file] of Object.entries(demos)) {
      for (let n = 1; n <= 5; n++) {
        await check(`${demo} ${n}: route, content, reload, interaction`, async () => {
          await page.goto(`${base}/${file}#/pages/${n}`);
          await state(page, demo, n); await settle(page); await visibleMotion(page, n);
          await page.screenshot({path: path.join(screenshots, `${demo}-${n}.png`), fullPage: true});
          await page.reload(); await state(page, demo, n); await settle(page);
          await page.evaluate(() => window.DemoMotion.ready);
          await interaction(page, demo, n);
        });
      }
      await check(`${demo}: history, keyboard, rapid switching, real slot-text`, () => navigation(page, base, demo));
    }
    await check('Collection links retain destination iteration', async () => {
      await page.goto(`${base}/${demos.noema}#/pages/4`);
      await page.locator('[data-collection="cairn"]').click();
      await page.locator(iteration('cairn', 3)).click();
      await page.locator('[data-collection="commonplace"]').click();
      await page.locator(iteration('commonplace', 5)).click();
      for (const [demo, n] of [['noema', 4], ['cairn', 3], ['commonplace', 5]]) {
        const link = page.locator(`[data-collection="${demo}"]`);
        assert.match(await link.getAttribute('href'), new RegExp(`${demos[demo]}#/pages/${n}$`));
        await link.click(); await state(page, demo, n);
      }
    });
    const mobilePage = await context.newPage(); watch(mobilePage);
    await mobilePage.setViewportSize({width: 390, height: 844});
    for (const demo of Object.keys(demos)) await check(`${demo}: 390px navigation`, () => mobile(mobilePage, base, demo));
    const reducedContext = await browser.newContext({reducedMotion: 'reduce', viewport: {width: 1280, height: 900}});
    await reducedContext.addInitScript(() => {
      Object.defineProperty(document, 'startViewTransition', {value: undefined, configurable: true});
    });
    const reducedPage = await reducedContext.newPage(); watch(reducedPage);
    for (const [demo, file] of Object.entries(demos)) await check(`${demo}: reduced motion, no ViewTransition API`, async () => {
      await reducedPage.goto(`${base}/${file}#/pages/1`);
      assert.equal(await reducedPage.evaluate(() => typeof document.startViewTransition), 'undefined');
      for (let n = 1; n <= 5; n++) {
        await reducedPage.locator(iteration(demo, n)).click();
        await state(reducedPage, demo, n); await visibleMotion(reducedPage, n);
        const animations = await reducedPage.evaluate(n => document.getAnimations().filter(animation => {
          const target = animation.effect?.target;
          return target instanceof Element && (target.closest(`[data-demo-page="${n}"]`) || target.closest('.motion-navigation'));
        }).map(animation => animation.effect.getComputedTiming().duration), n);
        assert.ok(animations.every(duration => duration <= 1), `Reduced motion still animates: ${animations}`);
        assert.equal(await reducedPage.locator('.motion-position').textContent(), `${n} / 5`);
      }
      await reducedPage.locator(iteration(demo, 2)).click();
      await interaction(reducedPage, demo, 2);
    });
    if (filter || errors.size) {
      // Asset/browser errors remain mandatory even when rerunning only affected cases.
      assert.deepEqual([...errors], [], 'Browser errors during selected checks');
    }
    await check('No JavaScript errors or required asset failures', async () => assert.deepEqual([...errors], []));
    console.log(`\n${passed} checks passed; ${failures.length} failed. Screenshots: ${screenshots}`);
    if (fontFailures.size) console.log(`External font failures (separate):\n${[...fontFailures].join('\n')}`);
    if (failures.length) process.exitCode = 1;
  } finally {
    await browser.close(); await new Promise(resolve => server.close(resolve));
  }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
