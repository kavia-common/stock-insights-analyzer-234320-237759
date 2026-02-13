// PUBLIC_INTERFACE
export function sma(values, period) {
  /** Simple moving average; returns array aligned to input with nulls for insufficient lookback. */
  const out = values.map(() => null);
  for (let i = period - 1; i < values.length; i += 1) {
    let sum = 0;
    for (let j = i - period + 1; j <= i; j += 1) sum += values[j];
    out[i] = sum / period;
  }
  return out;
}

// PUBLIC_INTERFACE
export function ema(values, period) {
  /** Exponential moving average; returns array aligned to input with nulls for insufficient lookback. */
  const out = values.map(() => null);
  const k = 2 / (period + 1);
  let prev = null;
  for (let i = 0; i < values.length; i += 1) {
    const v = values[i];
    if (i < period - 1) continue;
    if (prev === null) {
      // seed with SMA
      const seed = values.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0) / period;
      prev = seed;
      out[i] = seed;
      continue;
    }
    const next = v * k + prev * (1 - k);
    out[i] = next;
    prev = next;
  }
  return out;
}

// PUBLIC_INTERFACE
export function rsi(values, period) {
  /** RSI (Wilder's) aligned to input; nulls for insufficient lookback. */
  const out = values.map(() => null);
  let avgGain = 0;
  let avgLoss = 0;

  for (let i = 1; i < values.length; i += 1) {
    const change = values[i] - values[i - 1];
    const gain = Math.max(0, change);
    const loss = Math.max(0, -change);

    if (i <= period) {
      avgGain += gain;
      avgLoss += loss;
      if (i === period) {
        avgGain /= period;
        avgLoss /= period;
        const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
        out[i] = 100 - 100 / (1 + rs);
      }
      continue;
    }

    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;

    const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
    out[i] = 100 - 100 / (1 + rs);
  }

  return out;
}

// PUBLIC_INTERFACE
export function computeTrendSummary(closes) {
  /** Returns a simple trend direction/momentum summary for the Trend Summary panel. */
  if (closes.length < 8) return { direction: 'sideways', momentum: 'low', changePct: 0 };
  const first = closes[0];
  const last = closes[closes.length - 1];
  const changePct = ((last - first) / first) * 100;

  const direction = changePct > 2 ? 'uptrend' : changePct < -2 ? 'downtrend' : 'sideways';

  const recent = closes.slice(-8);
  let vol = 0;
  for (let i = 1; i < recent.length; i += 1) vol += Math.abs(recent[i] - recent[i - 1]);
  const avgVol = vol / (recent.length - 1);

  const momentum = avgVol > Math.abs(last - first) / closes.length ? 'medium' : 'low';
  return { direction, momentum, changePct: Number(changePct.toFixed(2)) };
}

// PUBLIC_INTERFACE
export function detectMockPatterns(closes) {
  /** Lightweight mock pattern detection returning a list of detected patterns. */
  if (closes.length < 20) return [];
  const out = [];

  const max = Math.max(...closes);
  const min = Math.min(...closes);
  const range = max - min;

  // "Triangle" if range compresses in last third (mocked heuristic)
  const a = closes.slice(0, Math.floor(closes.length * 0.33));
  const b = closes.slice(Math.floor(closes.length * 0.66));
  const rangeA = Math.max(...a) - Math.min(...a);
  const rangeB = Math.max(...b) - Math.min(...b);
  if (rangeB < rangeA * 0.7) out.push({ name: 'Triangle (mock)', significance: 'Potential breakout after consolidation.' });

  // "Double top" if two peaks near max
  const peaks = closes.filter((v) => v > max - range * 0.05);
  if (peaks.length >= 2) out.push({ name: 'Double Top (mock)', significance: 'Possible resistance and reversal risk.' });

  return out;
}
