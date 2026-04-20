// TradeMind AI - Training Data Fetcher
// Fetches and stores market data, news, social sentiment into vector store

import { marketStore, newsStore, tradeStore, sentimentStore } from './vector-store.js';

const API_BASE = 'https://morningstar.zo.space';

// Indian stock symbols mapping (NSE → Yahoo)
const SYMBOL_MAP = {
  NIFTY: '^NSEI',
  BANKNIFTY: '^NSEBANK',
  RELIANCE: 'RELIANCE.NS',
  TCS: 'TCS.NS',
  INFOSYS: 'INFY.NS',
  HDFCBANK: 'HDFCBANK.NS',
  ICICIBANK: 'ICICIBANK.NS',
  SBIN: 'SBIN.NS',
  HDFC: 'HDFC.NS',
  LT: 'LT.NS',
  AXISBANK: 'AXISBANK.NS',
  KOTAKBANK: 'KOTAKBANK.NS',
  ADANIPORTS: 'ADANIPORTS.NS',
  ASIANPAINT: 'ASIANPAINT.NS',
  TITAN: 'TITAN.NS',
  ULTRACEMCO: 'ULTRACEMCO.NS',
  SUNPHARMA: 'SUNPHARMA.NS',
  ONGC: 'ONGC.NS',
  NTPC: 'NTPC.NS',
  POWERGRID: 'POWERGRID.NS',
  BPCL: 'BPCL.NS',
  TATASTEEL: 'TATASTEEL.NS'
};

// Fetch OHLCV data from Yahoo Finance
async function fetchYahooOHLCV(symbol, period = '1y') {
  try {
    const response = await fetch(
      `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=${period}`,
      { headers: { 'User-Agent': 'Mozilla/5.0' } }
    );
    const data = await response.json();
    const chart = data?.chart?.result?.[0];
    
    if (!chart) return [];
    
    const timestamps = chart.timestamp || [];
    const quotes = chart.indicators?.quote?.[0] || {};
    
    return timestamps.map((ts, i) => ({
      date: new Date(ts * 1000).toISOString().split('T')[0],
      open: quotes.open?.[i] || 0,
      high: quotes.high?.[i] || 0,
      low: quotes.low?.[i] || 0,
      close: quotes.close?.[i] || 0,
      volume: quotes.volume?.[i] || 0,
      symbol: symbol.replace('.NS', '')
    })).filter(q => q.close > 0);
  } catch (err) {
    console.error(`Failed to fetch ${symbol}:`, err.message);
    return [];
  }
}

// Fetch intraday data (5-minute candles)
async function fetchIntradayData(symbol) {
  try {
    const response = await fetch(
      `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=5m&range=5d`,
      { headers: { 'User-Agent': 'Mozilla/5.0' } }
    );
    const data = await response.json();
    const chart = data?.chart?.result?.[0];
    
    if (!chart) return [];
    
    const timestamps = chart.timestamp || [];
    const quotes = chart.indicators?.quote?.[0] || {};
    
    return timestamps.map((ts, i) => ({
      date: new Date(ts * 1000).toISOString(),
      open: quotes.open?.[i] || 0,
      high: quotes.high?.[i] || 0,
      low: quotes.low?.[i] || 0,
      close: quotes.close?.[i] || 0,
      volume: quotes.volume?.[i] || 0
    })).filter(q => q.close > 0);
  } catch (err) {
    console.error(`Intraday fetch failed for ${symbol}:`, err.message);
    return [];
  }
}

// Fetch index data (NIFTY, BANKNIFTY)
async function fetchIndexData(index = 'NIFTY') {
  const symbol = SYMBOL_MAP[index] || index;
  return fetchYahooOHLCV(symbol, '2y');
}

