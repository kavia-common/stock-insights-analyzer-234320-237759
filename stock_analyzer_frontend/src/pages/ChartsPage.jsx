import React, { useEffect } from "react";
import StockChartPanel from "../components/charts/StockChartPanel.jsx";
import TrendSummaryPanel from "../components/trend/TrendSummaryPanel.jsx";
import { useAppState } from "../state/app/AppStateContext.jsx";
import styles from "./PageGrid.module.css";

// PUBLIC_INTERFACE
export default function ChartsPage() {
  /** Charts page composed of chart visualization and a trend insights side panel. */
  const { setNewsContextMode } = useAppState();

  useEffect(() => {
    setNewsContextMode("stock");
  }, [setNewsContextMode]);

  return (
    <div className={styles.grid}>
      <StockChartPanel />
      <TrendSummaryPanel />
    </div>
  );
}
