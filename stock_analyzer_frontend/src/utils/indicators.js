/**
 * Indicator calculation helpers (client-side).
 * These are lightweight and designed for mock demonstrations, not production trading.
 */

// PUBLIC_INTERFACE
export function calcSMA(values, period) {
  /** Calculate simple moving average series aligned to input length (null for insufficient points). */
  const out = [];
  for (let i = 0; i < values.length; i += 1) {
    if (i + 1 < period) {
      out.push(null);
      continue;
    }
    const slice = values.slice(i + 1 - period, i + 1);
    const avg = slice.reduce((a, b) => a + b, 0) / period;
    out.push(avg);
  }
  return out;
}

// PUBLIC_INTERFACE
export function calcEMA(values, period) {
  /** Calculate exponential moving average series aligned to input length (null for insufficient points). */
  const out = [];
  const k = 2 / (period + 1);
  let ema = null;

  for (let i = 0; i < values.length; i += 1) {
    const v = values[i];
    if (i + 1 < period) {
      out.push(null);
      continue;
    }
    if (ema === null) {
      const seed = values.slice(i + 1 - period, i + 1).reduce((a, b) => a + b, 0) / period;
      ema = seed;
      out.push(ema);
      continue;
    }
    ema = v * k + ema * (1 - k);
    out.push(ema);
  }
  return out;
}

// PUBLIC_INTERFACE
export function calcRSI(values, period) {
  /** Calculate RSI series aligned to input length (null for insufficient points). */
  const out = [];
  let avgGain = 0;
  let avgLoss = 0;

  for (let i = 0; i < values.length; i += 1) {
    if (i === 0) {
      out.push(null);
      continue;
    }
    const change = values[i] - values[i - 1];
    const gain = Math.max(0, change);
    const loss = Math.max(0, -change);

    if (i <= period) {
      avgGain += gain;
      avgLoss += loss;
      out.push(null);
      if (i === period) {
        avgGain /= period;
        avgLoss /= period;
      }
      continue;
    }

    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;

    const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
    const rsi = 100 - 100 / (1 + rs);
    out.push(rsi);
  }

  return out;
}

// PUBLIC_INTERFACE
export function summarizeTrend(values) {
  /** Return a simple trend direction + momentum score based on slope and volatility. */
  if (values.length < 10) return { direction: "Sideways", momentum: 0.2 };
  const first = values[0];
  const last = values[values.length - 1];
  const delta = last - first;

  const direction = delta > 2 ? "Uptrend" : delta < -2 ? "Downtrend" : "Sideways";
  const abs = Math.abs(delta);
  const momentum = Math.min(1, abs / Math.max(5, Math.abs(first) * 0.05));
  return { direction, momentum };
}

// PUBLIC_INTERFACE
export function mockDetectPatterns(values) {
  /**
   * Very lightweight “pattern detection” mock:
   * returns a deterministic set of patterns based on the series shape.
   */
  const patterns = [];
  if (values.length < 30) return patterns;

  const mid = values[Math.floor(values.length / 2)];
  const max = Math.max(...values);
  const min = Math.min(...values);

  if (max - mid > (max - min) * 0.35) patterns.push({ name: "Double Top", hint: "Potential resistance near recent highs." });
  if (mid - min > (max - min) * 0.35) patterns.push({ name: "Triangle", hint: "Consolidation may precede a breakout." });

  return patterns.slice(0, 2);
}
