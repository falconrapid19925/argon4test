const { test, expect } = require('./helpers/fixtures.cjs');
const {
  demos,
  iteration,
  settle,
  state,
  visibleMotion,
  interaction,
  navigation,
  mobile,
} = require('./helpers/motion.cjs');

for (const [demo, file] of Object.entries(demos)) {
  test.describe(demo, () => {
    for (let n = 1; n <= 5; n++) {
      test(`iteration ${n}: route, reload, visible content, interaction`, async ({ page }) => {
        await page.goto(`/${file}#/pages/${n}`);
        await state(page, demo, n);
        await settle(page);
        await visibleMotion(page, n);
        await page.reload();
        await state(page, demo, n);
        await settle(page);
        await page.evaluate(() => window.DemoMotion.ready);
        await interaction(page, demo, n);
      });
    }
    test('history, keyboard, rapid switching, real slot-text', async ({ page, baseURL }) => {
      await navigation(page, baseURL, demo);
    });
    test('390px navigation', async ({ page, baseURL }, testInfo) => {
      await page.setViewportSize({ width: 390, height: 844 });
      await mobile(page, baseURL, demo, testInfo.outputDir);
    });
    test('reduced motion and no ViewTransition API', async ({ page }) => {
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await page.addInitScript(() =>
        Object.defineProperty(document, 'startViewTransition', {
          value: undefined,
          configurable: true,
        }),
      );
      await page.goto(`/${file}#/pages/1`);
      for (let n = 1; n <= 5; n++) {
        await page.locator(iteration(demo, n)).click();
        await state(page, demo, n);
        await visibleMotion(page, n);
        const durations = await page.evaluate(() =>
          document
            .getAnimations()
            .map((animation) => animation.effect.getComputedTiming().duration),
        );
        expect(durations.every((duration) => duration <= 1)).toBeTruthy();
        await expect(page.locator('.motion-position')).toHaveText(`${n} / 5`);
      }
      await page.locator(iteration(demo, 2)).click();
      await interaction(page, demo, 2);
    });
  });
}

test('collection links retain the last destination iteration', async ({ page }) => {
  await page.goto(`/${demos.noema}#/pages/4`);
  await page.locator('[data-collection="cairn"]').click();
  await page.locator(iteration('cairn', 3)).click();
  await page.locator('[data-collection="commonplace"]').click();
  await page.locator(iteration('commonplace', 5)).click();
  for (const [demo, n] of [
    ['noema', 4],
    ['cairn', 3],
    ['commonplace', 5],
  ]) {
    const link = page.locator(`[data-collection="${demo}"]`);
    await expect(link).toHaveAttribute('href', new RegExp(`${demos[demo]}#/pages/${n}$`));
    await link.click();
    await state(page, demo, n);
  }
});

test('showcase iframe controls stay synchronized through collection navigation and history', async ({
  page,
}) => {
  await page.goto('/');
  await expect(page).toHaveTitle('Argon4Test - UI Switcher');
  const frame = page.frameLocator('#pageFrame');
  await expect(frame.locator('[data-collection="cairn"]')).toHaveAttribute('aria-current', 'page');
  await page.locator('button[data-page="second_brain_landing_pages.html"]').click();
  await expect(frame.locator('[data-collection="noema"]')).toHaveAttribute('aria-current', 'page');
  await frame.locator('[data-collection="commonplace"]').click();
  await expect(page.locator('button.active')).toHaveAttribute('data-page', demos.commonplace);
  await expect(page.locator('#openCurrent')).toHaveAttribute('href', demos.commonplace);
  // History traverses the child frame; the top document does not fire load.
  await page.evaluate(() => history.back());
  await expect(page.locator('button.active')).toHaveAttribute('data-page', demos.noema);
});
