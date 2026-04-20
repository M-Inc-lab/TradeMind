// TradeMind AI - Accuracy Tracking Backtester
// Tracks trade accuracy from 0% → 85% → 93% target
// Uses actual NSE/BSE historical data from Yahoo Finance

import { fetchYahooOHLCV } from './market-data.js';
import { INDICATOR_FUNCTIONS } from './backtester-core.js';
import { blackScholes, calculateGreeks } from './options-analytics.js';

// ==========================================
// ACCURACY METRICS
// ==========================================
function calculateAccuracy(trades, marketData) {
  let correct = 0;
  let total = trades.length;
  
  for (const trade of trades) {
    // Check if trade was profitable (correct prediction)
    if (trade.type === 'BUY' && trade.exitPrice > trade.entryPrice) correct++;
    if (trade.type === 'SELL' && trade.exitPrice < trade.entryPrice) correct++;
    
    // Check stop loss hit (wrong direction)
    if (trade.hitStopLoss) correct--; // Deduct for stop loss hits
  }
  
  // Also factor in prediction confidence
  const confidentCorrect = trades.filter(t => t.confidence >= 0.7 && 
    ((t.type === 'BUY' && t.exitPrice > t.entryPrice) ||
     (t.type === 'SELL' && t.exitPrice < t.entryPrice))).length;
  
  const accuracy = total > 0 ? (correct / total) * 100 : 0;
  const confidentAccuracy = total > 0 ? (confidentCorrect / total) * 100 : 0;
  
  return { accuracy, confidentAccuracy, total, correct };
}

// ==========================================
// SIGNAL GENERATION WITH CONFIDENCE
// ==========================================
function generateSignal(symbol, candles, strategy) {
  const closes = candles.map(c => c.close);
  const highs = candles.map(c => c.high);
  const lows = candles.map(c => c.low);
  const volumes = candles.map(c => c.volume);
  
  const last = closes.length - 1;
  const current = closes[last];
  const prev = closes[last - 1];
  
  let signal = 'HOLD';
  let confidence = 0.5;
  let entry = current;
  let stopLoss = 0;
  let target = 0;
  let indicators = {};
  
  // Calculate indicators
  const ema9 = INDICATOR_FUNCTIONS.EMA(closes.slice(-20), 9)[0];
  const ema21 = INDICATOR_FUNCTIONS.EMA(closes.slice(-30), 21)[0];
  const ema50 = INDICATOR_FUNCTIONS.EMA(closes.slice(-60), 50)[0];
  const rsi = INDICATOR_FUNCTIONS.RSI(closes, 14)[0];
  const macd = INDICATOR_FUNCTIONS.MACD(closes);
  const atr = INDICATOR_FUNCTIONS.ATR(highs, lows, closes, 14)[0];
  const volumeProfile = INDICATOR_FUNCTIONS.VolumeProfile(highs, lows, volumes);
  
  const currentRSI = rsi || 50;
  const currentMACD = macd.macd || 0;
  const signalMACD = macd.signal || 0;
  const currentEMA9 = ema9 || current;
  const currentEMA21 = ema21 || current;
  const currentEMA50 = ema50 || current;
  
  indicators = { ema9: currentEMA9, ema21: currentEMA21, ema50: currentEMA50, 
                 rsi: currentRSI, macd: currentMACD, signal: signalMACD, atr };
  
  // ========== STRATEGY: Trend Following ==========
  if (strategy === 'TREND') {
    if (current > currentEMA21 && currentEMA9 > currentEMA21 && currentRSI > 50) {
      signal = 'BUY';
      confidence = Math.min(0.9, 0.5 + (currentRSI - 50) / 100 + (currentEMA9 - currentEMA21) / currentEMA21);
      stopLoss = current - 2 * atr;
      target = current + 3 * atr;
    } else if (current < currentEMA21 || currentRSI < 40) {
      signal = 'SELL';
      confidence = Math.min(0.8, 0.5 + (50 - currentRSI) / 100);
      stopLoss = current + 2 * atr;
      target = current - 3 * atr;
    }
  }
  
  // ========== STRATEGY: RSI Reversion ==========
  if (strategy === 'RSI_REVERSION') {
    if (currentRSI < 30) {
      signal = 'BUY';
      confidence = 0.7 + (30 - currentRSI) / 100;
      stopLoss = current - 2 * atr;
      target = current + 4 * atr;
    } else if (currentRSI > 70) {
      signal = 'SELL';
      confidence = 0.7 + (currentRSI - 70) / 100;
      stopLoss = current + 2 * atr;
      target = current - 4 * atr;
    }
  }
  
  // ========== STRATEGY: MACD Crossover ==========
  if (strategy === 'MACD_CROSS') {
    const prevMACD = macd.macd - (currentMACD - signalMACD);
    if (prevMACD < signalMACD && currentMACD > signalMACD) {
      signal = 'BUY';
      confidence = 0.75;
      stopLoss = current - 1.5 * atr;
      target = current + 5 * atr;
    } else if (prevMACD > signalMACD && currentMACD < signalMACD) {
      signal = 'SELL';
      confidence = 0.75;
      stopLoss = current + 1.5 * atr;
      target = current - 5 * atr;
    }
  }
  
  // ========== STRATEGY: VWAP Reversion ==========
  if (strategy === 'VWAP') {
    const vwap = INDICATOR_FUNCTIONS.VWAP(highs, lows, closes, volumes);
    if (current > vwap && currentRSI > 55) {
      signal = 'BUY';
      confidence = 0.65;
      stopLoss = vwap;
      target = current + 2 * atr;
    } else if (current < vwap && currentRSI < 45) {
      signal = 'SELL';
      confidence = 0.65;
      stopLoss = vwap;
      target = current - 2 * atr;
    }
  }
  
  // ========== STRATEGY: Breakout ==========
  if (strategy === 'BREAKOUT') {
    const resistance = Math.max(...highs.slice(-20, -1));
    const support = Math.min(...lows.slice(-20, -1));
    if (current > resistance && volumes[last] > volumes[last-1] * 1.5) {
      signal = 'BUY';
      confidence = 0.8;
      stopLoss = support;
      target = current + (current - support) * 2;
    } else if (current < support && volumes[last] > volumes[last-1] * 1.5) {
      signal = 'SELL';
      confidence = 0.8;
      stopLoss = resistance;
      target = current - (resistance - current) * 2;
    }
  }
  
  // ========== STRATEGY: Multi-Timeframe ==========
  if (strategy === 'MTF') {
    const ema9_1h = INDICATOR_FUNCTIONS.EMA(closes.slice(-20), 9)[0];
    const ema21_1h = INDICATOR_FUNCTIONS.EMA(closes.slice(-30), 21)[0];
    const rsi_1h = INDICATOR_FUNCTIONS.RSI(closes, 14)[0];
    
    // Bullish: EMA9 > EMA21 on multiple timeframes + RSI confirm
    if (ema9_1h > ema21_1h && currentRSI > 55 && rsi_1h > 50) {
      signal = 'BUY';
      confidence = 0.85;
      stopLoss = current - 2 * atr;
      target = current + 4 * atr;
    } else if (ema9_1h < ema21_1h && currentRSI < 45 && rsi_1h < 50) {
      signal = 'SELL';
      confidence = 0.85;
      stopLoss = current + 2 * atr;
      target = current - 4 * atr;
    }
  }
  
  // ========== STRATEGY: Options Straddle (High Volatility) ==========
  if (strategy === 'OPTIONS_STRADDLE') {
    const iv = calculateIV(current, current * 0.1, 30/365, current * 0.3); // Simplified IV calc
    if (iv > 25) {
      signal = 'STRADDLE';
      confidence = 0.6;
    }
  }
  
  return { signal, confidence, entry, stopLoss, target, indicators, strategy };
}

