import React, { useMemo } from "react";
import { generateTimeSeries } from "../../data/mockStocks.js";
import { mockDetectPatterns, summarizeTrend } from "../../utils/indicators.js";
import { useAppState } from "../../state/app/AppStateContext.jsx";
import { usePreferences } from "../../state/preferences/PreferencesContext.jsx";
import styles from "./TrendSummaryPanel.module.css";

const TIMEFRAME_TO_DAYS = { "1D": 10, "1W": 14, "1M": 30, "1Y": 260, ALL: 720 };

function momentumLabel(m) {
  if (m > 0.75) return "Strong";
  if (m > 0.45) return "Moderate";
  return "Light";
}

// PUBLIC_INTERFACE
export default function TrendSummaryPanel() {
  /** Summary insights panel showing trend direction, momentum, and detected patterns (mock). */
  const { selectedStock } = useAppState();
  const { preferences } = usePreferences();

  const { direction, momentum, patterns } = useMemo(() => {
    const days = TIMEFRAME_TO_DAYS[preferences.timeframe] ?? 30;
    const series = generateTimeSeries(selectedStock.symbol, Math.max(days, 30)).slice(-days);
    const closes = series.map((p) => p.close);
    const t = summarizeTrend(closes);
    const p = mockDetectPatterns(closes);
    return { direction: t.direction, momentum: t.momentum, patterns: p };
  }, [selectedStock.symbol, preferences.timeframe]);

  const cueClass =
    direction === "Uptrend" ? styles.up : direction === "Downtrend" ? styles.down : styles.sideways;

  return (
    <section className={`card ${styles.wrap}`} aria-label="Trend summary insights">
      <h2 className={styles.h2}>Trend Insights</h2>

      <div className={styles.grid}>
        <div className={styles.metric}>
          <div className={styles.label}>Direction</div>
          <div className={`${styles.value} ${cueClass}`} aria-label={`Trend direction: ${direction}`}>
            {direction}
          </div>
        </div>

        <div className={styles.metric}>
          <div className={styles.label}>Momentum</div>
          <div className={styles.value} aria-label={`Momentum: ${momentumLabel(momentum)}`}>
            {momentumLabel(momentum)} <span className={styles.muted}>({Math.round(momentum * 100)}%)</span>
          </div>
          <div className={styles.meter} role="img" aria-label={`Momentum meter ${Math.round(momentum * 100)} percent`}>
            <div className={styles.meterFill} style={{ width: `${Math.round(momentum * 100)}%` }} />
          </div>
        </div>

        <div className={styles.metric}>
          <div className={styles.label}>Patterns (mock)</div>
          {patterns.length === 0 ? (
            <div className={styles.muted}>No notable patterns detected.</div>
          ) : (
            <ul className={styles.patternList}>
              {patterns.map((p) => (
                <li key={p.name}>
                  <strong>{p.name}:</strong> <span className={styles.muted}>{p.hint}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <p className="help-text">
        These insights are generated from mock data and simplified calculations intended for demonstration.
      </p>
    </section>
  );
}
