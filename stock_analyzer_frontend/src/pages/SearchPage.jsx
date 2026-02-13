import React from 'react';
import StockSearchPanel from '../components/search/StockSearchPanel.jsx';

// PUBLIC_INTERFACE
export default function SearchPage() {
  /** Search & Filters page. */
  return (
    <div className="grid" aria-label="Search page">
      <StockSearchPanel />
    </div>
  );
}
