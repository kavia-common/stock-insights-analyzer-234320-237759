#!/usr/bin/env bash
set -euo pipefail
WS="/home/kavia/workspace/code-generation/stock-generation/stock-insights-analyzer-234320-237759/stock_analyzer_frontend"
cd "$WS"
# run npm build and fail fast; redirect logs to temp file for diagnostics on error
LOG=$(mktemp /tmp/npm_build.XXXX)
npm run build >"$LOG" 2>&1 || { tail -n 200 "$LOG" >&2; rm -f "$LOG"; exit 5; }
rm -f "$LOG"
