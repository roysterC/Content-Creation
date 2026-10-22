#!/bin/bash
# Shared environment for every script in this repo. Source it:  source tools/env.sh
REPO="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
export REPO
# Headless Chromium for Remotion: prefer the pre-installed Playwright build, else Remotion's own download.
CHROME="$(ls -d /opt/pw-browsers/chromium_headless_shell-*/chrome-linux/headless_shell 2>/dev/null | sort -V | tail -1)"
[ -z "$CHROME" ] && CHROME="$(command -v chromium || command -v chromium-browser || command -v google-chrome || true)"
export CHROME
# 2 CPUs in the cloud workspace; more workers than cores fails
export RENDER_CONCURRENCY="${RENDER_CONCURRENCY:-$(nproc 2>/dev/null || echo 2)}"
