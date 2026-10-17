#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
npm exec --yes --cache "${TMPDIR:-/tmp}/argon-npm-cache" --package tailwindcss@3.4.17 -- tailwindcss --input tools/commonplace-tailwind.css --content './second_brain_five_landing_page_iterations.html' --output assets/vendor/tailwind/commonplace.css --minify
