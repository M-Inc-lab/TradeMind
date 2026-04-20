// TradeMind AI - Sentiment Analysis Engine
// Multi-source sentiment tracking for Indian markets

const SOURCES = {
  twitter: { weight: 0.2, keywords: ['nifty', 'banknifty', 'reliance', 'infosys', 'trend', 'buy', 'sell'] },
  news: { weight: 0.4, keywords: ['rbi', 'inflation', 'gdp', 'budget', 'fed', 'result', 'earnings'] },
  fii: { weight: 0.25, keywords: ['fi', 'dii', 'institutional', 'foreign', ' outflow'] },
  options: { weight: 0.15, keywords: ['pcr', 'maxpain', 'oi', 'buildup'] }
};

class SentimentEngine {
  constructor() {
    this.cache = { twitter: [], news: [], fii: [], overall: null };
    this.lastUpdate = null;
  }

  async fetchAll() {
    const [twitter, news, fii, options] = await Promise.all([
      this.fetchTwitterSentiment(),
      this.fetchNewsSentiment(),
      this.fetchFIIData(),
      this.fetchOptionsData()
    ]);

    this.cache = { twitter, news, fii, options, overall: this.calculateOverall({ twitter, news, fii, options }) };
    this.lastUpdate = new Date();
    return this.cache;
  }

  calculateOverall(sources) {
    const weights = { twitter: 0.2, news: 0.35, fii: 0.25, options: 0.2 };
    let score = 0;
    for (const [key, val] of Object.entries(sources)) {
      if (val?.score) score += val.score * weights[key];
    }
    const label = score > 0.6 ? 'BULLISH' : score < 0.4 ? 'BEARISH' : 'NEUTRAL';
    return { score, label, breakdown: sources };
  }

  getTradingSignal() {
    if (!this.cache.overall) return null;
    const { score, label } = this.cache.overall;
    if (label === 'BULLISH' && score > 0.7) return { action: 'BUY', conviction: 'HIGH', score };
    if (label === 'BEARISH' && score < 0.3) return { action: 'SELL', conviction: 'HIGH', score };
    if (label === 'BULLISH') return { action: 'BUY', conviction: 'MODERATE', score };
    if (label === 'BEARISH') return { action: 'SELL', conviction: 'MODERATE', score };
    return { action: 'HOLD', conviction: 'LOW', score };
  }
}

module.exports = { SentimentEngine };
