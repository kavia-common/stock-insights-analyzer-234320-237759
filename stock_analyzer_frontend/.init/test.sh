#!/usr/bin/env bash
set -euo pipefail
WS="/home/kavia/workspace/code-generation/stock-insights-analyzer-234320-237759/stock_analyzer_frontend"
cd "$WS"
PM="$(cat .pm_choice 2>/dev/null || echo "npm")"
LOG_BASE="/tmp/stock_frontend_$(basename "$WS")"
LOG_TEST="${LOG_BASE}_test.log"
rm -f "$LOG_TEST"
# run tests non-interactively
if [ "$PM" = "yarn" ]; then yarn test --silent --watchAll=false >"$LOG_TEST" 2>&1 || { echo "tests failed; see $LOG_TEST" >&2; exit 31; }; else npm test -- --watchAll=false >"$LOG_TEST" 2>&1 || { echo "tests failed; see $LOG_TEST" >&2; exit 32; }; fi
exit 0
