const BASE_NEWS = [
  {
    id: 'n1',
    title: 'Tech leads as investors bet on AI productivity',
    summary: 'Major technology names saw renewed momentum amid strong guidance and easing rate fears.',
    source: 'MockWire',
    url: 'https://example.com/news/tech-ai',
    publishedAt: daysAgo(0),
    tags: { symbols: ['AAPL', 'MSFT', 'NVDA'], sectors: ['Technology'], relevance: 5 }
  },
  {
    id: 'n2',
    title: 'Energy stocks steady as crude prices stabilize',
    summary: 'Oil prices held range-bound; integrated majors benefited from resilient downstream margins.',
    source: 'Market Demo',
    url: 'https://example.com/news/energy-crude',
    publishedAt: daysAgo(1),
    tags: { symbols: ['XOM'], sectors: ['Energy'], relevance: 3 }
  },
  {
    id: 'n3',
    title: 'Bank earnings highlight consumer resilience',
    summary: 'Credit quality remains stable, while net interest income normalizes from peak levels.',
    source: 'MockWire',
    url: 'https://example.com/news/banks-earnings',
    publishedAt: daysAgo(2),
    tags: { symbols: ['JPM', 'V'], sectors: ['Financials'], relevance: 4 }
  },
  {
    id: 'n4',
    title: 'Healthcare defensive bid returns amid volatility',
    summary: 'Investors rotated toward healthcare as a risk-off hedge, supporting large-cap names.',
    source: 'Health Finance',
    url: 'https://example.com/news/healthcare-defensive',
    publishedAt: daysAgo(3),
    tags: { symbols: ['UNH'], sectors: ['Healthcare'], relevance: 3 }
  },
  {
    id: 'n5',
    title: 'Market overview: inflation data and the week ahead',
    summary: 'Upcoming macro releases may influence rate expectations and equity multiples.',
    source: 'Daily Brief',
    url: 'https://example.com/news/macro-week-ahead',
    publishedAt: daysAgo(0),
    tags: { symbols: [], sectors: [], relevance: 2 }
  }
];

function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
}

// PUBLIC_INTERFACE
export function getMockNews() {
  /** Returns a shallow-cloned list of mock news articles. */
  return BASE_NEWS.map((n) => ({ ...n }));
}

// PUBLIC_INTERFACE
export function filterNewsByContext(news, context) {
  /** Filters news by app context: selected stock or portfolio. */
  if (!context || context.type === 'general') return news;
  if (context.type === 'stock') {
    const sym = context.symbols?.[0];
    return news.filter((n) => n.tags.symbols.includes(sym) || n.tags.sectors.includes(context.sector));
  }
  if (context.type === 'portfolio') {
    const set = new Set(context.symbols || []);
    return news.filter((n) => n.tags.symbols.some((s) => set.has(s)) || n.tags.relevance >= 4);
  }
  return news;
}
