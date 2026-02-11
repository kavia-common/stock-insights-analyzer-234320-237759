#!/usr/bin/env bash
set -euo pipefail
WS="/home/kavia/workspace/code-generation/stock-insights-analyzer-234320-237759/stock_analyzer_frontend"
cd "$WS"
LOG=$(mktemp /tmp/stock_test.XXXX)
# Run tests in CI mode to prevent watch prompts
npm test --silent -- --ci >"$LOG" 2>&1 || { echo "tests failed; see $LOG" >&2; cat "$LOG" >&2 || true; rm -f "$LOG"; exit 7; }
rm -f "$LOG"
echo "tests OK"
