#!/usr/bin/env bash
set -euo pipefail
# Deterministic dependency installer for workspace provided by container context
WS="/home/kavia/workspace/code-generation/stock-generation/stock-insights-analyzer-234320-237759/stock_analyzer_frontend"
cd "$WS"
[ -f package.json ] || { echo "package.json missing; run scaffold first" >&2; exit 3; }
LOG=$(mktemp /tmp/stock_deps.XXXX)
PM="npm"
if [ -f yarn.lock ]; then PM="yarn"; elif [ -f package-lock.json ]; then PM="npm"; fi
# Detect TypeScript intent
is_ts_project=0
[ -f tsconfig.json ] && is_ts_project=1 || true
if [ "$is_ts_project" -eq 0 ]; then
  has_ts=$(node -e "const j=require('./package.json'); console.log((j.devDependencies&&j.devDependencies.typescript)|| (j.dependencies&&j.dependencies.typescript)?1:0);")
  [ "$has_ts" = "1" ] && is_ts_project=1 || true
fi
# Use lockfile if present for reproducible install
if [ "$PM" = "yarn" ] && [ -f yarn.lock ]; then
  yarn install --silent --non-interactive >"$LOG" 2>&1 || { cat "$LOG" >&2; rm -f "$LOG"; exit 4; }
elif [ "$PM" = "npm" ] && [ -f package-lock.json ]; then
  npm ci --no-audit --no-fund --quiet >"$LOG" 2>&1 || { cat "$LOG" >&2; rm -f "$LOG"; exit 4; }
else
  # No lockfile: ensure core deps present in package.json; install missing ones
  need_install=()
  core=(react react-dom react-scripts)
  for pkg in "${core[@]}"; do
    present=$(node -e "const j=require('./package.json'); const has=(j.dependencies&&j.dependencies['$pkg'])||(j.devDependencies&&j.devDependencies['$pkg']); console.log(has?1:0);")
    [ "$present" != "1" ] && need_install+=("$pkg") || true
  done
  # Typescript: only install locally if project indicates TS and no system tsc present
  if [ "$is_ts_project" -eq 1 ]; then
    if command -v tsc >/dev/null 2>&1; then
      : # system tsc available; skip local typescript install
    else
      need_install+=("typescript" "@types/react" "@types/react-dom")
    fi
  fi
  if [ ${#need_install[@]} -gt 0 ]; then
    if [ "$PM" = "yarn" ]; then
      yarn add --silent --non-interactive "${need_install[@]}" >"$LOG" 2>&1 || { cat "$LOG" >&2; rm -f "$LOG"; exit 4; }
    else
      npm i --no-audit --no-fund --quiet "${need_install[@]}" >"$LOG" 2>&1 || { cat "$LOG" >&2; rm -f "$LOG"; exit 4; }
    fi
  else
    rm -f "$LOG"
  fi
fi
# Ensure common scripts exist in package.json
node -e "const fs=require('fs');const p='package.json';const j=JSON.parse(fs.readFileSync(p));j.scripts=j.scripts||{}; if(!j.scripts.start) j.scripts.start='react-scripts start'; if(!j.scripts.build) j.scripts.build='react-scripts build'; if(!j.scripts.test) j.scripts.test='react-scripts test --watchAll=false'; fs.writeFileSync(p,JSON.stringify(j,null,2));"
exit 0
