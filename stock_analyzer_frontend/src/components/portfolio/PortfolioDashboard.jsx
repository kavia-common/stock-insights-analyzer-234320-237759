import React, { useMemo, useState } from "react";
import { Pie, PieChart, Cell, ResponsiveContainer, Tooltip, LineChart, Line, XAxis, YAxis, CartesianGrid } from "recharts";
import { MOCK_STOCKS, generateTimeSeries } from "../../data/mockStocks.js";
import {
  allocationBySector,
  allocationBySymbol,
  computePortfolioValue,
  getQuote,
  performTrade
} from "../../state/portfolio/portfolioStore.js";
import { usePortfolio } from "../../state/portfolio/PortfolioContext.jsx";
import { useAppState } from "../../state/app/AppStateContext.jsx";
import styles from "./PortfolioDashboard.module.css";

const COLORS = ["#2563EB", "#F59E0B", "#22C55E", "#A855F7", "#EF4444", "#06B6D4", "#F97316"];

function formatMoney(v) {
  return v.toLocaleString(undefined, { style: "currency", currency: "USD" });
}

function formatDateTick(dateStr) {
  const [y, m, d] = dateStr.split("-");
  return `${m}/${d}`;
}

function findStockLabel(symbol) {
  const s = MOCK_STOCKS.find((x) => x.symbol === symbol);
  return s ? `${s.symbol} — ${s.name}` : symbol;
}

function computePerformanceSeries(portfolio, days = 60) {
  // Very simplified: value = cash + holdings priced from each day series.
  const symbols = portfolio.holdings.map((h) => h.symbol);
  const seriesBySymbol = Object.fromEntries(symbols.map((sym) => [sym, generateTimeSeries(sym, days)]));
  const out = [];
  for (let i = 0; i < days; i += 1) {
    let holdingsValue = 0;
    for (const h of portfolio.holdings) {
      const p = seriesBySymbol[h.symbol][i]?.close ?? getQuote(h.symbol);
      holdingsValue += p * h.shares;
    }
    out.push({
      date: seriesBySymbol[symbols[0]]?.[i]?.date ?? `Day ${i}`,
      value: portfolio.cash + holdingsValue
    });
  }
  return out;
}

