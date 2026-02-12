#!/usr/bin/env bash
set -euo pipefail
WS="/home/kavia/workspace/code-generation/stock-insights-analyzer-234320-237759/stock_analyzer_frontend"
cd "$WS"
# sanity
NODE_V=$(node -v 2>/dev/null || true)
NPM_V=$(npm -v 2>/dev/null || true)
[ -n "$NODE_V" ] || { echo "node not available" >&2; exit 2; }
[ -n "$NPM_V" ] || { echo "npm not available" >&2; exit 3; }
# env flags (defaults)
: "${INSTALL_RECHARTS:=0}"
: "${INSTALL_PLAYWRIGHT:=0}"
: "${PLAYWRIGHT_INSTALL_BROWSERS:=0}"
: "${USE_TYPESCRIPT:=0}"
# desired packages
PKGS=("@testing-library/react" "@testing-library/jest-dom")
DEV_PKGS=()
DEV_PKGS+=("jest")
[ "$INSTALL_RECHARTS" -eq 1 ] && PKGS+=("recharts")
[ "$USE_TYPESCRIPT" -eq 1 ] && (DEV_PKGS+=("typescript") && PKGS+=("@types/react" "@types/react-dom"))
if [ "$INSTALL_PLAYWRIGHT" -eq 1 ]; then DEV_PKGS+=("playwright"); fi
# detect need for babel (jsx/tsx files)
NEEDS_BABEL=0
if ls src/*.jsx src/*.tsx >/dev/null 2>&1; then NEEDS_BABEL=1; fi
if [ "$NEEDS_BABEL" -eq 1 ]; then DEV_PKGS+=("babel-jest" "@babel/core" "@babel/preset-react"); fi
# compute missing packages against package.json
to_install_pkgs=()
to_install_dev=()
for p in "${PKGS[@]}"; do
  node -e "try{const pj=require('./package.json');const deps=Object.assign({},pj.dependencies||{},pj.devDependencies||{});process.exit(deps['$p']?0:1)}catch(e){process.exit(2)}" >/dev/null 2>&1 || to_install_pkgs+=("$p")
done
for p in "${DEV_PKGS[@]}"; do
  node -e "try{const pj=require('./package.json');const deps=Object.assign({},pj.dependencies||{},pj.devDependencies||{});process.exit(deps['$p']?0:1)}catch(e){process.exit(2)}" >/dev/null 2>&1 || to_install_dev+=("$p")
done
# set PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD when playwright requested but browser install not requested
NPM_ENV_PREFIX=""
if [ "$INSTALL_PLAYWRIGHT" -eq 1 ] && [ "$PLAYWRIGHT_INSTALL_BROWSERS" -ne 1 ]; then
  NPM_ENV_PREFIX="PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1"
fi
# install runtime deps if any
if [ ${#to_install_pkgs[@]} -gt 0 ]; then
  LOG=$(mktemp /tmp/npm_pkgs_install.XXXX.log)
  eval "$NPM_ENV_PREFIX npm i --no-audit --no-progress ${to_install_pkgs[*]}" >"$LOG" 2>&1 || { tail -n 200 "$LOG" >&2; rm -f "$LOG"; exit 6; }
  rm -f "$LOG"
fi
# install dev deps if any
if [ ${#to_install_dev[@]} -gt 0 ]; then
  LOG=$(mktemp /tmp/npm_dev_install.XXXX.log)
  eval "$NPM_ENV_PREFIX npm i -D --no-audit --no-progress ${to_install_dev[*]}" >"$LOG" 2>&1 || { tail -n 200 "$LOG" >&2; rm -f "$LOG"; exit 7; }
  rm -f "$LOG"
fi
# ensure package.json test script uses local jest
node - <<'NODE'
const fs=require('fs');const p=require('./package.json');p.scripts=p.scripts||{};if(p.scripts.test && p.scripts.test.includes('jest') && !p.scripts.test.includes('node_modules/.bin/jest')){p.scripts.test='node_modules/.bin/jest --passWithNoTests'}else if(!p.scripts.test){p.scripts.test='node_modules/.bin/jest --passWithNoTests'}fs.writeFileSync('package.json',JSON.stringify(p,null,2));
NODE

# write jest.setup.js atomically if missing
if [ ! -f jest.setup.js ]; then tmp=$(mktemp) && cat > "$tmp" <<'EOF'
import '@testing-library/jest-dom'
EOF
  mv "$tmp" jest.setup.js
fi
# ensure package.json jest.setupFilesAfterEnv contains our setup file
node - <<'NODE'
const fs=require('fs');const p=require('./package.json');p.jest=p.jest||{};p.jest.setupFilesAfterEnv=p.jest.setupFilesAfterEnv||[];const v='<rootDir>/jest.setup.js';if(!p.jest.setupFilesAfterEnv.includes(v))p.jest.setupFilesAfterEnv.push(v);fs.writeFileSync('package.json',JSON.stringify(p,null,2));
NODE

# final validation: ensure jest binary exists (local) when jest added
if grep -q '"jest"' package.json 2>/dev/null; then
  if [ ! -x node_modules/.bin/jest ]; then
    echo "Local jest binary not found; ensure npm install succeeded" >&2
    exit 8
  fi
fi

exit 0
