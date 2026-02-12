import React, { useMemo, useRef, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import { generateTimeSeries } from "../../data/mockStocks.js";
import { calcEMA, calcRSI, calcSMA } from "../../utils/indicators.js";
import { useAppState } from "../../state/app/AppStateContext.jsx";
import { usePreferences } from "../../state/preferences/PreferencesContext.jsx";
import styles from "./StockChartPanel.module.css";

const TIMEFRAME_TO_DAYS = {
  "1D": 1,
  "1W": 7,
  "1M": 30,
  "1Y": 365,
  ALL: 720
};

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

async function exportSvgAsImage(svgEl, type) {
  const svgData = new XMLSerializer().serializeToString(svgEl);
  const svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
  const svgUrl = URL.createObjectURL(svgBlob);

  const img = new Image();
  img.src = svgUrl;
  await new Promise((resolve, reject) => {
    img.onload = resolve;
    img.onerror = reject;
  });

  const width = Math.max(900, svgEl.clientWidth || 900);
  const height = Math.max(420, svgEl.clientHeight || 420);
  const canvas = document.createElement("canvas");
  canvas.width = width * 2;
  canvas.height = height * 2;
  const ctx = canvas.getContext("2d");
  ctx.scale(2, 2);

  // Background
  ctx.fillStyle = getComputedStyle(document.body).getPropertyValue("--ocean-surface") || "#ffffff";
  ctx.fillRect(0, 0, width, height);
  ctx.drawImage(img, 0, 0, width, height);

  URL.revokeObjectURL(svgUrl);

  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), type === "jpg" ? "image/jpeg" : "image/png", 0.92);
  });
}

function formatDateTick(dateStr) {
  // YYYY-MM-DD -> MM/DD
  const [y, m, d] = dateStr.split("-");
  return `${m}/${d}`;
}