// Store market data in vector DB
async function indexMarketData(ohlcvData, category = 'daily') {
  const docs = ohlcvData.map(bar => {
    // Create descriptive text for embedding
    const text = [
      `${bar.symbol} on ${bar.date}`,
      `Open: ${bar.open.toFixed(2)}, High: ${bar.high.toFixed(2)}, Low: ${bar.low.toFixed(2)}, Close: ${bar.close.toFixed(2)}`,
      `Volume: ${(bar.volume / 1000000).toFixed(2)}M`,
      `Change: ${((bar.close - bar.open) / bar.open * 100).toFixed(2)}%`
    ].join('. ');

    return {
      text,
      metadata: {
        category: `market_${category}`,
        symbol: bar.symbol,
        date: bar.date,
        close: bar.close,
        volume: bar.volume,
        change: (bar.close - bar.open) / bar.open * 100
      }
    };
  });

  return marketStore.addMany(docs);
}

// Fetch news headlines (using public RSS/API)
async function fetchNewsHeadlines() {
  const sources = [
    'https://feeds.moneycontrol.com/mcfeed/src/main/features/site应急安全/fiat/ETMARKETS',
    'https://www.moneycontrol.com/rss/markets.xml'
  ];

  const allNews = [];

  try {
    const response = await fetch('https://api.rss2json.com/v1/api.json?rss_url=https://www.moneycontrol.com/rss/markets.xml&count=50');
    const data = await response.json();
    
    if (data?.items) {
      for (const item of data.items) {
        allNews.push({
          title: item.title,
          description: item.description?.replace(/<[^>]+>/g, '').substring(0, 500),
          link: item.link,
          pubDate: item.pubDate,
          source: 'MoneyControl'
        });
      }
    }
  } catch (err) {
    console.error('News fetch failed:', err.message);
  }

  // Add Economic Times
  try {
    const response = await fetch('https://api.rss2json.com/v1/api.json?rss_url=https://economictimes.indiatimes.com/markets/stocks/rssfeeds/1977021501.cms&count=30');
    const data = await response.json();
    
    if (data?.items) {
      for (const item of data.items) {
        allNews.push({
          title: item.title,
          description: item.description?.replace(/<[^>]+>/g, '').substring(0, 500),
          link: item.link,
          pubDate: item.pubDate,
          source: 'EconomicTimes'
        });
      }
    }
  } catch (err) {
    console.error('ET News fetch failed:', err.message);
  }

  return allNews;
}

// Index news into vector store
async function indexNews(newsItems) {
  const docs = newsItems.map(news => ({
    text: `${news.title}. ${news.description || ''}`,
    metadata: {
      category: 'news',
      source: news.source,
      date: news.pubDate,
      title: news.title,
      link: news.link
    }
  }));

  return newsStore.addMany(docs);
}

// Fetch Twitter/X sentiment for Indian market terms
async function fetchSocialSentiment() {
  // Mock social data - in production use Twitter API or aggregators
  const mockTweets = [
    { text: 'NIFTY looking bullish above 19500, targeting 19800', sentiment: 0.7, engagements: 150, date: new Date().toISOString() },
    { text: 'Bank Nifty breakout above 44000, strong buying seen', sentiment: 0.8, engagements: 200, date: new Date().toISOString() },
    { text: 'Reliance Q4 results beat expectations, buy on dips', sentiment: 0.75, engagements: 300, date: new Date().toISOString() },
    { text: 'FII selling continues, market may face pressure', sentiment: -0.6, engagements: 180, date: new Date().toISOString() },
    { text: 'RBI rate cut hopes boosting financial stocks', sentiment: 0.65, engagements: 120, date: new Date().toISOString() },
    { text: 'IT sector under pressure due to rupee appreciation', sentiment: -0.5, engagements: 90, date: new Date().toISOString() },
    { text: 'Auto stocks rally on festive demand hopes', sentiment: 0.7, engagements: 160, date: new Date().toISOString() },
    { text: 'PSU banks outperform, private banks lag', sentiment: 0.55, engagements: 100, date: new Date().toISOString() }
  ];

  return mockTweets;
}

// Index sentiment data
async function indexSentiment(tweets) {
  const docs = tweets.map(tweet => ({
    text: tweet.text,
    metadata: {
      category: 'sentiment',
      sentiment: tweet.sentiment,
      engagements: tweet.engagements,
      date: tweet.date
    }
  }));

  return sentimentStore.addMany(docs);
}

