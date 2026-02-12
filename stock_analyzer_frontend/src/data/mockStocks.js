/**
 * Mock stocks dataset used throughout the application.
 * Market cap values are in USD (approx).
 */

export const MOCK_STOCKS = [
  { symbol: "AAPL", name: "Apple Inc.", sector: "Technology", price: 187.12, marketCap: 2.91e12 },
  { symbol: "MSFT", name: "Microsoft Corp.", sector: "Technology", price: 412.55, marketCap: 3.08e12 },
  { symbol: "NVDA", name: "NVIDIA Corp.", sector: "Technology", price: 689.3, marketCap: 1.7e12 },
  { symbol: "TSLA", name: "Tesla, Inc.", sector: "Consumer Discretionary", price: 192.21, marketCap: 6.1e11 },
  { symbol: "AMZN", name: "Amazon.com, Inc.", sector: "Consumer Discretionary", price: 173.41, marketCap: 1.8e12 },
  { symbol: "JPM", name: "JPMorgan Chase & Co.", sector: "Financials", price: 176.22, marketCap: 5.1e11 },
  { symbol: "XOM", name: "Exxon Mobil Corp.", sector: "Energy", price: 103.88, marketCap: 4.2e11 },
  { symbol: "JNJ", name: "Johnson & Johnson", sector: "Health Care", price: 156.02, marketCap: 3.7e11 },
  { symbol: "PG", name: "Procter & Gamble", sector: "Consumer Staples", price: 155.92, marketCap: 3.6e11 },
  { symbol: "V", name: "Visa Inc.", sector: "Financials", price: 276.12, marketCap: 5.7e11 }
];

export const SECTORS = Array.from(new Set(MOCK_STOCKS.map((s) => s.sector))).sort();

function seededNoise(i) {
  return Math.sin(i * 999) * 0.5 + Math.cos(i * 123) * 0.35;
}

/**
 * Returns generated time series points for a stock symbol.
 * Points include date, close, open, high, low, volume.
 */
// PUBLIC_INTERFACE
export function generateTimeSeries(symbol, days = 90) {
  /** Generate deterministic mock OHLCV time series for charting. */
  const base = MOCK_STOCKS.find((s) => s.symbol === symbol)?.price ?? 100;
  const points = [];
  const now = new Date();

  let lastClose = base;
  for (let i = days - 1; i >= 0; i -= 1) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);

    const drift = seededNoise(i) * 1.2;
    const close = Math.max(5, lastClose + drift);
    const open = Math.max(5, close + seededNoise(i + 1));
    const high = Math.max(open, close) + Math.abs(seededNoise(i + 2)) * 1.8;
    const low = Math.min(open, close) - Math.abs(seededNoise(i + 3)) * 1.8;
    const volume = Math.round(2_000_000 + Math.abs(seededNoise(i + 4)) * 5_000_000);

    points.push({
      date: d.toISOString().slice(0, 10),
      open: Number(open.toFixed(2)),
      high: Number(high.toFixed(2)),
      low: Number(low.toFixed(2)),
      close: Number(close.toFixed(2)),
      volume
    });

    lastClose = close;
  }

  return points;
}
