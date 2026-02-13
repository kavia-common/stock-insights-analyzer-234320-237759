import React, { useMemo, useRef, useState } from 'react';
import { STOCKS } from '../../mock/stocks.js';
import { useApp } from '../../state/AppContext.jsx';

const SECTORS = Array.from(new Set(STOCKS.map((s) => s.sector))).sort();

// PUBLIC_INTERFACE
export default function StockSearchPanel() {
  /** Advanced stock search + filters panel with accessible autocomplete and active filter chips. */
  const { selectedSymbol, setSelectedSymbol, setNewsContext } = useApp();

  const [query, setQuery] = useState('');
  const [sectorMulti, setSectorMulti] = useState([]);
  const [priceMin, setPriceMin] = useState('');
  const [priceMax, setPriceMax] = useState('');
  const [capMin, setCapMin] = useState('');
  const [capMax, setCapMax] = useState('');
  const [sort, setSort] = useState({ key: 'symbol', dir: 'asc' });

  const [activeIndex, setActiveIndex] = useState(-1);
  const listId = 'autocomplete-list';
  const inputRef = useRef(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let arr = STOCKS.slice();

    if (q) {
      arr = arr.filter((s) => s.symbol.toLowerCase().includes(q) || s.name.toLowerCase().includes(q));
    }
    if (sectorMulti.length) {
      const set = new Set(sectorMulti);
      arr = arr.filter((s) => set.has(s.sector));
    }

    const pMin = priceMin === '' ? null : Number(priceMin);
    const pMax = priceMax === '' ? null : Number(priceMax);
    if (pMin !== null && !Number.isNaN(pMin)) arr = arr.filter((s) => s.price >= pMin);
    if (pMax !== null && !Number.isNaN(pMax)) arr = arr.filter((s) => s.price <= pMax);

    const cMin = capMin === '' ? null : Number(capMin);
    const cMax = capMax === '' ? null : Number(capMax);
    if (cMin !== null && !Number.isNaN(cMin)) arr = arr.filter((s) => s.marketCap >= cMin);
    if (cMax !== null && !Number.isNaN(cMax)) arr = arr.filter((s) => s.marketCap <= cMax);

    arr.sort((a, b) => {
      const dir = sort.dir === 'asc' ? 1 : -1;
      const key = sort.key;
      if (key === 'name') return a.name.localeCompare(b.name) * dir;
      if (key === 'price') return (a.price - b.price) * dir;
      if (key === 'marketCap') return (a.marketCap - b.marketCap) * dir;
      return a.symbol.localeCompare(b.symbol) * dir;
    });

    return arr;
  }, [query, sectorMulti, priceMin, priceMax, capMin, capMax, sort]);

  const suggestions = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return STOCKS.filter((s) => s.symbol.toLowerCase().includes(q) || s.name.toLowerCase().includes(q)).slice(
      0,
      10
    );
  }, [query]);

  const activeChips = useMemo(() => {
    const chips = [];
    if (query.trim()) chips.push({ key: 'q', label: `Query: ${query.trim()}` });
    for (const sec of sectorMulti) chips.push({ key: `sec:${sec}`, label: `Sector: ${sec}` });
    if (priceMin !== '') chips.push({ key: 'pmin', label: `Min $${priceMin}` });
    if (priceMax !== '') chips.push({ key: 'pmax', label: `Max $${priceMax}` });
    if (capMin !== '') chips.push({ key: 'cmin', label: `Min Cap ${capMin}B` });
    if (capMax !== '') chips.push({ key: 'cmax', label: `Max Cap ${capMax}B` });
    return chips;
  }, [query, sectorMulti, priceMin, priceMax, capMin, capMax]);

  function resetFilters() {
    setSectorMulti([]);
    setPriceMin('');
    setPriceMax('');
    setCapMin('');
    setCapMax('');
  }

  function removeChip(key) {
    if (key === 'q') setQuery('');
    if (key.startsWith('sec:')) setSectorMulti((prev) => prev.filter((s) => `sec:${s}` !== key));
    if (key === 'pmin') setPriceMin('');
    if (key === 'pmax') setPriceMax('');
    if (key === 'cmin') setCapMin('');
    if (key === 'cmax') setCapMax('');
  }

  function chooseStock(sym) {
    setSelectedSymbol(sym);
    const stock = STOCKS.find((s) => s.symbol === sym);
    setNewsContext({ type: 'stock', symbols: [sym], sector: stock?.sector });
  }

  return (
    <section className="card" aria-label="Stock search and filters" data-tour="search">
      <h2>Stocks</h2>

      <div className="row" style={{ justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div style={{ flex: 1, minWidth: 220 }}>
          <label className="small-muted" htmlFor="stock-search">
            Search by symbol or company name
          </label>
          <input
            id="stock-search"
            ref={inputRef}
            className="input"
            style={{ width: '100%' }}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setActiveIndex(-1);
            }}
            placeholder="e.g., AAPL or Apple"
            role="combobox"
            aria-autocomplete="list"
            aria-expanded={suggestions.length ? 'true' : 'false'}
            aria-controls={listId}
            aria-activedescendant={activeIndex >= 0 ? `${listId}-item-${activeIndex}` : undefined}
            onKeyDown={(e) => {
              if (!suggestions.length) return;
              if (e.key === 'ArrowDown') {
                e.preventDefault();
                setActiveIndex((i) => Math.min(i + 1, suggestions.length - 1));
              } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setActiveIndex((i) => Math.max(i - 1, 0));
              } else if (e.key === 'Enter') {
                if (activeIndex >= 0) {
                  e.preventDefault();
                  chooseStock(suggestions[activeIndex].symbol);
                  setQuery(suggestions[activeIndex].symbol);
                }
              } else if (e.key === 'Escape') {
                setActiveIndex(-1);
              }
            }}
          />

          {query.trim() ? (
            <div
              id={listId}
              role="listbox"
              aria-label="Stock suggestions"
              className="card"
              style={{
                marginTop: 8,
                padding: 0,
                maxHeight: 260,
                overflow: 'auto'
              }}
            >
              {suggestions.length ? (
                suggestions.map((s, idx) => (
                  <div
                    key={s.symbol}
                    id={`${listId}-item-${idx}`}
                    role="option"
                    aria-selected={activeIndex === idx ? 'true' : 'false'}
                    style={{
                      padding: 10,
                      borderBottom: '1px solid var(--ocean-border)',
                      cursor: 'pointer',
                      background: activeIndex === idx ? 'rgba(37,99,235,0.10)' : 'transparent'
                    }}
                    onMouseDown={(e) => {
                      // prevent blur which closes list before click registers
                      e.preventDefault();
                      chooseStock(s.symbol);
                      setQuery(s.symbol);
                    }}
                    onMouseEnter={() => setActiveIndex(idx)}
                  >
                    <strong>{s.symbol}</strong> <span className="small-muted">{s.name}</span>
                  </div>
                ))
              ) : (
                <div style={{ padding: 10 }} className="small-muted">
                  No results found
                </div>
              )}
            </div>
          ) : null}
        </div>

        <div className="row" style={{ justifyContent: 'flex-end' }}>
          <label className="small-muted" htmlFor="sort-select">
            Sort
          </label>
          <select
            id="sort-select"
            className="select"
            value={`${sort.key}:${sort.dir}`}
            onChange={(e) => {
              const [key, dir] = e.target.value.split(':');
              setSort({ key, dir });
            }}
            aria-label="Sort stocks"
          >
            <option value="symbol:asc">Symbol (A-Z)</option>
            <option value="symbol:desc">Symbol (Z-A)</option>
            <option value="name:asc">Name (A-Z)</option>
            <option value="name:desc">Name (Z-A)</option>
            <option value="price:asc">Price (Low-High)</option>
            <option value="price:desc">Price (High-Low)</option>
            <option value="marketCap:asc">Market Cap (Low-High)</option>
            <option value="marketCap:desc">Market Cap (High-Low)</option>
          </select>
        </div>
      </div>

      <div style={{ marginTop: 12 }} className="grid">
        <div className="row">
          <fieldset style={{ border: '1px solid var(--ocean-border)', borderRadius: 12, padding: 10 }}>
            <legend className="small-muted">Sectors</legend>
            <div className="row">
              {SECTORS.map((sec) => {
                const id = `sec-${sec.replaceAll(' ', '-')}`;
                const checked = sectorMulti.includes(sec);
                return (
                  <label key={sec} htmlFor={id} className="pill">
                    <input
                      id={id}
                      type="checkbox"
                      checked={checked}
                      onChange={(e) => {
                        setSectorMulti((prev) => {
                          if (e.target.checked) return Array.from(new Set([...prev, sec]));
                          return prev.filter((s) => s !== sec);
                        });
                      }}
                    />
                    {sec}
                  </label>
                );
              })}
            </div>
          </fieldset>
        </div>

        <div className="row" style={{ alignItems: 'flex-end' }}>
          <div>
            <label className="small-muted" htmlFor="pmin">
              Price min ($)
            </label>
            <input id="pmin" className="input" inputMode="decimal" value={priceMin} onChange={(e) => setPriceMin(e.target.value)} />
          </div>
          <div>
            <label className="small-muted" htmlFor="pmax">
              Price max ($)
            </label>
            <input id="pmax" className="input" inputMode="decimal" value={priceMax} onChange={(e) => setPriceMax(e.target.value)} />
          </div>
          <div>
            <label className="small-muted" htmlFor="cmin">
              Market cap min (B)
            </label>
            <input id="cmin" className="input" inputMode="numeric" value={capMin} onChange={(e) => setCapMin(e.target.value)} />
          </div>
          <div>
            <label className="small-muted" htmlFor="cmax">
              Market cap max (B)
            </label>
            <input id="cmax" className="input" inputMode="numeric" value={capMax} onChange={(e) => setCapMax(e.target.value)} />
          </div>
          <button type="button" className="btn" onClick={resetFilters} aria-label="Clear all filters">
            Clear all
          </button>
        </div>

        <div aria-label="Active filters summary" className="notice">
          <div className="row" style={{ justifyContent: 'space-between' }}>
            <div>
              <strong>{filtered.length}</strong> results
              {selectedSymbol ? (
                <span className="small-muted" style={{ marginLeft: 10 }}>
                  Selected: <strong>{selectedSymbol}</strong>
                </span>
              ) : null}
            </div>
          </div>

          <div className="row" style={{ marginTop: 8 }}>
            {activeChips.length ? (
              activeChips.map((c) => (
                <span key={c.key} className="pill">
                  {c.label}
                  <button type="button" onClick={() => removeChip(c.key)} aria-label={`Remove ${c.label}`}>
                    ×
                  </button>
                </span>
              ))
            ) : (
              <span className="small-muted">No filters applied.</span>
            )}
          </div>
        </div>

        <div style={{ overflow: 'auto' }} aria-label="Stock results">
          <table className="table">
            <thead>
              <tr>
                <th>Symbol</th>
                <th>Name</th>
                <th>Sector</th>
                <th>Price</th>
                <th>Market Cap (B)</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {filtered.map((s) => (
                <tr key={s.symbol} style={{ background: s.symbol === selectedSymbol ? 'rgba(37,99,235,0.08)' : 'transparent' }}>
                  <td>
                    <strong>{s.symbol}</strong>
                  </td>
                  <td>{s.name}</td>
                  <td>{s.sector}</td>
                  <td>${s.price.toFixed(2)}</td>
                  <td>{s.marketCap}</td>
                  <td>
                    <button type="button" className="btn primary" onClick={() => chooseStock(s.symbol)} aria-label={`Select ${s.symbol}`}>
                      View
                    </button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="small-muted" style={{ padding: 14 }}>
                    No stocks match the current filters.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
