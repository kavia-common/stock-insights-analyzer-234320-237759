#!/usr/bin/env bash
set -euo pipefail
WORKSPACE="/home/kavia/workspace/code-generation/stock-insights-analyzer-234320-237759/stock_analyzer_frontend"
cd "$WORKSPACE"
[ -f package.json ] || { echo "package.json missing; run scaffold first" >&2; exit 6; }
# idempotent configs
[ -f "$WORKSPACE/jest.config.cjs" ] || cat > "$WORKSPACE/jest.config.cjs" <<'JCFG'
module.exports = { testEnvironment: 'jsdom', transform: { '^.+\\.jsx?$': ['babel-jest', { presets: ['@babel/preset-env','@babel/preset-react'] }] } }
JCFG
[ -f "$WORKSPACE/.babelrc" ] || cat > "$WORKSPACE/.babelrc" <<'BRC'
{ "presets": ["@babel/preset-env","@babel/preset-react"] }
BRC
# minimal test
mkdir -p "$WORKSPACE/src/__tests__"
[ -f "$WORKSPACE/src/__tests__/App.test.jsx" ] || cat > "$WORKSPACE/src/__tests__/App.test.jsx" <<'TST'
import React from 'react'
import { render } from '@testing-library/react'
import '@testing-library/jest-dom'
function App(){ return React.createElement('div', null, 'Stock Analyzer UI') }
test('renders text', () => {
  const { getByText } = render(React.createElement(App))
  expect(getByText('Stock Analyzer UI')).toBeInTheDocument()
})
TST
# ensure devDeps: jest, babel-jest, @babel/preset-env, @babel/preset-react, @testing-library/react, @testing-library/jest-dom
NEEDED_DEPS=("jest" "babel-jest" "@babel/preset-env" "@babel/preset-react" "@testing-library/react" "@testing-library/jest-dom")
MISSING=()
for pkg in "${NEEDED_DEPS[@]}"; do
  if ! grep -q "\"$pkg\"" package.json && ! jq -e ".devDependencies | has(\"$pkg\") or .dependencies | has(\"$pkg\")" package.json >/dev/null 2>&1; then
    MISSING+=("$pkg")
  fi
done
# choose package manager: prefer npm if package-lock.json present, otherwise yarn if yarn.lock present, else npm
PM="npm"
if [ -f package-lock.json ]; then PM="npm"; elif [ -f yarn.lock ]; then PM="yarn"; else PM="npm"; fi
if [ ${#MISSING[@]} -gt 0 ]; then
  if [ "$PM" = "npm" ]; then
    npm i -D --no-audit --no-fund "${MISSING[@]}" >/dev/null
  else
    yarn add --dev "${MISSING[@]}" --silent >/dev/null
  fi
fi
# run local jest if present
JEST_BIN="$WORKSPACE/node_modules/.bin/jest"
if [ -x "$JEST_BIN" ]; then
  "$JEST_BIN" --config=jest.config.cjs --runInBand
else
  if command -v jest >/dev/null 2>&1; then
    jest --config=jest.config.cjs --runInBand
  else
    echo "jest binary not found after attempted install" >&2
    exit 7
  fi
fi
