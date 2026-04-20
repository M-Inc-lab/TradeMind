// TradeMind AI - Evolutionary Trading Algorithm
// Genetic programming approach to optimize trading strategies

const INDICATORS = {
  RSI: { period: 14, oversold: 30, overbought: 70 },
  MACD: { fast: 12, slow: 26, signal: 9 },
  SMA: { periods: [20, 50, 200] },
  EMA: { periods: [12, 26] },
  BB: { period: 20, std: 2 },
  ATR: { period: 14 },
  ADX: { period: 14 },
  STOCH: { k: 14, d: 3 },
  CCI: { period: 20 },
  WILLR: { period: 14 },
  MFI: { period: 14 },
  OBV: {}
};

const CONDITIONS = [
  'CROSSES_ABOVE', 'CROSSES_BELOW', 'ABOVE', 'BELOW', 'DIVERGES', 'CONVERGES'
];

const ACTIONS = ['BUY', 'SELL', 'HOLD'];

class StrategyGenome {
  constructor(genes = null) {
    if (genes) {
      this.genes = genes;
    } else {
      this.genes = this.randomGenome();
    }
    this.fitness = 0;
    this.trades = [];
    this.metrics = {};
  }

  randomGenome() {
    const indicators = Object.keys(INDICATORS);
    const numConditions = Math.floor(Math.random() * 4) + 1;
    
    const conditions = [];
    for (let i = 0; i < numConditions; i++) {
      conditions.push({
        indicator1: indicators[Math.floor(Math.random() * indicators.length)],
        indicator2: Math.random() > 0.5 ? indicators[Math.floor(Math.random() * indicators.length)] : null,
        condition: CONDITIONS[Math.floor(Math.random() * CONDITIONS.length)],
        threshold: Math.random() * 100
      });
    }
    
    return {
      entryConditions: conditions,
      exitConditions: conditions.slice(0, Math.ceil(conditions.length / 2)),
      positionSizing: Math.random() * 0.3 + 0.05,
      maxLossPercent: Math.random() * 2 + 0.5,
      maxGainPercent: Math.random() * 5 + 1,
      timeBasedExit: Math.floor(Math.random() * 120) + 15,
      trailingStop: Math.random() * 1.5 + 0.5
    };
  }

  mutate(rate = 0.1) {
    const child = new StrategyGenome(JSON.parse(JSON.stringify(this.genes)));
    
    if (Math.random() < rate) {
      const mutations = ['addCondition', 'removeCondition', 'modifyThreshold', 'swapIndicator'];
      const mutation = mutations[Math.floor(Math.random() * mutations.length)];
      
      switch (mutation) {
        case 'addCondition':
          const newCond = {
            indicator1: Object.keys(INDICATORS)[Math.floor(Math.random() * Object.keys(INDICATORS).length)],
            indicator2: Math.random() > 0.5 ? Object.keys(INDICATORS)[Math.floor(Math.random() * Object.keys(INDICATORS).length)] : null,
            condition: CONDITIONS[Math.floor(Math.random() * CONDITIONS.length)],
            threshold: Math.random() * 100
          };
          child.genes.entryConditions.push(newCond);
          break;
        case 'removeCondition':
          if (child.genes.entryConditions.length > 1) {
            child.genes.entryConditions.splice(Math.floor(Math.random() * child.genes.entryConditions.length), 1);
          }
          break;
        case 'modifyThreshold':
          const cond = child.genes.entryConditions[Math.floor(Math.random() * child.genes.entryConditions.length)];
          if (cond) cond.threshold += (Math.random() - 0.5) * 20;
          break;
      }
    }
    
    return child;
  }

  crossover(other) {
    const child = new StrategyGenome({
      entryConditions: Math.random() > 0.5 ? this.genes.entryConditions : other.genes.entryConditions,
      exitConditions: Math.random() > 0.5 ? this.genes.exitConditions : other.genes.exitConditions,
      positionSizing: Math.random() > 0.5 ? this.genes.positionSizing : other.genes.positionSizing,
      maxLossPercent: Math.random() > 0.5 ? this.genes.maxLossPercent : other.genes.maxLossPercent,
      maxGainPercent: Math.random() > 0.5 ? this.genes.maxGainPercent : other.genes.maxGainPercent,
      timeBasedExit: Math.random() > 0.5 ? this.genes.timeBasedExit : other.genes.timeBasedExit,
      trailingStop: Math.random() > 0.5 ? this.genes.trailingStop : other.genes.trailingStop
    });
    return child;
  }
}

