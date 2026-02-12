import React, { createContext, useContext, useMemo, useState } from "react";
import { MOCK_STOCKS } from "../../data/mockStocks.js";

const AppStateContext = createContext(null);

// PUBLIC_INTERFACE
export function AppStateProvider({ children }) {
  /** Provides cross-cutting state such as currently selected stock and context for news. */
  const [selectedSymbol, setSelectedSymbol] = useState("AAPL");
  const [newsContextMode, setNewsContextMode] = useState("stock"); // "stock" | "portfolio" | "market"
  const [selectedPortfolioId, setSelectedPortfolioId] = useState("default");

  const selectedStock = useMemo(
    () => MOCK_STOCKS.find((s) => s.symbol === selectedSymbol) ?? MOCK_STOCKS[0],
    [selectedSymbol]
  );

  const value = useMemo(
    () => ({
      selectedSymbol,
      setSelectedSymbol,
      selectedStock,
      newsContextMode,
      setNewsContextMode,
      selectedPortfolioId,
      setSelectedPortfolioId
    }),
    [selectedSymbol, selectedStock, newsContextMode, selectedPortfolioId]
  );

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
}

// PUBLIC_INTERFACE
export function useAppState() {
  /** Hook to access global app state. */
  const ctx = useContext(AppStateContext);
  if (!ctx) throw new Error("useAppState must be used within AppStateProvider");
  return ctx;
}