// PUBLIC_INTERFACE
export default function PortfolioDashboard() {
  /** Portfolio dashboard with CRUD, holdings management, simulated trades, and visualizations. */
  const { state, createPortfolio, renamePortfolio, deletePortfolio, updatePortfolio } = usePortfolio();
  const { selectedPortfolioId, setSelectedPortfolioId, setNewsContextMode } = useAppState();

  const [error, setError] = useState("");
  const [status, setStatus] = useState("");

  const [newName, setNewName] = useState("");
  const [renameValue, setRenameValue] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);

  const [addSymbol, setAddSymbol] = useState("");
  const [tradeModal, setTradeModal] = useState(null); // {action, symbol}
  const [tradeShares, setTradeShares] = useState("1");

  const [allocMode, setAllocMode] = useState("sector"); // sector | symbol

  const portfolio = useMemo(
    () => state.portfolios.find((p) => p.id === selectedPortfolioId) ?? state.portfolios[0],
    [state.portfolios, selectedPortfolioId]
  );

  const totalValue = useMemo(() => (portfolio ? computePortfolioValue(portfolio) : 0), [portfolio]);

  const allocData = useMemo(() => {
    if (!portfolio) return [];
    const raw = allocMode === "sector" ? allocationBySector(portfolio) : allocationBySymbol(portfolio);
    return raw
      .filter((x) => x.value > 0)
      .map((x) => ({ name: x.key, value: Number(x.value.toFixed(2)) }));
  }, [portfolio, allocMode]);

  const performanceData = useMemo(() => {
    if (!portfolio) return [];
    return computePerformanceSeries(portfolio, 60);
  }, [portfolio]);

  const setToast = (msg, kind = "status") => {
    setError(kind === "error" ? msg : "");
    setStatus(kind === "status" ? msg : "");
    setTimeout(() => {
      setError("");
      setStatus("");
    }, 2600);
  };

  const onCreate = () => {
    try {
      const id = createPortfolio(newName);
      setSelectedPortfolioId(id);
      setNewsContextMode("portfolio");
      setNewName("");
      setToast("Portfolio created.", "status");
    } catch (e) {
      setToast(e.message, "error");
    }
  };

  const onRename = () => {
    try {
      renamePortfolio(portfolio.id, renameValue);
      setRenameValue("");
      setToast("Portfolio renamed.", "status");
    } catch (e) {
      setToast(e.message, "error");
    }
  };

  const onDelete = () => {
    deletePortfolio(portfolio.id);
    setSelectedPortfolioId("default");
    setConfirmDelete(false);
    setToast("Portfolio deleted.", "status");
  };

  const onAddHolding = () => {
    const sym = addSymbol.trim().toUpperCase();
    const exists = MOCK_STOCKS.some((s) => s.symbol === sym);
    if (!exists) {
      setToast("Unknown symbol. Try AAPL, MSFT, NVDA, TSLA…", "error");
      return;
    }
    updatePortfolio(portfolio.id, (p) => {
      if (p.holdings.some((h) => h.symbol === sym)) return p;
      return { ...p, holdings: [...p.holdings, { symbol: sym, shares: 0, avgCost: getQuote(sym) }] };
    });
    setAddSymbol("");
    setToast("Holding added.", "status");
  };

  const onRemoveHolding = (sym) => {
    updatePortfolio(portfolio.id, (p) => ({ ...p, holdings: p.holdings.filter((h) => h.symbol !== sym) }));
    setToast("Holding removed.", "status");
  };

  const openTrade = (action, symbol) => {
    setTradeModal({ action, symbol });
    setTradeShares("1");
  };

  const confirmTrade = () => {
    try {
      updatePortfolio(portfolio.id, (p) => performTrade(p, { action: tradeModal.action, symbol: tradeModal.symbol, shares: tradeShares }));
      setTradeModal(null);
      setToast("Trade executed.", "status");
    } catch (e) {
      setToast(`Cannot ${tradeModal.action === "BUY" ? "buy" : "sell"}: ${e.message}`, "error");
    }
  };

  if (!portfolio) {
    return (
      <section className="card" style={{ padding: 16 }}>
        <h1>Portfolio</h1>
        <p className="help-text">No portfolio available.</p>
      </section>
    );
  }

  return (
    <section className={`card ${styles.wrap}`} aria-label="Portfolio dashboard">
      <div className={styles.header}>
        <h1 className={styles.h1}>Portfolio</h1>
        <div className={styles.toastArea}>
          {error && (
            <div role="alert" className={styles.toastError}>
              {error}
            </div>
          )}
          {status && (
            <div role="status" className={styles.toastStatus}>
              {status}
            </div>
          )}
        </div>
      </div>

      <div className={styles.selectorRow} aria-label="Portfolio selector and actions">
        <div className="field">
          <label htmlFor="pfSelect">Select Portfolio</label>
          <select
            id="pfSelect"
            className="select"
            value={portfolio.id}
            onChange={(e) => {
              setSelectedPortfolioId(e.target.value);
              setNewsContextMode("portfolio");
            }}
            aria-label="Select portfolio"
          >
            {state.portfolios.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.inlineForm}>
          <div className="field">
            <label htmlFor="newPf">New Portfolio</label>
            <input id="newPf" className="input" value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Name" />
          </div>
          <button className="btn primary" onClick={onCreate} aria-label="New portfolio">
            New Portfolio
          </button>
        </div>

        <div className={styles.inlineForm}>
          <div className="field">
            <label htmlFor="rename">Rename</label>
            <input id="rename" className="input" value={renameValue} onChange={(e) => setRenameValue(e.target.value)} placeholder="New name" />
          </div>
          <button className="btn" onClick={onRename} aria-label="Rename portfolio">
            Rename
          </button>
          <button className="btn danger" onClick={() => setConfirmDelete(true)} aria-label="Delete portfolio">
            Delete
          </button>
        </div>
      </div>

      <div className={styles.summary}>
        <div className={styles.stat}>
          <div className={styles.label}>Total Value</div>
          <div className={styles.value}>{formatMoney(totalValue)}</div>
        </div>
        <div className={styles.stat}>
          <div className={styles.label}>Cash</div>
          <div className={styles.value}>{formatMoney(portfolio.cash)}</div>
        </div>
        <div className={styles.stat}>
          <div className={styles.label}>Holdings</div>
          <div className={styles.value}>{portfolio.holdings.length}</div>
        </div>
      </div>

      <div className={styles.grid}>
        <div className={styles.panel}>
          <h2 className={styles.h2}>Holdings</h2>

          <div className={styles.addRow}>
            <div className="field">
              <label htmlFor="addSymbol">Add stock to portfolio</label>
              <input
                id="addSymbol"
                className="input"
                value={addSymbol}
                onChange={(e) => setAddSymbol(e.target.value)}
                placeholder="e.g. MSFT"
                aria-label="Add stock to portfolio"
              />
            </div>
            <button className="btn primary" onClick={onAddHolding} aria-label="Add">
              Add
            </button>
          </div>

          <div className={styles.tableWrap} role="region" aria-label="Portfolio holdings table">
            <table className={styles.table}>
              <thead>
                <tr>
                  <th scope="col">Symbol</th>
                  <th scope="col">Shares</th>
                  <th scope="col">Avg Cost</th>
                  <th scope="col">Price</th>
                  <th scope="col">P/L</th>
                  <th scope="col">Trade</th>
                  <th scope="col">Remove</th>
                </tr>
              </thead>
              <tbody>
                {portfolio.holdings.map((h) => {
                  const price = getQuote(h.symbol);
                  const pl = (price - h.avgCost) * h.shares;
                  return (
                    <tr key={h.symbol} role="row" aria-label={h.symbol}>
                      <th scope="row">{h.symbol}</th>
                      <td>{h.shares}</td>
                      <td>{formatMoney(h.avgCost)}</td>
                      <td>{formatMoney(price)}</td>
                      <td className={pl >= 0 ? styles.good : styles.bad}>{formatMoney(pl)}</td>
                      <td>
                        <div className={styles.tradeBtns}>
                          <button className="btn" onClick={() => openTrade("BUY", h.symbol)} aria-label="Buy">
                            Buy
                          </button>
                          <button className="btn" onClick={() => openTrade("SELL", h.symbol)} aria-label="Sell">
                            Sell
                          </button>
                        </div>
                      </td>
                      <td>
                        <button className="btn danger" onClick={() => onRemoveHolding(h.symbol)} aria-label={`Remove ${h.symbol}`}>
                          Remove
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {portfolio.holdings.length === 0 && (
                  <tr>
                    <td colSpan={7} className={styles.empty}>
                      No holdings yet. Add a stock to begin.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <h2 className={styles.h2}>Trade History</h2>
          <div className={styles.history} role="region" aria-label="Trade history">
            {portfolio.trades.length === 0 ? (
              <div className={styles.empty}>No trades yet.</div>
            ) : (
              <ul className={styles.tradeList}>
                {portfolio.trades.slice(0, 10).map((t) => (
                  <li key={t.id} className={styles.tradeItem}>
                    <strong>{t.action}</strong> {t.shares} {t.symbol} @ {formatMoney(t.price)}{" "}
                    <span className={styles.muted}>({new Date(t.timestamp).toLocaleString()})</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className={styles.panel}>
          <h2 className={styles.h2}>Allocation</h2>
          <div className={styles.allocToggle} role="group" aria-label="Allocation view selector">
            <button className={`btn ${allocMode === "sector" ? "secondary" : ""}`} onClick={() => setAllocMode("sector")}>
              By sector
            </button>
            <button className={`btn ${allocMode === "symbol" ? "secondary" : ""}`} onClick={() => setAllocMode("symbol")}>
              By stock
            </button>
          </div>

          <div className={styles.chartBox} aria-label="Allocation chart">
            {allocData.length === 0 ? (
              <div className={styles.empty}>Add holdings to see allocation.</div>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Tooltip />
                  <Pie data={allocData} dataKey="value" nameKey="name" outerRadius={100} label>
                    {allocData.map((_, idx) => (
                      <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>

          <h2 className={styles.h2}>Performance (mock)</h2>
          <div className={styles.chartBox} aria-label="Performance chart">
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={performanceData} margin={{ left: 8, right: 10, top: 10, bottom: 0 }}>
                <CartesianGrid stroke="rgba(107,114,128,0.15)" />
                <XAxis dataKey="date" tickFormatter={formatDateTick} minTickGap={18} />
                <YAxis domain={["auto", "auto"]} />
                <Tooltip />
                <Line type="monotone" dataKey="value" stroke="#2563EB" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <p className="help-text">
            Holdings can be added even with 0 shares; use Buy/Sell to simulate trades and see metrics update instantly.
          </p>
        </div>
      </div>

      {confirmDelete && (
        <div className={styles.modalOverlay} role="presentation" onClick={() => setConfirmDelete(false)}>
          <div className={styles.modal} role="dialog" aria-modal="true" aria-label="Confirm delete" onClick={(e) => e.stopPropagation()}>
            <h3 className={styles.h3}>Confirm delete</h3>
            <p>Delete “{portfolio.name}”? This cannot be undone.</p>
            <div className={styles.modalActions}>
              <button className="btn" onClick={() => setConfirmDelete(false)}>
                Cancel
              </button>
              <button className="btn danger" onClick={onDelete}>
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {tradeModal && (
        <div className={styles.modalOverlay} role="presentation" onClick={() => setTradeModal(null)}>
          <div
            className={styles.modal}
            role="dialog"
            aria-modal="true"
            aria-label={`${tradeModal.action === "BUY" ? "Buy" : "Sell"} shares`}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className={styles.h3}>
              {tradeModal.action === "BUY" ? "Buy" : "Sell"} {tradeModal.symbol}
            </h3>
            <div className="help-text">Price (mock): {formatMoney(getQuote(tradeModal.symbol))}</div>

            <div className={styles.tradeForm}>
              <div className="field">
                <label htmlFor="shares">Shares</label>
                <input
                  id="shares"
                  className="input"
                  inputMode="numeric"
                  value={tradeShares}
                  onChange={(e) => setTradeShares(e.target.value)}
                  aria-label="Shares"
                />
              </div>

              <div className={styles.modalActions}>
                <button className="btn" onClick={() => setTradeModal(null)}>
                  Cancel
                </button>
                <button
                  className={`btn ${tradeModal.action === "BUY" ? "primary" : ""}`}
                  onClick={confirmTrade}
                  aria-label={tradeModal.action === "BUY" ? "Confirm buy" : "Confirm sell"}
                >
                  Confirm {tradeModal.action === "BUY" ? "Buy" : "Sell"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <p className="help-text">News context will automatically show portfolio-related articles when you view this page.</p>
      <div className="sr-only" aria-live="polite">
        {error || status}
      </div>

      <div className="sr-only">
        <span>{findStockLabel("AAPL")}</span>
      </div>
    </section>
  );
}
