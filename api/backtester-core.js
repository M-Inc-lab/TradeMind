// TradeMind AI - Executable Strategy Engine
// Converts strategy definitions into actual backtestable code

const INDICATOR_FUNCTIONS = {
  SMA: (data, period) => {
    const result = [];
    for (let i = period - 1; i < data.length; i++) {
      let sum = 0;
      for (let j = 0; j < period; j++) sum += data[i - j].close;
      result.push({ date: data[i].date, value: sum / period });
    }
    return result;
  },
  
  EMA: (data, period) => {
    const k = 2 / (period + 1);
    const sma = INDICATOR_FUNCTIONS.SMA(data.slice(0, period), period);
    let ema = sma[sma.length - 1].value;
    const result = [{ date: data[period - 1].date, value: ema }];
    
    for (let i = period; i < data.length; i++) {
      ema = data[i].close * k + ema * (1 - k);
      result.push({ date: data[i].date, value: ema });
    }
    return result;
  },
  
  RSI: (data, period = 14) => {
    const result = [];
    let gains = [], losses = [];
    
    for (let i = 1; i < data.length; i++) {
      const change = data[i].close - data[i - 1].close;
      gains.push(change > 0 ? change : 0);
      losses.push(change < 0 ? -change : 0);
      
      if (i >= period) {
        const avgGain = gains.slice(-period).reduce((a, b) => a + b, 0) / period;
        const avgLoss = losses.slice(-period).reduce((a, b) => a + b, 0) / period;
        const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
        const rsi = 100 - (100 / (1 + rs));
        result.push({ date: data[i].date, value: rsi });
      }
    }
    return result;
  },
  
  MACD: (data, fast = 12, slow = 26, signal = 9) => {
    const emaFast = INDICATOR_FUNCTIONS.EMA(data, fast);
    const emaSlow = INDICATOR_FUNCTIONS.EMA(data, slow);
    
    const macdLine = [];
    const startIdx = emaSlow[0] ? 0 : emaFast.length - emaSlow.length;
    
    for (let i = 0; i < emaSlow.length; i++) {
      const fastIdx = i + (emaFast.length - emaSlow.length);
      if (fastIdx >= 0 && fastIdx < emaFast.length) {
        macdLine.push({
          date: emaSlow[i].date,
          value: emaFast[fastIdx].value - emaSlow[i].value
        });
      }
    }
    
    // Signal line = EMA of MACD
    const signalLine = INDICATOR_FUNCTIONS.EMA(
      macdLine.map(d => ({ ...d, close: d.value })),
      signal
    );
    
    const histogram = macdLine.slice(-signalLine.length).map((d, i) => ({
      date: d.date,
      value: d.value - signalLine[i].value
    }));
    
    return { macd: macdLine.slice(-signalLine.length), signal: signalLine, histogram };
  },
  
  BB: (data, period = 20, stdDev = 2) => {
    const sma = INDICATOR_FUNCTIONS.SMA(data, period);
    const result = [];
    
    for (let i = period - 1; i < data.length; i++) {
      const mean = sma[i - (period - 1)].value;
      let sumSq = 0;
      for (let j = 0; j < period; j++) {
        sumSq += Math.pow(data[i - j].close - mean, 2);
      }
      const std = Math.sqrt(sumSq / period);
      result.push({
        date: data[i].date,
        upper: mean + stdDev * std,
        middle: mean,
        lower: mean - stdDev * std
      });
    }
    return result;
  },
  
  ATR: (data, period = 14) => {
    const trueRange = [];
    for (let i = 1; i < data.length; i++) {
      const hl = data[i].high - data[i].low;
      const hc = Math.abs(data[i].high - data[i - 1].close);
      const lc = Math.abs(data[i].low - data[i - 1].close);
      trueRange.push(Math.max(hl, hc, lc));
    }
    
    const result = [];
    for (let i = period - 1; i < trueRange.length; i++) {
      const atr = trueRange.slice(i - (period - 1), i + 1).reduce((a, b) => a + b, 0) / period;
      result.push({ date: data[i + 1].date, value: atr });
    }
    return result;
  },
  
  STOCH: (data, kPeriod = 14, dPeriod = 3) => {
    const result = [];
    for (let i = kPeriod - 1; i < data.length; i++) {
      let highest = -Infinity, lowest = Infinity;
      for (let j = 0; j < kPeriod; j++) {
        highest = Math.max(highest, data[i - j].high);
        lowest = Math.min(lowest, data[i - j].low);
      }
      const k = highest === lowest ? 50 : 100 * (data[i].close - lowest) / (highest - lowest);
      result.push({ date: data[i].date, value: k });
    }
    
    // %D = SMA of %K
    const d = [];
    for (let i = dPeriod - 1; i < result.length; i++) {
      const avg = result.slice(i - (dPeriod - 1), i + 1).reduce((a, b) => a + b.value, 0) / dPeriod;
      d.push({ date: result[i].date, value: avg });
    }
    
    return { k: result, d };
  },
  
  ADX: (data, period = 14) => {
    const plusDM = [], minusDM = [], trueRange = [];
    
    for (let i = 1; i < data.length; i++) {
      const hl = data[i].high - data[i].low;
      const hph = data[i].high - data[i - 1].high;
      const plh = data[i - 1].low - data[i].low;
      
      plusDM.push(hph > plh && hph > 0 ? hph : 0);
      minusDM.push(plh > hph && plh > 0 ? plh : 0);
      
      const hc = Math.abs(data[i].high - data[i - 1].close);
      const lc = Math.abs(data[i].low - data[i - 1].close);
      trueRange.push(Math.max(hl, hc, lc));
    }
    
    const result = [];
    let smoothPlus = 0, smoothMinus = 0, smoothTR = 0;
    
    for (let i = 0; i < period; i++) {
      smoothPlus += plusDM[i];
      smoothMinus += minusDM[i];
      smoothTR += trueRange[i];
    }
    
    for (let i = period; i < data.length; i++) {
      const plusDI = 100 * smoothPlus / smoothTR;
      const minusDI = 100 * smoothMinus / smoothTR;
      const dx = 100 * Math.abs(plusDI - minusDI) / (plusDI + minusDI);
      result.push({ date: data[i].date, value: dx });
      
      smoothPlus = smoothPlus - smoothPlus / period + plusDM[i];
      smoothMinus = smoothMinus - smoothMinus / period + minusDM[i];
      smoothTR = smoothTR - smoothTR / period + trueRange[i];
    }
    
    // ADX = smoothed DX
    const adx = [];
    let smoothed = result.slice(0, period).reduce((a, b) => a + b.value, 0) / period;
    adx.push({ date: result[period - 1].date, value: smoothed });
    
    for (let i = period; i < result.length; i++) {
      smoothed = (smoothed * (period - 1) + result[i].value) / period;
      adx.push({ date: result[i].date, value: smoothed });
    }
    
    return adx;
  }
};

