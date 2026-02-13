import React, { useMemo, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import DOMPurify from 'dompurify';
import FeedbackWidget from '../components/help/FeedbackWidget.jsx';
import { HELP_DOCS } from '../static/helpDocs.js';

// PUBLIC_INTERFACE
export default function HelpPage() {
  /** In-app documentation and FAQ. */
  const [query, setQuery] = useState('');

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return HELP_DOCS;
    return HELP_DOCS.filter((d) => d.title.toLowerCase().includes(q) || d.body.toLowerCase().includes(q));
  }, [query]);

  return (
    <div className="grid" aria-label="Help page">
      <section className="card" aria-label="Help and documentation">
        <div className="row" style={{ justifyContent: 'space-between' }}>
          <h2>Help & Documentation</h2>
          <a className="btn" href="/help?tour=1" aria-label="Restart onboarding tour">
            Start Tour
          </a>
        </div>

        <label className="small-muted" htmlFor="help-search">
          Search docs & FAQs
        </label>
        <input
          id="help-search"
          className="input"
          style={{ width: '100%' }}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Try: export, indicators, portfolio, filters…"
        />

        <div className="grid" style={{ marginTop: 12 }}>
          {results.map((d) => (
            <article key={d.id} className="card" style={{ padding: 12 }}>
              <h3 style={{ margin: '0 0 8px 0' }}>{d.title}</h3>
              <div className="small-muted">
                <SafeMarkdown markdown={d.body} />
              </div>
              <div style={{ marginTop: 10 }}>
                <FeedbackWidget resourceId={d.id} />
              </div>
            </article>
          ))}
          {results.length === 0 ? <div className="small-muted">No matches found.</div> : null}
        </div>
      </section>
    </div>
  );
}

function SafeMarkdown({ markdown }) {
  const clean = useMemo(() => {
    // We render markdown but sanitize to be safe if content is ever user-provided later.
    return DOMPurify.sanitize(markdown);
  }, [markdown]);

  return <ReactMarkdown remarkPlugins={[remarkGfm]}>{clean}</ReactMarkdown>;
}
