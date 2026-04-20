// TradeMind AI - Evolutionary Strategy Engine
// Genetic algorithm that evolves profitable trading strategies

const INDICATORS = ['RSI', 'MACD', 'SMA20', 'SMA50', 'BB', 'ATR', 'ADX', 'CCI', 'WILLR', 'MFI'];
const CONDITIONS = ['CROSSES_ABOVE', 'CROSSES_BELOW', 'ABOVE', 'BELOW'];
const ACTIONS = ['BUY', 'SELL'];

class Gene {
  constructor(config = {}) {
    this.indicator = config.indicator || INDICATORS[Math.floor(Math.random() * INDICATORS.length)];
    this.condition = config.condition || CONDITIONS[Math.floor(Math.random() * CONDITIONS.length)];
    this.value = config.value || (this.indicator === 'RSI' ? 30 + Math.random() * 40 : Math.random() * 100);
    this.action = config.action || ACTIONS[Math.floor(Math.random() * ACTIONS.length)];
  }

  mutate(rate = 0.1) {
    if (Math.random() < rate) this.indicator = INDICATORS[Math.floor(Math.random() * INDICATORS.length)];
    if (Math.random() < rate) this.condition = CONDITIONS[Math.floor(Math.random() * CONDITIONS.length)];
    if (Math.random() < rate) this.value = Math.random() * 100;
    if (Math.random() < rate) this.action = ACTIONS[Math.floor(Math.random() * ACTIONS.length)];
  }

  cross