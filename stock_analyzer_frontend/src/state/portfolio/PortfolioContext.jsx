import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { loadPortfolioState, savePortfolioState } from "./portfolioStore.js";

const PortfolioContext = createContext(null);

// PUBLIC_INTERFACE
export function PortfolioProvider({ children }) {
  /** Provides portfolio CRUD and trading state, persisted in localStorage. */
  const [state, setState] = useState(() => loadPortfolioState());

  useEffect(() => {
    savePortfolioState(state);
  }, [state]);

  const api = useMemo(() => {
    return {
      state,
      setState,
      createPortfolio: (name) => {
        const trimmed = String(name || "").trim();
        if (!trimmed) throw new Error("Portfolio name is required.");
        if (state.portfolios.some((p) => p.name.toLowerCase() === trimmed.toLowerCase()))
          throw new Error("Portfolio name must be unique.");
        const id = `pf_${Math.random().toString(16).slice(2)}`;
        setState((prev) => ({
          portfolios: [{ id, name: trimmed, cash: 50_000, holdings: [], trades: [] }, ...prev.portfolios]
        }));
        return id;
      },
      renamePortfolio: (id, name) => {
        const trimmed = String(name || "").trim();
        if (!trimmed) throw new Error("Portfolio name is required.");
        if (state.portfolios.some((p) => p.id !== id && p.name.toLowerCase() === trimmed.toLowerCase()))
          throw new Error("Portfolio name must be unique.");
        setState((prev) => ({
          portfolios: prev.portfolios.map((p) => (p.id === id ? { ...p, name: trimmed } : p))
        }));
      },
      deletePortfolio: (id) => {
        setState((prev) => ({
          portfolios: prev.portfolios.filter((p) => p.id !== id)
        }));
      },
      updatePortfolio: (id, updater) => {
        setState((prev) => ({
          portfolios: prev.portfolios.map((p) => (p.id === id ? updater(p) : p))
        }));
      }
    };
  }, [state]);

  return <PortfolioContext.Provider value={api}>{children}</PortfolioContext.Provider>;
}

// PUBLIC_INTERFACE
export function usePortfolio() {
  /** Hook to access portfolio state and actions. */
  const ctx = useContext(PortfolioContext);
  if (!ctx) throw new Error("usePortfolio must be used within PortfolioProvider");
  return ctx;
}
