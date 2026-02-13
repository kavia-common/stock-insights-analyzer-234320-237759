#!/usr/bin/env bash
set -euo pipefail
WS="/home/kavia/workspace/code-generation/stock-insights-analyzer-234320-237759/stock_analyzer_frontend"
cd "$WS"
PM="$(cat .pm_choice 2>/dev/null || echo "npm")"
HOST=${HOST:-0.0.0.0}
PORT=${PORT:-3000}
LOG_BASE="/tmp/stock_frontend_$(basename "$WS")"
LOG_OUT="${LOG_BASE}_stdout.log"
LOG_ERR="${LOG_BASE}_stderr.log"
rm -f "$LOG_OUT" "$LOG_ERR"
# ensure start script exists
if command -v jq >/dev/null 2>&1 && ! jq -e '.scripts.start' package.json >/dev/null 2>&1; then
  echo "no start script found; cannot start dev server" >&2
  exit 23
fi
START_CMD=""
if [ "$PM" = "yarn" ]; then START_CMD="yarn start"; else START_CMD="npm run start"; fi
# start server in background, capture PID
env NODE_ENV=development BROWSER=none HOST="$HOST" PORT="$PORT" bash -lc "$START_CMD" >"$LOG_OUT" 2>"$LOG_ERR" &
PID=$!
if [ -z "$PID" ] || ! ps -p "$PID" >/dev/null 2>&1; then echo "failed to start server or capture PID" >&2; echo "See $LOG_OUT and $LOG_ERR" >&2; exit 24; fi
# derive PGID for group termination
PGID=$(ps -o pgid= -p "$PID" 2>/dev/null | tr -d ' ')
if [ -z "$PGID" ]; then echo "failed to determine PGID for PID $PID" >&2; fi
# persist PIDs for stop script
echo "$PID" >"${LOG_BASE}_pid" || true
echo "$PGID" >"${LOG_BASE}_pgid" || true
echo "$PID"
