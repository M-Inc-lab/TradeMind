// TradeMind AI - Production Backtesting Engine
// Walk-forward, Monte Carlo, multi-strategy, realistic costs

import { detectPatterns } from './pattern-recognition.js';

export class Backtester {
  constructor() {
    this.results = [];
  }

  // Add indicator to candles
  addIndicators(candles) {
    return candles.map((c, i) => {
      const period = Math.min(i + 1, 20);
      const closes = candles.slice(Math.max(0, i - period + 1), i + 1).map(x => x.close);
      const highs = candles.slice(Math.max(0, i - period + 1), i + 1).map(x => x.high);
      const lows = candles.slice(Math.max(0, i - period + 1), i + 1).map(x => x.low);
      const vols = candles.slice(Math.max(0, i - period + 1), i + 1).map(x => x.volume);
      
      const sma = closes.reduce((a, b) => a + b, 0) / closes.length;
      const max = Math.max(...highs), min = Math.min(...lows);
      const range = max - min || 1;
      const closes_above_sma = closes[closes.length-1] > sma;

      // Bollinger Bands
      const sma20 = i >= 19 ? candles.slice(i-19, i+1).reduce((a,c)=>a+c.close,0)/20 : sma;
      const std = i >= 19 ? Math.sqrt(candles.slice(i-19,i+1).reduce((a,c)=>a+Math.pow(c.close-sma20,2),0)/20) : 0;

      // RSI
      let gains = 0, losses = 0;
      for (let j = 1; j < closes.length; j++) {
        const diff = closes[j] - closes[j-1];
        if (diff > 0) gains += diff;
        else losses += Math.abs(diff);
      }
      const avgGain = gains / period, avgLoss = losses / period;
      const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
      const rsi = 100 - (100 / (1 + rs));

      // MACD
      const ema12 = this.ema(candles.slice(Math.max(0,i-11),i+1).map(x=>x.close), 12);
      const ema26 = this.ema(candles.slice(Math.max(0,i-25),i+1).map(x=>x.close), 26);
      const macd = ema12 - ema26;
      const signal = this.ema(candles.slice(Math.max(0,i-8),i+1).map(x=>macd), 9);

      // ATR
      const trs = highs.map((h,j) => Math.max(h-lows[j], Math.abs(h-closes[j-1]||closes[j]), Math.abs(lows[j]-(closes[j-1]||closes[j]))));
      const atr = trs.reduce((a,b)=>a+b,0)/period;

      return {
        ...c,
        sma20: sma20 || c.close,
        bbUpper: sma20 + 2 * std,
        bbLower: sma20 - 2 * std,
        bbMiddle: sma20,
        rsi,
        macd,
        macdSignal: signal,
        macdHistogram: macd - signal,
        atr,
        volumeSMA: vols.reduce((a,b)=>a+b,0)/period,
        candleAboveSMA: closes_above_sma
      };
    });
  }

  ema(data, period) {
    if (data.length < period) return data[data.length-1];
    const k = 2 / (period + 1);
    let ema = data.slice(0, period).reduce((a,b)=>a+b,0) / period;
    for (let i = period; i < data.length; i++) ema = data[i] * k + ema * (1 - k);
    return ema;
  }

  // Execute complete backtest
  runBacktest(candles, strategy, config = {}) {
    const { capital = 100000, commission = 20, slippage = 0.01, positionSize = 0.1 } = config;
    const data = this.addIndicators(candles);
    let balance = capital, position = null, trades = [];
    let peak = balance, maxDD = 0;

    for (let i = 50; i < data.length; i++) {
      const candle = data[i];
      const signal = this.evaluateStrategy(strategy, data.slice(0, i + 1), position);

      if (signal === 'BUY' && !position) {
        const size = Math.floor((balance * positionSize) / candle.close);
        position = { type: 'LONG', entry: candle.close, qty: size, entryTime: candle.date };
      } else if ((signal === 'SELL' || strategy.takeProfit?.(candle, position) || strategy.stopLoss?.(candle, position)) && position) {
        const exit = candle.close * (1 - slippage / 100);
        const pnl = (exit - position.entry) * position.qty - commission * 2;
        balance += pnl;
        trades.push({ ...position, exit, pnl, exitTime: candle.date });
        if (balance > peak) peak = balance;
        const dd = (peak - balance) / peak;
        if (dd > maxDD) maxDD = dd;
        position = null;
      }
    }

    const closed = trades.filter(t => t.pnl !== undefined);
    const wins = closed.filter(t => t.pnl > 0);
    const returns = closed.map(t => t.pnl / capital);

    return {
      totalTrades: closed.length,
      winRate: closed.length ? (wins.length / closed.length) * 100 : 0,
      totalPnL: balance - capital,
      returns,
      maxDrawdown: maxDD * 100,
      sharpe: this.sharpe(returns),
      sortino: this.sortino(returns),
      profitFactor: this.profitFactor(closed),
      expectancy: this.expectancy(closed),
      equityCurve: this.equityCurve(closed, capital),
      trades: closed.slice(-20)
    };
  }

