const assert = require('node:assert/strict');
const path = require('node:path');
const demos = {
  noema: 'second_brain_landing_pages.html',
  cairn: 'cairn_second_brain_iterations.html',
  commonplace: 'second_brain_five_landing_page_iterations.html',
};
const iteration = (demo, n) =>
  demo === 'noema'
    ? `.switcher-num-btn[data-num="${n}"]`
    : demo === 'cairn'
      ? `.switcher-tab[data-target="${n}"]`
      : `#nav-btn-${n}`;
async function settle(page) {
  await page.waitForTimeout(780);
}
async function state(page, demo, n) {
  await page.waitForFunction(
    (n) => {
      const active = [...document.querySelectorAll('[data-demo-page]')].filter((el) => !el.inert);
      return active.length === 1 && active[0].dataset.demoPage === String(n);
    },
    n,
    { timeout: 8000 },
  );
  assert.equal(new URL(page.url()).hash, `#/pages/${n}`);
  assert.equal(new URL(page.url()).pathname.split('/').pop(), demos[demo]);
  const visibility = await page.evaluate(() =>
    [...document.querySelectorAll('[data-demo-page]')].map((el) => ({
      n: +el.dataset.demoPage,
      inert: el.inert,
      hidden: el.getAttribute('aria-hidden'),
      rendered: !!el.getClientRects().length && getComputedStyle(el).display !== 'none',
    })),
  );
  assert.equal(visibility.filter((el) => el.rendered).length, 1, 'Exactly one page must render');
  for (const item of visibility) {
    assert.equal(item.inert, item.n !== n);
    assert.equal(item.hidden, item.n === n ? 'false' : 'true');
  }
  assert.equal(await page.locator(iteration(demo, n)).getAttribute('aria-current'), 'page');
  assert.equal(
    await page.locator('.motion-navigation [aria-current="page"]').getAttribute('data-collection'),
    demo,
  );
}

async function visibleMotion(page, n) {
  // Slow browser frames can outlast the minimum settling delay. Observe the
  // resulting reveal state instead of assuming a wall-clock animation duration.
  await page.waitForFunction(
    (n) => {
      const elements = [...document.querySelectorAll(`[data-demo-page="${n}"] [data-motion]`)];
      return (
        elements.length >= 2 &&
        elements.every((el) => {
          const style = getComputedStyle(el);
          return (
            el.getClientRects().length &&
            style.visibility !== 'hidden' &&
            Number(style.opacity) > 0.95
          );
        })
      );
    },
    n,
    { timeout: 8000 },
  );
  const hooks = await page
    .locator(`[data-demo-page="${n}"] [data-motion]`)
    .evaluateAll((elements) =>
      elements.map((el) => ({
        text: el.textContent.trim().slice(0, 70),
        opacity: +getComputedStyle(el).opacity,
        hidden: getComputedStyle(el).visibility === 'hidden',
        rect: !!el.getClientRects().length,
      })),
    );
  assert.ok(hooks.length >= 2, 'Page needs meaningful motion targets');
  for (const hook of hooks)
    assert.ok(hook.rect && !hook.hidden && hook.opacity > 0.95, `Hidden content: ${hook.text}`);
}

async function changed(page, target, action) {
  const before = await page.locator(target).textContent();
  await action();
  await page.waitForFunction(
    ({ target, before }) => document.querySelector(target)?.textContent !== before,
    { target, before },
  );
  assert.ok(await page.locator(target).isVisible(), `${target} must remain visible`);
}

async function animationCount(page) {
  return page.evaluate(() => {
    if (!window.__motionProbe) {
      window.__motionProbe = { count: 0 };
      for (const event of ['transitionrun', 'animationstart'])
        document.addEventListener(
          event,
          (event) => {
            if (event.target.closest('[data-demo-page]')) window.__motionProbe.count++;
          },
          true,
        );
      const animate = Element.prototype.animate;
      Element.prototype.animate = function (...args) {
        const result = animate.apply(this, args);
        if (this.closest('[data-demo-page]')) window.__motionProbe.count++;
        return result;
      };
    }
    return window.__motionProbe.count;
  });
}

