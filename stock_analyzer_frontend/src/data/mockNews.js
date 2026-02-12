export const MOCK_NEWS = [
  {
    id: "n1",
    title: "Tech stocks rally as investors rotate into AI leaders",
    summary: "Momentum in large-cap technology names remains strong as traders position for earnings season.",
    source: "MarketWire",
    url: "https://example.com/news/tech-rally",
    publishedAt: "2026-02-10T12:10:00Z",
    tags: { symbols: ["AAPL", "MSFT", "NVDA"], sectors: ["Technology"] },
    relevance: 0.92
  },
  {
    id: "n2",
    title: "Energy sector steadies after volatile crude session",
    summary: "Oil prices stabilized following geopolitical headlines, easing pressure on integrated producers.",
    source: "EnergyToday",
    url: "https://example.com/news/energy-steadies",
    publishedAt: "2026-02-09T15:30:00Z",
    tags: { symbols: ["XOM"], sectors: ["Energy"] },
    relevance: 0.76
  },
  {
    id: "n3",
    title: "Consumer discretionary names mixed as rate expectations shift",
    summary: "Autos and retail are reacting to changing rate-cut probabilities, causing dispersion across the group.",
    source: "DailyFinance",
    url: "https://example.com/news/discretionary-mixed",
    publishedAt: "2026-02-08T10:05:00Z",
    tags: { symbols: ["TSLA", "AMZN"], sectors: ["Consumer Discretionary"] },
    relevance: 0.71
  },
  {
    id: "n4",
    title: "Banks focus on net interest margin stability",
    summary: "Financials look to maintain profitability as deposit costs and lending growth normalize.",
    source: "BankBrief",
    url: "https://example.com/news/bank-margins",
    publishedAt: "2026-02-07T09:00:00Z",
    tags: { symbols: ["JPM", "V"], sectors: ["Financials"] },
    relevance: 0.66
  },
  {
    id: "n5",
    title: "General market: S&P 500 consolidates near highs",
    summary: "Broader index action shows consolidation while traders watch macro catalysts.",
    source: "IndexPulse",
    url: "https://example.com/news/spx-consolidation",
    publishedAt: "2026-02-06T16:45:00Z",
    tags: { symbols: [], sectors: [] },
    relevance: 0.6
  }
];

export const NEWS_SOURCES = Array.from(new Set(MOCK_NEWS.map((n) => n.source))).sort();
