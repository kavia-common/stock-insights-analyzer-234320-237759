#!/usr/bin/env bash
set -euo pipefail
WS="/home/kavia/workspace/code-generation/stock-generation/stock-insights-analyzer-234320-237759/stock_analyzer_frontend"
cd "$WS"
PORT=${VALIDATION_PORT:-5173}
# Start dev server (Vite) if available; use local node_modules binary
if [ -x ./node_modules/.bin/vite ]; then
  ./node_modules/.bin/vite --port "$PORT" --host 127.0.0.1 >"$(mktemp /tmp/vite_dev.XXXX)" 2>&1 &
  echo $! > /tmp/stock_frontend_vite.pid
  sleep 1
  echo "vite started $!"
else
  echo "vite not found locally" >&2
  exit 2
fi
