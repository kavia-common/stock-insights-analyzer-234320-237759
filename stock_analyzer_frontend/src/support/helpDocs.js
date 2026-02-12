export const HELP_DOCS = [
  {
    id: "getting-started",
    category: "Getting Started",
    title: "Welcome to Stock Insights Analyzer",
    body: `
**Stock Insights Analyzer** is a client-side dashboard that demonstrates stock analysis workflows using **mock data**.

## Main areas
- **Charts**: visualize a selected stock and overlay technical indicators.
- **Search & Filter**: find stocks by symbol/name, filter by sector and ranges.
- **Trend Analysis**: view simplified trend insights and manage demo trendlines.
- **Portfolio**: create mock portfolios and simulate trades.
- **News**: read contextual headlines filtered for your current stock or portfolio.

> Note: Data resets as described in each panel. Portfolios persist in localStorage for convenience.
`
  },
  {
    id: "charts",
    category: "Charts",
    title: "Charts, Timeframes & Export",
    body: `
## Chart types
- Line
- Bar
- Candlestick (mock)

## Timeframes
Choose **1D / 1W / 1M / 1Y / All** to change the date range shown.

## Export
Use **Export** to download the chart as **PNG** or **JPG**. The export captures only the chart area.
`
  },
  {
    id: "indicators",
    category: "Charts",
    title: "Technical Indicators (SMA / EMA / RSI)",
    body: `
Indicators are calculated client-side from the mock close-price series:

- **SMA** (Simple Moving Average)
- **EMA** (Exponential Moving Average)
- **RSI** (Relative Strength Index)

You can enable multiple indicators simultaneously and adjust periods in the Charts panel.
`
  },
  {
    id: "portfolio",
    category: "Portfolio",
    title: "Mock Portfolio & Trade Simulation",
    body: `
## Portfolio actions
- Create, rename, delete portfolios
- Add holdings by symbol
- Simulate **Buy / Sell** trades
- View allocation and performance charts (mock)

## Validation
Trades are validated:
- Cannot buy beyond cash balance
- Cannot sell more shares than owned
`
  },
  {
    id: "news",
    category: "News",
    title: "Contextual News Feed",
    body: `
The news feed filters by:
- selected **stock**
- selected **portfolio**
- general **market** (fallback)

You can additionally filter by **source** and sort by **recent**, **relevant**, or **source**.
All links open in a new tab.
`
  }
];