class EvolutionaryEngine {
  constructor(options = {}) {
    this.populationSize = options.populationSize || 100;
    this.mutationRate = options.mutationRate || 0.15;
    this.crossoverRate = options.crossoverRate || 0.7;
    this.eliteCount = options.eliteCount || 10;
    this.generation = 0;
    this.population = [];
    this.bestStrategy = null;
    this.history = [];
  }

  initialize() {
    this.population = [];
    for (let i = 0; i < this.populationSize; i++) {
      this.population.push(new StrategyGenome());
    }
    this.generation = 0;
  }

  calculateFitness(strategy, marketData) {
    let capital = 100000;
    let trades = [];
    let position = null;
    
    for (let i = 50; i < marketData.length; i++) {
      const candle = marketData[i];
      const indicators = this.computeIndicators(marketData.slice(0, i + 1), strategy.genes);
      
      if (!position) {
        const entrySignal = this.evaluateConditions(strategy.genes.entryConditions, indicators);
        if (entrySignal === 'BUY') {
          const qty = Math.floor(capital * strategy.genes.positionSizing / candle.close);
          position = {
            entryPrice: candle.close,
            qty: qty,
            entryTime: i,
            stopLoss: candle.close * (1 - strategy.genes.maxLossPercent / 100),
            target: candle.close * (1 + strategy.genes.maxGainPercent / 100)
          };
          capital -= qty * candle.close;
        }
      } else {
        const exitSignal = this.evaluateConditions(strategy.genes.exitConditions, indicators);
        const shouldExit = 
          exitSignal === 'SELL' ||
          candle.low <= position.stopLoss ||
          candle.close >= position.target ||
          (i - position.entryTime) >= strategy.genes.timeBasedExit;
        
        if (shouldExit) {
          const pnl = (candle.close - position.entryPrice) * position.qty;
          capital += position.qty * candle.close;
          trades.push({
            entry: position.entryPrice,
            exit: candle.close,
            pnl: pnl,
            pnlPercent: (pnl / (position.entryPrice * position.qty)) * 100,
            exitReason: candle.low <= position.stopLoss ? 'SL' : 'TARGET'
          });
          position = null;
        }
      }
    }
    
    if (trades.length < 5) return -1000;
    
    const winRate = trades.filter(t => t.pnl > 0).length / trades.length;
    const avgWin = trades.filter(t => t.pnl > 0).reduce((s, t) => s + t.pnlPercent, 0) / trades.filter(t => t.pnl > 0).length;
    const avgLoss = Math.abs(trades.filter(t => t.pnl < 0).reduce((s, t) => s + t.pnlPercent, 0) / trades.filter(t => t.pnl < 0).length);
    const maxDrawdown = this.calculateMaxDrawdown(trades);
    const totalReturn = ((capital - 100000) / 100000) * 100;
    const sharpeRatio = this.calculateSharpeRatio(trades);
    
    strategy.fitness = (
      (winRate * 30) +
      (totalReturn * 2) +
      (avgWin / (avgLoss || 1) * 20) +
      (sharpeRatio * 15) -
      (maxDrawdown * 3)
    );
    
    strategy.trades = trades;
    strategy.metrics = { winRate, avgWin, avgLoss, maxDrawdown, totalReturn, sharpeRatio, tradeCount: trades.length };
    
    return strategy.fitness;
  }

