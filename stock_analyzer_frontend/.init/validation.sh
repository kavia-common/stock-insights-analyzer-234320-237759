#!/usr/bin/env bash
set -euo pipefail
# Build, serve, smoke-test and clean shutdown for Vite app
WORKSPACE="/home/kavia/workspace/code-generation/stock-insights-analyzer-234320-237759/stock_analyzer_frontend"
cd "$WORKSPACE"
# source project env first
if [ -f "$WORKSPACE/.env.development" ]; then set -a; source "$WORKSPACE/.env.development"; set +a; fi
# fallback to global profile only if explicitly persisted
if [ "${ENV_PERSIST_GLOBAL:-0}" = "1" ] && [ -f /etc/profile.d/stock_frontend_env.sh ]; then
  # shellcheck disable=SC1091
  source /etc/profile.d/stock_frontend_env.sh || true
fi
PORT=${PORT:-3000}
TMP_LOG=/tmp/stock_frontend_serve.log
TMP_HTML=/tmp/stock_frontend_smoke.html
cleanup() {
  if [ -n "${SERVE_PGID:-}" ]; then
    kill -TERM -"${SERVE_PGID}" 2>/dev/null || true
    sleep 1
    kill -KILL -"${SERVE_PGID}" 2>/dev/null || true
  fi
  rm -f "$TMP_LOG" "$TMP_HTML" || true
}
trap cleanup EXIT
# find vite (prefer project local)
VITE_BIN="$WORKSPACE/node_modules/.bin/vite"
if [ ! -x "$VITE_BIN" ]; then
  if command -v vite >/dev/null 2>&1; then
    VITE_BIN=$(command -v vite)
  else
    echo "vite not found" >&2
    exit 8
  fi
fi
# build
"$VITE_BIN" build >"$TMP_LOG" 2>&1 || (echo "vite build failed" >&2; echo "--- build log (tail) ---" >&2; tail -n 200 "$TMP_LOG" >&2; exit 9)
# find serve binary (prefer project local 'serve' if installed)
SERVE_BIN="$WORKSPACE/node_modules/.bin/serve"
if [ ! -x "$SERVE_BIN" ]; then
  if command -v serve >/dev/null 2>&1; then
    SERVE_BIN=$(command -v serve)
  else
    SERVE_BIN=""
  fi
fi
# start server: prefer serve, fallback to tiny node static server
if [ -n "${SERVE_BIN:-}" ]; then
  set -m
  ( setsid "$SERVE_BIN" -s dist -l "tcp://0.0.0.0:$PORT" >"$TMP_LOG" 2>&1 ) &
  sleep 0.2
  SERVE_PGID=$(ps -o pgid= -p $! | tr -d ' ')
else
  # fallback: tiny node static server (no extra deps)
  node -e "const http=require('http'),fs=require('fs'),p=require('path');const dir='dist';const server=http.createServer((req,res)=>{let f=p.join(dir,req.url==='/'?'/index.html':req.url);fs.readFile(f,(e,d)=>{if(e){res.statusCode=404;res.end('not found');return}res.end(d)})}).listen($PORT, '0.0.0.0');" >"$TMP_LOG" 2>&1 &
  SERVE_PGID=$(ps -o pgid= -p $! | tr -d ' ')
fi
# ensure curl available
if ! command -v curl >/dev/null 2>&1; then
  echo "curl required for validation but not found" >&2
  echo "--- serve log (tail) ---" >&2; tail -n 200 "$TMP_LOG" >&2 || true
  exit 10
fi
# wait for readiness
MAX=60
i=0
until curl -sSf "http://localhost:$PORT/" >"$TMP_HTML" 2>/dev/null || [ $i -ge $MAX ]; do sleep 1; i=$((i+1)); done
if [ $i -ge $MAX ]; then
  echo "server did not become ready in ${MAX}s" >&2
  echo "--- serve log (tail) ---" >&2; tail -n 200 "$TMP_LOG" >&2
  exit 11
fi
# output sample of returned HTML
head -n 40 "$TMP_HTML" || true
echo "validation completed"
# cleanup via trap
