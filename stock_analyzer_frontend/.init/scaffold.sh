#!/usr/bin/env bash
set -euo pipefail
WORKSPACE="/home/kavia/workspace/code-generation/stock-insights-analyzer-234320-237759/stock_analyzer_frontend"
cd "$WORKSPACE"
[ -f package.json ] && { echo "package.json exists, skipping scaffold"; exit 0; }
# detect TS by existing tsconfig or env flag
TS_DETECT=0
if [ -f "$WORKSPACE/tsconfig.json" ] || [ "${SCAFFOLD_TS:-0}" = "1" ]; then TS_DETECT=1; fi
# write package.json with explicit deps (React 18 compatible)
cat > "$WORKSPACE/package.json" <<JSON
{
  "name": "stock_analyzer_frontend",
  "version": "0.1.0",
  "private": true,
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0"
  },
  "devDependencies": {
    "vite": "^5.0.0",
    "jest": "^29.0.0",
    "@testing-library/react": "^14.0.0",
    "@testing-library/jest-dom": "^6.0.0",
    "babel-jest": "^29.0.0",
    "@babel/preset-env": "^7.0.0",
    "@babel/preset-react": "^7.0.0",
    "serve": "^14.0.0"
  },
  "scripts": {
    "dev": "vite",
    "start": "vite",
    "build": "vite build",
    "serve": "serve -s dist -l $PORT",
    "test": "jest --config=jest.config.cjs --runInBand"
  }
}
JSON
# Add TS devDeps if requested (uses jq if available, falls back to simple append)
if [ "$TS_DETECT" -eq 1 ]; then
  if command -v jq >/dev/null 2>&1; then
    jq '.devDependencies += {"typescript":"^5.0.0","@types/react":"^18.0.0","@types/react-dom":"^18.0.0"}' "$WORKSPACE/package.json" > "$WORKSPACE/package.json.tmp" && mv "$WORKSPACE/package.json.tmp" "$WORKSPACE/package.json"
  else
    # simple insertion: read, modify, write
    python3 - <<PY > "$WORKSPACE/package.json.tmp"
import json
p=''''+open('$WORKSPACE/package.json').read()+'''\n'''
obj=json.loads(p)
obj.setdefault('devDependencies',{})
obj['devDependencies'].update({
  'typescript':'^5.0.0','@types/react':'^18.0.0','@types/react-dom':'^18.0.0'
})
print(json.dumps(obj, indent=2))
PY
    mv "$WORKSPACE/package.json.tmp" "$WORKSPACE/package.json"
  fi
fi
# minimal index.html and src entry (do not overwrite existing files)
mkdir -p "$WORKSPACE/src"
if [ ! -f "$WORKSPACE/index.html" ]; then
  cat > "$WORKSPACE/index.html" <<HTML
<!doctype html>
<html>
  <head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>Stock Analyzer</title></head>
  <body><div id="root"></div><script type="module" src="/src/main.${TS_DETECT:+tsx}${TS_DETECT:-jsx}"></script></body>
</html>
HTML
fi
ENTRY="$WORKSPACE/src/main.${TS_DETECT:+tsx}${TS_DETECT:-jsx}"
if [ ! -f "$ENTRY" ]; then
  if [ "$TS_DETECT" -eq 1 ]; then
    cat > "$ENTRY" <<'TS'
import React from 'react'
import { createRoot } from 'react-dom/client'
function App(){ return <div>Stock Analyzer UI</div> }
createRoot(document.getElementById('root')).render(<App />)
TS
  else
    cat > "$ENTRY" <<'JS'
import React from 'react'
import { createRoot } from 'react-dom/client'
function App(){ return React.createElement('div',null,'Stock Analyzer UI') }
createRoot(document.getElementById('root')).render(React.createElement(App))
JS
  fi
fi
# record package manager choice if not already recorded
[ -f .pm ] || (echo "PM=$(command -v yarn >/dev/null 2>&1 && echo yarn || echo npm)" > .pm)

# Finished scaffold
exit 0
