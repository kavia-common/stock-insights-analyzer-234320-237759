#!/usr/bin/env bash
set -euo pipefail
WS="/home/kavia/workspace/code-generation/stock-insights-analyzer-234320-237759/stock_analyzer_frontend"
cd "$WS"
LOG=$(mktemp /tmp/stock_build.XXXX)
# Run production build quietly but capture logs on failure
npm run build >"$LOG" 2>&1 || { echo "build failed; see $LOG" >&2; cat "$LOG" >&2 || true; rm -f "$LOG"; exit 5; }
[ -d build ] || { echo "build directory missing; see $LOG" >&2; cat "$LOG" >&2 || true; rm -f "$LOG"; exit 5; }
rm -f "$LOG"
echo "build OK"
