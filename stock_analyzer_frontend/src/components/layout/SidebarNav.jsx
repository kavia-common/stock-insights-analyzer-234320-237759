import React from "react";
import { NavLink } from "react-router-dom";
import styles from "./SidebarNav.module.css";

const navItems = [
  { to: "/charts", label: "Charts", icon: "📈" },
  { to: "/search", label: "Search", icon: "🔎" },
  { to: "/trend", label: "Trend Analysis", icon: "🧭" },
  { to: "/portfolio", label: "Portfolio", icon: "💼" },
  { to: "/news", label: "News", icon: "📰" },
  { to: "/settings", label: "Settings", icon: "⚙️" },
  { to: "/help", label: "Help", icon: "❓" }
];

// PUBLIC_INTERFACE
export default function SidebarNav({ onNavigate }) {
  /** Primary sidebar navigation for the dashboard. */
  return (
    <nav className={`card ${styles.nav}`} aria-label="Primary">
      <div className={styles.sectionTitle}>Navigate</div>
      <div className={styles.list}>
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => `${styles.link} ${isActive ? styles.active : ""}`}
            onClick={onNavigate}
          >
            <span className={styles.icon} aria-hidden="true">
              {item.icon}
            </span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </div>

      <div className={styles.tip} role="note">
        Tip: Use <kbd>Tab</kbd> to move focus, <kbd>Enter</kbd> to activate links.
      </div>
    </nav>
  );
}
