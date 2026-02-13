#!/usr/bin/env bash
set -euo pipefail
WS="/home/kavia/workspace/code-generation/stock-insights-analyzer-234320-237759/stock_analyzer_frontend"
cd "$WS"
PM="$(cat .pm_choice 2>/dev/null || echo "npm")"
LOG_BASE="/tmp/stock_frontend_$(basename "$WS")"
rm -f "${LOG_BASE}_build.log"
# build if script exists
if command -v jq >/dev/null 2>&1 && jq -e '.scripts.build' package.json >/dev/null 2>&1; then
  if [ "$PM" = "yarn" ]; then
    yarn build 2>&1 | tee "${LOG_BASE}_build.log" || { echo "build failed; see ${LOG_BASE}_build.log" >&2; exit 21; }
  else
    npm run build --if-present 2>&1 | tee "${LOG_BASE}_build.log" || { echo "build failed; see ${LOG_BASE}_build.log" >&2; exit 22; }
  fi
else
  # no build script; nothing to do
  exit 0
fi
