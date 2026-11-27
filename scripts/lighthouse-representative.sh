#!/usr/bin/env bash
# QA-17B1-UI-06: Lighthouse on representative calculators across the
# remaining categories (Concrete, Gravel, Tile, Cubic Feet, Stair).
# Home + Paint are already covered by the ADR-9 gate (gate-round.sh).
# Usage: bash scripts/lighthouse-representative.sh <output-dir>
# Builds production mode, serves it locally, runs Lighthouse 12.8.2
# (desktop preset) on the 5 pages, saves one JSON report per page plus a
# summary table. Exits non-zero if any page scores below the launch
# thresholds (performance 90, accessibility 90, best-practices 90, SEO 80)
# or if Lighthouse itself fails. Does NOT deploy anything.
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
OUT_DIR="${1:-$REPO_ROOT/docs/lighthouse-representative}"
mkdir -p "$OUT_DIR"
TEST_ORIGIN="https://example.com"
PREVIEW_PORT="${PREVIEW_PORT:-4174}"

cd "$REPO_ROOT"

echo "--- production-mode build ---"
export PUBLIC_BUILD_MODE="production"
export PUBLIC_SITE_URL="$TEST_ORIGIN"
unset PUBLIC_PREVIEW CF_PAGES CF_PAGES_BRANCH PUBLIC_PRODUCTION_BRANCH || true
rm -rf dist/
npm run build

# Resolve the headless-shell Chrome (same logic as gate-round.sh).
if [ -n "${CHROME_PATH:-}" ]; then
  HEADLESS_SHELL="$CHROME_PATH"
else
  HEADLESS_SHELL="$(ls -d "$HOME"/.cache/ms-playwright/chromium_headless_shell-*/chrome-headless-shell-linux64/chrome-headless-shell 2>/dev/null | sort -V | tail -n 1 || true)"
fi
if [ -z "${HEADLESS_SHELL:-}" ] || [ ! -x "$HEADLESS_SHELL" ]; then
  echo "headless-shell Chrome not found — run: npx playwright install chromium"
  exit 1
fi
echo "chrome: $HEADLESS_SHELL"
echo "head SHA: $(git rev-parse HEAD)"
echo "chromium: $($HEADLESS_SHELL --version 2>/dev/null || echo unknown)"

"$REPO_ROOT/node_modules/.bin/astro" preview --port "$PREVIEW_PORT" --host 127.0.0.1 > /tmp/homediycalc-preview-representative.log 2>&1 &
PREVIEW_PID=$!
trap 'kill $PREVIEW_PID 2>/dev/null || true' EXIT
for _ in $(seq 1 30); do
  curl -fsS "http://127.0.0.1:$PREVIEW_PORT/" > /dev/null 2>&1 && break
  sleep 1
done
curl -fsS "http://127.0.0.1:$PREVIEW_PORT/" > /dev/null
export CHROME_PATH="$HEADLESS_SHELL"

SUMMARY="$OUT_DIR/summary.txt"
{
  echo "Lighthouse 12.8.2 — representative calculators (desktop preset)"
  echo "HEAD: $(git rev-parse HEAD)"
  echo "Tree: $(git rev-parse HEAD^{tree})"
  echo "Chrome: $($HEADLESS_SHELL --version 2>/dev/null || echo unknown)"
  echo "Origin: $TEST_ORIGIN (production-mode build, local preview on 127.0.0.1:$PREVIEW_PORT)"
  echo ""
  printf "%-28s %12s %12s %14s %6s\n" "page" "performance" "accessibility" "best-practices" "seo"
} > "$SUMMARY"

FAIL=0
for SPEC in "concrete:calculators/concrete-calculator/" "gravel:calculators/gravel-calculator/" "tile:calculators/tile-calculator/" "cubic-feet:calculators/cubic-feet-calculator/" "stair:calculators/stair-calculator/"; do
  NAME="${SPEC%%:*}"
  PAGE="${SPEC#*:}"
  echo "--- Lighthouse: $NAME ($PAGE) ---"
  npx --yes lighthouse@12.8.2 "http://127.0.0.1:$PREVIEW_PORT/$PAGE" \
    --preset=desktop \
    --chrome-flags="--no-sandbox --disable-dev-shm-usage" \
    --output=json \
    --output-path="$OUT_DIR/lighthouse-$NAME.json" \
    --quiet
  node -e '
    const fs = require("fs");
    const r = JSON.parse(fs.readFileSync(process.argv[1], "utf8"));
    const c = r.categories;
    const score = (k) => Math.round(c[k].score * 100);
    const line = `${process.argv[2].padEnd(28)} ${String(score("performance")).padStart(12)} ${String(score("accessibility")).padStart(12)} ${String(score("best-practices")).padStart(14)} ${String(score("seo")).padStart(6)}`;
    fs.appendFileSync(process.argv[3], line + "\n");
    console.log(`Lighthouse ${process.argv[2]}: Performance ${score("performance")}, Accessibility ${score("accessibility")}, Best Practices ${score("best-practices")}, SEO ${score("seo")} (LCP ${r.audits["largest-contentful-paint"].displayValue}, CLS ${r.audits["cumulative-layout-shift"].displayValue}, TTI ${r.audits["interactive"].displayValue})`);
    const thresholds = { performance: 90, accessibility: 90, "best-practices": 90, seo: 80 };
    const failures = Object.entries(thresholds).filter(([k, min]) => score(k) < min);
    if (failures.length > 0) {
      console.error(`Lighthouse ${process.argv[2]} below launch threshold: ` + failures.map(([k, min]) => `${k} ${score(k)} < ${min}`).join(", "));
      process.exit(1);
    }
  ' "$OUT_DIR/lighthouse-$NAME.json" "$NAME" "$SUMMARY" || FAIL=1
done

kill $PREVIEW_PID 2>/dev/null || true
trap - EXIT

echo ""
cat "$SUMMARY"
if [ "$FAIL" -ne 0 ]; then
  echo "RESULT: one or more representative pages below launch thresholds (see above)"
  exit 1
fi
echo "RESULT: all 5 representative pages meet launch thresholds"
