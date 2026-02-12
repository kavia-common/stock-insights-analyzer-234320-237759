#!/usr/bin/env bash
set -euo pipefail
WS="/home/kavia/workspace/code-generation/stock-generation/stock-insights-analyzer-234320-237759/stock_analyzer_frontend"
cd "$WS"
# Prefer local jest if present
if [ -x ./node_modules/.bin/jest ]; then
  ./node_modules/.bin/jest --runInBand
else
  # fall back to npx (non-interactive)
  npx --yes jest --runInBand
fi
