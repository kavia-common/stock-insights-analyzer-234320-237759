import { STOCKS } from '../mock/stocks.js';

const LS_KEY = 'sia.portfolios.v1';

function nowIso() {
  return new Date().toISOString();
}

function defaultPortfolios() {
  return [
    {
      id: 'p1',
      name: 'Demo Portfolio',
      cash: 50_000,
      holdings: [
        { symbol: 'AAPL', shares: 40, avgCost: 165.0 },
        { symbol: 'MSFT', shares: 15, avgCost: 360.0 }
      ],
      trades: []
    }
  ];
}

// PUBLIC_INTERFACE
export function loadPortfolios() {
  /** Loads portfolios from localStorage (allowed for portfolio per requirements). */
  try {
    const raw = window.localStorage.getItem(LS_KEY);
    if (!raw) return defaultPortfolios();
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : defaultPortfolios();
  } catch {
    return defaultPortfolios();
  }
}

// PUBLIC_INTERFACE
export function savePortfolios(portfolios) {
  /** Saves portfolios to localStorage. */
  try {
    window.localStorage.setItem(LS_KEY, JSON.stringify(portfolios));
  } catch {
    // ignore
  }
}

// PUBLIC_INTERFACE
export function getQuote(symbol) {
  /** Returns mock current price for symbol. */
  return STOCKS.find((s) => s.symbol === symbol)?.price ?? 0;
}

// PUBLIC_INTERFACE
export function computePortfolioValue(p) {
  /** Computes total value (cash + holdings at mock price). */
  const holdingsValue = p.holdings.reduce((sum, h) => sum + h.shares * getQuote(h.symbol), 0);
  return { total: p.cash + holdingsValue, holdingsValue };
}

// PUBLIC_INTERFACE
export function simulateTrade(portfolio, { symbol, side, shares }) {
  /** Simulates buy/sell trade and returns {nextPortfolio, error}. */
  const qty = Number(shares);
  if (!symbol || !['buy', 'sell'].includes(side)) return { error: 'Invalid trade action.' };
  if (!Number.isFinite(qty) || qty <= 0) return { error: 'Shares must be a positive number.' };

  const price = getQuote(symbol);
  if (!price) return { error: 'Unknown symbol.' };

  const next = structuredClone(portfolio);
  const holding = next.holdings.find((h) => h.symbol === symbol);

  if (side === 'buy') {
    const cost = qty * price;
    if (next.cash < cost) return { error: 'Insufficient cash for this buy.' };
    next.cash -= cost;
    if (!holding) {
      next.holdings.push({ symbol, shares: qty, avgCost: price });
    } else {
      const newShares = holding.shares + qty;
      holding.avgCost = (holding.avgCost * holding.shares + price * qty) / newShares;
      holding.shares = newShares;
    }
  } else {
    if (!holding || holding.shares < qty) return { error: 'You cannot sell more shares than you own.' };
    next.cash += qty * price;
    holding.shares -= qty;
    if (holding.shares === 0) next.holdings = next.holdings.filter((h) => h.symbol !== symbol);
  }

  next.trades.unshift({
    id: `t_${Math.random().toString(16).slice(2)}`,
    symbol,
    side,
    shares: qty,
    price,
    timestamp: nowIso()
  });

  return { nextPortfolio: next };
}
