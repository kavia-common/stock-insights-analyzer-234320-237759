export const STOCKS = [
  { symbol: 'AAPL', name: 'Apple Inc.', sector: 'Technology', marketCap: 2800, price: 189.2 },
  { symbol: 'MSFT', name: 'Microsoft', sector: 'Technology', marketCap: 3100, price: 412.5 },
  { symbol: 'NVDA', name: 'NVIDIA', sector: 'Technology', marketCap: 2200, price: 875.1 },
  { symbol: 'JPM', name: 'JPMorgan Chase', sector: 'Financials', marketCap: 560, price: 174.2 },
  { symbol: 'XOM', name: 'Exxon Mobil', sector: 'Energy', marketCap: 470, price: 103.4 },
  { symbol: 'UNH', name: 'UnitedHealth Group', sector: 'Healthcare', marketCap: 510, price: 523.7 },
  { symbol: 'TSLA', name: 'Tesla', sector: 'Consumer Discretionary', marketCap: 600, price: 193.6 },
  { symbol: 'KO', name: 'Coca-Cola', sector: 'Consumer Staples', marketCap: 265, price: 60.4 },
  { symbol: 'AMZN', name: 'Amazon.com', sector: 'Consumer Discretionary', marketCap: 1750, price: 171.3 },
  { symbol: 'V', name: 'Visa', sector: 'Financials', marketCap: 530, price: 274.8 }
];

export const TIMEFRAMES = [
  { key: '1D', label: '1D', points: 24 },
  { key: '1W', label: '1W', points: 7 },
  { key: '1M', label: '1M', points: 30 },
  { key: '1Y', label: '1Y', points: 52 },
  { key: 'ALL', label: 'All', points: 120 }
];

function seededRandom(seed) {
  // Simple deterministic RNG for stable mock series.
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

// PUBLIC_INTERFACE
export function getStockBySymbol(symbol) {
  /** Returns stock metadata for a given symbol. */
  return STOCKS.find((s) => s.symbol === symbol) || STOCKS[0];
}

// PUBLIC_INTERFACE
export function generateSeries(symbol, timeframeKey) {
  /** Generates deterministic OHLC mock data per symbol and timeframe. */
  const stock = getStockBySymbol(symbol);
  const tf = TIMEFRAMES.find((t) => t.key === timeframeKey) || TIMEFRAMES[2];
  const rand = seededRandom(
    symbol
      .split('')
      .reduce((acc, ch) => acc + ch.charCodeAt(0), 0) + tf.points
  );

  const now = new Date();
  let base = stock.price * (0.85 + rand() * 0.3);
  const series = [];

  for (let i = tf.points - 1; i >= 0; i -= 1) {
    const d = new Date(now);
    if (timeframeKey === '1D') d.setHours(now.getHours() - i);
    else if (timeframeKey === '1W' || timeframeKey === '1M') d.setDate(now.getDate() - i);
    else d.setDate(now.getDate() - i * 7);

    const drift = (rand() - 0.45) * 1.2;
    const volatility = 0.8 + rand() * 1.6;
    const open = base;
    const close = Math.max(1, open + drift * volatility);
    const high = Math.max(open, close) + rand() * volatility;
    const low = Math.min(open, close) - rand() * volatility;
    const volume = Math.round(800000 + rand() * 1200000);

    series.push({
      t: d.toISOString(),
      open,
      high,
      low,
      close,
      volume
    });

    base = close;
  }

  return series;
}
