#!/usr/bin/env bash
set -euo pipefail
WS="/home/kavia/workspace/code-generation/stock-insights-analyzer-234320-237759/stock_analyzer_frontend"
cd "$WS"
# ensure package.json exists
if [ ! -f package.json ]; then echo "package.json not found in workspace ($WS). Run scaffold or add package.json before installing dependencies." >&2; exit 9; fi
# choose package manager: lockfile precedence, then yarn binary, else npm
PM=""
if [ -f yarn.lock ]; then PM="yarn";
elif [ -f package-lock.json ]; then PM="npm";
elif command -v yarn >/dev/null 2>&1; then PM="yarn";
else PM="npm"; fi
# persist choice
echo "$PM" > .pm_choice
# detect yarn major version and fail on berry (v2+)
if [ "$PM" = "yarn" ]; then
  YV=$(yarn -v 2>/dev/null || echo "0")
  # attempt to parse major
  if [[ "$YV" =~ ^([0-9]+) ]]; then YMAJOR=${BASH_REMATCH[1]}; else echo "cannot parse yarn version: $YV" >&2; YMAJOR=0; fi
  if [ "$YMAJOR" -ge 2 ]; then
    echo "Detected Yarn v2+ (berry) version $YV. This plan expects Yarn classic (v1) or npm. Recommended remediation: install yarn classic (e.g., 'npm i -g yarn@1') or switch to npm. Aborting." >&2
    exit 10
  fi
fi
LOG_BASE="/tmp/stock_frontend_$(basename "$WS")"
mkdir -p "$(dirname "$LOG_BASE")"
# Ensure jq is available (script relies on jq)
if ! command -v jq >/dev/null 2>&1; then
  sudo apt-get update -qq && sudo apt-get install -y -qq jq >/dev/null 2>&1 || { echo "Failed to install jq; please install jq." >&2; exit 20; }
fi
# ensure react/react-dom exist in package.json
HAS_REACT=$(jq -r '(.dependencies.react // .devDependencies.react) // empty' package.json || true)
if [ -z "$HAS_REACT" ]; then
  if [ "$PM" = "yarn" ]; then
    yarn add react react-dom 2>&1 | tee "${LOG_BASE}_deps.log" || { echo "yarn add react failed; see ${LOG_BASE}_deps.log" >&2; exit 11; }
  else
    npm i react react-dom --save --no-audit --no-fund 2>&1 | tee "${LOG_BASE}_deps.log" || { echo "npm install react failed; see ${LOG_BASE}_deps.log" >&2; exit 12; }
  fi
fi
# detect TypeScript usage (tsconfig or .ts/.tsx files)
if [ -f tsconfig.json ] || ls src/*.ts src/*.tsx >/dev/null 2>&1; then
  HAS_TS=$(jq -r '(.devDependencies.typescript // .dependencies.typescript) // empty' package.json || true)
  if [ -z "$HAS_TS" ]; then
    if [ "$PM" = "yarn" ]; then
      yarn add -D typescript @types/react @types/react-dom 2>&1 | tee -a "${LOG_BASE}_deps.log" || { echo "yarn add typescript failed; see ${LOG_BASE}_deps.log" >&2; exit 13; }
    else
      npm i typescript @types/react @types/react-dom --save-dev --no-audit --no-fund 2>&1 | tee -a "${LOG_BASE}_deps.log" || { echo "npm install typescript failed; see ${LOG_BASE}_deps.log" >&2; exit 14; }
    fi
  fi
fi
# install all deps, prefer npm ci when package-lock.json exists
if [ "$PM" = "yarn" ]; then
  yarn install 2>&1 | tee "${LOG_BASE}_install.log" || { echo "yarn install failed; see ${LOG_BASE}_install.log" >&2; exit 15; }
else
  if [ -f package-lock.json ]; then
    npm ci --no-audit --no-fund 2>&1 | tee "${LOG_BASE}_install.log" || { echo "npm ci failed; see ${LOG_BASE}_install.log" >&2; exit 16; }
  else
    npm i --no-audit --no-fund 2>&1 | tee "${LOG_BASE}_install.log" || { echo "npm install failed; see ${LOG_BASE}_install.log" >&2; exit 17; }
  fi
fi
# verify start/build scripts or react-scripts presence and warn if missing
HAS_START=$(jq -r '.scripts.start // empty' package.json || true)
HAS_BUILD=$(jq -r '.scripts.build // empty' package.json || true)
HAS_REACT_SCRIPTS=$(jq -r '(.dependencies["react-scripts"] // .devDependencies["react-scripts"]) // empty' package.json || true)
if [ -z "$HAS_START" ] && [ -z "$HAS_REACT_SCRIPTS" ]; then
  echo "Warning: No start script or react-scripts detected. For CRA projects add react-scripts (e.g., '$PM add react-scripts@latest' or update package.json scripts)." >&2
fi
# final output
echo "PM=$PM"
