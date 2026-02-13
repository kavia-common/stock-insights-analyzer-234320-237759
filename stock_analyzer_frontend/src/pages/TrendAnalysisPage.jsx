import React, { useMemo, useState } from 'react';
import { generateSeries } from '../mock/stocks.js';
import { useApp } from '../state/AppContext.jsx';
import TrendlineOverlay from '../components/trend/TrendlineOverlay.jsx';
import StockChartPanel from '../components/charts/StockChartPanel.jsx';

// PUBLIC_INTERFACE
export default function TrendAnalysisPage() {
  /** Trend analysis page: chart + trendline tool panel. */
  const { selectedSymbol, preferences } = useApp();
  const [tf] = useState(preferences.chart.defaultTimeframe);
  const series = useMemo(() => generateSeries(selectedSymbol, tf), [selectedSymbol, tf]);

  return (
    <div className="grid" aria-label="Trend analysis page">
      <StockChartPanel />
      <TrendlineOverlay series={series} />
    </div>
  );
}
