import React, { useState } from "react";
import { useTheme } from "../../state/theme/ThemeContext.jsx";
import { DEFAULT_PREFERENCES, usePreferences } from "../../state/preferences/PreferencesContext.jsx";
import styles from "./SettingsPanel.module.css";

// PUBLIC_INTERFACE
export default function SettingsPanel() {
  /** Settings panel for theme, chart defaults, refresh intervals, and reset. */
  const { theme, toggleTheme } = useTheme();
  const { preferences, setPreferences, resetPreferences } = usePreferences();
  const [confirmReset, setConfirmReset] = useState(false);

  return (
    <section className={`card ${styles.wrap}`} aria-label="Settings">
      <h1 className={styles.h1}>Settings</h1>

      <section className={styles.section} aria-label="Theme settings">
        <h2 className={styles.h2}>Theme</h2>
        <div className={styles.row}>
          <div>
            <div className={styles.label}>Dark mode</div>
            <div className="help-text">Switch between light and dark Ocean Professional themes.</div>
          </div>
          <button
            className={`btn ${styles.switch}`}
            role="switch"
            aria-checked={theme === "dark"}
            aria-label="Dark mode"
            onClick={toggleTheme}
          >
            <span className={`${styles.knob} ${theme === "dark" ? styles.on : ""}`} aria-hidden="true" />
            <span className={styles.switchText}>{theme === "dark" ? "On" : "Off"}</span>
          </button>
        </div>
      </section>

      <section className={styles.section} aria-label="Chart preferences">
        <h2 className={styles.h2}>Chart Defaults</h2>
        <div className={styles.grid}>
          <div className="field">
            <label htmlFor="defaultChartType">Default chart type</label>
            <select
              id="defaultChartType"
              className="select"
              value={preferences.chartType}
              onChange={(e) => setPreferences((p) => ({ ...p, chartType: e.target.value }))}
            >
              <option value="line">Line</option>
              <option value="bar">Bar</option>
              <option value="candlestick">Candlestick (mock)</option>
            </select>
          </div>

          <div className="field">
            <label htmlFor="defaultTimeframe">Default timeframe</label>
            <select
              id="defaultTimeframe"
              className="select"
              value={preferences.timeframe}
              onChange={(e) => setPreferences((p) => ({ ...p, timeframe: e.target.value }))}
            >
              <option value="1D">1D</option>
              <option value="1W">1W</option>
              <option value="1M">1M</option>
              <option value="1Y">1Y</option>
              <option value="ALL">All</option>
            </select>
          </div>

          <div className={styles.indicators}>
            <div className={styles.label}>Default indicators</div>
            <label className={styles.checkRow}>
              <input
                type="checkbox"
                checked={preferences.indicators.sma.enabled}
                onChange={(e) =>
                  setPreferences((p) => ({
                    ...p,
                    indicators: { ...p.indicators, sma: { ...p.indicators.sma, enabled: e.target.checked } }
                  }))
                }
              />
              SMA ({preferences.indicators.sma.period})
            </label>
            <label className={styles.checkRow}>
              <input
                type="checkbox"
                checked={preferences.indicators.ema.enabled}
                onChange={(e) =>
                  setPreferences((p) => ({
                    ...p,
                    indicators: { ...p.indicators, ema: { ...p.indicators.ema, enabled: e.target.checked } }
                  }))
                }
              />
              EMA ({preferences.indicators.ema.period})
            </label>
            <label className={styles.checkRow}>
              <input
                type="checkbox"
                checked={preferences.indicators.rsi.enabled}
                onChange={(e) =>
                  setPreferences((p) => ({
                    ...p,
                    indicators: { ...p.indicators, rsi: { ...p.indicators.rsi, enabled: e.target.checked } }
                  }))
                }
              />
              RSI ({preferences.indicators.rsi.period})
            </label>
          </div>
        </div>
        <p className="help-text">Preferences are stored for the current session (sessionStorage) and reset when the session ends.</p>
      </section>

      <section className={styles.section} aria-label="Refresh settings">
        <h2 className={styles.h2}>Data Refresh Interval</h2>
        <div className="field">
          <label htmlFor="refresh">Refresh mode</label>
          <select
            id="refresh"
            className="select"
            value={preferences.refreshInterval}
            onChange={(e) => setPreferences((p) => ({ ...p, refreshInterval: e.target.value }))}
            aria-label="Data refresh interval"
          >
            <option value="30s">30 seconds</option>
            <option value="1m">1 minute</option>
            <option value="5m">5 minutes</option>
            <option value="manual">Manual refresh only</option>
          </select>
          <div className="help-text">
            In this mock app, refresh controls the news “refresh” prompt and can be used for future data polling.
          </div>
        </div>
      </section>

      <section className={styles.section} aria-label="Reset preferences">
        <h2 className={styles.h2}>Reset</h2>
        <button className="btn danger" onClick={() => setConfirmReset(true)} aria-label="Reset to defaults">
          Reset to Defaults
        </button>
        <div className="help-text">
          Restores preferences to: chart type {DEFAULT_PREFERENCES.chartType}, timeframe {DEFAULT_PREFERENCES.timeframe}, and refresh{" "}
          {DEFAULT_PREFERENCES.refreshInterval}.
        </div>
      </section>

      {confirmReset && (
        <div className={styles.modalOverlay} role="presentation" onClick={() => setConfirmReset(false)}>
          <div className={styles.modal} role="dialog" aria-modal="true" aria-label="Confirm reset" onClick={(e) => e.stopPropagation()}>
            <h3 className={styles.h3}>Confirm reset</h3>
            <p>Reset all preferences to defaults?</p>
            <div className={styles.modalActions}>
              <button className="btn" onClick={() => setConfirmReset(false)}>
                Cancel
              </button>
              <button
                className="btn danger"
                onClick={() => {
                  resetPreferences();
                  setConfirmReset(false);
                }}
              >
                Reset
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
