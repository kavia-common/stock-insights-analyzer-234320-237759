import React, { useEffect, useMemo, useState } from 'react';
import { getMockNews, filterNewsByContext } from '../../mock/news.js';
import { useApp } from '../../state/AppContext.jsx';

function sortNews(items, sort) {
  const arr = items.slice();
  if (sort === 'recent') arr.sort((a, b) => (a.publishedAt < b.publishedAt ? 1 : -1));
  if (sort === 'relevance') arr.sort((a, b) => (b.tags.relevance ?? 0) - (a.tags.relevance ?? 0));
  if (sort === 'source') arr.sort((a, b) => a.source.localeCompare(b.source));
  return arr;
}

// PUBLIC_INTERFACE
export default function NewsFeed() {
  /** Financial news section using mock data, contextual filtering, and accessibility-friendly layout. */
  const { newsContext, preferences } = useApp();
  const [news, setNews] = useState(() => getMockNews());
  const [filterSource, setFilterSource] = useState('all');
  const [sort, setSort] = useState('recent');
  const [lastUpdated, setLastUpdated] = useState(new Date());

  // periodic refresh based on settings
  useEffect(() => {
    if (preferences.refreshInterval === 'manual') return undefined;
    const ms =
      preferences.refreshInterval === '30s'
        ? 30_000
        : preferences.refreshInterval === '5m'
          ? 5 * 60_000
          : 60_000;

    const id = window.setInterval(() => {
      setNews(getMockNews());
      setLastUpdated(new Date());
    }, ms);

    return () => window.clearInterval(id);
  }, [preferences.refreshInterval]);

  const sources = useMemo(() => {
    return Array.from(new Set(news.map((n) => n.source))).sort();
  }, [news]);

  const filtered = useMemo(() => {
    let items = filterNewsByContext(news, newsContext);
    if (filterSource !== 'all') items = items.filter((n) => n.source === filterSource);
    return sortNews(items, sort);
  }, [news, newsContext, filterSource, sort]);

  const contextLabel = useMemo(() => {
    if (!newsContext || newsContext.type === 'general') return 'General Market News';
    if (newsContext.type === 'stock') return `News for: ${newsContext.symbols?.[0] || ''}`;
    if (newsContext.type === 'portfolio') return `News for Portfolio (${(newsContext.symbols || []).join(', ')})`;
    return 'News';
  }, [newsContext]);

  return (
    <section className="card" aria-label="Financial news feed" data-tour="news">
      <div className="row" style={{ justifyContent: 'space-between' }}>
        <h2 style={{ marginBottom: 6 }}>{contextLabel}</h2>
        <div className="small-muted">Updated: {lastUpdated.toLocaleTimeString()}</div>
      </div>

      <div className="row" style={{ justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <label className="small-muted" htmlFor="filter-source">
            Source
          </label>
          <select
            id="filter-source"
            className="select"
            value={filterSource}
            onChange={(e) => setFilterSource(e.target.value)}
          >
            <option value="all">All</option>
            {sources.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        <div className="row">
          <label className="small-muted" htmlFor="sort-news">
            Sort
          </label>
          <select id="sort-news" className="select" value={sort} onChange={(e) => setSort(e.target.value)}>
            <option value="recent">Most recent</option>
            <option value="relevance">Most relevant</option>
            <option value="source">Source</option>
          </select>

          {preferences.refreshInterval === 'manual' ? (
            <button
              type="button"
              className="btn primary"
              onClick={() => {
                setNews(getMockNews());
                setLastUpdated(new Date());
              }}
              aria-label="Refresh news manually"
            >
              Refresh
            </button>
          ) : null}
        </div>
      </div>

      <div className="grid" style={{ marginTop: 12 }}>
        {filtered.map((n) => (
          <article key={n.id} className="card" style={{ padding: 12 }}>
            <div className="row" style={{ justifyContent: 'space-between' }}>
              <a
                href={n.url}
                target="_blank"
                rel="noopener noreferrer"
                style={{ textDecoration: 'none' }}
                aria-label={`Open article in new tab: ${n.title}`}
              >
                <strong>{n.title}</strong> <span className="small-muted" aria-hidden="true">↗</span>
              </a>
              <span className="small-muted">{new Date(n.publishedAt).toLocaleDateString()}</span>
            </div>
            <p style={{ margin: '8px 0' }} className="small-muted">
              {n.summary}
            </p>
            <div className="row">
              <span className="pill" aria-label={`Source ${n.source}`}>
                {n.source}
              </span>
              {(n.tags.symbols || []).map((s) => (
                <span key={s} className="pill" aria-label={`Related symbol ${s}`}>
                  {s}
                </span>
              ))}
              {(n.tags.sectors || []).map((s) => (
                <span key={s} className="pill" aria-label={`Related sector ${s}`}>
                  {s}
                </span>
              ))}
            </div>
          </article>
        ))}
        {filtered.length === 0 ? <div className="small-muted">No news matches the current filters.</div> : null}
      </div>
    </section>
  );
}
