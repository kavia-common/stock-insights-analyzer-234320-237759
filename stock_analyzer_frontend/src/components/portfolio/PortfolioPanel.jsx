import React, { useEffect, useId, useMemo, useState } from 'react';
import { STOCKS, generateSeries } from '../../mock/stocks.js';
import { useApp } from '../../state/AppContext.jsx';
import Modal from '../common/Modal.jsx';
import { computePortfolioValue, loadPortfolios, savePortfolios, simulateTrade, getQuote } from '../../state/portfolioStore.js';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, LineChart, Line, XAxis, YAxis, CartesianGrid } from 'recharts';

const COLORS = ['#2563EB', '#F59E0B', '#22c55e', '#a855f7', '#ef4444', '#14b8a6'];

function slug(s) {
  return s.toLowerCase().replaceAll(' ', '-');
}

// PUBLIC_INTERFACE
export default function PortfolioPanel() {
  /** Mock portfolio tracking: create/rename/delete, holdings, simulated trades, allocation & performance charts. */
  const { setNewsContext } = useApp();

  const [portfolios, setPortfolios] = useState(() => loadPortfolios());
  const [activeId, setActiveId] = useState(() => portfolios[0]?.id || null);

  const [modal, setModal] = useState(null); // {type, ...}
  const modalTitleId = useId();

  useEffect(() => {
    savePortfolios(portfolios);
  }, [portfolios]);

  const active = useMemo(() => portfolios.find((p) => p.id === activeId) || portfolios[0], [portfolios, activeId]);

  useEffect(() => {
    if (active) {
      setNewsContext({ type: 'portfolio', symbols: active.holdings.map((h) => h.symbol) });
    }
  }, [active, setNewsContext]);

  const value = useMemo(() => (active ? computePortfolioValue(active) : { total: 0, holdingsValue: 0 }), [active]);

  const allocation = useMemo(() => {
    if (!active) return [];
    return active.holdings.map((h, idx) => ({
      name: h.symbol,
      value: h.shares * getQuote(h.symbol),
      color: COLORS[idx % COLORS.length]
    }));
  }, [active]);

  const performance = useMemo(() => {
    // Use combined series from holdings as mock performance
    if (!active) return [];
    const symbols = active.holdings.map((h) => h.symbol);
    if (!symbols.length) return [];

    const series = symbols.map((s) => generateSeries(s, '1M'));
    const len = Math.min(...series.map((arr) => arr.length));
    const data = [];
    for (let i = 0; i < len; i += 1) {
      const t = series[0][i].t;
      let holdingsValue = 0;
      for (let j = 0; j < symbols.length; j += 1) {
        const sym = symbols[j];
        const shares = active.holdings.find((h) => h.symbol === sym)?.shares ?? 0;
        holdingsValue += shares * series[j][i].close;
      }
      data.push({ t, value: active.cash + holdingsValue });
    }
    return data;
  }, [active]);

  function validateName(name, excludeId = null) {
    const n = name.trim();
    if (!n) return 'Name cannot be empty.';
    const exists = portfolios.some((p) => p.name.toLowerCase() === n.toLowerCase() && p.id !== excludeId);
    if (exists) return 'Name must be unique.';
    return null;
  }

  function createPortfolio(name) {
    const err = validateName(name);
    if (err) return err;
    const p = { id: `p_${Math.random().toString(16).slice(2)}`, name: name.trim(), cash: 25_000, holdings: [], trades: [] };
    setPortfolios((prev) => [p, ...prev]);
    setActiveId(p.id);
    return null;
  }

  function renamePortfolio(id, name) {
    const err = validateName(name, id);
    if (err) return err;
    setPortfolios((prev) => prev.map((p) => (p.id === id ? { ...p, name: name.trim() } : p)));
    return null;
  }

  function deletePortfolio(id) {
    setPortfolios((prev) => prev.filter((p) => p.id !== id));
    if (activeId === id) setActiveId((prev) => portfolios.find((p) => p.id !== id)?.id || null);
  }

  function addHolding(symbol) {
    if (!active) return;
    if (active.holdings.some((h) => h.symbol === symbol)) return;
    setPortfolios((prev) =>
      prev.map((p) => (p.id === active.id ? { ...p, holdings: [...p.holdings, { symbol, shares: 0, avgCost: getQuote(symbol) }] } : p))
    );
  }

  function removeHolding(symbol) {
    if (!active) return;
    setPortfolios((prev) =>
      prev.map((p) =>
        p.id === active.id ? { ...p, holdings: p.holdings.filter((h) => h.symbol !== symbol) } : p
      )
    );
  }

  function doTrade({ symbol, side, shares }) {
    if (!active) return;
    const { nextPortfolio, error } = simulateTrade(active, { symbol, side, shares });
    if (error) return error;
    setPortfolios((prev) => prev.map((p) => (p.id === active.id ? nextPortfolio : p)));
    return null;
  }

  return (
    <section className="grid" aria-label="Portfolio section" data-tour="portfolio">
      <div className="card">
        <div className="row" style={{ justifyContent: 'space-between' }}>
          <h2>Portfolios</h2>
          <button type="button" className="btn primary" onClick={() => setModal({ type: 'create' })}>
            New
          </button>
        </div>

        <div className="row" style={{ flexWrap: 'wrap' }}>
          {portfolios.map((p) => (
            <button
              key={p.id}
              type="button"
              className={p.id === activeId ? 'btn primary' : 'btn'}
              onClick={() => setActiveId(p.id)}
              aria-label={`Select portfolio ${p.name}`}
            >
              {p.name}
            </button>
          ))}
        </div>

        {active ? (
          <div className="row" style={{ marginTop: 10, justifyContent: 'space-between' }}>
            <div className="pill">
              <strong>Total:</strong> ${value.total.toFixed(2)}
            </div>
            <div className="pill">
              <strong>Cash:</strong> ${active.cash.toFixed(2)}
            </div>
            <div className="pill">
              <strong>Holdings:</strong> {active.holdings.length}
            </div>

            <div className="row">
              <button type="button" className="btn" onClick={() => setModal({ type: 'rename', id: active.id, name: active.name })}>
                Rename
              </button>
              <button type="button" className="btn danger" onClick={() => setModal({ type: 'delete', id: active.id })}>
                Delete
              </button>
            </div>
          </div>
        ) : (
          <div className="small-muted">No portfolio selected.</div>
        )}
      </div>

      <div className="grid dashboard">
        <div className="grid">
          <HoldingsCard
            active={active}
            onAddHolding={(sym) => addHolding(sym)}
            onRemoveHolding={(sym) => removeHolding(sym)}
            onTrade={(t) => {
              const err = doTrade(t);
              if (err) setModal({ type: 'error', message: err });
            }}
          />

          <div className="card">
            <h2>Trade history</h2>
            {active?.trades?.length ? (
              <div style={{ overflow: 'auto' }}>
                <table className="table" aria-label="Trade history table">
                  <thead>
                    <tr>
                      <th>Time</th>
                      <th>Symbol</th>
                      <th>Side</th>
                      <th>Shares</th>
                      <th>Price</th>
                    </tr>
                  </thead>
                  <tbody>
                    {active.trades.slice(0, 20).map((t) => (
                      <tr key={t.id}>
                        <td className="small-muted">{new Date(t.timestamp).toLocaleString()}</td>
                        <td>
                          <strong>{t.symbol}</strong>
                        </td>
                        <td>{t.side}</td>
                        <td>{t.shares}</td>
                        <td>${t.price.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="small-muted">No trades yet. Try a simulated buy/sell.</div>
            )}
          </div>
        </div>

        <div className="grid">
          <div className="card">
            <h2>Allocation</h2>
            {allocation.length ? (
              <div style={{ height: 260 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Tooltip />
                    <Pie data={allocation} dataKey="value" nameKey="name" outerRadius={90} label>
                      {allocation.map((a) => (
                        <Cell key={a.name} fill={a.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="small-muted">Add holdings to see allocation.</div>
            )}
          </div>

          <div className="card">
            <h2>Performance (mock)</h2>
            {performance.length ? (
              <div style={{ height: 260 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={performance}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--ocean-border)" />
                    <XAxis dataKey="t" tickFormatter={(v) => new Date(v).getDate()} />
                    <YAxis domain={['auto', 'auto']} />
                    <Tooltip />
                    <Line type="monotone" dataKey="value" stroke="var(--ocean-primary)" dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="small-muted">Add holdings to generate performance chart.</div>
            )}
          </div>
        </div>
      </div>

      {modal ? (
        <PortfolioModal
          modal={modal}
          titleId={modalTitleId}
          onClose={() => setModal(null)}
          onCreate={createPortfolio}
          onRename={renamePortfolio}
          onDelete={deletePortfolio}
        />
      ) : null}
    </section>
  );
}

function HoldingsCard({ active, onAddHolding, onRemoveHolding, onTrade }) {
  const [addSymbol, setAddSymbol] = useState('AAPL');
  const [tradeSymbol, setTradeSymbol] = useState('AAPL');
  const [side, setSide] = useState('buy');
  const [shares, setShares] = useState('10');

  const holdingRows = useMemo(() => {
    if (!active) return [];
    return active.holdings.map((h) => {
      const price = getQuote(h.symbol);
      const marketValue = price * h.shares;
      const gainLoss = (price - h.avgCost) * h.shares;
      return { ...h, price, marketValue, gainLoss };
    });
  }, [active]);

  return (
    <div className="card" aria-label="Holdings and trades">
      <h2>Holdings</h2>

      <div className="row" style={{ alignItems: 'flex-end', justifyContent: 'space-between' }}>
        <div className="row" style={{ alignItems: 'flex-end' }}>
          <div>
            <label className="small-muted" htmlFor="add-symbol">
              Add stock
            </label>
            <select
              id="add-symbol"
              className="select"
              value={addSymbol}
              onChange={(e) => setAddSymbol(e.target.value)}
            >
              {STOCKS.map((s) => (
                <option key={s.symbol} value={s.symbol}>
                  {s.symbol} • {s.name}
                </option>
              ))}
            </select>
          </div>
          <button type="button" className="btn" onClick={() => onAddHolding(addSymbol)} aria-label="Add stock to portfolio">
            Add
          </button>
        </div>

        <div className="row" style={{ alignItems: 'flex-end' }}>
          <div>
            <label className="small-muted" htmlFor="trade-symbol">
              Trade symbol
            </label>
            <select
              id="trade-symbol"
              className="select"
              value={tradeSymbol}
              onChange={(e) => setTradeSymbol(e.target.value)}
            >
              {STOCKS.map((s) => (
                <option key={s.symbol} value={s.symbol}>
                  {s.symbol}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="small-muted" htmlFor="trade-side">
              Side
            </label>
            <select id="trade-side" className="select" value={side} onChange={(e) => setSide(e.target.value)}>
              <option value="buy">Buy</option>
              <option value="sell">Sell</option>
            </select>
          </div>
          <div>
            <label className="small-muted" htmlFor="trade-shares">
              Shares
            </label>
            <input id="trade-shares" className="input" inputMode="numeric" value={shares} onChange={(e) => setShares(e.target.value)} />
          </div>
          <button
            type="button"
            className="btn primary"
            onClick={() => onTrade({ symbol: tradeSymbol, side, shares })}
            aria-label="Execute simulated trade"
          >
            Execute
          </button>
        </div>
      </div>

      {active?.holdings?.length ? (
        <div style={{ overflow: 'auto', marginTop: 12 }}>
          <table className="table" aria-label="Holdings table">
            <thead>
              <tr>
                <th>Symbol</th>
                <th>Shares</th>
                <th>Avg cost</th>
                <th>Price</th>
                <th>Value</th>
                <th>Gain/Loss</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {holdingRows.map((h) => (
                <tr key={h.symbol}>
                  <td>
                    <strong>{h.symbol}</strong>
                  </td>
                  <td>{h.shares}</td>
                  <td>${h.avgCost.toFixed(2)}</td>
                  <td>${h.price.toFixed(2)}</td>
                  <td>${h.marketValue.toFixed(2)}</td>
                  <td style={{ color: h.gainLoss >= 0 ? '#22c55e' : '#ef4444' }}>
                    ${h.gainLoss.toFixed(2)}
                  </td>
                  <td>
                    <button type="button" className="btn danger" onClick={() => onRemoveHolding(h.symbol)} aria-label={`Remove ${h.symbol} from portfolio`}>
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="small-muted" style={{ marginTop: 10 }}>
          No holdings. Add a stock to begin.
        </div>
      )}
    </div>
  );
}

function PortfolioModal({ modal, titleId, onClose, onCreate, onRename, onDelete }) {
  const [name, setName] = useState(modal.name || '');
  const [error, setError] = useState('');

  if (modal.type === 'error') {
    return (
      <Modal
        title="Trade error"
        labelledById={titleId}
        onClose={onClose}
        actions={
          <button type="button" className="btn primary" onClick={onClose}>
            OK
          </button>
        }
      >
        <div className="notice error" role="alert">
          {modal.message}
        </div>
      </Modal>
    );
  }

  if (modal.type === 'delete') {
    return (
      <Modal
        title="Delete portfolio?"
        labelledById={titleId}
        onClose={onClose}
        actions={
          <>
            <button type="button" className="btn" onClick={onClose}>
              Cancel
            </button>
            <button
              type="button"
              className="btn danger"
              onClick={() => {
                onDelete(modal.id);
                onClose();
              }}
            >
              Delete
            </button>
          </>
        }
      >
        <div className="notice error">This cannot be undone. Portfolio data is stored locally.</div>
      </Modal>
    );
  }

  return (
    <Modal
      title={modal.type === 'rename' ? 'Rename portfolio' : 'Create portfolio'}
      labelledById={titleId}
      onClose={onClose}
      actions={
        <>
          <button type="button" className="btn" onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className="btn primary"
            onClick={() => {
              setError('');
              const err =
                modal.type === 'rename'
                  ? onRename(modal.id, name)
                  : onCreate(name);
              if (err) setError(err);
              else onClose();
            }}
          >
            Save
          </button>
        </>
      }
    >
      <label className="small-muted" htmlFor="portfolio-name">
        Portfolio name
      </label>
      <input
        id="portfolio-name"
        className="input"
        style={{ width: '100%' }}
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      {error ? (
        <div className="notice error" role="alert" style={{ marginTop: 10 }}>
          {error}
        </div>
      ) : null}
    </Modal>
  );
}
