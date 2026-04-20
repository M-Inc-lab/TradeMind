// TradeMind AI - Candlestick Pattern Recognition
const PATTERNS = {
  Hammer: {
    type: "bullish",
    detect: (c) => {
      const body = Math.abs(c.close - c.open);
      const lower = Math.min(c.open, c.close) - c.low;
      const upper = c.high - Math.max(c.open, c.close);
      return body > 0 && lower > body * 2 && upper < body * 0.3;
    }
  },
  Engulfing: {
    type: "bullish",
    detect: (candles) => {
      if (candles.length < 2) return false;
      const prev = candles[candles.length - 2], curr = candles[candles.length - 1];
      return prev.close < prev.open && curr.close > curr.open && curr.open < prev.close && curr.close > prev.open;
    }
  },
  MorningStar: {
    type: "bullish",
    detect: (candles) => {
      if (candles.length < 3) return false;
      const [p1, p2, p3] = candles.slice(-3);
      return p1.close < p1.open && Math.abs(p2.close - p2.open) < (p1.high - p1.low) * 0.3 && p3.close > (p1.open + p1.close) / 2;
    }
  },
  ShootingStar: {
    type: "bearish",
    detect: (c) => {
      const body = Math.abs(c.close - c.open);
      const upper = c.high - Math.max(c.open, c.close);
      const lower = Math.min(c.open, c.close) - c.low;
      return body > 0 && upper > body * 2 && lower < body * 0.3;
    }
  },
  DarkCloudCover: {
    type: "bearish",
    detect: (candles) => {
      if (candles.length < 2) return false;
      const prev = candles[candles.length - 2], curr = candles[candles.length - 1];
      return prev.close > prev.open && curr.close < curr.open && curr.open > prev.close && curr.close < (prev.open + prev.close) / 2;
    }
  },
  EveningStar: {
    type: "bearish",
    detect: (candles) => {
      if (candles.length < 3) return false;
      const [p1, p2, p3] = candles.slice(-3);
      return p1.close > p1.open && Math.abs(p2.close - p2.open) < (p1.high - p1.low) * 0.3 && p3.close < (p1.open + p1.close) / 2;
    }
  },
  Doji: {
    type: "neutral",
    detect: (c) => Math.abs(c.close - c.open) < (c.high - c.low) * 0.1
  },
  DoubleTop: {
    type: "bearish_reversal",
    detect: (candles) => {
      if (candles.length < 20) return false;
      const highs = candles.map(c => c.high);
      const mid = Math.floor(highs.length / 2);
      const left = Math.max(...highs.slice(0, mid)), right = Math.max(...highs.slice(mid));
      return Math.abs(left - right) < left * 0.02;
    }
  },
  DoubleBottom: {
    type: "bullish_reversal",
    detect: (candles) => {
      if (candles.length < 20) return false;
      const lows = candles.map(c => c.low);
      const mid = Math.floor(lows.length / 2);
      const left = Math.min(...lows.slice(0, mid)), right = Math.min(...lows.slice(mid));
      return Math.abs(left - right) < left * 0.02;
    }
  }
};

export function detectPatterns(candles) {
  const detected = [];
  const c = candles[candles.length - 1];
  for (const [name, pattern] of Object.entries(PATTERNS)) {
    try {
      if (pattern.detect(candles)) {
        const body = Math.abs(c.close - c.open);
        const range = c.high - c.low || 1;
        detected.push({
          pattern: name,
          type: pattern.type,
          confidence: Math.min(95, Math.max(60, 70 + (body / range) * 25)),
          signal: pattern.type.includes('bullish') ? 'BUY' : pattern.type.includes('bearish') ? 'SELL' : 'NEUTRAL'
        });
      }
    } catch {}
  }
  return detected.sort((a, b) => b.confidence - a.confidence);
}

export function scanConfluence(candleSets) {
  const results = {};
  let bullishCount = 0, bearishCount = 0;
  for (const [tf, candles] of Object.entries(candleSets)) {
    const detected = detectPatterns(candles);
    results[tf] = detected;
    bullishCount += detected.filter(p => p.signal === 'BUY').length;
    bearishCount += detected.filter(p => p.signal === 'SELL').length;
  }
  const total = bullishCount + bearishCount || 1;
  return {
    timeframeAnalysis: results,
    confluence: {
      bullishSignals: bullishCount,
      bearishSignals: bearishCount,
      verdict: bullishCount > bearishCount ? 'BULLISH' : bearishCount > bullishCount ? 'BEARISH' : 'NEUTRAL',
      strength: Math.abs(bullishCount - bearishCount) / total
    }
  };
}
