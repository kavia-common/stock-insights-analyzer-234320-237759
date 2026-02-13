import React, { useEffect, useId, useRef, useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import JoyrideTour from '../onboarding/JoyrideTour.jsx';

function NavItem({ to, label, icon }) {
  return (
    <NavLink to={to} end={to === '/dashboard'} aria-label={label}>
      <span aria-hidden="true">{icon}</span>
      <span>{label}</span>
    </NavLink>
  );
}

// PUBLIC_INTERFACE
export default function Layout() {
  /** Main app layout: responsive sidebar + content outlet. */
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const sidebarId = useId();
  const menuButtonRef = useRef(null);

  useEffect(() => {
    // close drawer on navigation
    setMobileOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!mobileOpen && menuButtonRef.current) {
      // restore focus to menu button after closing
      menuButtonRef.current.focus();
    }
  }, [mobileOpen]);

  return (
    <div className="app-shell">
      {mobileOpen ? (
        <div
          className="backdrop"
          role="presentation"
          onClick={() => setMobileOpen(false)}
          onKeyDown={(e) => {
            if (e.key === 'Escape') setMobileOpen(false);
          }}
        />
      ) : null}

      <aside
        className="sidebar"
        id={sidebarId}
        data-open={mobileOpen ? 'true' : 'false'}
        aria-label="Primary"
      >
        <div className="brand" data-tour="brand">
          <div className="brand-badge" aria-hidden="true" />
          <div>
            <h1>Stock Insights Analyzer</h1>
            <div className="small-muted">Mock data • Ocean Professional</div>
          </div>
        </div>

        <nav className="nav" aria-label="Main navigation" data-tour="nav">
          <NavItem to="/dashboard" label="Dashboard" icon="📈" />
          <NavItem to="/search" label="Search & Filters" icon="🔎" />
          <NavItem to="/trend-analysis" label="Trend Analysis" icon="📐" />
          <NavItem to="/portfolio" label="Portfolio" icon="💼" />
          <NavItem to="/news" label="News" icon="📰" />
          <NavItem to="/settings" label="Settings" icon="⚙️" />
          <NavItem to="/help" label="Help" icon="❓" />
        </nav>

        <div style={{ marginTop: 16 }} className="small-muted">
          Tip: Use Tab to navigate and Enter/Space to activate controls.
        </div>
      </aside>

      <div className="content">
        <header className="topbar">
          <div className="topbar-left">
            <button
              className="icon-btn"
              ref={menuButtonRef}
              type="button"
              aria-controls={sidebarId}
              aria-expanded={mobileOpen ? 'true' : 'false'}
              aria-label={mobileOpen ? 'Close navigation menu' : 'Open navigation menu'}
              onClick={() => setMobileOpen((v) => !v)}
            >
              ☰
            </button>
            <h2 className="h1">{titleForPath(location.pathname)}</h2>
          </div>
          <div className="small-muted" data-tour="topbar">
            WCAG 2.1 AA • Keyboard-friendly
          </div>
        </header>

        <main id="main" tabIndex={-1}>
          <JoyrideTour />
          <Outlet />
        </main>
      </div>
    </div>
  );
}

function titleForPath(pathname) {
  if (pathname.startsWith('/search')) return 'Search & Filters';
  if (pathname.startsWith('/trend-analysis')) return 'Trend Analysis';
  if (pathname.startsWith('/portfolio')) return 'Portfolio';
  if (pathname.startsWith('/news')) return 'News';
  if (pathname.startsWith('/settings')) return 'Settings';
  if (pathname.startsWith('/help')) return 'Help';
  return 'Dashboard';
}
