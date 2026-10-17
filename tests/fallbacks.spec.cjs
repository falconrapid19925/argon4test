const { test, expect } = require('./helpers/fixtures.cjs');
const { demos, iteration, state } = require('./helpers/motion.cjs');

for (const [demo, file] of Object.entries(demos)) {
  test(`${demo}: legacy query, invalid route, anchors, and blocked storage`, async ({ page }) => {
    await page.addInitScript(() => {
      for (const method of ['getItem', 'setItem'])
        Object.defineProperty(Storage.prototype, method, {
          value() {
            throw new Error('Storage unavailable');
          },
        });
    });
    await page.goto(`/${file}?page=3&ref=qa`);
    await state(page, demo, 3);
    expect(new URL(page.url()).search).toBe('?ref=qa');
    await page.goto(`/${file}#/pages/99`);
    expect(await page.evaluate(() => window.DemoMotion.initial())).toBe(1);
    await page.locator(iteration(demo, 2)).click();
    await state(page, demo, 2);
    await page.evaluate(() => {
      location.hash = 'section-anchor';
    });
    await expect(page).toHaveURL(/#section-anchor$/);
    await page.evaluate(() => {
      window.DemoMotion.route('invalid', 3);
      window.DemoMotion.text('#missing', 'ok');
      window.DemoMotion.reveal('#missing');
      window.DemoMotion.enter('#missing', 2);
    });
  });
}

test('editable fields ignore shortcuts; live reduced-motion preference cancels effects', async ({
  page,
}) => {
  await page.goto(`/${demos.cairn}#/pages/5`);
  const input = page.locator('#iter5-input');
  await input.fill('');
  await input.press('2');
  await state(page, 'cairn', 5);
  await expect(input).toHaveValue('2');
  await page.locator(iteration('cairn', 2)).click();
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect.poll(() => page.evaluate(() => window.DemoMotion.reduced())).toBe(true);
  await expect(page.locator('.motion-position .char-slot')).toHaveCount(0);
  await page.evaluate(() => {
    const host = document.createElement('div');
    document.body.append(host);
    window.DemoMotion.text(
      host,
      'A long label that exceeds the short animated text budget of 42 characters',
    );
    const heading = document.createElement('h2');
    document.body.append(heading);
    window.DemoMotion.text(heading, 'Heading');
  });
});

test('short-label lifecycle, disconnected targets, and unavailable animation API', async ({
  page,
}) => {
  await page.goto(`/${demos.noema}#/pages/2`);
  await page.evaluate(() => window.DemoMotion.ready);
  const result = await page.evaluate(() => {
    const host = document.createElement('div');
    document.querySelector('[data-demo-page="2"]').append(host);
    window.DemoMotion.text(host, 'One');
    window.DemoMotion.text(host, 'Two');
    window.DemoMotion.text(host, 'Two');
    const accessible = host.querySelector('.motion-sr-only').textContent;
    host.replaceChildren();
    window.DemoMotion.text(host, 'Three');
    window.DemoMotion.text(host, 'A long label that deliberately exceeds forty-two characters');
    const long = host.textContent;
    const heading = document.createElement('h2');
    document.body.append(heading);
    window.DemoMotion.text(heading, 'Readable heading');
    window.DemoMotion.text(host, 'Again');
    host.remove();
    window.DemoMotion.enter(document.querySelector('[data-demo-page="2"]'), 2);
    const target = document.createElement('div');
    target.textContent = 'Transform';
    target.style.transform = 'rotate(5deg)';
    document.body.append(target);
    window.DemoMotion.reveal(target);
    window.DemoMotion.reveal(target, { duration: 10, distance: 2 });
    target.hidden = true;
    window.DemoMotion.reveal(target);
    const animate = Element.prototype.animate;
    Element.prototype.animate = undefined;
    target.hidden = false;
    window.DemoMotion.reveal(target);
    Element.prototype.animate = animate;
    return {
      accessible,
      long,
      heading: heading.textContent,
      replays: target.dataset.motionReplays,
    };
  });
  expect(result).toEqual({
    accessible: 'Two',
    long: 'A long label that deliberately exceeds forty-two characters',
    heading: 'Readable heading',
    replays: '4',
  });
});

test('optional text module failure leaves navigation and labels usable', async ({ page }) => {
  await page.route('**/assets/vendor/slot-text/index.js', (route) =>
    route.fulfill({
      contentType: 'text/javascript',
      body: 'throw new Error("Optional module unavailable");',
    }),
  );
  await page.goto(`/${demos.cairn}#/pages/1`);
  expect(await page.evaluate(() => window.DemoMotion.ready)).toBe(false);
  await page.locator(iteration('cairn', 3)).click();
  await state(page, 'cairn', 3);
  await expect(page.locator('.motion-position')).toHaveText('3 / 5');
  await expect(page.locator('.motion-position .char-slot')).toHaveCount(0);
});
