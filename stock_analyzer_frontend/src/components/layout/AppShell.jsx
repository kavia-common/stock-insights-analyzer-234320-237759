import React, { useEffect, useRef, useState } from "react";
import SidebarNav from "./SidebarNav.jsx";
import styles from "./AppShell.module.css";

// PUBLIC_INTERFACE
export default function AppShell({ children }) {
  /** Responsive dashboard shell with collapsible sidebar and accessible landmarks. */
  const [mobileOpen, setMobileOpen] = useState(false);
  const mainRef = useRef(null);

  useEffect(() => {
    if (!mobileOpen) return;
    const onKey = (e) => {
      if (e.key === "Escape") setMobileOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [mobileOpen]);

  return (
    <div className={styles.root}>
      <a className="skip-link" href="#main">
        Skip to main content
      </a>

      <header className={styles.header}>
        <button
          className={`btn ${styles.hamburger}`}
          aria-label={mobileOpen ? "Close navigation menu" : "Open navigation menu"}
          aria-expanded={mobileOpen}
          onClick={() => setMobileOpen((v) => !v)}
        >
          ☰
        </button>
        <div className={styles.brand}>
          <div className={styles.logo} aria-hidden="true">
            SIA
          </div>
          <div>
            <div className={styles.title}>Stock Insights Analyzer</div>
            <div className={styles.subtitle}>Mock data dashboard • Ocean Professional</div>
          </div>
        </div>
      </header>

      <aside className={styles.sidebarDesktop}>
        <SidebarNav onNavigate={() => setMobileOpen(false)} />
      </aside>

      {mobileOpen && (
        <div className={styles.mobileOverlay} role="presentation" onClick={() => setMobileOpen(false)}>
          <div
            className={styles.sidebarMobile}
            role="dialog"
            aria-modal="true"
            aria-label="Navigation menu"
            onClick={(e) => e.stopPropagation()}
          >
            <SidebarNav onNavigate={() => setMobileOpen(false)} />
          </div>
        </div>
      )}

      <main id="main" ref={mainRef} className={styles.main} role="main" tabIndex={-1}>
        {children}
      </main>
    </div>
  );
}
