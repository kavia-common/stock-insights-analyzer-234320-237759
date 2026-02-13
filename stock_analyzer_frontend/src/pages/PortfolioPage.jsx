import React from 'react';
import PortfolioPanel from '../components/portfolio/PortfolioPanel.jsx';

// PUBLIC_INTERFACE
export default function PortfolioPage() {
  /** Portfolio tracking page. */
  return (
    <div className="grid" aria-label="Portfolio page">
      <PortfolioPanel />
    </div>
  );
}
