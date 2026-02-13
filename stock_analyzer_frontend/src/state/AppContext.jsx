import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { DEFAULT_PREFERENCES } from './defaults.js';
import { loadSessionJSON, saveSessionJSON } from './storage.js';

const AppContext = createContext(null);

const SESSION_KEY = 'sia.preferences.v1';
const ONBOARDING_KEY = 'sia.onboardingCompleted.v1';

// PUBLIC_INTERFACE
export function AppProvider({ children }) {
  /** Provides global, client-side app state for the SPA. */
  const [preferences, setPreferences] = useState(() => {
    return loadSessionJSON(SESSION_KEY, DEFAULT_PREFERENCES);
  });
  const [selectedSymbol, setSelectedSymbol] = useState('AAPL');
  const [newsContext, setNewsContext] = useState({ type: 'stock', symbols: ['AAPL'] });
  const [onboardingCompleted, setOnboardingCompleted] = useState(() => {
    try {
      return window.localStorage.getItem(ONBOARDING_KEY) === 'true';
    } catch {
      return false;
    }
  });

  useEffect(() => {
    saveSessionJSON(SESSION_KEY, preferences);
  }, [preferences]);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', preferences.theme);
  }, [preferences.theme]);

  const value = useMemo(() => {
    return {
      preferences,
      setPreferences,
      selectedSymbol,
      setSelectedSymbol,
      newsContext,
      setNewsContext,
      onboardingCompleted,
      setOnboardingCompleted
    };
  }, [preferences, selectedSymbol, newsContext, onboardingCompleted]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

// PUBLIC_INTERFACE
export function useApp() {
  /** Hook to access global app state. */
  const ctx = useContext(AppContext);
  if (!ctx) {
    throw new Error('useApp must be used within AppProvider');
  }
  return ctx;
}