// ==========================================
// SIMULATED TRADE EXECUTION
// ==========================================
function executeTrade(symbol, signal, candles, stopLoss, target, atr) {
  const current = candles[candles.length - 1].close;
  const high = candles[candles.length - 1].high;
  const low = candles[candles.length - 1].low;
  
  const SL_PCT = stopLoss ? Math.abs((current - stopLoss) / current) : 0.02;
  const TARGET_PCT = target ? Math.abs((target - current) / current) : 0.04;
  
  let exitPrice = current;
  let exitReason = 'TIMEOUT';
  let hitStopLoss = false;
  
  // Simulate price movement (simplified - uses random walk based on ATR)
  const maxMove = atr * 3;
  const priceMove = (Math.random() - 0.5) * 2 * maxMove;
  
  if (signal === 'BUY') {
    const simulatedPrice = current + priceMove;
    
    if (simulatedPrice <= stopLoss) {
      exitPrice = stopLoss;
      exitReason = 'STOP_LOSS';
      hitStopLoss = true;
    } else if (simulatedPrice >= target) {
      exitPrice = target;
      exitReason = 'TARGET_HIT';
    } else {
      exitPrice = simulatedPrice;
      exitReason = 'TIMEOUT';
    }
  } else if (signal === 'SELL') {
    const simulatedPrice = current - priceMove;
    
    if (simulatedPrice >= stopLoss) {
      exitPrice = stopLoss;
      exitReason = 'STOP_LOSS';
      hitStopLoss = true;
    } else if (simulatedPrice <= target) {
      exitPrice = target;
      exitReason = 'TARGET_HIT';
    } else {
      exitPrice = simulatedPrice;
      exitReason = 'TIMEOUT';
    }
  }
  
  const pnl = signal === 'BUY' ? exitPrice - current : current - exitPrice;
  const pnlPct = (pnl / current) * 100;
  
  return {
    symbol,
    entry: current,
    exit: exitPrice,
    pnl,
    pnlPct,
    exitReason,
    hitStopLoss,
    confidence: signal.confidence,
    strategy: signal.strategy
  };
}

