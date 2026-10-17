const { test: base, expect } = require('@playwright/test');
const fs = require('node:fs/promises');
const path = require('node:path');
const { randomUUID } = require('node:crypto');

const test = base.extend({
  guard: [
    async ({ context, browserName }, use, testInfo) => {
      const errors = [];
      const coverage = [];
      const pending = [];
      const monitor = async (page) => {
        page.on('pageerror', (error) => errors.push(error.message));
        page.on('console', (message) => {
          if (message.type() === 'error') errors.push(message.text());
        });
        page.on('response', (response) => {
          if (response.status() >= 400) errors.push(`HTTP ${response.status()}: ${response.url()}`);
        });
        page.on('requestfailed', (request) => {
          // A new document legitimately cancels images/fonts during rapid navigation.
          if (!/ABORT|CANCEL|NS_BINDING_ABORTED/i.test(request.failure()?.errorText || ''))
            errors.push(`Failed request: ${request.url()}`);
        });
        if (process.env.COVERAGE && browserName === 'chromium') {
          await page.coverage.startJSCoverage({ resetOnNavigation: false });
          coverage.push(page);
        }
      };
      context.on('page', (page) => pending.push(monitor(page)));
      await use();
      await Promise.all(pending);
      if (coverage.length) {
        const entries = (
          await Promise.all(
            coverage.map((page) => (page.isClosed() ? [] : page.coverage.stopJSCoverage())),
          )
        ).flat();
        await fs.mkdir('coverage/raw', { recursive: true });
        await fs.writeFile(
          path.join('coverage/raw', `${randomUUID()}.json`),
          JSON.stringify(entries),
        );
      }
      if (errors.length)
        await testInfo.attach('browser-errors', {
          body: errors.join('\n'),
          contentType: 'text/plain',
        });
      expect(errors, 'No JavaScript, console, HTTP, or required asset failures').toEqual([]);
    },
    { auto: true },
  ],
});
module.exports = { test, expect };