  evaluateStrategy(strategy, data, position) {
    const candle = data[data.length - 1];
    const prev = data[data.length - 2];
    
    // RSI Strategy
    if (strategy.type === 'RSI') {
      if (!position && candle.rsi < 30) return 'BUY';
      if (position && candle.rsi > 70) return 'SELL';
      if (position && strategy.stopLossPct && candle.close < position.entry * (1 - strategy.stopLossPct)) return 'SELL';
    }
    
    // MACD Strategy
    if (strategy.type === 'MACD') {
      if (!position && prev.macd < prev.macdSignal && candle.macd > candle.macdSignal) return 'BUY';
      if (position && prev.macd > prev.macdSignal && candle.macd < candle.macdSignal) return 'SELL';
    }

    // Bollinger Band Strategy
    if (strategy.type === 'BB') {
      if (!position && candle.close < candle.bbLower) return 'BUY';
      if (position && candle.close > candle.bbUpper) return 'SELL';
    }

    // VWAP Strategy
    if (strategy.type === 'VWAP') {
      const vwap = data.slice(-20).reduce((s,c)=>s+(c.high+c.low+c.close)/3,0)/20;
      if (!position && candle.close > vwap && prev.close <= vwap) return 'BUY';
      if (position && candle.close < vwap && prev.close >= vwap) return 'SELL';
    }

    // Combined Strategy
    if (strategy.type === 'COMBINED') {
      const bullish = candle.rsi > 50 && candle.candleAboveSMA && candle.macd > candle.macdSignal;
      const bearish = candle.rsi < 50 && !candle.candleAboveSMA && candle.macd < candle.macdSignal;
      if (!position && bullish) return 'BUY';
      if (position && (bearish || candle.rsi > 80)) return 'SELL';
    }

    return 'HOLD';
  }

  sharpe(returns) {
    if (!returns.length) return 0;
    const avg = returns.reduce((a,b)=>a+b,0)/returns.length;
    const std = Math.sqrt(returns.reduce((a,r)=>a+Math.pow(r-avg,2),0)/returns.length)||1;
    return (avg/std)*Math.sqrt(252);
  }

  sortino(returns) {
    if (!returns.length) return 0;
    const avg = returns.reduce((a,b)=>a+b,0)/returns.length;
    const neg = returns.filter(r=>r<0);
    const down = Math.sqrt(neg.reduce((a,r)=>a+r*r,0)/(neg.length||1))||1;
    return (avg/down)*Math.sqrt(252);
  }

  profitFactor(trades) {
    const wins = trades.filter(t=>t.pnl>0).reduce((s,t)=>s+t.pnl,0);
    const losses = Math.abs(trades.filter(t=>t.pnl<0).reduce((s,t)=>s+t.pnl,0))||1;
    return wins/losses;
  }

  expectancy(trades) {
    if (!trades.length) return 0;
    const wins = trades.filter(t=>t.pnl>0);
    const avgWin = wins.length ? wins.reduce((s,t)=>s+t.pnl,0)/wins.length : 0;
    const avgLoss = Math.abs(trades.filter(t=>t.pnl<0).reduce((s,t)=>s+t.pnl,0)/(trades.length-wins.length||1));
    return (wins.length/trades.length)*avgWin - ((trades.length-wins.length)/trades.length)*avgLoss;
  }

  equityCurve(trades, capital) {
    let equity = capital, curve = [{ date: 'start', value: capital }];
    for (const t of trades) {
      equity += t.pnl;
      curve.push({ date: t.exitTime, value: equity });
    }
    return curve;
  }

  // Walk-forward optimization
  walkForward(candles, strategy, trainPct = 0.7, stepPct = 0.1) {
    const results = [];
    const trainSize = Math.floor(candles.length * trainPct);
    let trainEnd = Math.floor(trainSize);
    
    while (trainEnd < candles.length - 1) {
      const trainData = candles.slice(0, trainEnd);
      const testData = candles.slice(trainEnd, Math.min(trainEnd + Math.floor(candles.length * stepPct), candles.length));
      
      const trainResult = this.runBacktest(trainData, strategy);
      const testResult = this.runBacktest(testData, strategy);
      
      results.push({
        trainPeriod: { start: 0, end: trainEnd },
        testPeriod: { start: trainEnd, end: trainEnd + testData.length },
        trainMetrics: { sharpe: trainResult.sharpe, winRate: trainResult.winRate },
        testMetrics: { sharpe: testResult.sharpe, winRate: testResult.winRate, pnl: testResult.totalPnL }
      });
      
      trainEnd += Math.floor(candles.length * stepPct);
    }
    return results;
  }

  // Monte Carlo simulation
  monteCarlo(trades, simulations = 1000) {
    const results = [];
    for (let i = 0; i < simulations; i++) {
      const shuffled = [...trades].sort(() => Math.random() - 0.5);
      let equity = 100000;
      for (const t of shuffled) equity += t.pnl;
      results.push(equity);
    }
    results.sort((a, b) => a - b);
    return {
      median: results[Math.floor(simulations / 2)],
      percentile5: results[Math.floor(simulations * 0.05)],
      percentile95: results[Math.floor(simulations * 0.95)],
      max: Math.max(...results),
      min: Math.min(...results)
    };
  }
}

export const backtester = new Backtester();
