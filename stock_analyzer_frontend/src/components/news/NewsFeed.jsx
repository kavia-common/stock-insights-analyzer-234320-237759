import React, { useEffect, useMemo, useState } from "react";
import { MOCK_NEWS, NEWS_SOURCES } from "../../data/mockNews.js";
import { useAppState } from "../../state/app/AppStateContext.jsx";
import { usePortfolio } from "../../state/portfolio/PortfolioContext.jsx";
import styles from "./NewsFeed.module.css";

function toDate(ts) {
  return new Date(ts).getTime();
}

// PUBLIC_INTERFACE
export default function NewsFeed() {
  /** News feed with contextual filtering + sorting and accessible external links. */
  const { selectedSymbol, newsContextMode, selectedPortfolioId } = useAppState();
  const { state } = usePortfolio();

  const [source, setSource] = useState("");
  const [sort, setSort] = useState("recent"); // recent | relevant | source

  const [items, setItems] = useState(() => MOCK_NEWS);

  useEffect(() => {
    // Mock "refresh" by shuffling deterministically.
    const id = window.setInterval(() => {
      setItems((prev) => [...prev].sort((a, b) => (a.id > b.id ? 1 : -1)));
    }, 5 * 60 * 1000);
    return () => window.clearInterval(id);
  }, []);

  const portfolioSymbols = useMemo(() => {
    const pf = state.portfolios.find((p) => p.id === selectedPortfolioId);
    return pf ? pf.holdings.map((h) => h.symbol) : [];
  }, [state.portfolios, selectedPortfolioId]);

  const contextLabel = useMemo(() => {
    if (newsContextMode === "portfolio") return portfolioSymbols.length ? `News for portfolio (${portfolioSymbols.join(", ")})` : "News for portfolio";
    if (newsContextMode === "market") return "General Market News";
    return `News for: ${selectedSymbol}`;
  }, [newsContextMode, selectedSymbol, portfolioSymbols]);

  const filtered = useMemo(() => {
    let rows = [...items];

    // Contextual filter
    if (newsContextMode === "stock") {
      rows = rows.filter((n) => n.tags.symbols.includes(selectedSymbol) || n.tags.sectors.length === 0);
    } else if (newsContextMode === "portfolio") {
      if (portfolioSymbols.length) {
        rows = rows.filter((n) => n.tags.symbols.some((s) => portfolioSymbols.includes(s)) || n.tags.sectors.length === 0);
      }
    } else {
      rows = rows.filter((n) => n.tags.symbols.length === 0 && n.tags.sectors.length === 0);
    }

    if (source) rows = rows.filter((n) => n.source === source);

    if (sort === "recent") rows.sort((a, b) => toDate(b.publishedAt) - toDate(a.publishedAt));
    if (sort === "relevant") rows.sort((a, b) => b.relevance - a.relevance);
    if (sort === "source") rows.sort((a, b) => a.source.localeCompare(b.source));

    return rows;
  }, [items, selectedSymbol, newsContextMode, portfolioSymbols, source, sort]);

  return (
    <section className={`card ${styles.wrap}`} aria-label="Financial news feed">
      <div className={styles.header}>
        <h1 className={styles.h1}>News</h1>
        <div className={styles.context} role="note" aria-label="News context">
          {contextLabel}
        </div>
      </div>

      <div className={styles.controls} aria-label="News filters and sort">
        <div className="field">
          <label htmlFor="newsSource">Source</label>
          <select id="newsSource" className="select" value={source} onChange={(e) => setSource(e.target.value)} aria-label="Filter by source">
            <option value="">All sources</option>
            {NEWS_SOURCES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        <div className="field">
          <label htmlFor="newsSort">Sort</label>
          <select id="newsSort" className="select" value={sort} onChange={(e) => setSort(e.target.value)} aria-label="Sort news">
            <option value="recent">Most recent</option>
            <option value="relevant">Most relevant</option>
            <option value="source">By source</option>
          </select>
        </div>

        <button className="btn secondary" onClick={() => setItems(MOCK_NEWS)} aria-label="Refresh news">
          Refresh
        </button>
      </div>

      <div className={styles.list} role="list" aria-label="News items">
        {filtered.map((n) => (
          <article key={n.id} className={styles.item} role="listitem">
            <div className={styles.meta}>
              <span className="badge">{n.source}</span>
              <span className={styles.muted}>{new Date(n.publishedAt).toLocaleString()}</span>
              <span className={styles.muted}>Relevance: {Math.round(n.relevance * 100)}%</span>
            </div>

            <a className={styles.titleLink} href={n.url} target="_blank" rel="noopener noreferrer" aria-label={`${n.title} (opens in new tab)`}>
              <h2 className={styles.h2}>
                {n.title} <span className={styles.external} aria-hidden="true">↗</span>
              </h2>
            </a>

            <p className={styles.summary}>{n.summary}</p>

            <div className={styles.tags} aria-label="Article tags">
              {n.tags.symbols.map((s) => (
                <span key={s} className={styles.tag}>
                  {s}
                </span>
              ))}
              {n.tags.sectors.map((sec) => (
                <span key={sec} className={styles.tag}>
                  {sec}
                </span>
              ))}
              {n.tags.symbols.length === 0 && n.tags.sectors.length === 0 && (
                <span className={styles.tag}>Market</span>
              )}
            </div>

            <a className={styles.readMore} href={n.url} target="_blank" rel="noopener noreferrer">
              Read more (new tab)
            </a>
          </article>
        ))}
        {filtered.length === 0 && <div className={styles.empty}>No articles match your filters.</div>}
      </div>
    </section>
  );
}
