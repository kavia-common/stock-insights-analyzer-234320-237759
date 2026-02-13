import React from 'react';
import StockSearchPanel from '../components/search/StockSearchPanel.jsx';
import StockChartPanel from '../components/charts/StockChartPanel.jsx';
import NewsFeed from '../components/news/NewsFeed.jsx';

// PUBLIC_INTERFACE
export default function DashboardPage() {
  /** Dashboard page: search panel + chart + news in responsive grid. */
  return (
    <div className="grid dashboard" aria-label="Dashboard">
      <div className="grid">
        <StockChartPanel />
        <div className="card">
          <h2>Quick tips</h2>
          <ul className="small-muted">
            <li>Use the Search panel to filter stocks and change the selected symbol.</li>
            <li>Enable indicators to overlay SMA/EMA/RSI on the chart.</li>
            <li>Export the chart view with the Download button.</li>
          </ul>
        </div>
      </div>

      <div className="grid">
        <StockSearchPanel />
        <NewsFeed />
      </div>
    </div>
  );
}
