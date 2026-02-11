#!/usr/bin/env bash
set -euo pipefail
WS="/home/kavia/workspace/code-generation/stock-insights-analyzer-234320-237759/stock_analyzer_frontend"
cd "$WS"
HOST="${HOST:-0.0.0.0}"
PORT="${PORT:-3000}"
LOG=$(mktemp /tmp/stock_validate.XXXX)
# Build production bundle
npm run build >"$LOG" 2>&1 || { echo "build failed; see $LOG" >&2; cat "$LOG" >&2 || true; rm -f "$LOG" >&2 || exit 5; }
[ -d build ] || { echo "build directory missing; see $LOG" >&2; cat "$LOG" >&2 || true; rm -f "$LOG"; exit 5; }
cd build
# Choose server
if command -v serve >/dev/null 2>&1; then
  CMD=(serve -s . -l "$PORT")
  NETWORK_NOTE="no"
else
  CMD=(npx --yes serve -s . -l "$PORT")
  NETWORK_NOTE="may-download"
fi
# Start in new session, capture logs
setsid "${CMD[@]}" >"$LOG" 2>&1 &
PID=$!
sleep 1
PGID=$(ps -o pgid= -p "$PID" | tr -d ' ' || true)
if [ -z "$PGID" ]; then echo "failed to determine PGID; see $LOG" >&2; cat "$LOG" >&2 || true; kill "$PID" >/dev/null 2>&1 || true; rm -f "$LOG" >&2; exit 6; fi
# Save runtime metadata for stop script
echo "$PID" > /tmp/stock_server_pid
echo "$PGID" > /tmp/stock_server_pgid
echo "$LOG" > /tmp/stock_server_log
echo "$NETWORK_NOTE" > /tmp/stock_server_network_note
# Poll readiness (127.0.0.1 and HOST if HOST not 0.0.0.0)
ok=0; i=0; max=30
while [ $i -lt $max ]; do
  if curl -sSf "http://127.0.0.1:$PORT/" >/dev/null 2>&1 || ( [ "$HOST" != "0.0.0.0" ] && curl -sSf "http://$HOST:$PORT/" >/dev/null 2>&1 ); then ok=1; break; fi
  sleep 1; i=$((i+1))
done
if [ $ok -ne 1 ]; then
  echo "server did not start within timeout; see $LOG" >&2; cat "$LOG" >&2 || true
  kill -TERM -"$PGID" >/dev/null 2>&1 || true; sleep 1; kill -KILL -"$PGID" >/dev/null 2>&1 || true; rm -f "$LOG"; exit 6
fi
# Save evidence (short sample)
curl -sSf "http://127.0.0.1:$PORT/" | head -c 200 > /tmp/stock_analyzer_root.html || true
echo "validation OK (network:${NETWORK_NOTE}), sample=/tmp/stock_analyzer_root.html, log=$LOG"
# Tear down process group cleanly
kill -TERM -"$PGID" >/dev/null 2>&1 || true
sleep 1
kill -KILL -"$PGID" >/dev/null 2>&1 || true
wait "$PID" 2>/dev/null || true
rm -f "$LOG"
exit 0
