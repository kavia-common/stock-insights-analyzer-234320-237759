import React, { useMemo, useState } from "react";
import styles from "./TrendlineToolPanel.module.css";

function newTrendline() {
  const id = `tl_${Math.random().toString(16).slice(2)}`;
  return {
    id,
    name: `Trendline ${id.slice(-4)}`,
    createdAt: new Date().toISOString(),
    kind: "Support",
    snap: true
  };
}

// PUBLIC_INTERFACE
export default function TrendlineToolPanel() {
  /** Trendline UI allowing add/select/delete trendlines (state resets on reload). */
  const [trendlines, setTrendlines] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const selected = useMemo(() => trendlines.find((t) => t.id === selectedId) ?? null, [trendlines, selectedId]);

  const add = () => {
    const tl = newTrendline();
    setTrendlines((prev) => [tl, ...prev]);
    setSelectedId(tl.id);
  };

  const deleteSelected = () => {
    if (!selected) return;
    setTrendlines((prev) => prev.filter((t) => t.id !== selected.id));
    setSelectedId(null);
    setConfirmDelete(false);
  };

  return (
    <section className={`card ${styles.wrap}`} aria-label="Trendline tools">
      <div className={styles.header}>
        <h2 className={styles.h2}>Trendline Tools</h2>
        <div className={styles.actions}>
          <button className="btn primary" onClick={add} aria-label="Add trendline">
            Add Trendline
          </button>
          <button
            className="btn danger"
            onClick={() => setConfirmDelete(true)}
            disabled={!selected}
            aria-label="Delete selected trendline"
          >
            Delete
          </button>
        </div>
      </div>

      <div className={styles.grid}>
        <div>
          <div className={styles.subhead}>Trendlines</div>
          <ul className={styles.list} data-testid="trendline-list">
            {trendlines.length === 0 ? (
              <li className={styles.empty}>No trendlines yet. Add one to begin.</li>
            ) : (
              trendlines.map((t) => (
                <li key={t.id}>
                  <button
                    className={`${styles.itemBtn} ${t.id === selectedId ? styles.selected : ""}`}
                    onClick={() => setSelectedId(t.id)}
                    aria-label={`Select ${t.name}`}
                  >
                    <div className={styles.itemTitle}>{t.name}</div>
                    <div className={styles.itemMeta}>
                      {t.kind} • {t.snap ? "Snap: on" : "Snap: off"}
                    </div>
                  </button>
                </li>
              ))
            )}
          </ul>
          <p className="help-text">
            In this demo, “drawing” is represented as creating trendline objects. Full drag/edit overlays can be added later.
          </p>
        </div>

        <div>
          <div className={styles.subhead}>Selected</div>
          {selected ? (
            <div className={styles.detail}>
              <div className="field">
                <label htmlFor="kind">Type</label>
                <select
                  id="kind"
                  className="select"
                  value={selected.kind}
                  onChange={(e) =>
                    setTrendlines((prev) => prev.map((t) => (t.id === selected.id ? { ...t, kind: e.target.value } : t)))
                  }
                >
                  <option value="Support">Support</option>
                  <option value="Resistance">Resistance</option>
                  <option value="Custom">Custom</option>
                </select>
              </div>

              <label className={styles.checkboxRow}>
                <input
                  type="checkbox"
                  checked={selected.snap}
                  onChange={(e) =>
                    setTrendlines((prev) => prev.map((t) => (t.id === selected.id ? { ...t, snap: e.target.checked } : t)))
                  }
                />
                <span>Snap endpoints to nearest data points</span>
              </label>

              <div className="help-text">Created: {new Date(selected.createdAt).toLocaleString()}</div>
            </div>
          ) : (
            <div className={styles.empty}>Select a trendline to edit its settings.</div>
          )}
        </div>
      </div>

      {confirmDelete && (
        <div className={styles.modalOverlay} role="presentation" onClick={() => setConfirmDelete(false)}>
          <div
            className={styles.modal}
            role="dialog"
            aria-modal="true"
            aria-label="Confirm delete"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className={styles.h3}>Confirm delete</h3>
            <p>Delete the selected trendline? This action cannot be undone.</p>
            <div className={styles.modalActions}>
              <button className="btn" onClick={() => setConfirmDelete(false)}>
                Cancel
              </button>
              <button className="btn danger" onClick={deleteSelected}>
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
