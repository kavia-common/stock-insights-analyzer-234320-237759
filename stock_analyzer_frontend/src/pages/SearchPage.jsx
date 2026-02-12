import React, { useEffect } from "react";
import StockSearchFilterPanel from "../components/search/StockSearchFilterPanel.jsx";
import { useAppState } from "../state/app/AppStateContext.jsx";

// PUBLIC_INTERFACE
export default function SearchPage() {
  /** Search and filter page. Selecting a stock updates global selected symbol. */
  const { setNewsContextMode } = useAppState();

  useEffect(() => {
    setNewsContextMode("stock");
  }, [setNewsContextMode]);

  return <StockSearchFilterPanel />;
}
