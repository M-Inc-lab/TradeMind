// TradeMind - Executable Intraday Strategies
import { INDICATOR_FUNCTIONS } from '../backtester-core.js';

function getValue(indicatorArray, date) {
  const found = indicatorArray?.find(v => v.date === date);
  return found ? found.value : null;
}

function calculateVWAP(data) {
  let cumulativeTPV = 0, cumulativeVolume = 0, result = [];
  for (const bar of data) {
    const tp = (bar.high + bar.low + bar.close) / 3;
    cumulativeTPV += tp * bar.volume;
    cumulativeVolume += bar.volume;
    result.push({ date: bar.date, value: cumulativeVolume > 0 ? cumulativeTPV / cumulativeVolume : tp });
  }
  return result;
}

export const VWAPReversion = {
  name: 'VWAP Reversion', type: 'intraday', timeframe: '5m',
  params: { rsiPeriod: 14, rsiOversold: 35, rsiOverbought: 65, volumeMult: 1.5 },
  calculateIndicators(data) {
    return {
      vwap: calculateVWAP(data),
      rsi: INDICATOR_FUNCTIONS.RSI(data, this.params.rsiPeriod),
      volume: data.map(d => ({ date: d.date, value: d.volume })),
      avgVolume: data.slice(-20).reduce((a, d) => a + d.volume, 0) / 20
    };
  },
  getEntry(data, date, indicators) {
    const price = data.find(d => d.date === date);
    const vwapVal = getValue(indicators.vwap, date);
    const rsiVal = getValue(indicators.rsi, date);
    const volVal = getValue(indicators.volume, date);
    if (!price || !vwapVal || !rsiVal) return null;
    if (price.low < vwapVal && rsiVal < this.params.rsiOversold && volVal > indicators.avgVolume * this.params.volumeMult)
      return { action: 'BUY', confidence: 0.7 + (35 - rsiVal) / 100 };
    if (price.high > vwapVal && rsiVal > this.params.rsiOverbought && volVal > indicators.avgVolume * this.params.volumeMult)
      return { action: 'SELL', confidence: 0.7 + (rsiVal - 65) / 100 };
    return null;
  },
  getExit(data, date, indicators, position) {
    const rsiVal = getValue(indicators.rsi, date);
    const hour = new Date(date).getHours();
    if (!rsiVal) return null;
    if (position.action === 'BUY' && rsiVal > this.params.rsiOverbought) return { action: 'EXIT', reason: 'RSI overbought' };
    if (position.action === 'SELL' && rsiVal < this.params.rsiOversold) return { action: 'EXIT', reason: 'RSI oversold' };
    if (hour >= 14 && hour < 15) return { action: 'EXIT', reason: 'Intraday time exit' };
    return null;
  }
};

export const ORBStrategy = {
  name: 'Opening Range Breakout', type: 'intraday', timeframe: '5m',
  params: { rangeMinutes: 30, breakoutMult: 1 },
  calculateIndicators(data) {
    const dailyBars = {};
    for (const bar of data) {
      const day = bar.date.split('T')[0];
      if (!dailyBars[day]) dailyBars[day] = [];
      dailyBars[day].push(bar);
    }
    const ranges = {};
    for (const [day, bars] of Object.entries(dailyBars)) {
      const rangeBars = bars.slice(0, this.params.rangeMinutes / 5);
      if (rangeBars.length > 0) {
        ranges[day] = {
          high: Math.max(...rangeBars.map(b => b.high)),
          low: Math.min(...rangeBars.map(b => b.low)),
          midpoint: (Math.max(...rangeBars.map(b => b.high)) + Math.min(...rangeBars.map(b => b.low))) / 2
        };
      }
    }
    return { ranges };
  },
  getEntry(data, date, indicators) {
    const day = date.split('T')[0];
    const range = indicators.ranges[day];
    const price = data.find(d => d.date === date);
    if (!range || !price) return null;
    if (price.close > range.high * (1 + this.params.breakoutMult / 100))
      return { action: 'BUY', confidence: 0.75, target: range.midpoint };
    if (price.close < range.low * (1 - this.params.breakoutMult / 100))
      return { action: 'SELL', confidence: 0.75, target: range.midpoint };
    return null;
  }
};

export const SuperTrendTrail = {
  name: 'SuperTrend Trailing', type: 'intraday', timeframe: '5m',
  params: { atrPeriod: 10, multiplier: 3 },
  calculateIndicators(data) {
    const atr = INDICATOR_FUNCTIONS.ATR(data, this.params.atrPeriod);
    const result = [];
    for (const atrBar of atr) {
      const priceData = data.find(d => d.date === atrBar.date);
      if (!priceData) continue;
      const hl2 = (priceData.high + priceData.low) / 2;
      const upperBand = hl2 + this.params.multiplier * atrBar.value;
      const lowerBand = hl2 - this.params.multiplier * atrBar.value;
      const prev = result[result.length - 1];
      let supertrend = lowerBand, direction = 1;
      if (prev) {
        direction = priceData.close > prev.supertrend ? 1 : -1;
        supertrend = direction === 1 ? lowerBand : upperBand;
      }
      result.push({ date: atrBar.date, value: supertrend, direction, upper: upperBand, lower: lowerBand });
    }
    return { supertrend: result };
  },
  getEntry(data, date, indicators) {
    const st = indicators.supertrend;
    const idx = st.findIndex(v => v.date === date);
    if (idx <= 0) return null;
    const current = st[idx], prev = st[idx - 1], price = data.find(d => d.date === date);
    if (!price) return null;
    if (prev.direction === -1 && current.direction === 1)
      return { action: 'BUY', confidence: 0.8, stopLoss: current.lower };
    if (prev.direction === 1 && current.direction === -1)
      return { action: 'SELL', confidence: 0.8, stopLoss: current.upper };
    return null;
  }
};
