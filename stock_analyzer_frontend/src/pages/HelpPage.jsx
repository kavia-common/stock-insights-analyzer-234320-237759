import React, { useMemo, useState } from "react";
import Joyride, { STATUS } from "react-joyride";
import { marked } from "marked";
import DOMPurify from "dompurify";
import { HELP_DOCS } from "../support/helpDocs.js";
import FeedbackWidget from "../components/support/FeedbackWidget.jsx";
import styles from "./HelpPage.module.css";

const ONBOARDING_KEY = "sia.onboarding.done";

function sanitizeMarkdown(md) {
  const html = marked.parse(md);
  return DOMPurify.sanitize(html);
}

// PUBLIC_INTERFACE
export default function HelpPage() {
  /** Help & documentation page with onboarding tour and searchable docs/FAQs. */
  const [query, setQuery] = useState("");
  const [activeId, setActiveId] = useState(HELP_DOCS[0]?.id ?? "getting-started");
  const [runTour, setRunTour] = useState(() => window.localStorage.getItem(ONBOARDING_KEY) !== "true");

  const docs = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return HELP_DOCS;
    return HELP_DOCS.filter((d) => d.title.toLowerCase().includes(q) || d.body.toLowerCase().includes(q) || d.category.toLowerCase().includes(q));
  }, [query]);

  const active = useMemo(() => HELP_DOCS.find((d) => d.id === activeId) ?? HELP_DOCS[0], [activeId]);

  const steps = useMemo(
    () => [
      { target: 'nav[aria-label="Primary"]', content: "Use the sidebar to navigate between main dashboard sections." },
      { target: "#main", content: "This main area shows charts, filters, portfolio and news panels." },
      { target: 'a[href="/settings"]', content: "Open Settings to change theme, chart defaults, and refresh interval." }
    ],
    []
  );

  return (
    <section className={`card ${styles.wrap}`} aria-label="Help and documentation">
      <Joyride
        steps={steps}
        run={runTour}
        continuous
        showSkipButton
        styles={{ options: { primaryColor: "#2563EB", zIndex: 3000 } }}
        callback={(data) => {
          if ([STATUS.FINISHED, STATUS.SKIPPED].includes(data.status)) {
            window.localStorage.setItem(ONBOARDING_KEY, "true");
            setRunTour(false);
          }
        }}
      />

      <header className={styles.header}>
        <h1 className={styles.h1}>Help & Documentation</h1>
        <button className="btn primary" onClick={() => setRunTour(true)} aria-label="Start tour">
          Start Tour
        </button>
      </header>

      <div className={styles.grid}>
        <aside className={styles.sidebar} aria-label="Help topics">
          <div className="field">
            <label htmlFor="helpSearch">Search docs</label>
            <input
              id="helpSearch"
              className="input"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Try: indicators, portfolio, export…"
              aria-label="Search documentation"
            />
          </div>

          <div className={styles.topicList} role="list" aria-label="Topics list">
            {docs.map((d) => (
              <button
                key={d.id}
                className={`${styles.topicBtn} ${d.id === activeId ? styles.active : ""}`}
                onClick={() => setActiveId(d.id)}
                aria-label={`Open topic: ${d.title}`}
              >
                <div className={styles.topicTitle}>{d.title}</div>
                <div className={styles.topicMeta}>{d.category}</div>
              </button>
            ))}
            {docs.length === 0 && <div className={styles.empty}>No results.</div>}
          </div>
        </aside>

        <article className={styles.content} aria-label="Help content">
          <h2 className={styles.h2}>{active.title}</h2>
          <div className={styles.categoryBadge}>
            <span className="badge">{active.category}</span>
          </div>
          <div className={styles.md} dangerouslySetInnerHTML={{ __html: sanitizeMarkdown(active.body) }} />
          <FeedbackWidget contentId={active.id} />
        </article>
      </div>
    </section>
  );
}