  computeIndicators(data, genes) {
    const closes = data.map(d => d.close);
    const highs = data.map(d => d.high);
    const lows = data.map(d => d.low);
    const volumes = data.map(d => d.volume);
    
    const indicators = {};
    
    // RSI
    indicators.RSI = this.calculateRSI(closes, 14);
    
    // MACD
    const macd = this.calculateMACD(closes, 12, 26, 9);
    indicators.MACD = macd.macd;
    indicators.MACD_SIGNAL = macd.signal;
    indicators.MACD_HIST = macd.hist;
    
    // SMAs
    indicators.SMA20 = this.calculateSMA(closes, 20);
    indicators.SMA50 = this.calculateSMA(closes, 50);
    indicators.SMA200 = this.calculateSMA(closes, 200);
    
    // Bollinger Bands
    const bb = this.calculateBB(closes, 20, 2);
    indicators.BB_UPPER = bb.upper;
    indicators.BB_LOWER = bb.lower;
    
    // ATR
    indicators.ATR = this.calculateATR(data, 14);
    
    // Stochastic
    const stoch = this.calculateStochastic(highs, lows, closes, 14, 3);
    indicators.STOCH_K = stoch.k;
    indicators.STOCH_D = stoch.d;
    
    // Williams %R
    indicators.WILLR = this.calculateWilliamsR(highs, lows, closes, 14);
    
    // OBV
    indicators.OBV = this.calculateOBV(closes, volumes);
    
    // MFI
    indicators.MFI = this.calculateMFI(highs, lows, closes, volumes, 14);
    
    return indicators;
  }

  evaluateConditions(conditions, indicators) {
    let buySignals = 0;
    let sellSignals = 0;
    
    for (const cond of conditions) {
      const ind1 = indicators[cond.indicator1];
      const ind2 = cond.indicator2 ? indicators[cond.indicator2] : cond.threshold;
      
      if (ind1 === undefined) continue;
      
      switch (cond.condition) {
        case 'CROSSES_ABOVE':
          if (ind1 > ind2) buySignals++;
          break;
        case 'CROSSES_BELOW':
          if (ind1 < ind2) sellSignals++;
          break;
        case 'ABOVE':
          if (ind1 > ind2) buySignals++;
          break;
        case 'BELOW':
          if (ind1 < ind2) sellSignals++;
          break;
        case 'DIVERGES':
          if (Math.abs(ind1 - ind2) > cond.threshold * 2) buySignals++;
          break;
      }
    }
    
    if (buySignals >= conditions.length * 0.6) return 'BUY';
    if (sellSignals >= conditions.length * 0.6) return 'SELL';
    return 'HOLD';
  }

  calculateRSI(prices, period = 14) {
    const changes = [];
    for (let i = 1; i < prices.length; i++) {
      changes.push(prices[i] - prices[i - 1]);
    }
    
    let gains = changes.filter(c => c > 0);
    let losses = Math.abs(changes.filter(c => c < 0));
    
    const avgGain = gains.slice(-period).reduce((s, v) => s + v, 0) / period;
    const avgLoss = losses.slice(-period).reduce((s, v) => s + v, 0) / period;
    
    if (avgLoss === 0) return 100;
    const rs = avgGain / avgLoss;
    return 100 - (100 / (1 + rs));
  }

  calculateMACD(prices, fast, slow, signal) {
    const emaFast = this.calculateEMA(prices, fast);
    const emaSlow = this.calculateEMA(prices, slow);
    const macd = emaFast - emaSlow;
    const macdSignal = this.calculateEMA([macd], signal);
    return { macd, signal: macdSignal, hist: macd - macdSignal };
  }

  calculateEMA(prices, period) {
    const k = 2 / (period + 1);
    let ema = prices.slice(0, period).reduce((s, p) => s + p, 0) / period;
    for (let i = period; i < prices.length; i++) {
      ema = prices[i] * k + ema * (1 - k);
    }
    return ema;
  }

  calculateSMA(prices, period) {
    return prices.slice(-period).reduce((s, p) => s + p, 0) / period;
  }

  calculateBB(prices, period, stdDev) {
    const sma = this.calculateSMA(prices, period);
    const variance = prices.slice(-period).reduce((s, p) => s + Math.pow(p - sma, 2), 0) / period;
    const std = Math.sqrt(variance);
    return { upper: sma + stdDev * std, lower: sma - stdDev * std, middle: sma };
  }

  calculateATR(data, period) {
    const trs = [];
    for (let i = 1; i < data.length; i++) {
      trs.push(Math.max(data[i].high - data[i].low, Math.abs(data[i].high - data[i-1].close), Math.abs(data[i].low - data[i-1].close)));
    }
    return trs.slice(-period).reduce((s, v) => s + v, 0) / period;
  }

  calculateStochastic(highs, lows, closes, k, d) {
    const period = k;
    const highest = Math.max(...highs.slice(-period));
    const lowest = Math.min(...lows.slice(-period));
    const kVal = ((closes[closes.length - 1] - lowest) / (highest - lowest)) * 100;
    return { k: kVal, d: kVal / d };
  }

