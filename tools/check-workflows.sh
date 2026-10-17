#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
# Verified against the upstream v1.7.12 checksums asset.
cache_dir="${TMPDIR:-/tmp}/argon-actionlint-1.7.12"
mkdir -p "$cache_dir"
curl --fail --silent --show-error --location --retry 3 \
  https://github.com/rhysd/actionlint/releases/download/v1.7.12/actionlint_1.7.12_linux_amd64.tar.gz \
  --output "$cache_dir/actionlint.tar.gz"
echo "8aca8db96f1b94770f1b0d72b6dddcb1ebb8123cb3712530b08cc387b349a3d8  $cache_dir/actionlint.tar.gz" | sha256sum --check --status
tar -xzf "$cache_dir/actionlint.tar.gz" -C "$cache_dir" actionlint
"$cache_dir/actionlint" -shellcheck= -pyflakes=
