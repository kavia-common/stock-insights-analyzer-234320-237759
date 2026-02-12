import React, { useEffect } from "react";
import TrendSummaryPanel from "../components/trend/TrendSummaryPanel.jsx";
import TrendlineToolPanel from "../components/trend/TrendlineToolPanel.jsx";
import { useAppState } from "../state/app/AppStateContext.jsx";
import styles from "./PageGrid.module.css";

// PUBLIC_INTERFACE
export default function TrendAnalysisPage() {
  /** Trend analysis page combining insights and trendline management tools. */
  const { setNewsContextMode } = useAppState();

  useEffect(() => {
    setNewsContextMode("stock");
  }, [setNewsContextMode]);

  return (
    <div className={styles.grid}>
      <TrendlineToolPanel />
      <TrendSummaryPanel />
    </div>
  );
}
