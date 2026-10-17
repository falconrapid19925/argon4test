# Maintaining Argon

## Tooling and updates

Use Node 24 LTS and `npm ci`. Browsers follow the locked Playwright version. Dependabot checks npm and Actions weekly; review release notes and rerun all checks before merging. The `@parcel/watcher` override pins the patched 2.6.0 release because Tailwind CLI 4.3.3 otherwise pins vulnerable 2.5.1; remove the override once the CLI uses a patched watcher.

Action versions below were checked against upstream stable releases on **2026-10-17**. Workflows pin resolved commit hashes, not mutable major tags.

| Action                          | Stable version             |
| ------------------------------- | -------------------------- |
| `actions/checkout`              | 7.0.1                      |
| `actions/setup-node`            | 7.1.0                      |
| `actions/upload-artifact`       | 7.0.2                      |
| `actions/download-artifact`     | 8.0.2                      |
| `actions/configure-pages`       | 6.0.0                      |
| `actions/upload-pages-artifact` | 5.0.0                      |
| `actions/deploy-pages`          | 5.0.1                      |
| `github/codeql-action`          | 4.39.0                     |
| actionlint CLI                  | 1.7.12 (checksum verified) |

The CodeQL repository also publishes bundle releases, so its `releases/latest` endpoint is not sufficient to discover the action version. Check the stable action release/tag explicitly. When updating actionlint, update the download version and checksum together. Workflow lint currently disables optional external shellcheck/pyflakes integrations; expression and Actions validation still runs.

## CI and Pages

`verify.yml` is the shared gate for both CI and releases. It runs quality checks, audit, workflow lint, dry-run discovery, three browsers, Chromium coverage thresholds, and clean site packaging. Tests never require repository secrets. Fork pull requests receive only read permissions. Reports are kept 14 days.

`ci.yml` calls verification on pull requests and `main`, then publishes a verified `site-dist` artifact on a successful `main` push. The deployment job alone receives Pages/OIDC write access and uses the `github-pages` environment. The deployment job uses its scoped `pages: write` token to set the existing Pages build source to **GitHub Actions** before publication. If repository policy blocks that request, an administrator must select GitHub Actions in Settings → Pages. The bundle uses an allowlist and excludes development packages, reports, git files, and legacy placeholder documents.

Keep branch protection aligned with the reusable workflow's visible check names: **Code quality and dry run**, **Browser (chromium)**, **Browser (firefox)**, **Browser (webkit)**, and **Package verified site**. Use the names shown in a completed Actions run if GitHub prefixes them with the caller. Require a pull request and passing checks; squash merges keep history tidy. CodeQL is an additional security check.

## Release

1. Update `package.json`, the lockfile (`npm install --package-lock-only`), and `CHANGELOG.md` for the intended stable version.
2. Merge passing changes to `main`.
3. Exercise the full release dry run:

   ```sh
   gh workflow run release.yml --ref main -f dry_run=true
   ```

4. After verification, tag the matching commit and push:

   ```sh
   git tag -a v1.0.1 -m 'v1.0.1'
   git push origin v1.0.1
   ```

A tag push reruns the same gate, checks tag/package version agreement, and creates a GitHub release with generated notes, a site tarball, and `SHA256SUMS`. A manual run defaults to dry run; live manual publication requires selecting an existing stable version tag and disabling dry run. Releases are not pushed to npm (`private: true`). Failed verification prevents publication. Avoid reusing or moving published tags.

To verify an archive, place it beside `SHA256SUMS` and run `sha256sum -c SHA256SUMS`. Extract and serve it using a static HTTP server.

## Preview and formatting

Run `npm run docs:preview` after UI changes. It captures the real first iteration of each collection in Chromium, then renders the README contact sheet to `docs/preview.png`. Motion is reduced so captures are deterministic. Optional `CHROMIUM_PATH` selects an installed Chromium; normally the managed browser is used.

Prettier covers tooling and documentation, while original hand-authored HTML, the shared motion assets, generated styles, and vendored sources retain their current formatting. ESLint still checks first-party JavaScript and inline HTML scripts. Reports, `work/`, `dist/`, and dependencies are ignored by git.

## Repository administration

`.github/repository.json` records the intended description, homepage, topics, Pages workflow source, and private vulnerability reporting. Preview requests with `npm run repo:dry-run`; apply them with `npm run repo:configure` using a GitHub credential that has the required repository administration, Pages, and security permissions. This script is intentionally separate from CI because normal pull-request tokens must not have administration privileges.

The initial connected integration rejected metadata and private-reporting updates with HTTP 403 (`Resource not accessible by integration`). These require a credential with the corresponding scopes even when the authenticated user is a repository admin. Code and workflow commits do not grant additional token permissions.
