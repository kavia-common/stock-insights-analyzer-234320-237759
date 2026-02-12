#!/usr/bin/env bash
set -euo pipefail
WS="/home/kavia/workspace/code-generation/stock-insights-analyzer-234320-237759/stock_analyzer_frontend"
mkdir -p "$WS" && cd "$WS"
# verify node/npm
command -v node >/dev/null 2>&1 || { echo "node not found" >&2; exit 2; }
command -v npm >/dev/null 2>&1 || { echo "npm not found" >&2; exit 3; }
# ensure package.json exists
[ -f package.json ] || npm init -y >/dev/null
# helper: check if dependency exists in dependencies or devDependencies
has_dep(){ node -e "try{const p=require('./package.json');const d=Object.assign({},p.dependencies||{},p.devDependencies||{});console.log(Boolean(d['$1']));}catch(e){console.log('false')}" 2>/dev/null; }
HAS_REACT=$(has_dep react || echo false)
HAS_VITE=$(has_dep vite || echo false)
# prepare lists
PKGS=()
DEV_PKGS=()
[ "$HAS_REACT" = "false" ] && PKGS+=(react react-dom)
[ "$HAS_VITE" = "false" ] && DEV_PKGS+=(vite)
# install production deps if any
if [ ${#PKGS[@]} -gt 0 ]; then
  LOG=$(mktemp /tmp/npm_pkgs.XXXX.log)
  npm i --no-audit --no-progress "${PKGS[@]}" >"$LOG" 2>&1 || { tail -n 200 "$LOG" >&2; rm -f "$LOG"; exit 4; }
  rm -f "$LOG"
fi
# install dev deps if any
if [ ${#DEV_PKGS[@]} -gt 0 ]; then
  LOG=$(mktemp /tmp/npm_devpkgs.XXXX.log)
  npm i -D --no-audit --no-progress "${DEV_PKGS[@]}" >"$LOG" 2>&1 || { tail -n 200 "$LOG" >&2; rm -f "$LOG"; exit 5; }
  rm -f "$LOG"
fi
# merge scripts into package.json without overwriting existing ones
node - <<'NODE'
const fs=require('fs');const p=require('./package.json');p.scripts=p.scripts||{};const defaults={start:'vite',build:'vite build',test:'jest --passWithNoTests'};for(const k of Object.keys(defaults)){if(!p.scripts[k])p.scripts[k]=defaults[k]}fs.writeFileSync('package.json',JSON.stringify(p,null,2));
NODE
# create minimal app files if missing
mkdir -p src
[ -f src/main.jsx ] || cat > src/main.jsx <<'EOF'
import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
createRoot(document.getElementById('root')).render(<App />)
EOF
[ -f src/App.jsx ] || cat > src/App.jsx <<'EOF'
import React from 'react'
export default function App(){return (<div><h1>Stock Insights Analyzer - Frontend</h1></div>)}
EOF
[ -f index.html ] || cat > index.html <<'EOF'
<!doctype html>
<html>
  <head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"></head>
  <body><div id="root"></div><script type="module" src="/src/main.jsx"></script></body>
</html>
EOF