// Parse and execute strategy conditions
function evaluateCondition(condition, indicators, price) {
  const parts = condition.split(' ').filter(p => p.trim());
  if (parts.length < 3) return false;
  
  const [left, op, right] = parts;
  let leftVal = indicators[left]?.value ?? price[left] ?? parseFloat(left);
  let rightVal = parseFloat(right);
  
  switch (op) {
    case '>': return leftVal > rightVal;
    case '<': return leftVal < rightVal;
    case '>=': return leftVal >= rightVal;
    case '<=': return leftVal <= rightVal;
    case '==': return Math.abs(leftVal - rightVal) < 0.01;
    default: return false;
  }
}

// Execute a complete strategy backtest
function executeStrategy(strategy, data, startBalance = 100000) {
  const trades = [];
  let balance = startBalance;
  let position = null;
  let equity = startBalance;
  const equityCurve = [];
  
  // Pre-calculate all indicators
  const indicators = {};
  for (const [name, params] of Object.entries(strategy.indicators || {})) {
    if (INDICATOR_FUNCTIONS[name]) {
      indicators[name] = INDICATOR_FUNCTIONS[name](data, ...(Array.isArray(params) ? params : [params]));
    }
  }
  
  // Main backtest loop
  for (let i = 50; i < data.length; i++) { // Start from bar 50 to have indicator history
    const bar = data[i];
    const date = bar.date;
    equityCurve.push({ date, equity });
    
    // Get current indicator values
    const currentIndicators = {};
    for (const [name, values] of Object.entries(indicators)) {
      const match = values.find(v => v.date === date);
      if (match) currentIndicators[name] = match;
    }
    currentIndicators.price = bar.close;
    
    // Check entry signals
    if (!position && evaluateCondition(strategy.entry, currentIndicators, bar)) {
      const quantity = Math.floor(balance * 0.95 / bar.close);
      if (quantity > 0) {
        position = {
          type: strategy.action === 'LONG' ? 'long' : 'short',
          entryPrice: bar.close,
          quantity,
          entryDate: date,
          balance
        };
        balance = 0;
      }
    }
    
    // Check exit signals
    if (position) {
      const pnl = position.type === 'long'
        ? (bar.close - position.entryPrice) * position.quantity
        : (position.entryPrice - bar.close) * position.quantity;
      
      const shouldExit = 
        evaluateCondition(strategy.exit, currentIndicators, bar) ||
        pnl < -position.quantity * position.entryPrice * (strategy.stopLoss || 0.02) ||
        pnl > position.quantity * position.entryPrice * (strategy.target || 0.05);
      
      if (shouldExit) {
        balance = position.quantity * bar.close + pnl;
        trades.push({
          entryDate: position.entryDate,
          exitDate: date,
          entryPrice: position.entryPrice,
          exitPrice: bar.close,
          type: position.type,
          quantity: position.quantity,
          pnl,
          return: pnl / (position.quantity * position.entryPrice) * 100
        });
        position = null;
      }
    }
  }
  
  // Calculate metrics
  const winningTrades = trades.filter(t => t.pnl > 0);
  const losingTrades = trades.filter(t => t.pnl <= 0);
  
  return {
    strategy: strategy.name,
    totalTrades: trades.length,
    winningTrades: winningTrades.length,
    losingTrades: losingTrades.length,
    winRate: trades.length > 0 ? winningTrades.length / trades.length : 0,
    totalPnL: balance - startBalance,
    totalReturn: ((balance - startBalance) / startBalance) * 100,
    maxDrawdown: calculateMaxDrawdown(equityCurve),
    sharpe: calculateSharpe(trades),
    avgWin: winningTrades.length > 0 ? winningTrades.reduce((a, t) => a + t.pnl, 0) / winningTrades.length : 0,
    avgLoss: losingTrades.length > 0 ? losingTrades.reduce((a, t) => a + t.pnl, 0) / losingTrades.length : 0,
    trades,
    equityCurve
  };
}

function calculateMaxDrawdown(equityCurve) {
  let peak = equityCurve[0]?.equity || 0;
  let maxDD = 0;
  for (const point of equityCurve) {
    peak = Math.max(peak, point.equity);
    const dd = (peak - point.equity) / peak * 100;
    maxDD = Math.max(maxDD, dd);
  }
  return maxDD;
}

function calculateSharpe(trades) {
  if (trades.length < 2) return 0;
  const returns = trades.map(t => t.return / 100);
  const avg = returns.reduce((a, b) => a + b, 0) / returns.length;
  const std = Math.sqrt(returns.map(r => Math.pow(r - avg, 2)).reduce((a, b) => a + b, 0) / returns.length);
  return std > 0 ? avg / std * Math.sqrt(252) : 0;
}

export { INDICATOR_FUNCTIONS, executeStrategy };
export default { INDICATOR_FUNCTIONS, executeStrategy };