// PUBLIC_INTERFACE
export default function StockChartPanel() {
  /** Chart panel supporting multiple chart types, timeframes, indicator overlays, and export. */
  const { selectedStock } = useAppState();
  const { preferences, setPreferences } = usePreferences();
  const [exportFormat, setExportFormat] = useState("png");
  const [exportStatus, setExportStatus] = useState("");

  const svgWrapRef = useRef(null);

  const days = TIMEFRAME_TO_DAYS[preferences.timeframe] ?? 30;

  const series = useMemo(() => {
    const points = generateTimeSeries(selectedStock.symbol, Math.max(days, 30));
    const sliced = preferences.timeframe === "1D" ? points.slice(-10) : points.slice(-days);

    const closes = sliced.map((p) => p.close);
    const sma = preferences.indicators.sma.enabled ? calcSMA(closes, preferences.indicators.sma.period) : [];
    const ema = preferences.indicators.ema.enabled ? calcEMA(closes, preferences.indicators.ema.period) : [];
    const rsi = preferences.indicators.rsi.enabled ? calcRSI(closes, preferences.indicators.rsi.period) : [];

    return sliced.map((p, idx) => ({
      ...p,
      sma: sma[idx],
      ema: ema[idx],
      rsi: rsi[idx]
    }));
  }, [selectedStock.symbol, days, preferences]);

  const chartType = preferences.chartType;

  const onExport = async () => {
    setExportStatus("");
    try {
      const svg = svgWrapRef.current?.querySelector("svg");
      if (!svg) throw new Error("Chart not ready");
      const blob = await exportSvgAsImage(svg, exportFormat);
      if (!blob) throw new Error("Export failed");
      downloadBlob(blob, `${selectedStock.symbol}-${preferences.timeframe}.${exportFormat}`);
      setExportStatus("Chart exported.");
      setTimeout(() => setExportStatus(""), 2000);
    } catch (e) {
      setExportStatus(`Export failed: ${e?.message || "Unknown error"}`);
      setTimeout(() => setExportStatus(""), 4000);
    }
  };

  const timeframeOptions = ["1D", "1W", "1M", "1Y", "ALL"];

  return (
    <section className={`card ${styles.wrap}`} aria-label="Stock chart visualization">
      <div className={styles.headerRow}>
        <div>
          <h1 className={styles.h1}>Charts</h1>
          <div className={styles.selected} data-testid="selected-stock">
            <span className="badge">
              <strong>{selectedStock.symbol}</strong> <span className={styles.muted}>{selectedStock.name}</span>
            </span>
          </div>
        </div>

        <div className={styles.controls} aria-label="Chart controls">
          <div className="field">
            <label htmlFor="chartType">Chart Type</label>
            <select
              id="chartType"
              className="select"
              value={chartType}
              onChange={(e) => setPreferences((p) => ({ ...p, chartType: e.target.value }))}
            >
              <option value="line">Line</option>
              <option value="bar">Bar</option>
              <option value="candlestick">Candlestick (mock)</option>
            </select>
          </div>

          <div className="field">
            <label htmlFor="timeframe">Timeframe</label>
            <select
              id="timeframe"
              className="select"
              value={preferences.timeframe}
              onChange={(e) => setPreferences((p) => ({ ...p, timeframe: e.target.value }))}
            >
              {timeframeOptions.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          <div className="field">
            <label htmlFor="exportFormat">Export</label>
            <div className={styles.exportRow}>
              <select
                id="exportFormat"
                className="select"
                value={exportFormat}
                onChange={(e) => setExportFormat(e.target.value)}
                aria-label="Export format"
              >
                <option value="png">PNG</option>
                <option value="jpg">JPG</option>
              </select>
              <button className="btn primary" onClick={onExport} aria-label="Export chart as image">
                Export
              </button>
            </div>
            <div role={exportStatus.includes("failed") ? "alert" : "status"} className="help-text" aria-live="polite">
              {exportStatus}
            </div>
          </div>
        </div>
      </div>

      <div className={styles.indicators}>
        <h2 className={styles.h2}>Technical Indicators</h2>
        <div className={styles.indicatorGrid}>
          <label className={styles.checkboxRow}>
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
            <span>SMA</span>
          </label>
          <div className="field">
            <label htmlFor="smaPeriod">SMA Period</label>
            <input
              id="smaPeriod"
              className="input"
              type="number"
              min={2}
              max={200}
              value={preferences.indicators.sma.period}
              onChange={(e) =>
                setPreferences((p) => ({
                  ...p,
                  indicators: { ...p.indicators, sma: { ...p.indicators.sma, period: Number(e.target.value) } }
                }))
              }
              disabled={!preferences.indicators.sma.enabled}
            />
          </div>

          <label className={styles.checkboxRow}>
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
            <span>EMA</span>
          </label>
          <div className="field">
            <label htmlFor="emaPeriod">EMA Period</label>
            <input
              id="emaPeriod"
              className="input"
              type="number"
              min={2}
              max={200}
              value={preferences.indicators.ema.period}
              onChange={(e) =>
                setPreferences((p) => ({
                  ...p,
                  indicators: { ...p.indicators, ema: { ...p.indicators.ema, period: Number(e.target.value) } }
                }))
              }
              disabled={!preferences.indicators.ema.enabled}
            />
          </div>

          <label className={styles.checkboxRow}>
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
            <span>RSI</span>
          </label>
          <div className="field">
            <label htmlFor="rsiPeriod">RSI Period</label>
            <input
              id="rsiPeriod"
              className="input"
              type="number"
              min={2}
              max={60}
              value={preferences.indicators.rsi.period}
              onChange={(e) =>
                setPreferences((p) => ({
                  ...p,
                  indicators: { ...p.indicators, rsi: { ...p.indicators.rsi, period: Number(e.target.value) } }
                }))
              }
              disabled={!preferences.indicators.rsi.enabled}
            />
          </div>
        </div>
        <div className="help-text">
          Indicators are calculated client-side on mock data. Candlestick chart is approximated in this demo.
        </div>
      </div>

      <div className={styles.chartArea} ref={svgWrapRef}>
        <ResponsiveContainer width="100%" height={420}>
          {chartType === "bar" ? (
            <BarChart data={series} margin={{ left: 8, right: 18, top: 10, bottom: 0 }}>
              <CartesianGrid stroke="rgba(107,114,128,0.15)" />
              <XAxis dataKey="date" tickFormatter={formatDateTick} minTickGap={18} />
              <YAxis domain={["auto", "auto"]} />
              <Tooltip
                contentStyle={{ borderRadius: 12, borderColor: "rgba(17,24,39,0.12)" }}
                labelFormatter={(v) => `Date: ${v}`}
              />
              <Legend />
              <Bar dataKey="close" name="Close" fill="#2563EB" radius={[6, 6, 0, 0]} />
            </BarChart>
          ) : chartType === "candlestick" ? (
            <ComposedChart data={series} margin={{ left: 8, right: 18, top: 10, bottom: 0 }}>
              <CartesianGrid stroke="rgba(107,114,128,0.15)" />
              <XAxis dataKey="date" tickFormatter={formatDateTick} minTickGap={18} />
              <YAxis domain={["auto", "auto"]} />
              <Tooltip
                contentStyle={{ borderRadius: 12, borderColor: "rgba(17,24,39,0.12)" }}
                formatter={(value, name, props) => {
                  if (name === "Close") return [`$${Number(value).toFixed(2)}`, name];
                  return [value, name];
                }}
                labelFormatter={(v) => `Date: ${v}`}
              />
              <Legend />
              {/* Mock candlestick: show high-low as bar and close as line */}
              <Bar dataKey="high" name="High (mock)" fill="rgba(245,158,11,0.35)" />
              <Bar dataKey="low" name="Low (mock)" fill="rgba(239,68,68,0.22)" />
              <Line type="monotone" dataKey="close" name="Close" stroke="#2563EB" strokeWidth={2} dot={false} />
              {preferences.indicators.sma.enabled && (
                <Line type="monotone" dataKey="sma" name={`SMA (${preferences.indicators.sma.period})`} stroke="#F59E0B" dot={false} />
              )}
              {preferences.indicators.ema.enabled && (
                <Line type="monotone" dataKey="ema" name={`EMA (${preferences.indicators.ema.period})`} stroke="#22C55E" dot={false} />
              )}
            </ComposedChart>
          ) : (
            <LineChart data={series} margin={{ left: 8, right: 18, top: 10, bottom: 0 }}>
              <CartesianGrid stroke="rgba(107,114,128,0.15)" />
              <XAxis dataKey="date" tickFormatter={formatDateTick} minTickGap={18} />
              <YAxis domain={["auto", "auto"]} />
              <Tooltip
                contentStyle={{ borderRadius: 12, borderColor: "rgba(17,24,39,0.12)" }}
                formatter={(value, name) => {
                  if (name === "Close" || String(name).startsWith("SMA") || String(name).startsWith("EMA")) {
                    return [`$${Number(value).toFixed(2)}`, name];
                  }
                  if (name === "RSI") return [Number(value).toFixed(1), name];
                  return [value, name];
                }}
                labelFormatter={(v) => `Date: ${v}`}
              />
              <Legend />
              <Line type="monotone" dataKey="close" name="Close" stroke="#2563EB" strokeWidth={2} dot={false} />
              {preferences.indicators.sma.enabled && (
                <Line
                  type="monotone"
                  dataKey="sma"
                  name={`SMA (${preferences.indicators.sma.period})`}
                  stroke="#F59E0B"
                  strokeWidth={2}
                  dot={false}
                />
              )}
              {preferences.indicators.ema.enabled && (
                <Line
                  type="monotone"
                  dataKey="ema"
                  name={`EMA (${preferences.indicators.ema.period})`}
                  stroke="#22C55E"
                  strokeWidth={2}
                  dot={false}
                />
              )}
              {preferences.indicators.rsi.enabled && (
                <Line type="monotone" dataKey="rsi" name="RSI" stroke="#A855F7" strokeWidth={2} dot={false} yAxisId={0} />
              )}
            </LineChart>
          )}
        </ResponsiveContainer>
      </div>

      <p className="help-text">
        Zoom/pan gestures are library-dependent; this demo focuses on accessible controls, tooltips, and export.
      </p>
    </section>
  );
}
