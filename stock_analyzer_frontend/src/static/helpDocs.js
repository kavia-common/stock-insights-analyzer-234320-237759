export const HELP_DOCS = [
  {
    id: 'getting-started',
    title: 'Getting started',
    body:
      'Use the **Dashboard** to view charts and news. Use **Search & Filters** to change the selected stock. ' +
      'All data is **mock** and runs entirely in your browser.'
  },
  {
    id: 'charts',
    title: 'Charts: timeframe, indicators, export',
    body:
      '- Change **Timeframe** to zoom into different periods.\n' +
      '- Enable **SMA/EMA/RSI** to overlay indicators.\n' +
      '- Use **Download** to export the current chart view as PNG/JPG.'
  },
  {
    id: 'trendlines',
    title: 'Trendlines (mock)',
    body:
      'Open **Trend Analysis** to draw trendlines.\n\n' +
      '**Mouse/touch:** click twice to set endpoints.\n\n' +
      '**Keyboard:** press `D` to draw, `V` to view, `Delete` removes selected line, and arrow keys shift the line.'
  },
  {
    id: 'portfolio',
    title: 'Portfolio: simulate trades',
    body:
      'Portfolios are mock and stored in your browser using localStorage.\n\n' +
      '- Add holdings, then use **Execute** to simulate buy/sell.\n' +
      '- Errors such as **insufficient cash** are shown immediately.\n' +
      '- Allocation and performance charts update as you trade.'
  },
  {
    id: 'accessibility',
    title: 'Accessibility',
    body:
      'This app is designed for **WCAG 2.1 AA**: keyboard navigation, visible focus, semantic HTML, and labels. ' +
      'Use the **Skip to main content** link at the top of the page.'
  }
];
