# Test and coverage guide

Use Node 24 LTS, `npm ci`, then `npx playwright install --with-deps chromium firefox webkit`. Browsers are tied to the exact Playwright version in the lockfile. CI installs the same browsers and OS dependencies.

## Commands

| Command                                                | Purpose                                                                                                                        |
| ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------ |
| `npm run check`                                        | First-party JavaScript and inline-script lint, tool/document formatting, repeatable stylesheet generation, server safety tests |
| `npm run check:workflows`                              | Validate Actions syntax, expressions, dependencies, and action input names with checksummed actionlint                         |
| `npm run test:dry-run`                                 | List every browser case and static bundle input without starting browsers or publishing                                        |
| `npm run test:e2e`                                     | Run all scenarios on Chromium, Firefox, and WebKit                                                                             |
| `npm run test:coverage`                                | Run Chromium scenarios and enforce shared motion coverage thresholds                                                           |
| `npx playwright test --project=firefox --grep '390px'` | Focused mobile rerun                                                                                                           |
| `npx playwright show-report`                           | Open the latest HTML report                                                                                                    |

Playwright starts and cleans up a local server automatically. Set `CHROMIUM_PATH` only to use an existing Chromium installation; normally leave it unset to use the managed browser. `SERVE_DIR=dist npm run test:e2e` tests the packaged site. CI disallows focused tests, uses two workers, and retries failures once; local runs have no retries. Every test gets isolated browser storage and pages.

## Scenario coverage

- All three collections × all five iterations: initial hash route, reload, exactly one active page, visible motion targets, and a primary working interaction.
- Every collection: Back/Forward, keyboard focus transfer, number/bracket shortcuts, rapid switching with the last destination winning, and real slot-text output.
- Every collection: 390px controls, all five iterations, document overflow, and screenshot capture.
- Every collection: reduced motion with the View Transition API removed.
- Cross-collection iteration memory, legacy query URLs, invalid routes, anchor preservation, and blocked session storage.
- Editable inputs keep keystrokes, live motion-preference changes cancel motion, and long/headline text stays readable.
- The existing iframe showcase keeps outer controls aligned with collection links and browser history.
- A separate Node test checks the static server's site allowlist, encoded traversal, malformed URLs, HTTP methods, and MIME headers.

Animation assertions observe actual calls to the browser's Web Animations API and CSS transition/animation start events, avoiding a race where a short animation finishes before the assertion. State and visibility assertions still check the resulting UI. Runtime errors, error-level console messages, failed requests, and HTTP errors fail each browser case. Navigation-cancelled requests are ignored because navigating away can cancel in-flight assets.

## Measured code coverage

`npm run test:coverage` collects Chromium V8 coverage across navigations and merges it into Istanbul reports. A missing motion file fails the gate. Coverage is scoped to first-party shared runtime `assets/motion/motion.js`; vendored packages and inline demo scripts are excluded. Inline scripts are linted and their primary behaviors are covered by browser scenarios. This is not a claim of whole-repository unit coverage.

| Metric     | Minimum |
| ---------- | ------- |
| Lines      | 90%     |
| Statements | 90%     |
| Functions  | 85%     |
| Branches   | 80%     |

Reports: `coverage/index.html`, `coverage/lcov.info`, `coverage/coverage-summary.json`, `playwright-report/index.html`, and `test-results/junit.xml`. Failure traces, screenshots, and videos live under `test-results/`. CI retains these artifacts for 14 days, including on failure. Generated reports and dependencies stay out of git.
