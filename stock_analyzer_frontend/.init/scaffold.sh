#!/usr/bin/env bash
set -euo pipefail
WS="/home/kavia/workspace/code-generation/stock-insights-analyzer-234320-237759/stock_analyzer_frontend"
cd "$WS"
# If package.json exists, skip
if [ -f package.json ]; then echo "package.json exists; skipping scaffold"; exit 0; fi
# Ensure workspace is empty except optional .git
if [ -n "$(find "$WS" -mindepth 1 -maxdepth 1 -not -name '.git' -print -quit 2>/dev/null)" ]; then
  echo "Workspace not empty and no package.json; will not scaffold to avoid overwrite. Add package.json or clean workspace." >&2
  exit 5
fi
# Prefer global create-react-app if available
if command -v create-react-app >/dev/null 2>&1; then
  create-react-app . --silent || { echo "create-react-app failed" >&2; exit 6; }
else
  # npx fallback (non-interactive)
  if command -v npx >/dev/null 2>&1; then
    npx --yes create-react-app@latest . --silent || { echo "npx create-react-app failed" >&2; exit 7; }
  else
    echo "npx not available; cannot scaffold create-react-app" >&2
    exit 9
  fi
fi
# Ensure essential npm scripts exist (idempotent). Require jq.
if ! command -v jq >/dev/null 2>&1; then
  echo "jq not found; installing jq non-interactively via apt-get" >&2
  sudo apt-get update -q && sudo apt-get install -y -qq jq || { echo "failed to install jq" >&2; exit 10; }
fi
if [ -f package.json ]; then
  TMP=$(mktemp) && jq '(.scripts //= {}) | (.scripts.start //= "react-scripts start") | (.scripts.build //= "react-scripts build") | (.scripts.test //= "react-scripts test --watchAll=false")' package.json > "$TMP" && mv "$TMP" package.json || { echo "failed to ensure package.json scripts" >&2; exit 8; }
fi
exit 0
