// TradeMind - Executable Swing & Positional Strategies
import { INDICATOR_FUNCTIONS } from '../backtester-core.js';

const getVal = (arr, date) => arr?.find(v => v.date === date)?.value ?? null;
const getObj = (arr, date) => arr?.find(v => v.date === date) ?? null;

export const MACDTrend = {
  name: 'MACD Trend Following', type: 'swing', timeframe: '1h',
  params: { fast: 12, slow: 26, signal: 9 },
  calculateIndicators(data) {
    return {
      macd: INDICATOR_FUNCTIONS.MACD(data, this.params.fast, this.params.slow, this.params.signal),
      ema200: INDICATOR_FUNCTIONS.EMA(data, 200)
    };
  },
  getEntry(data, date, ind) {
    const price = data.find(d => d.date === date);
    const macd = ind.macd, ema200Val = getVal(ind.ema200, date);
    if (!price || !macd?.macd || !ema200Val) return null;
    const idx = macd.macd.findIndex(v => v.date === date);
    if (idx <= 0) return null;
    const mCurr = macd.macd[idx], mPrev = macd.macd[idx - 1];
    const sCurr = macd.signal[idx], sPrev = macd.signal[idx - 1];
    if (!mCurr || !mPrev || !sCurr || !sPrev) return null;
    if (mPrev.value <= sPrev.value && mCurr.value > sCurr.value && price.close > ema200Val)
      return { action: 'BUY', confidence: 0.85 };
    if (mPrev.value >= sPrev.value && mCurr.value < sCurr.value && price.close < ema200Val)
      return { action: 'SELL', confidence: 0.85 };
    return null;
  }
};

export const BBSqueeze = {
  name: 'Bollinger Band Squeeze', type: 'swing', timeframe: '4h',
  params: { bbPeriod: 20, bbStd: 2, atrPeriod: 14 },
  calculateIndicators(data) {
    return {
      bb: INDICATOR_FUNCTIONS.BB(data, this.params.bbPeriod, this.params.bbStd),
      atr: INDICATOR_FUNCTIONS.ATR(data, this.params.atrPeriod)
    };
  },
  getEntry(data, date, ind) {
    const bb = ind.bb, price = data.find(d => d.date === date);
    if (!bb || !price) return null;
    const idx = bb.findIndex(v => v.date === date);
    if (idx <= 0) return null;
    const curr = bb[idx], prev = bb[idx - 1];
    if (!curr || !prev) return null;
    const width = (curr.upper - curr.lower) / curr.middle;
    const avgWidth = bb.reduce((a, b) => a + (b.upper - b.lower) / b.middle, 0) / bb.length;
    const wasSqueeze = (prev.upper - prev.lower) / prev.middle < avgWidth * 0.5;
    const isSqueeze = width < avgWidth * 0.5;
    if (wasSqueeze && !isSqueeze) {
      if (price.close > curr.upper) return { action: 'BUY', confidence: 0.8, stopLoss: curr.middle };
      if (price.close < curr.lower) return { action: 'SELL', confidence: 0.8, stopLoss: curr.middle };
    }
    return null;
  }
};

export const RSI21Swing = {
  name: 'RSI 21 Swing', type: 'swing', timeframe: '4h',
  params: { rsiPeriod: 21, oversold: 35, overbought: 65 },
  calculateIndicators(data) {
    return { rsi: INDICATOR_FUNCTIONS.RSI(data, this.params.rsiPeriod) };
  },
  getEntry(data, date, ind) {
    const price = data.find(d => d.date === date);
    const rsiVal = getVal(ind.rsi, date);
    if (!price || !rsiVal) return null;
    const idx = ind.rsi.findIndex(v => v.date === date);
    if (idx <= 0) return null;
    const prev = ind.rsi[idx - 1].value;
    if (prev <= this.params.oversold && rsiVal > this.params.oversold)
      return { action: 'BUY', confidence: 0.75 };
    if (prev >= this.params.overbought && rsiVal < this.params.overbought)
      return { action: 'SELL', confidence: 0.75 };
    return null;
  }
};

export const ADXTrendFilter = {
  name: 'ADX Trend Strength', type: 'swing', timeframe: '1h',
  params: { adxPeriod: 14, adxThreshold: 25 },
  calculateIndicators(data) {
    return {
      adx: INDICATOR_FUNCTIONS.ADX(data, this.params.adxPeriod),
      ema50: INDICATOR_FUNCTIONS.EMA(data, 50)
    };
  },
  getEntry(data, date, ind) {
    const price = data.find(d => d.date === date);
    const adxVal = getVal(ind.adx, date);
    const ema50 = getVal(ind.ema50, date);
    if (!price || !adxVal || !ema50) return null;
    if (adxVal > this.params.adxThreshold) {
      if (price.close > ema50) return { action: 'BUY', confidence: 0.7 + adxVal / 100 };
      if (price.close < ema50) return { action: 'SELL', confidence: 0.7 + adxVal / 100 };
    }
    return null;
  }
};
