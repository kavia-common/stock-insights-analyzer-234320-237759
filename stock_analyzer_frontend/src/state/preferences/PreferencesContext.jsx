import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

const PreferencesContext = createContext(null);
const STORAGE_KEY = "sia.preferences";

export const DEFAULT_PREFERENCES = {
  chartType: "line", // line | bar | candlestick (mocked)
  timeframe: "1M", // 1D | 1W | 1M | 1Y | ALL
  indicators: {
    sma: { enabled: true, period: 20 },
    ema: { enabled: false, period: 20 },
    rsi: { enabled: false, period: 14 }
  },
  refreshInterval: "1m" // 30s | 1m | 5m | manual
};

function safeParse(json) {
  try {
    return JSON.parse(json);
  } catch {
    return null;
  }
}

// PUBLIC_INTERFACE
export function PreferencesProvider({ children }) {
  /** Provides session-scoped user preferences (chart defaults, refresh interval). */
  const [preferences, setPreferences] = useState(() => {
    const saved = window.sessionStorage.getItem(STORAGE_KEY);
    const parsed = saved ? safeParse(saved) : null;
    return parsed ? { ...DEFAULT_PREFERENCES, ...parsed } : DEFAULT_PREFERENCES;
  });

  useEffect(() => {
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
  }, [preferences]);

  const value = useMemo(
    () => ({
      preferences,
      setPreferences,
      resetPreferences: () => setPreferences(DEFAULT_PREFERENCES)
    }),
    [preferences]
  );

  return <PreferencesContext.Provider value={value}>{children}</PreferencesContext.Provider>;
}

// PUBLIC_INTERFACE
export function usePreferences() {
  /** Hook to access preferences and update/reset them. */
  const ctx = useContext(PreferencesContext);
  if (!ctx) throw new Error("usePreferences must be used within PreferencesProvider");
  return ctx;
}
