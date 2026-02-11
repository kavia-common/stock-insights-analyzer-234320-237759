#!/usr/bin/env bash
set -euo pipefail
WORKSPACE="/home/kavia/workspace/code-generation/stock-insights-analyzer-234320-237759/stock_analyzer_frontend"
cd "$WORKSPACE"
# recorded PM (defaults to npm) and ensure PATH prefers standard bins then local node_modules/.bin
PM="npm"
if [ -f "$WORKSPACE/.pm" ]; then PM=$(cut -d= -f2 "$WORKSPACE/.pm" 2>/dev/null || echo npm); fi
export PATH="/usr/local/bin:/usr/bin:/bin:$PATH"
# source persisted profile only when explicitly opted-in
if [ -f /etc/profile.d/stock_frontend_env.sh ] && [ "${ENV_PERSIST_GLOBAL:-0}" = "1" ]; then
  # shellcheck disable=SC1091
  source /etc/profile.d/stock_frontend_env.sh || true
fi
# prefer local project binaries
export PATH="$WORKSPACE/node_modules/.bin:$PATH"
# Lockfile-aware install
if [ "$PM" = "yarn" ]; then
  if [ -f yarn.lock ]; then
    yarn install --frozen-lockfile --silent
  else
    yarn install --silent
  fi
else
  if [ -f package-lock.json ]; then
    npm ci --no-audit --no-fund --silent
  else
    npm i --no-audit --no-fund --silent
  fi
fi
# verify local binaries (prefer node_modules/.bin) and print versions
VITE_BIN="$WORKSPACE/node_modules/.bin/vite"
JEST_BIN="$WORKSPACE/node_modules/.bin/jest"
if [ ! -x "$VITE_BIN" ] && ! command -v vite >/dev/null 2>&1; then echo "vite not available after install" >&2; exit 7; fi
if [ ! -x "$JEST_BIN" ] && ! command -v jest >/dev/null 2>&1; then echo "jest not available after install" >&2; exit 8; fi
echo "node: $(node -v)"
if [ "$PM" = "yarn" ]; then echo "yarn: $(yarn -v)"; else echo "npm: $(npm -v)"; fi
( command -v vite >/dev/null 2>&1 && echo "vite: $(vite --version 2>/dev/null || echo unknown)" ) || true
( command -v jest >/dev/null 2>&1 && echo "jest: $(jest --version 2>/dev/null || echo unknown)" ) || true