  calculateWilliamsR(highs, lows, closes, period) {
    const highest = Math.max(...highs.slice(-period));
    const lowest = Math.min(...lows.slice(-period));
    return ((highest - closes[closes.length - 1]) / (highest - lowest)) * -100;
  }

  calculateOBV(closes, volumes) {
    let obv = 0;
    for (let i = 1; i < closes.length; i++) {
      if (closes[i] > closes[i-1]) obv += volumes[i];
      else if (closes[i] < closes[i-1]) obv -= volumes[i];
    }
    return obv;
  }

  calculateMFI(highs, lows, closes, volumes, period) {
    const typicalPrices = highs.map((h, i) => (h + lows[i] + closes[i]) / 3);
    const moneyFlow = typicalPrices.map((tp, i) => tp * volumes[i]);
    
    let positiveFlow = 0;
    let negativeFlow = 0;
    for (let i = typicalPrices.length - period; i < typicalPrices.length; i++) {
      if (typicalPrices[i] > typicalPrices[i-1]) positiveFlow += moneyFlow[i];
      else negativeFlow += moneyFlow[i];
    }
    
    if (negativeFlow === 0) return 100;
    const mfRatio = positiveFlow / negativeFlow;
    return 100 - (100 / (1 + mfRatio));
  }

  calculateMaxDrawdown(trades) {
    let peak = 0;
    let maxDD = 0;
    let capital = 100000;
    
    for (const trade of trades) {
      capital += trade.pnl;
      if (capital > peak) peak = capital;
      const dd = ((peak - capital) / peak) * 100;
      if (dd > maxDD) maxDD = dd;
    }
    return maxDD;
  }

  calculateSharpeRatio(trades) {
    const returns = trades.map(t => t.pnlPercent);
    const avgReturn = returns.reduce((s, r) => s + r, 0) / returns.length;
    const stdDev = Math.sqrt(returns.reduce((s, r) => s + Math.pow(r - avgReturn, 2), 0) / returns.length);
    return stdDev === 0 ? 0 : avgReturn / stdDev;
  }

  evolve(marketData) {
    for (const strategy of this.population) {
      this.calculateFitness(strategy, marketData);
    }
    
    this.population.sort((a, b) => b.fitness - a.fitness);
    
    const elite = this.population.slice(0, this.eliteCount);
    const nextGeneration = [...elite];
    
    while (nextGeneration.length < this.populationSize) {
      let child;
      
      if (Math.random() < this.crossoverRate) {
        const parent1 = this.tournamentSelect();
        const parent2 = this.tournamentSelect();
        child = parent1.crossover(parent2);
      } else {
        const parent = this.tournamentSelect();
        child = new StrategyGenome(JSON.parse(JSON.stringify(parent.genes)));
      }
      
      if (Math.random() < this.mutationRate) {
        child = child.mutate(this.mutationRate);
      }
      
      nextGeneration.push(child);
    }
    
    this.population = nextGeneration.slice(0, this.populationSize);
    this.bestStrategy = this.population[0];
    this.generation++;
    
    this.history.push({
      generation: this.generation,
      bestFitness: this.bestStrategy.fitness,
      avgFitness: this.population.reduce((s, p) => s + p.fitness, 0) / this.populationSize,
      bestMetrics: this.bestStrategy.metrics
    });
    
    return {
      generation: this.generation,
      bestStrategy: this.bestStrategy,
      metrics: this.bestStrategy.metrics,
      history: this.history.slice(-10)
    };
  }

  tournamentSelect(tournamentSize = 5) {
    let best = null;
    for (let i = 0; i < tournamentSize; i++) {
      const idx = Math.floor(Math.random() * this.population.length);
      if (!best || this.population[idx].fitness > best.fitness) {
        best = this.population[idx];
      }
    }
    return best;
  }

  getBestStrategy() {
    return this.bestStrategy;
  }

  getTopStrategies(count = 10) {
    return this.population.slice(0, count).map(s => ({
      fitness: s.fitness,
      genes: s.genes,
      metrics: s.metrics
    }));
  }
}

module.exports = { EvolutionaryEngine, StrategyGenome, INDICATORS, CONDITIONS, ACTIONS };