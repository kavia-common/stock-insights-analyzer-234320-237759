import React from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import AppShell from "./components/layout/AppShell.jsx";
import { ThemeProvider } from "./state/theme/ThemeContext.jsx";
import { PreferencesProvider } from "./state/preferences/PreferencesContext.jsx";
import { AppStateProvider } from "./state/app/AppStateContext.jsx";
import { PortfolioProvider } from "./state/portfolio/PortfolioContext.jsx";

import ChartsPage from "./pages/ChartsPage.jsx";
import SearchPage from "./pages/SearchPage.jsx";
import TrendAnalysisPage from "./pages/TrendAnalysisPage.jsx";
import PortfolioPage from "./pages/PortfolioPage.jsx";
import NewsPage from "./pages/NewsPage.jsx";
import SettingsPage from "./pages/SettingsPage.jsx";
import HelpPage from "./pages/HelpPage.jsx";

// PUBLIC_INTERFACE
export default function App() {
  /** Root application component providing routing and state providers. */
  return (
    <ThemeProvider>
      <PreferencesProvider>
        <AppStateProvider>
          <PortfolioProvider>
            <BrowserRouter>
              <AppShell>
                <Routes>
                  <Route path="/" element={<Navigate to="/charts" replace />} />
                  <Route path="/charts" element={<ChartsPage />} />
                  <Route path="/search" element={<SearchPage />} />
                  <Route path="/trend" element={<TrendAnalysisPage />} />
                  <Route path="/portfolio" element={<PortfolioPage />} />
                  <Route path="/news" element={<NewsPage />} />
                  <Route path="/settings" element={<SettingsPage />} />
                  <Route path="/help" element={<HelpPage />} />
                  <Route path="*" element={<Navigate to="/charts" replace />} />
                </Routes>
              </AppShell>
            </BrowserRouter>
          </PortfolioProvider>
        </AppStateProvider>
      </PreferencesProvider>
    </ThemeProvider>
  );
}
