#!/usr/bin/env bash
set -euo pipefail
WS="/home/kavia/workspace/code-generation/stock-generation/stock-insights-analyzer-234320-237759/stock_analyzer_frontend"
cd "$WS"
START_DEV=${START_DEV:-0}
PORT=${VALIDATION_PORT:-5173}
EVIDENCE_TMP=$(mktemp /tmp/validation_evidence.XXXX)
EVIDENCE_FINAL=/tmp/validation_evidence.txt
cleanup(){ [ -n "${PID:-}" ] && kill "${PID}" >/dev/null 2>&1 || true; }
trap cleanup EXIT
# detect vite outDir from package.json or vite.config
OUTDIR=$(node -e "try{const pj=require('./package.json'); if(pj.vite&&pj.vite.build&&pj.vite.build.outDir)console.log(pj.vite.build.outDir); else try{const cfg=require('./vite.config'); if(cfg && cfg.build && cfg.build.outDir)console.log(cfg.build.outDir)}catch(e){} }catch(e){}" 2>/dev/null || true)
OUTDIR=${OUTDIR:-dist}
if [ "$START_DEV" -eq 1 ]; then
  if [ -x ./node_modules/.bin/vite ]; then
    ./node_modules/.bin/vite --port "$PORT" --host 127.0.0.1 >"$(mktemp /tmp/vite_dev.XXXX)" 2>&1 & PID=$!
    sleep 1
    URL="http://127.0.0.1:${PORT}/index.html"
  else
    echo "vite not found locally" >&2; exit 2
  fi
else
  LOG=$(mktemp /tmp/npm_build.XXXX)
  npm run build >"$LOG" 2>&1 || { tail -n 200 "$LOG" >&2; rm -f "$LOG"; exit 5; }
  rm -f "$LOG"
  if [ ! -d "$OUTDIR" ]; then echo "build output directory '$OUTDIR' missing" >&2; exit 6; fi
  # ensure port is free (simple check)
  if ss -ltn | grep -q ":${PORT} "; then echo "port ${PORT} in use" >&2; exit 7; fi
  cd "$OUTDIR"
  python3 -m http.server "$PORT" --bind 127.0.0.1 >"$(mktemp /tmp/static_server.XXXX)" 2>&1 & PID=$!
  URL="http://127.0.0.1:${PORT}/index.html"
fi
# wait for server up to ~30s
for i in {1..60}; do
  sleep 0.5
  HTTP=$(curl -s -o /tmp/resp.html -w "%{http_code}" --max-time 2 "$URL" || echo "000")
  if [ "$HTTP" = "200" ]; then break; fi
done
HTTP=$(cat /tmp/resp.html >/dev/null 2>&1; echo ${HTTP:-000})
if [ "$HTTP" != "200" ]; then
  echo "Validation failed: HTTP $HTTP for $URL" >&2
  mv /tmp/resp.html "${EVIDENCE_TMP}.html" || true
  printf "HTTP_STATUS=%s\nSNIPPET_PATH=%s.html\n" "$HTTP" "${EVIDENCE_TMP}" > "$EVIDENCE_TMP"
  mv "$EVIDENCE_TMP" "$EVIDENCE_FINAL"
  exit 8
fi
# check expected H1 text
if ! grep -q "Stock Insights Analyzer - Frontend" /tmp/resp.html; then
  head -n 40 /tmp/resp.html > "${EVIDENCE_TMP}.snippet.html" || true
  printf "HTTP_STATUS=%s\nSNIPPET_PATH=%s.snippet.html\nURL=%s\n" "$HTTP" "${EVIDENCE_TMP}" "$URL" > "$EVIDENCE_TMP"
  mv "$EVIDENCE_TMP" "$EVIDENCE_FINAL"
  exit 9
fi
head -n 40 /tmp/resp.html > "${EVIDENCE_TMP}.snippet.html" || true
printf "HTTP_STATUS=%s\nSNIPPET_PATH=%s.snippet.html\nURL=%s\n" "$HTTP" "${EVIDENCE_TMP}" "$URL" > "$EVIDENCE_TMP"
mv "$EVIDENCE_TMP" "$EVIDENCE_FINAL"
echo "Validation passed; evidence saved to $EVIDENCE_FINAL"
