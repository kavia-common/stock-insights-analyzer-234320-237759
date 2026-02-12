import React, { useEffect } from "react";
import PortfolioDashboard from "../components/portfolio/PortfolioDashboard.jsx";
import { useAppState } from "../state/app/AppStateContext.jsx";

// PUBLIC_INTERFACE
export default function PortfolioPage() {
  /** Portfolio tracking and trading simulation page. */
  const { setNewsContextMode } = useAppState();

  useEffect(() => {
    setNewsContextMode("portfolio");
  }, [setNewsContextMode]);

  return <PortfolioDashboard />;
}