// Calculate sentiment indicators
function calculateSentimentIndicators(tweets) {
  const now = Date.now();
  const hourAgo = tweets.filter(t => now - new Date(t.metadata.date).getTime() < 3600000);
  const dayAgo = tweets.filter(t => now - new Date(t.metadata.date).getTime() < 86400000);

  const avgSentiment = tweets.reduce((a, t) => a + t.metadata.sentiment, 0) / tweets.length;
  const hourSentiment = hourAgo.length > 0 ? hourAgo.reduce((a, t) => a + t.metadata.sentiment, 0) / hourAgo.length : avgSentiment;
  const daySentiment = dayAgo.length > 0 ? dayAgo.reduce((a, t) => a + t.metadata.sentiment, 0) / dayAgo.length : avgSentiment;

  return {
    overall: avgSentiment,
    hourly: hourSentiment,
    daily: daySentiment,
    trend: daySentiment - hourSentiment, // Positive = improving
    tweetCount: tweets.length
  };
}

// Main training data refresh function
async function refreshAllTrainingData() {
  console.log('[TradeMind] Starting training data refresh...');

  const results = {
    marketData: { indexed: 0, symbols: [] },
    news: { indexed: 0 },
    sentiment: { indexed: 0 }
  };

  // 1. Fetch and index market data
  for (const [symbol, yahooSymbol] of Object.entries(SYMBOL_MAP)) {
    const data = await fetchYahooOHLCV(yahooSymbol, '1y');
    if (data.length > 0) {
      await indexMarketData(data, 'daily');
      results.marketData.indexed += data.length;
      results.marketData.symbols.push(symbol);
    }
  }

  // 2. Fetch and index index data
  const niftyData = await fetchIndexData('NIFTY');
  const bankniftyData = await fetchIndexData('BANKNIFTY');
  await indexMarketData([...niftyData, ...bankniftyData], 'index');
  results.marketData.indexed += niftyData.length + bankniftyData.length;

  // 3. Fetch and index news
  const news = await fetchNewsHeadlines();
  if (news.length > 0) {
    await indexNews(news);
    results.news.indexed = news.length;
  }

  // 4. Fetch and index sentiment
  const tweets = await fetchSocialSentiment();
  if (tweets.length > 0) {
    await indexSentiment(tweets);
    results.sentiment.indexed = tweets.length;
  }

  console.log('[TradeMind] Training data refresh complete:', results);
  return results;
}

// Query training data for LLM context
async function queryContext(query, options = {}) {
  const { topK = 5, categories = ['market_daily', 'market_index', 'news', 'sentiment'] } = options;

  let allResults = [];

  for (const cat of categories) {
    const [type, subtype] = cat.split('_');
    const filter = subtype ? { category: cat } : { category: type };

    const results = await marketStore.searchByText(query, topK, filter);
    allResults.push(...results);
  }

  // Also search news and sentiment
  if (categories.includes('news')) {
    const newsResults = await newsStore.searchByText(query, topK, { category: 'news' });
    allResults.push(...newsResults);
  }

  if (categories.includes('sentiment')) {
    const sentResults = await sentimentStore.searchByText(query, topK, { category: 'sentiment' });
    allResults.push(...sentResults);
  }

  // Sort by relevance
  allResults.sort((a, b) => b.similarity - a.similarity);

  return allResults.slice(0, topK);
}

// Export stats
function getTrainingStats() {
  return {
    market: marketStore.stats(),
    news: newsStore.stats(),
    sentiment: sentimentStore.stats(),
    trades: tradeStore.stats()
  };
}

export {
  fetchYahooOHLCV,
  fetchIntradayData,
  fetchIndexData,
  indexMarketData,
  fetchNewsHeadlines,
  indexNews,
  fetchSocialSentiment,
  indexSentiment,
  calculateSentimentIndicators,
  refreshAllTrainingData,
  queryContext,
  getTrainingStats,
  SYMBOL_MAP
};
