#!/usr/bin/env bash
# QA-17B1-UI-07: baseline-vs-candidate functional regression matrix.
# Usage: bash scripts/regression-baseline-vs-candidate.sh <output-dir>
# Builds the baseline (exact SHA 9acf474e, detached worktree) and the
# candidate in production mode, serves each in turn, runs the data-driven
# regression spec (tests/ui-stage2-regression.spec.ts) against both, and
# diffs the two result JSONs into a matrix report. Does NOT deploy.
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BASELINE_ROOT="$REPO_ROOT/../baseline-9acf474e"
OUT_DIR="${1:-$REPO_ROOT/../phase17b1-ui/qa07-regression}"
mkdir -p "$OUT_DIR"
BASELINE_SHA="9acf474ee7278628a3dc32122b49d14906b6a643"
CANDIDATE_SHA="$(cd "$REPO_ROOT" && git rev-parse HEAD)"
TEST_ORIGIN="https://example.com"

# Baseline shares the candidate's node_modules (package.json/lock identical).
if [ ! -e "$BASELINE_ROOT/node_modules" ]; then
  ln -s "$REPO_ROOT/node_modules" "$BASELINE_ROOT/node_modules"
fi

serve() {
  local dir="$1" port="$2"
  (cd "$dir" && PUBLIC_BUILD_MODE=production PUBLIC_SITE_URL="$TEST_ORIGIN" npm run build > /tmp/regression-build-"$port".log 2>&1)
  (cd "$dir" && "$REPO_ROOT/node_modules/.bin/astro" preview --port "$port" --host 127.0.0.1 > /tmp/regression-preview-"$port".log 2>&1 &)
  for _ in $(seq 1 30); do
    curl -fsS "http://127.0.0.1:$port/" > /dev/null 2>&1 && break
    sleep 1
  done
  curl -fsS "http://127.0.0.1:$port/" > /dev/null
}

stop() {
  local port="$1"
  # Kill by the exact command line: $! inside the subshell above is the
  # subshell PID, not astro's, so killing it leaves astro orphaned.
  pkill -f "astro preview --port $port --host 127.0.0.1" 2>/dev/null || true
  sleep 1
}

trap 'stop 4324; stop 4321' EXIT

echo "--- baseline $BASELINE_SHA (port 4324) ---"
serve "$BASELINE_ROOT" 4324
cd "$REPO_ROOT"
PLAYWRIGHT_NO_WEBSERVER=1 PLAYWRIGHT_BASE_URL="http://127.0.0.1:4324" \
  REGRESSION_OUT="$OUT_DIR/baseline.json" REGRESSION_LABEL="baseline" REGRESSION_HEAD="$BASELINE_SHA" \
  npx playwright test tests/ui-stage2-regression.spec.ts --project=chromium --workers=1 > /tmp/regression-baseline-run.log 2>&1
echo "baseline run exit=$? (see /tmp/regression-baseline-run.log)"
stop 4324

echo "--- candidate $CANDIDATE_SHA (port 4321) ---"
serve "$REPO_ROOT" 4321
PLAYWRIGHT_NO_WEBSERVER=1 PLAYWRIGHT_BASE_URL="http://127.0.0.1:4321" \
  REGRESSION_OUT="$OUT_DIR/candidate.json" REGRESSION_LABEL="candidate" REGRESSION_HEAD="$CANDIDATE_SHA" \
  npx playwright test tests/ui-stage2-regression.spec.ts --project=chromium --workers=1 > /tmp/regression-candidate-run.log 2>&1
echo "candidate run exit=$? (see /tmp/regression-candidate-run.log)"
stop 4321

echo "--- compare ---"
node scripts/compare-regression.mjs "$OUT_DIR/baseline.json" "$OUT_DIR/candidate.json" "$OUT_DIR/matrix.md"
echo "matrix: $OUT_DIR/matrix.md"
