#!/usr/bin/env bash
# HomeDIYCalc ADR-9 release-gate round (one of three consecutive clean rounds).
#
# Runs, from a clean state, the full check set for one round and appends a
# per-check summary to the log file. Any failing step fails the round
# (set -euo pipefail); a failed round does not count toward the three.
#
# Usage: bash scripts/gate-round.sh <round-number> <log-file>
#   e.g. bash scripts/gate-round.sh 1 docs/gate-logs/2026-11-22-review-response/round-1.log
#
# Steps: clean build (40 pages: 39 indexable + custom 404), Vitest,
# typecheck, lint (Prettier formatting check), scripted audit checks
# (scripts/gate-audit.py), Playwright e2e (desktop + mobile), Lighthouse
# 12.8.2 on Home and Paint (desktop preset) via the Playwright Chromium
# headless-shell binary (CHROME_PATH; Lighthouse ignores --chrome-path).
# Lighthouse is pinned to 12.8.2 so rounds stay comparable.
#
# Launch thresholds (enforced below — a score below its threshold fails
# the round, so a passing round is not just "Lighthouse ran"): Home and
# Paint each need Performance >= 90, Accessibility >= 90, Best
# Practices >= 90, SEO >= 80. SEO is capped at 83 until the site has an
# owner-approved domain (relative canonical + relative robots.txt
# sitemap URL), so its threshold has only 3 points of margin by design;
# Performance/Accessibility/Best Practices have run at 100 in every
# gate round so far. The thresholds are minimums, not targets.
#
# Requirements: node >= 22, npm, python3, npx (Lighthouse is fetched via
# npx on first use and then cached), and a Playwright Chromium install
# (`npx playwright install chromium`). The headless-shell binary is
# resolved in this order: $CHROME_PATH if set, otherwise the newest
# chromium_headless_shell-* under ~/.cache/ms-playwright. Override with
# CHROME_PATH=/path/to/chrome to use a different Chrome. No network
# access is needed by the site itself; only the one-time Lighthouse
# download uses the network.

set -euo pipefail

ROUND="${1:?round number required}"
LOG_FILE="${2:?log file required}"
REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$REPO_ROOT"

mkdir -p "$(dirname "$LOG_FILE")"
exec > >(tee -a "$LOG_FILE") 2>&1

echo "=== ADR-9 gate round $ROUND — $(date -u +%Y-%m-%dT%H:%M:%SZ) ==="
echo "repo: $REPO_ROOT"
echo "node: $(node --version)  npm: $(npm --version)  python: $(python3 --version)"

echo "--- clean build ---"
rm -rf dist/
npm run build

echo "--- Vitest ---"
npm run test

echo "--- typecheck ---"
npm run typecheck

echo "--- lint (Prettier formatting check) ---"
npm run lint

echo "--- scripted audit checks ---"
python3 scripts/gate-audit.py dist/

echo "--- Playwright e2e ---"
npm run test:e2e

echo "--- Lighthouse 12.8.2 (Home + Paint, desktop) ---"
# Resolve the headless-shell Chrome: $CHROME_PATH wins; otherwise the
# newest chromium_headless_shell-* under the Playwright cache (no
# hardcoded version — the cache directory name carries the revision).
if [ -n "${CHROME_PATH:-}" ]; then
  HEADLESS_SHELL="$CHROME_PATH"
else
  HEADLESS_SHELL="$(ls -d "$HOME"/.cache/ms-playwright/chromium_headless_shell-*/chrome-headless-shell-linux64/chrome-headless-shell 2>/dev/null | sort -V | tail -n 1 || true)"
fi
if [ -z "${HEADLESS_SHELL:-}" ] || [ ! -x "$HEADLESS_SHELL" ]; then
  echo "headless-shell Chrome not found — run: npx playwright install chromium"
  echo "(or set CHROME_PATH to a Chrome binary)"
  exit 1
fi
echo "chrome: $HEADLESS_SHELL"
PREVIEW_PORT="${PREVIEW_PORT:-4173}"
"$REPO_ROOT/node_modules/.bin/astro" preview --port "$PREVIEW_PORT" --host 127.0.0.1 > /tmp/homediycalc-preview-"$ROUND".log 2>&1 &
PREVIEW_PID=$!
trap 'kill $PREVIEW_PID 2>/dev/null || true' EXIT
for _ in $(seq 1 30); do
  curl -fsS "http://127.0.0.1:$PREVIEW_PORT/" > /dev/null 2>&1 && break
  sleep 1
done
curl -fsS "http://127.0.0.1:$PREVIEW_PORT/" > /dev/null
export CHROME_PATH="$HEADLESS_SHELL"
for PAGE in "" "calculators/paint-calculator/"; do
  NAME="home"
  [ -n "$PAGE" ] && NAME="paint"
  npx --yes lighthouse@12.8.2 "http://127.0.0.1:$PREVIEW_PORT/$PAGE" \
    --preset=desktop \
    --chrome-flags="--no-sandbox --disable-dev-shm-usage" \
    --output=json \
    --output-path="/tmp/homediycalc-lighthouse-$NAME-$ROUND.json" \
    --quiet
  node -e '
    const fs = require("fs");
    const r = JSON.parse(fs.readFileSync("/tmp/homediycalc-lighthouse-'"$NAME"'-'"$ROUND"'.json", "utf8"));
    const c = r.categories;
    const score = (k) => Math.round(c[k].score * 100);
    const lcp = r.audits["largest-contentful-paint"].displayValue;
    const cls = r.audits["cumulative-layout-shift"].displayValue;
    const tti = r.audits["interactive"].displayValue;
    console.log(`Lighthouse '"$NAME"': Performance ${score("performance")}, Accessibility ${score("accessibility")}, Best Practices ${score("best-practices")}, SEO ${score("seo")} (LCP ${lcp}, CLS ${cls}, TTI ${tti})`);
    // Launch thresholds (see the script header): fail the round on any
    // score below its floor, so a pass means the scores were checked,
    // not just produced.
    const thresholds = { performance: 90, accessibility: 90, "best-practices": 90, seo: 80 };
    const failures = Object.entries(thresholds).filter(([k, min]) => score(k) < min);
    if (failures.length > 0) {
      console.error(`Lighthouse '"$NAME"' below launch threshold: ` + failures.map(([k, min]) => `${k} ${score(k)} < ${min}`).join(", "));
      process.exit(1);
    }
  '
done
kill $PREVIEW_PID 2>/dev/null || true
trap - EXIT

echo "=== ADR-9 gate round $ROUND PASSED ==="
