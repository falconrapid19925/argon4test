# Contributing

Small, focused contributions are welcome. Open an issue for substantial design changes and include the collection/iteration for UI bugs. Please follow the [code of conduct](CODE_OF_CONDUCT.md).

1. Fork/clone and use Node 24 (`nvm use` if installed).
2. Run `npm ci` and `npx playwright install --with-deps chromium firefox webkit`.
3. Start a branch and preserve the distinct visual character of each iteration.
4. Run `npm run build:styles` after changing Commonplace utility classes.
5. Run `npm run format`, `npm run check`, `npm run check:workflows`, `npm run test:e2e`, and `npm run test:coverage`.
6. Open a pull request describing the resulting behavior, verification, and relevant screenshots.

Use real links and portable hash routes. Keep runtime assets local and include upstream licenses. Honor reduced motion, editable-field shortcuts, visible focus, and inert inactive pages. Do not commit generated reports, `node_modules`, credentials, or `dist`.

Add a behavior-focused regression case for a user-visible fix. Keep development tooling locked and update `package-lock.json` with dependency changes. Generated vendor styles are checked in; run the reproducibility check before submitting.
