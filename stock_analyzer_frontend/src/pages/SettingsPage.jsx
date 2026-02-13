import React, { useId, useState } from 'react';
import { useApp } from '../state/AppContext.jsx';
import { DEFAULT_PREFERENCES } from '../state/defaults.js';
import Modal from '../components/common/Modal.jsx';

// PUBLIC_INTERFACE
export default function SettingsPage() {
  /** Settings & preferences page. */
  const { preferences, setPreferences } = useApp();
  const [confirmReset, setConfirmReset] = useState(false);
  const titleId = useId();

  return (
    <div className="grid" aria-label="Settings page">
      <section className="card" aria-label="User preferences">
        <h2>Preferences</h2>

        <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))' }}>
          <div>
            <label className="small-muted" htmlFor="theme">
              Theme
            </label>
            <select
              id="theme"
              className="select"
              value={preferences.theme}
              onChange={(e) => setPreferences((p) => ({ ...p, theme: e.target.value }))}
              aria-label="Theme selection"
            >
              <option value="light">Light</option>
              <option value="dark">Dark</option>
            </select>
          </div>

          <div>
            <label className="small-muted" htmlFor="default-timeframe">
              Default chart timeframe (session)
            </label>
            <select
              id="default-timeframe"
              className="select"
              value={preferences.chart.defaultTimeframe}
              onChange={(e) =>
                setPreferences((p) => ({ ...p, chart: { ...p.chart, defaultTimeframe: e.target.value } }))
              }
            >
              <option value="1D">1D</option>
              <option value="1W">1W</option>
              <option value="1M">1M</option>
              <option value="1Y">1Y</option>
              <option value="ALL">All</option>
            </select>
          </div>

          <div>
            <label className="small-muted" htmlFor="default-type">
              Default chart type (session)
            </label>
            <select
              id="default-type"
              className="select"
              value={preferences.chart.chartType}
              onChange={(e) => setPreferences((p) => ({ ...p, chart: { ...p.chart, chartType: e.target.value } }))}
            >
              <option value="line">Line</option>
              <option value="bar">Bar</option>
              <option value="candlestick">Candlestick (simplified)</option>
            </select>
          </div>

          <div>
            <label className="small-muted" htmlFor="refresh">
              Data refresh interval
            </label>
            <select
              id="refresh"
              className="select"
              value={preferences.refreshInterval}
              onChange={(e) => setPreferences((p) => ({ ...p, refreshInterval: e.target.value }))}
            >
              <option value="30s">30 seconds</option>
              <option value="1m">1 minute</option>
              <option value="5m">5 minutes</option>
              <option value="manual">Manual only</option>
            </select>
          </div>
        </div>

        <div className="notice" style={{ marginTop: 12 }}>
          Changes are applied immediately and stored for this browser session only (sessionStorage).
        </div>

        <div style={{ marginTop: 12 }} className="row">
          <button type="button" className="btn danger" onClick={() => setConfirmReset(true)}>
            Reset to defaults
          </button>
        </div>
      </section>

      {confirmReset ? (
        <Modal
          title="Reset all preferences?"
          labelledById={titleId}
          onClose={() => setConfirmReset(false)}
          actions={
            <>
              <button type="button" className="btn" onClick={() => setConfirmReset(false)}>
                Cancel
              </button>
              <button
                type="button"
                className="btn danger"
                onClick={() => {
                  setPreferences(DEFAULT_PREFERENCES);
                  setConfirmReset(false);
                }}
              >
                Reset
              </button>
            </>
          }
        >
          <div className="notice error">This will restore theme, chart defaults, and refresh settings for this session.</div>
        </Modal>
      ) : null}
    </div>
  );
}