// ==========================================
// MAIN BACKTEST FUNCTION
// ==========================================
export async function runAccuracyBacktest({ symbols = ['RELIANCE'], 
  startDate = '2024-01-01', endDate = '2025-01-01', 
  strategy = 'TREND', interval = '1d', capital = 100000 }) {
  
  const results = [];
  const allTrades = [];
  const strategyResults = {};
  
  for (const symbol of symbols) {
    try {
      console.log(`\n=== Backtesting ${symbol} ===`);
      
      // Fetch historical data
      const candles = await fetchYahooOHLCV(symbol, startDate, endDate, interval);
      
      if (candles.length < 50) {
        console.log(`Insufficient data for ${symbol}: ${candles.length} candles`);
        continue;
      }
      
      console.log(`Loaded ${candles.length} candles for ${symbol}`);
      
      // Generate signals for each day
      const signals = [];
      for (let i = 50; i < candles.length; i++) {
        const slice = candles.slice(0, i + 1);
        const signal = generateSignal(symbol, slice, strategy);
        
        if (signal.signal !== 'HOLD') {
          signals.push({ candle: candles[i], signal, index: i });
        }
      }
      
      console.log(`Generated ${signals.length} signals`);
      
      // Execute simulated trades
      for (const { candle, signal, index } of signals) {
        const slice = candles.slice(index, Math.min(index + 20, candles.length));
        const trade = executeTrade(symbol, signal, [candle], signal.stopLoss, signal.target, signal.indicators.atr);
        allTrades.push(trade);
        results.push({ symbol, ...trade, date: candle.date });
      }
      
      // Calculate accuracy for this symbol
      const symbolTrades = allTrades.filter(t => t.symbol === symbol);
      const accuracy = calculateAccuracy(symbolTrades, candles);
      strategyResults[symbol] = { ...accuracy, symbol };
      
    } catch (e) {
      console.error(`Error backtesting ${symbol}:`, e.message);
    }
  }
  
  // Overall accuracy
  const overall = calculateAccuracy(allTrades, []);
  
  // Win rate
  const winningTrades = allTrades.filter(t => t.pnl > 0);
  const losingTrades = allTrades.filter(t => t.pnl <= 0);
  const winRate = allTrades.length > 0 ? (winningTrades.length / allTrades.length) * 100 : 0;
  
  // Average trade
  const avgTrade = allTrades.length > 0 
    ? allTrades.reduce((sum, t) => sum + t.pnlPct, 0) / allTrades.length 
    : 0;
  
  // Max drawdown
  let maxDrawdown = 0;
  let peak = capital;
  let current = capital;
  for (const trade of allTrades) {
    current += (trade.pnlPct / 100) * capital;
    if (current > peak) peak = current;
    const drawdown = (peak - current) / peak * 100;
    if (drawdown > maxDrawdown) maxDrawdown = drawdown;
  }
  
  // Sharpe ratio (simplified)
  const returns = allTrades.map(t => t.pnlPct / 100);
  const avgReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
  const stdReturn = Math.sqrt(returns.map(r => Math.pow(r - avgReturn, 2)).reduce((a, b) => a + b, 0) / returns.length);
  const sharpe = stdReturn > 0 ? (avgReturn / stdReturn) * Math.sqrt(252) : 0;
  
  // Sortino ratio (using downside deviation)
  const downsideReturns = returns.filter(r => r < 0);
  const downsideStd = downsideReturns.length > 0 
    ? Math.sqrt(downsideReturns.map(r => Math.pow(r - avgReturn, 2)).reduce((a, b) => a + b, 0) / downsideReturns.length)
    : stdReturn;
  const sortino = downsideStd > 0 ? (avgReturn / downsideStd) * Math.sqrt(252) : 0;
  
  // Profit factor
  const grossProfit = winningTrades.reduce((sum, t) => sum + t.pnl, 0);
  const grossLoss = Math.abs(losingTrades.reduce((sum, t) => sum + t.pnl, 0));
  const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : 0;
  
  return {
    summary: {
      totalTrades: allTrades.length,
      winningTrades: winningTrades.length,
      losingTrades: losingTrades.length,
      winRate,
      avgTrade,
      maxDrawdown,
      sharpe,
      sortino,
      profitFactor,
      accuracy: overall.accuracy,
      confidentAccuracy: overall.confidentAccuracy,
      targetAccuracy: 85,
      progressTo93: Math.min(100, (overall.accuracy / 93) * 100)
    },
    bySymbol: strategyResults,
    recentTrades: allTrades.slice(-20).reverse()
  };
}

export { generateSignal };
