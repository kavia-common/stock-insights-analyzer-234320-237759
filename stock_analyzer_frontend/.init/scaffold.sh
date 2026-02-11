#!/usr/bin/env bash
set -euo pipefail
WS="/home/kavia/workspace/code-generation/stock-insights-analyzer-234320-237759/stock_analyzer_frontend"
mkdir -p "$WS" && cd "$WS"
[ -f package.json ] && exit 0
cat > package.json <<'JSON'
{
  "name": "stock-analyzer-frontend",
  "version": "0.1.0",
  "private": true,
  "license": "MIT",
  "dependencies": {
    "react": "^18.0.0",
    "react-dom": "^18.0.0",
    "react-scripts": "^5.0.0"
  },
  "scripts": {
    "start": "react-scripts start",
    "build": "react-scripts build",
    "test": "react-scripts test --watchAll=false"
  }
}
JSON
mkdir -p src public
cat > public/index.html <<'HTML'
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <title>Stock Insights Analyzer (dev)</title>
  </head>
  <body>
    <noscript>You need to enable JavaScript to run this app.</noscript>
    <div id="root"></div>
  </body>
</html>
HTML
mkdir -p public && printf '' > public/favicon.ico
cat > src/index.js <<'JS'
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
const el = document.getElementById('root');
if (el) createRoot(el).render(React.createElement(App));
JS
cat > src/App.js <<'JS'
import React from 'react';
export default function App(){
  return React.createElement('div',{className:'App',style:{fontFamily:'sans-serif',padding:20}},
    React.createElement('h1',null,'Stock Insights Analyzer (dev)'),
    React.createElement('div',null,'Chart placeholder - install chart.js to render charts')
  );
}
JS
cat > .gitignore <<'GIT'
node_modules/
build/
.env.local
.env.development.local
GIT
cat > README.md <<'MD'
# Stock Insights Analyzer - Frontend
Minimal scaffold for local development.
MD
echo "HOST=0.0.0.0" > .env.development
echo "PORT=3000" >> .env.development
exit 0
