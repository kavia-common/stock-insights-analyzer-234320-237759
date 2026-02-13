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
# build if present (reuse build script behavior)
if command -v jq >/dev/null 2>&1 && jq -e '.scripts.build' package.json >/dev/null 2>&1; then
  if [ "$PM" = "yarn" ]; then yarn build 2>&1 | tee "${LOG_BASE}_build.log" || { echo "build failed; see ${LOG_BASE}_build.log" >&2; exit 21; }; else npm run build --if-present 2>&1 | tee "${LOG_BASE}_build.log" || { echo "build failed; see ${LOG_BASE}_build.log" >&2; exit 22; }; fi
fi
# ensure start script exists
if command -v jq >/dev/null 2>&1 && ! jq -e '.scripts.start' package.json >/dev/null 2>&1; then echo "no start script found; cannot validate dev server" >&2; exit 23; fi
# determine START_CMD
if [ "$PM" = "yarn" ]; then START_CMD="yarn start"; else START_CMD="npm run start"; fi
# start server in background, capture PID
env NODE_ENV=development BROWSER=none HOST="$HOST" PORT="$PORT" bash -lc "$START_CMD" >"$LOG_OUT" 2>"$LOG_ERR" &
PID=$!
if [ -z "$PID" ] || ! ps -p "$PID" >/dev/null 2>&1; then echo "failed to start server or capture PID" >&2; echo "See $LOG_OUT and $LOG_ERR" >&2; exit 24; fi
# derive PGID for group termination
PGID=$(ps -o pgid= -p "$PID" 2>/dev/null | tr -d ' ')
if [ -z "$PGID" ]; then echo "failed to determine PGID for PID $PID" >&2; fi
cleanup(){
  if [ -n "$PGID" ]; then kill -TERM -"$PGID" >/dev/null 2>&1 || kill -TERM "$PID" >/dev/null 2>&1 || true; sleep 2; kill -KILL -"$PGID" >/dev/null 2>&1 || true; fi
}
trap cleanup EXIT
# healthcheck: try HTTP (accept any 2xx/3xx), then fallback to tcp port listen
RETRIES=12
SLEEP=5
OK=1
for i in $(seq 1 $RETRIES); do
  sleep $SLEEP
  if command -v curl >/dev/null 2>&1; then
    CODE=$(curl -s -o /dev/null -w "%{http_code}" "http://127.0.0.1:${PORT}/" ) || CODE=000
    if [ "$CODE" -ge 200 ] && [ "$CODE" -lt 400 ]; then OK=0; break; fi
  fi
  # fallback: check listening TCP port
  if command -v ss >/dev/null 2>&1; then
    if ss -ltn "sport = :${PORT}" | grep -q LISTEN; then OK=0; break; fi
  elif command -v netstat >/dev/null 2>&1; then
    if netstat -ltn | awk '{print $4}' | grep -q ":${PORT}$"; then OK=0; break; fi
  fi
done
# output brief logs for operator
head -n 200 "$LOG_OUT" 2>/dev/null || true
head -n 200 "$LOG_ERR" 2>/dev/null || true
if [ $OK -ne 0 ]; then echo "validation failed: server did not become ready within timeout; see $LOG_ERR and $LOG_OUT" >&2; exit 25; fi
echo "validation succeeded: server responded on port ${PORT} (PID $PID)"
exit 0
