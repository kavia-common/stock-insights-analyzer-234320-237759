import React, { useMemo, useRef, useState } from "react";
import { MOCK_STOCKS, SECTORS } from "../../data/mockStocks.js";
import { useAppState } from "../../state/app/AppStateContext.jsx";
import styles from "./StockSearchFilterPanel.module.css";

function byIncludes(s, q) {
  return s.toLowerCase().includes(q.toLowerCase());
}

function formatCap(v) {
  if (v >= 1e12) return `${(v / 1e12).toFixed(2)}T`;
  if (v >= 1e9) return `${(v / 1e9).toFixed(2)}B`;
  return `${(v / 1e6).toFixed(0)}M`;
}

// PUBLIC_INTERFACE
export default function StockSearchFilterPanel() {
  /** Search + filter panel with autocomplete, multi-criteria filtering, sorting, and active filter chips. */
  const { setSelectedSymbol } = useAppState();

  const [query, setQuery] = useState("");
  const [sector, setSector] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [minCap, setMinCap] = useState("");
  const [sort, setSort] = useState("name_asc");

  const [activeIndex, setActiveIndex] = useState(-1);
  const listRef = useRef(null);

  const suggestions = useMemo(() => {
    const q = query.trim();
    if (!q) return [];
    return MOCK_STOCKS.filter((s) => byIncludes(s.symbol, q) || byIncludes(s.name, q)).slice(0, 10);
  }, [query]);

  const filtered = useMemo(() => {
    let rows = [...MOCK_STOCKS];

    if (sector) rows = rows.filter((s) => s.sector === sector);

    const minP = minPrice === "" ? null : Number(minPrice);
    const maxP = maxPrice === "" ? null : Number(maxPrice);
    if (minP !== null && !Number.isNaN(minP)) rows = rows.filter((s) => s.price >= minP);
    if (maxP !== null && !Number.isNaN(maxP)) rows = rows.filter((s) => s.price <= maxP);

    const minC = minCap === "" ? null : Number(minCap);
    if (minC !== null && !Number.isNaN(minC)) rows = rows.filter((s) => s.marketCap >= minC);

    if (query.trim()) {
      const q = query.trim();
      rows = rows.filter((s) => byIncludes(s.symbol, q) || byIncludes(s.name, q));
    }

    const [field, dir] = sort.split("_");
    rows.sort((a, b) => {
      const mul = dir === "desc" ? -1 : 1;
      if (field === "price") return (a.price - b.price) * mul;
      if (field === "cap") return (a.marketCap - b.marketCap) * mul;
      return a.name.localeCompare(b.name) * mul;
    });

    return rows;
  }, [sector, minPrice, maxPrice, minCap, sort, query]);

  const activeFilters = useMemo(() => {
    const chips = [];
    if (query.trim()) chips.push({ key: "query", label: `Search: ${query.trim()}` });
    if (sector) chips.push({ key: "sector", label: `Sector: ${sector}` });
    if (minPrice !== "") chips.push({ key: "minPrice", label: `Min price: $${minPrice}` });
    if (maxPrice !== "") chips.push({ key: "maxPrice", label: `Max price: $${maxPrice}` });
    if (minCap !== "") chips.push({ key: "minCap", label: `Min cap: ${formatCap(Number(minCap))}` });
    if (sort) chips.push({ key: "sort", label: `Sort: ${sort.replace("_", " ")}` });
    return chips;
  }, [query, sector, minPrice, maxPrice, minCap, sort]);

  const clearFilters = () => {
    setQuery("");
    setSector("");
    setMinPrice("");
    setMaxPrice("");
    setMinCap("");
    setSort("name_asc");
    setActiveIndex(-1);
  };

  const removeChip = (key) => {
    if (key === "query") setQuery("");
    if (key === "sector") setSector("");
    if (key === "minPrice") setMinPrice("");
    if (key === "maxPrice") setMaxPrice("");
    if (key === "minCap") setMinCap("");
    if (key === "sort") setSort("name_asc");
  };

  const onSelectStock = (sym) => {
    setSelectedSymbol(sym);
  };

  const onKeyDown = (e) => {
    if (!suggestions.length) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, suggestions.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      if (activeIndex >= 0) {
        e.preventDefault();
        onSelectStock(suggestions[activeIndex].symbol);
      }
    } else if (e.key === "Escape") {
      setActiveIndex(-1);
    }
  };

  return (
    <section className={`card ${styles.wrap}`} aria-label="Stock search and filtering">
      <h1 className={styles.h1}>Search & Filter</h1>

      <div className={styles.topRow}>
        <div className="field" style={{ position: "relative" }}>
          <label htmlFor="search">Search Stocks</label>
          <input
            id="search"
            className="input"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setActiveIndex(-1);
            }}
            onKeyDown={onKeyDown}
            aria-label="Search stocks"
            aria-autocomplete="list"
            aria-controls="suggestions"
            aria-expanded={suggestions.length > 0}
          />
          <div className="help-text">Type symbol or company name. Use ↑/↓ and Enter to select.</div>

          {suggestions.length > 0 && (
            <ul
              id="suggestions"
              className={styles.suggestions}
              role="listbox"
              aria-label="Stock suggestions"
              ref={listRef}
            >
              {suggestions.map((s, idx) => (
                <li
                  key={s.symbol}
                  role="option"
                  aria-selected={idx === activeIndex}
                  className={`${styles.option} ${idx === activeIndex ? styles.optionActive : ""}`}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => onSelectStock(s.symbol)}
                >
                  <strong>{s.symbol}</strong> <span className={styles.muted}>— {s.name}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="field">
          <label htmlFor="sort">Sort</label>
          <select id="sort" className="select" value={sort} onChange={(e) => setSort(e.target.value)} aria-label="Sort stocks">
            <option value="name_asc">Name (A–Z)</option>
            <option value="name_desc">Name (Z–A)</option>
            <option value="price_asc">Price (Low–High)</option>
            <option value="price_desc">Price (High–Low)</option>
            <option value="cap_asc">Market Cap (Low–High)</option>
            <option value="cap_desc">Market Cap (High–Low)</option>
          </select>
        </div>
      </div>

      <div className={styles.filters} aria-label="Filters">
        <div className="field">
          <label htmlFor="sector">Sector Filter</label>
          <select id="sector" className="select" value={sector} onChange={(e) => setSector(e.target.value)} aria-label="Sector filter">
            <option value="">All sectors</option>
            {SECTORS.map((sec) => (
              <option key={sec} value={sec}>
                {sec}
              </option>
            ))}
          </select>
        </div>

        <div className="field">
          <label htmlFor="minPrice">Min Price ($)</label>
          <input id="minPrice" className="input" inputMode="decimal" value={minPrice} onChange={(e) => setMinPrice(e.target.value)} />
        </div>

        <div className="field">
          <label htmlFor="maxPrice">Max Price ($)</label>
          <input id="maxPrice" className="input" inputMode="decimal" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} />
        </div>

        <div className="field">
          <label htmlFor="minCap">Min Market Cap (USD)</label>
          <input
            id="minCap"
            className="input"
            inputMode="numeric"
            placeholder="e.g. 100000000000"
            value={minCap}
            onChange={(e) => setMinCap(e.target.value)}
          />
        </div>

        <button className="btn secondary" onClick={clearFilters} aria-label="Clear filters">
          Clear Filters
        </button>
      </div>

      <div className={styles.summary} aria-label="Results summary">
        <div data-testid="results-count" className={styles.count}>
          {filtered.length} results
        </div>

        <div data-testid="active-filters" className={styles.chips} aria-label="Active filters">
          {activeFilters.map((c) => (
            <button
              key={c.key}
              className={styles.chip}
              onClick={() => removeChip(c.key)}
              aria-label={`Remove filter: ${c.label}`}
            >
              {c.label} <span aria-hidden="true">×</span>
            </button>
          ))}
        </div>
      </div>

      <div className={styles.tableWrap} role="region" aria-label="Stock results">
        <table className={styles.table}>
          <thead>
            <tr>
              <th scope="col">Symbol</th>
              <th scope="col">Name</th>
              <th scope="col">Sector</th>
              <th scope="col">Price</th>
              <th scope="col">Market Cap</th>
              <th scope="col">Action</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((s) => (
              <tr key={s.symbol}>
                <th scope="row">{s.symbol}</th>
                <td>{s.name}</td>
                <td>{s.sector}</td>
                <td>${s.price.toFixed(2)}</td>
                <td>{formatCap(s.marketCap)}</td>
                <td>
                  <button className="btn primary" onClick={() => onSelectStock(s.symbol)} aria-label={`View ${s.symbol} in charts`}>
                    View
                  </button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className={styles.noResults}>
                  No results found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
