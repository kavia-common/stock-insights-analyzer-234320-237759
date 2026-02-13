import React, { useEffect, useMemo, useRef, useState } from 'react';

// PUBLIC_INTERFACE
export default function TrendlineOverlay({ series, height = 320 }) {
  /** Canvas overlay enabling simple trendline draw/move/delete with mouse/touch and keyboard. */
  const canvasRef = useRef(null);

  const points = useMemo(() => {
    // Map series to normalized points
    const closes = series.map((p) => p.close);
    const min = Math.min(...closes);
    const max = Math.max(...closes);
    const range = Math.max(1e-9, max - min);

    return series.map((p, idx) => ({
      idx,
      t: p.t,
      close: p.close,
      x: idx / Math.max(1, series.length - 1),
      y: 1 - (p.close - min) / range
    }));
  }, [series]);

  const [trendlines, setTrendlines] = useState([]);
  const [mode, setMode] = useState('view'); // view | draw
  const [draft, setDraft] = useState(null);
  const [selectedId, setSelectedId] = useState(null);

  useEffect(() => {
    draw();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trendlines, draft, points]);

  function snapToNearest(px, py, rect) {
    const xN = (px - rect.left) / rect.width;
    const yN = (py - rect.top) / rect.height;
    let best = points[0];
    let bestD = Infinity;
    for (const p of points) {
      const dx = p.x - xN;
      const dy = p.y - yN;
      const d = dx * dx + dy * dy;
      if (d < bestD) {
        bestD = d;
        best = p;
      }
    }
    return best;
  }

  function draw() {
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext('2d');
    if (!ctx) return;

    const rect = c.getBoundingClientRect();
    const w = Math.round(rect.width * devicePixelRatio);
    const h = Math.round(rect.height * devicePixelRatio);
    if (c.width !== w) c.width = w;
    if (c.height !== h) c.height = h;
    ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
    ctx.clearRect(0, 0, rect.width, rect.height);

    function line(a, b, highlight) {
      const x1 = a.x * rect.width;
      const y1 = a.y * rect.height;
      const x2 = b.x * rect.width;
      const y2 = b.y * rect.height;
      ctx.lineWidth = highlight ? 3 : 2;
      ctx.strokeStyle = highlight ? '#F59E0B' : 'rgba(37,99,235,0.9)';
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();

      // endpoints
      ctx.fillStyle = highlight ? '#F59E0B' : 'rgba(37,99,235,0.9)';
      ctx.beginPath();
      ctx.arc(x1, y1, 4, 0, Math.PI * 2);
      ctx.arc(x2, y2, 4, 0, Math.PI * 2);
      ctx.fill();
    }

    for (const t of trendlines) {
      line(t.a, t.b, t.id === selectedId);
    }
    if (draft) line(draft.a, draft.b, true);
  }

  function pointerToPoint(e) {
    const rect = canvasRef.current.getBoundingClientRect();
    const clientX = e.touches?.[0]?.clientX ?? e.clientX;
    const clientY = e.touches?.[0]?.clientY ?? e.clientY;
    return snapToNearest(clientX, clientY, rect);
  }

  function onPointerDown(e) {
    if (mode !== 'draw') return;
    e.preventDefault();
    const p = pointerToPoint(e);
    if (!draft) {
      setDraft({ a: p, b: p });
    } else {
      // finish
      setTrendlines((prev) => [...prev, { id: cryptoId(), a: draft.a, b: p }]);
      setDraft(null);
      setMode('view');
    }
  }

  function onPointerMove(e) {
    if (mode !== 'draw') return;
    if (!draft) return;
    e.preventDefault();
    const p = pointerToPoint(e);
    setDraft((d) => (d ? { ...d, b: p } : d));
  }

  function onKeyDown(e) {
    if (e.key === 'Escape') {
      setDraft(null);
      setMode('view');
      setSelectedId(null);
    }
    if (e.key.toLowerCase() === 'd') setMode('draw');
    if (e.key.toLowerCase() === 'v') setMode('view');

    if (e.key === 'Delete' && selectedId) {
      setTrendlines((prev) => prev.filter((t) => t.id !== selectedId));
      setSelectedId(null);
    }

    // keyboard nudge selected endpoints
    if (!selectedId) return;
    const step = e.shiftKey ? 3 : 1;
    if (!['ArrowLeft', 'ArrowRight'].includes(e.key)) return;

    e.preventDefault();
    setTrendlines((prev) =>
      prev.map((t) => {
        if (t.id !== selectedId) return t;
        const delta = e.key === 'ArrowRight' ? step : -step;
        const clampIdx = (i) => Math.max(0, Math.min(points.length - 1, i));
        const a = points[clampIdx(t.a.idx + delta)];
        const b = points[clampIdx(t.b.idx + delta)];
        return { ...t, a, b };
      })
    );
  }

  return (
    <div className="card" aria-label="Trendline tool">
      <div className="row" style={{ justifyContent: 'space-between' }}>
        <h2>Trendlines</h2>
        <div className="row">
          <button
            type="button"
            className={mode === 'draw' ? 'btn primary' : 'btn'}
            onClick={() => setMode(mode === 'draw' ? 'view' : 'draw')}
            aria-label="Toggle trendline drawing tool"
          >
            {mode === 'draw' ? 'Drawing: ON' : 'Draw trendline'}
          </button>
          <button
            type="button"
            className="btn danger"
            onClick={() => {
              setTrendlines([]);
              setSelectedId(null);
            }}
            aria-label="Clear all trendlines"
          >
            Clear
          </button>
        </div>
      </div>

      <div className="small-muted">
        Mouse/touch: click twice to set endpoints. Keyboard: D to draw, V to view, Delete removes selected line, arrows
        move line (Shift = larger step).
      </div>

      <div
        style={{ position: 'relative', marginTop: 10, height }}
        aria-label="Trendline overlay area"
      >
        <canvas
          ref={canvasRef}
          style={{ width: '100%', height: '100%', borderRadius: 12, border: '1px solid var(--ocean-border)' }}
          tabIndex={0}
          role="application"
          aria-label="Trendline canvas. Press D to start drawing."
          onKeyDown={onKeyDown}
          onMouseDown={onPointerDown}
          onMouseMove={onPointerMove}
          onTouchStart={onPointerDown}
          onTouchMove={onPointerMove}
          onClick={(e) => {
            if (mode === 'draw') return;
            // select nearest trendline by endpoint distance
            const rect = canvasRef.current.getBoundingClientRect();
            const clientX = e.clientX;
            const clientY = e.clientY;
            const xN = (clientX - rect.left) / rect.width;
            const yN = (clientY - rect.top) / rect.height;
            let best = null;
            let bestD = Infinity;
            for (const t of trendlines) {
              const d1 = (t.a.x - xN) ** 2 + (t.a.y - yN) ** 2;
              const d2 = (t.b.x - xN) ** 2 + (t.b.y - yN) ** 2;
              const d = Math.min(d1, d2);
              if (d < bestD) {
                bestD = d;
                best = t;
              }
            }
            if (best && bestD < 0.01) setSelectedId(best.id);
            else setSelectedId(null);
          }}
        />
      </div>

      {selectedId ? (
        <div className="notice" style={{ marginTop: 10 }} role="status" aria-live="polite">
          Trendline selected. Press Delete to remove or use arrow keys to shift.
        </div>
      ) : null}
    </div>
  );
}

function cryptoId() {
  try {
    return crypto.randomUUID();
  } catch {
    return `id_${Math.random().toString(16).slice(2)}`;
  }
}
