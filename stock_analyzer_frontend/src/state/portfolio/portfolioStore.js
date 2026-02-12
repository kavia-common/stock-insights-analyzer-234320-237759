import { MOCK_STOCKS, generateTimeSeries } from "../../data/mockStocks.js";

const STORAGE_KEY = "sia.portfolios";

function nowIso() {
  return new Date().toISOString();
}

function safeParse(json) {
  try {
    return JSON.parse(json);
  } catch {
    return null;
  }
}

function makeDefault() {
  return {
    portfolios: [
      {
        id: "default",
        name: "Demo Portfolio",
        cash: 50_000,
        holdings: [{ symbol: "AAPL", shares: 10, avgCost: 150 }],
        trades: []
      }
    ]
  };
}

// PUBLIC_INTERFACE
export function loadPortfolioState() {
  /** Load portfolios from localStorage, or provide a default seeded portfolio. */
  const saved = window.localStorage.getItem(STORAGE_KEY);
  const parsed = saved ? safeParse(saved) : null;
  return parsed?.portfolios ? parsed : makeDefault();
}

// PUBLIC_INTERFACE
export function savePortfolioState(state) {
  /** Persist portfolios to localStorage. */
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

// PUBLIC_INTERFACE
export function getQuote(symbol) {
  /** Simple quote from mock time series latest close. */
  const series = generateTimeSeries(symbol, 30);
  const last = series[series.length - 1];
  return last.close;
}

// PUBLIC_INTERFACE
export function computePortfolioValue(portfolio) {
  /** Compute total value (cash + holdings at current quote). */
  const holdingsValue = portfolio.holdings.reduce((sum, h) => sum + getQuote(h.symbol) * h.shares, 0);
  return portfolio.cash + holdingsValue;
}

// PUBLIC_INTERFACE
export function allocationBySymbol(portfolio) {
  /** Allocation breakdown by symbol. */
  const map = new Map();
  for (const h of portfolio.holdings) {
    map.set(h.symbol, (map.get(h.symbol) || 0) + getQuote(h.symbol) * h.shares);
  }
  return Array.from(map.entries()).map(([key, value]) => ({ key, value }));
}

// PUBLIC_INTERFACE
export function allocationBySector(portfolio) {
  /** Allocation breakdown by sector. */
  const sectorMap = new Map();
  for (const h of portfolio.holdings) {
    const sector = MOCK_STOCKS.find((s) => s.symbol === h.symbol)?.sector ?? "Other";
    sectorMap.set(sector, (sectorMap.get(sector) || 0) + getQuote(h.symbol) * h.shares);
  }
  return Array.from(sectorMap.entries()).map(([key, value]) => ({ key, value }));
}

// PUBLIC_INTERFACE
export function performTrade(portfolio, trade) {
  /**
   * Perform a mock trade. Throws Error for invalid trades.
   * trade: { action: "BUY"|"SELL", symbol, shares }
   */
  const shares = Number(trade.shares);
  if (!Number.isFinite(shares) || shares <= 0) throw new Error("Shares must be a positive number.");

  const price = getQuote(trade.symbol);
  const cost = price * shares;

  const next = JSON.parse(JSON.stringify(portfolio));
  const holding = next.holdings.find((h) => h.symbol === trade.symbol);

  if (trade.action === "BUY") {
    if (next.cash < cost) throw new Error("Insufficient cash to buy.");
    next.cash -= cost;
    if (!holding) {
      next.holdings.push({ symbol: trade.symbol, shares, avgCost: price });
    } else {
      const totalCost = holding.avgCost * holding.shares + cost;
      holding.shares += shares;
      holding.avgCost = totalCost / holding.shares;
    }
  } else {
    if (!holding || holding.shares < shares) throw new Error("Cannot sell more shares than you own.");
    holding.shares -= shares;
    next.cash += cost;
    if (holding.shares === 0) {
      next.holdings = next.holdings.filter((h) => h.symbol !== trade.symbol);
    }
  }

  next.trades.unshift({
    id: `tr_${Math.random().toString(16).slice(2)}`,
    action: trade.action,
    symbol: trade.symbol,
    shares,
    price,
    timestamp: nowIso()
  });

  return next;
}