async function interaction(page, demo, n) {
  const beforeAnimations = await animationCount(page);
  const click = (selector) => page.locator(selector).first().click();
  if (demo === 'noema') {
    if (n === 1) await changed(page, '#p1-active-id', () => click('#p1-mini-1'));
    if (n === 2)
      await changed(page, '#p2-graph-telemetry', () =>
        click('[onclick="window.addP2GraphNode()"]'),
      );
    if (n === 3) await changed(page, '#p3-compiler-output', () => click('#p3-tab-query'));
    if (n === 4) await changed(page, '#p4-c1-title', () => click('#p4-lens-research'));
    if (n === 5)
      await changed(page, '#p5-summary-out', () => click('[onclick="window.loadP5Preset(1)"]'));
  } else if (demo === 'cairn') {
    if (n === 1) await changed(page, '#iter1-transclusion-text', () => click('[data-slip="0"]'));
    if (n === 2)
      await changed(page, '#iter2-synthesis-text', () =>
        click('.iter-2-gloss-note[data-gloss="2"]'),
      );
    if (n === 3)
      await changed(page, '#iter3-insp-title', () => click('.iter-3-cluster-btn[data-node="1"]'));
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
      assert.match(
        await page.locator('#iter5-stream-list .iter-5-entry').first().textContent(),
        /Motion QA/,
      );
    }
  } else {
    if (n === 1) await changed(page, '#slip-title', () => click('[onclick="selectSlip(\'21b\')"]'));
    if (n === 2) {
      const before = await page.locator('#node-a').getAttribute('style');
      await click('[onclick="clusterSpatialNodes()"]');
      assert.notEqual(await page.locator('#node-a').getAttribute('style'), before);
      assert.ok(await page.locator('#node-a').isVisible());
    }
    if (n === 3)
      await changed(page, '#recall-source-body', () =>
        click('[onclick="triggerRiverRecall(\'alexander\')"]'),
      );
    if (n === 4) await changed(page, '#pressed-quote-display', () => click('#specimen-quote-1'));
    if (n === 5) {
      await page.locator('#reflex-search-input').fill('148 * 12');
      assert.ok(await page.locator('#reflex-calc-banner').isVisible());
      assert.match(await page.locator('#reflex-calc-output').textContent(), /1,776/);
      await click('#reflex-calc-banner button');
      assert.match(await page.locator('#reflex-results-list').textContent(), /148 \* 12/);
    }
  }
  if (!(await page.evaluate(() => matchMedia('(prefers-reduced-motion: reduce)').matches))) {
    await page.waitForFunction((before) => window.__motionProbe.count > before, beforeAnimations, {
      timeout: 3000,
    });
    assert.ok(
      (await animationCount(page)) > beforeAnimations,
      `${demo} ${n} interaction must create an actual browser animation`,
    );
  }
}

async function navigation(page, base, demo) {
  await page.goto(`${base}/${demos[demo]}#/pages/1`);
  const beforeAnimations = await animationCount(page);
  await page.locator(iteration(demo, 2)).click();
  await state(page, demo, 2);
  assert.ok(
    (await animationCount(page)) > beforeAnimations,
    'Iteration switch must create an actual browser animation',
  );
  await page.locator(iteration(demo, 4)).click();
  await state(page, demo, 4);
  await page.goBack();
  await state(page, demo, 2);
  await page.goForward();
  await state(page, demo, 4);
  await page.keyboard.press('3');
  await state(page, demo, 3);
  await page.reload();
  await state(page, demo, 3);
  await page.locator('[data-demo-page="3"] button').first().focus();
  await page.keyboard.press('4');
  await state(page, demo, 4);
  assert.equal(
    await page.evaluate(() => document.activeElement.closest('[data-demo-page]')?.dataset.demoPage),
    '4',
    'Keyboard navigation should move focus out of the now inactive page',
  );
  await page.locator(iteration(demo, 1)).click();
  // Real rapid button activations in one event loop task exercise interrupt handling.
  await page.evaluate(
    (selectors) => selectors.forEach((selector) => document.querySelector(selector).click()),
    [2, 5, 3, 4, 2, 5].map((n) => iteration(demo, n)),
  );
  await state(page, demo, 5);
  await settle(page);
  await visibleMotion(page, 5);
  await page.keyboard.press(']');
  await state(page, demo, 1);
  await page.keyboard.press('[');
  await state(page, demo, 5);
  await page.locator(iteration(demo, 2)).click();
  await page.waitForFunction(() => !!document.querySelector('.motion-position .char-slot'));
  assert.ok(
    await page
      .locator('.motion-position .motion-text-visual[aria-hidden="true"] .char-slot')
      .count(),
  );
  assert.equal(await page.locator('.motion-position > .motion-text-visual').count(), 1);
  assert.equal(await page.locator('.motion-position > .motion-sr-only').count(), 1);
  assert.equal(await page.locator('.motion-position .motion-sr-only').textContent(), '2 / 5');
}

async function mobile(page, base, demo, screenshots) {
  await page.goto(`${base}/${demos[demo]}#/pages/1`);
  await settle(page);
  const selectors = [
    '.motion-navigation',
    ...Object.keys(demos).map((key) => `[data-collection="${key}"]`),
    ...[1, 2, 3, 4, 5].map((n) => iteration(demo, n)),
  ];
  for (let n = 1; n <= 5; n++) {
    await page.locator(iteration(demo, n)).click();
    await state(page, demo, n);
    for (const selector of selectors) {
      const bounds = await page.locator(selector).boundingBox();
      assert.ok(
        bounds &&
          bounds.width > 0 &&
          bounds.x >= -1 &&
          bounds.x + bounds.width <= 391 &&
          bounds.y >= 0 &&
          bounds.y + bounds.height <= 845,
        `Iteration ${n} control outside mobile viewport: ${selector} ${JSON.stringify(bounds)}`,
      );
    }
    const width = await page.evaluate(() => document.documentElement.scrollWidth);
    assert.ok(width <= 391, `Iteration ${n} has horizontal document overflow: ${width}px`);
  }
  await page.locator(iteration(demo, 2)).click();
  await state(page, demo, 2);
  await settle(page);
  await visibleMotion(page, 2);
  await page.screenshot({ path: path.join(screenshots, `${demo}-mobile.png`), fullPage: true });
}

module.exports = {
  demos,
  iteration,
  settle,
  state,
  visibleMotion,
  interaction,
  navigation,
  mobile,
};
