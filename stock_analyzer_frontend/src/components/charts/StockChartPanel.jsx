import React, { useMemo, useRef, useState } from 'react';
import html2canvas from 'html2canvas';
import {
  BarChart,
  Bar,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';
import { generateSeries, TIMEFRAMES, getStockBySymbol } from '../../mock/stocks.js';
import { useApp } from '../../state/AppContext.jsx';
import { computeTrendSummary, detectMockPatterns, ema, rsi, sma } from '../../utils/indicators.js';

function formatDate(iso) {
  const d = new Date(iso);
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

function formatTime(iso) {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, '0')}:00`;
}

function CustomTooltip({ active, payload, label, timeframe, indicatorKeys }) {
  if (!active || !payload?.length) return null;
  const p = payload[0]?.payload;
  return (
    <div className="card" style={{ padding: 10, boxShadow: 'var(--shadow)' }} role="status" aria-live="polite">
      <div>
        <strong>{timeframe === '1D' ? formatTime(label) : formatDate(label)}</strong>
      </div>
      <div className="small-muted">Close: ${p.close.toFixed(2)}</div>
      <div className="small-muted">Volume: {p.volume.toLocaleString()}</div>
      {indicatorKeys.map((k) => {
        const v = p[k];
        if (v == null) return null;
        return (
          <div key={k} className="small-muted">
            {k.toUpperCase()}: {Number(v).toFixed(2)}
          </div>
        );
      })}
    </div>
  );
}

// PUBLIC_INTERFACE
export default function StockChartPanel() {
  /** Stock chart visualization with mock series, indicators, patterns, and image export. */
  const { preferences, setPreferences, selectedSymbol, setNewsContext } = useApp();
  const [timeframe, setTimeframe] = useState(preferences.chart.defaultTimeframe);
  const [exportFormat, setExportFormat] = useState('png');
  const [exportError, setExportError] = useState('');

  const chartRef = useRef(null);

  const seriesRaw = useMemo(() => generateSeries(selectedSymbol, timeframe), [selectedSymbol, timeframe]);

  const series = useMemo(() => {
    const closes = seriesRaw.map((p) => p.close);
    const next = seriesRaw.map((p, idx) => ({ ...p }));

    const ind = preferences.chart.indicators;
    if (ind.sma.enabled) {
      const arr = sma(closes, ind.sma.period);
      next.forEach((p, i) => (p.sma = arr[i]));
    }
    if (ind.ema.enabled) {
      const arr = ema(closes, ind.ema.period);
      next.forEach((p, i) => (p.ema = arr[i]));
    }
    if (ind.rsi.enabled) {
      const arr = rsi(closes, ind.rsi.period);
      next.forEach((p, i) => (p.rsi = arr[i]));
    }
    return next;
  }, [seriesRaw, preferences.chart.indicators]);

  const indicatorKeys = useMemo(() => {
    const out = [];
    const ind = preferences.chart.indicators;
    if (ind.sma.enabled) out.push('sma');
    if (ind.ema.enabled) out.push('ema');
    if (ind.rsi.enabled) out.push('rsi');
    return out;
  }, [preferences.chart.indicators]);

  const trend = useMemo(() => {
    const closes = seriesRaw.map((p) => p.close);
    return computeTrendSummary(closes);
  }, [seriesRaw]);

  const patterns = useMemo(() => {
    if (!preferences.chart.patternDetectionEnabled) return [];
    return detectMockPatterns(seriesRaw.map((p) => p.close));
  }, [seriesRaw, preferences.chart.patternDetectionEnabled]);

  const stock = getStockBySymbol(selectedSymbol);

  function updateChartType(nextType) {
    setPreferences((prev) => ({
      ...prev,
      chart: { ...prev.chart, chartType: nextType }
    }));
  }

  function updateIndicator(key, patch) {
    setPreferences((prev) => ({
      ...prev,
      chart: {
        ...prev.chart,
        indicators: { ...prev.chart.indicators, [key]: { ...prev.chart.indicators[key], ...patch } }
      }
    }));
  }

  async function exportChart() {
    setExportError('');
    try {
      if (!chartRef.current) return;
      const canvas = await html2canvas(chartRef.current, { backgroundColor: null, scale: 2 });
      const mime = exportFormat === 'jpg' ? 'image/jpeg' : 'image/png';
      const dataUrl = canvas.toDataURL(mime, 0.92);
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = `${selectedSymbol}-${timeframe}.${exportFormat}`;
      a.click();
    } catch (e) {
      setExportError('Export failed. Please try again in another browser or reduce zoom.');
    }
  }

  return (
    <section className="card" aria-label="Stock chart panel" data-tour="chart">
      <div className="row" style={{ justifyContent: 'space-between' }}>
        <div>
          <h2 style={{ marginBottom: 4 }}>{stock.symbol} • {stock.name}</h2>
          <div className="small-muted">
            Sector: {stock.sector} • Market Cap: {stock.marketCap}B
          </div>
        </div>

        <div className="row">
          <label className="small-muted" htmlFor="chart-type">
            Chart type
          </label>
          <select
            id="chart-type"
            className="select"
            value={preferences.chart.chartType}
            onChange={(e) => updateChartType(e.target.value)}
          >
            <option value="line">Line</option>
            <option value="bar">Bar</option>
            <option value="candlestick">Candlestick (simplified)</option>
          </select>

          <label className="small-muted" htmlFor="timeframe">
            Timeframe
          </label>
          <select
            id="timeframe"
            className="select"
            value={timeframe}
            onChange={(e) => {
              setTimeframe(e.target.value);
              // keep news contextual
              setNewsContext({ type: 'stock', symbols: [selectedSymbol], sector: stock.sector });
            }}
          >
            {TIMEFRAMES.map((t) => (
              <option key={t.key} value={t.key}>
                {t.label}
              </option>
            ))}
          </select>

          <label className="small-muted" htmlFor="export-format">
            Export
          </label>
          <select
            id="export-format"
            className="select"
            value={exportFormat}
            onChange={(e) => setExportFormat(e.target.value)}
            aria-label="Export image format"
          >
            <option value="png">PNG</option>
            <option value="jpg">JPG</option>
          </select>

          <button type="button" className="btn primary" onClick={exportChart}>
            Download
          </button>
        </div>
      </div>

      {exportError ? (
        <div className="notice error" role="alert" style={{ marginTop: 10 }}>
          {exportError}
        </div>
      ) : null}

      <div className="row" style={{ marginTop: 10, alignItems: 'flex-end' }}>
        <fieldset style={{ border: '1px solid var(--ocean-border)', borderRadius: 12, padding: 10 }}>
          <legend className="small-muted">Indicators</legend>
          <div className="row">
            <IndicatorControl
              label="SMA"
              checked={preferences.chart.indicators.sma.enabled}
              period={preferences.chart.indicators.sma.period}
              onToggle={(v) => updateIndicator('sma', { enabled: v })}
              onPeriod={(p) => updateIndicator('sma', { period: p })}
            />
            <IndicatorControl
              label="EMA"
              checked={preferences.chart.indicators.ema.enabled}
              period={preferences.chart.indicators.ema.period}
              onToggle={(v) => updateIndicator('ema', { enabled: v })}
              onPeriod={(p) => updateIndicator('ema', { period: p })}
            />
            <IndicatorControl
              label="RSI"
              checked={preferences.chart.indicators.rsi.enabled}
              period={preferences.chart.indicators.rsi.period}
              onToggle={(v) => updateIndicator('rsi', { enabled: v })}
              onPeriod={(p) => updateIndicator('rsi', { period: p })}
            />
          </div>
        </fieldset>

        <label className="pill" htmlFor="patterns-toggle" title="Mock pattern detection highlights simple patterns">
          <input
            id="patterns-toggle"
            type="checkbox"
            checked={preferences.chart.patternDetectionEnabled}
            onChange={(e) =>
              setPreferences((prev) => ({
                ...prev,
                chart: { ...prev.chart, patternDetectionEnabled: e.target.checked }
              }))
            }
          />
          Pattern detection
        </label>

        <div className="pill" aria-label="Trend summary">
          <strong>{trend.direction}</strong>
          <span className="small-muted">{trend.changePct}%</span>
        </div>
      </div>

      <div ref={chartRef} style={{ marginTop: 12 }} aria-label="Chart area">
        <div style={{ height: 320 }}>
          <ResponsiveContainer width="100%" height="100%">
            {preferences.chart.chartType === 'bar' ? (
              <BarChart data={series}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--ocean-border)" />
                <XAxis dataKey="t" tickFormatter={(v) => (timeframe === '1D' ? formatTime(v) : formatDate(v))} />
                <YAxis domain={['auto', 'auto']} />
                <Tooltip
                  content={(props) => (
                    <CustomTooltip {...props} timeframe={timeframe} indicatorKeys={indicatorKeys} />
                  )}
                />
                <Bar dataKey="close" fill="var(--ocean-primary)" name="Close" />
              </BarChart>
            ) : (
              <LineChart data={series}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--ocean-border)" />
                <XAxis dataKey="t" tickFormatter={(v) => (timeframe === '1D' ? formatTime(v) : formatDate(v))} />
                <YAxis domain={['auto', 'auto']} />
                <Tooltip
                  content={(props) => (
                    <CustomTooltip {...props} timeframe={timeframe} indicatorKeys={indicatorKeys} />
                  )}
                />
                <Line
                  type="monotone"
                  dataKey="close"
                  stroke="var(--ocean-primary)"
                  strokeWidth={2}
                  dot={false}
                  name={preferences.chart.chartType === 'candlestick' ? 'Close (candlestick simplified)' : 'Close'}
                />
                {preferences.chart.indicators.sma.enabled ? (
                  <Line type="monotone" dataKey="sma" stroke="var(--ocean-secondary)" dot={false} name="SMA" />
                ) : null}
                {preferences.chart.indicators.ema.enabled ? (
                  <Line type="monotone" dataKey="ema" stroke="#22c55e" dot={false} name="EMA" />
                ) : null}
                {preferences.chart.indicators.rsi.enabled ? (
                  <Line type="monotone" dataKey="rsi" stroke="#a855f7" dot={false} name="RSI" />
                ) : null}
              </LineChart>
            )}
          </ResponsiveContainer>
        </div>

        {patterns.length ? (
          <div className="notice" style={{ marginTop: 10 }} role="note" aria-label="Pattern detections">
            <strong>Detected patterns:</strong>
            <ul style={{ margin: '6px 0 0 18px' }}>
              {patterns.map((p) => (
                <li key={p.name}>
                  <span>{p.name}</span> <span className="small-muted">— {p.significance}</span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    </section>
  );
}

function IndicatorControl({ label, checked, period, onToggle, onPeriod }) {
  const id = `ind-${label.toLowerCase()}`;
  return (
    <div className="pill">
      <label htmlFor={id} style={{ display: 'inline-flex', gap: 8, alignItems: 'center' }}>
        <input id={id} type="checkbox" checked={checked} onChange={(e) => onToggle(e.target.checked)} />
        {label}
      </label>
      <label className="small-muted" style={{ display: 'inline-flex', gap: 6, alignItems: 'center' }}>
        <span>Period</span>
        <input
          className="input"
          style={{ width: 70, padding: '6px 8px', borderRadius: 10 }}
          inputMode="numeric"
          value={period}
          onChange={(e) => onPeriod(Math.max(2, Number(e.target.value || 2)))}
          aria-label={`${label} period`}
        />
      </label>
    </div>
  );
}
