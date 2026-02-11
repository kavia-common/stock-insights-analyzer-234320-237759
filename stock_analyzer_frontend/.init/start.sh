#!/usr/bin/env bash
set -euo pipefail
WS="/home/kavia/workspace/code-generation/stock-insights-analyzer-234320-237759/stock_analyzer_frontend"
cd "$WS/build"
HOST="${HOST:-0.0.0.0}"
PORT="${PORT:-3000}"
LOG=$(mktemp /tmp/stock_start.XXXX)
# Choose server: prefer system 'serve'
if command -v serve >/dev/null 2>&1; then
  CMD=(serve -s . -l "$PORT")
  NETWORK_NOTE="no"
else
  CMD=(npx --yes serve -s . -l "$PORT")
  NETWORK_NOTE="may-download"
fi
# Start in new session, redirect logs
setsid "${CMD[@]}" >"$LOG" 2>&1 &
PID=$!
sleep 1
PGID=$(ps -o pgid= -p "$PID" | tr -d ' ' || true)
if [ -z "$PGID" ]; then
  echo "failed to determine PGID; see $LOG" >&2; cat "$LOG" >&2 || true; kill "$PID" >/dev/null 2>&1 || true; rm -f "$LOG"; exit 6
fi
# Record metadata
echo "$PID" > /tmp/stock_server_pid
echo "$PGID" > /tmp/stock_server_pgid
echo "$LOG" > /tmp/stock_server_log
echo "$NETWORK_NOTE" > /tmp/stock_server_network_note
# Output minimal status
echo "started pid=$PID pgid=$PGID log=$LOG network:${NETWORK_NOTE}"
