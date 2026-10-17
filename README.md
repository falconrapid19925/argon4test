# argon4test

Three interactive second-brain design studies, with five iterations each:

- `second_brain_landing_pages.html` — Noema
- `cairn_second_brain_iterations.html` — Cairn
- `second_brain_five_landing_page_iterations.html` — Commonplace

## Run

From this directory:

```sh
python3 -m http.server 8000 --bind 127.0.0.1
```

Serve the repository root and open any of the three HTML documents. The top navigation switches collections; the existing bottom controls switch iterations. URLs such as `cairn_second_brain_iterations.html#/pages/3` survive reloads on an ordinary static server. Collection links remember the last iteration for the current browser session.

Use number keys **1–5**, **[** / **]** to wrap between iterations, and **Escape** to close drawers or dialogs. Shortcuts leave editable fields alone.

## Motion

Every iteration has entrance motion and interaction feedback, with design-specific pacing. Shared assets live in `assets/motion/`. They integrate the **texts reveal** and **sliding tabs** recipes from [Transitions.dev](https://transitions.dev/skill.html), plus a small page/interaction lifecycle. Collection links fade out before ordinary navigation; reduced motion and modified clicks retain normal link behavior. No View Transitions API is required.

Short changing labels use the vanilla [slot-text](https://textmotion.dev/) API, pinned to **0.3.4** and vendored locally. Long text and headings retain normal wrapping. Animated text has one accessible text equivalent; inactive pages and closed drawers stay outside keyboard focus. CSS and JavaScript honor `prefers-reduced-motion`.

All runtime assets are local, including Commonplace's existing Google Fonts (Latin subset) and compiled Tailwind **3.4.17** utilities. Browsing these demos needs no external CDN requests, package installation, or build. Upstream licenses accompany the assets.

If Commonplace's utility classes change, regenerate its checked-in stylesheet:

```sh
bash tools/build-styles.sh
```

This optional maintenance step uses npm to fetch the pinned Tailwind CLI. It writes its dependency cache under the temporary directory and does not create application package files.

## Validate

See [tests/README.md](tests/README.md) for the browser smoke suite and its Playwright/Chromium prerequisites. The suite checks all 15 routes and interactions, collection navigation, history, rapid switching, keyboard controls, mobile navigation, reduced motion, and fallback behavior. Screenshots and reports are written outside the checkout.

The original implementation plan is in [ANIMATION_PLAN.md](ANIMATION_PLAN.md).
