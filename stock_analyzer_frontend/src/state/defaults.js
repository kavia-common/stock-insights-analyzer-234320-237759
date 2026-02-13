export const DEFAULT_PREFERENCES = {
  theme: 'light', // 'light' | 'dark'
  chart: {
    chartType: 'line', // 'line' | 'bar' | 'candlestick'
    defaultTimeframe: '1M',
    indicators: {
      sma: { enabled: true, period: 20 },
      ema: { enabled: false, period: 20 },
      rsi: { enabled: false, period: 14 }
    },
    patternDetectionEnabled: true
  },
  refreshInterval: '1m' // '30s' | '1m' | '5m' | 'manual'
};
