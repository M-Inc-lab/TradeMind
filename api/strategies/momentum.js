// TradeMind - Momentum & Mean Reversion Strategies
const MOMENTUM = {
  RSI60: {
    name: "RSI 60 Momentum",
    timeframe: "1h",
    indicators: ["RSI14", "EMA20", "Volume"],
    rules: {
      long: "RSI crosses above 60 AND price > EMA20 AND volume surge",
      short: "RSI crosses below 40 AND price < EMA20 AND volume surge",
      stop: 2,
      target: 4
    }
  },
  StochasticMomentum: {
    name: "Stochastic Momentum",
    timeframe: "1h",
    indicators: ["STOCHK", "STOCHD", "RSI"],
    rules: {
      long: "STOCHK > STOCHD AND STOCHK < 80 AND RSI > 50",
      short: "STOCHK < STOCHD AND STOCHK > 20 AND RSI < 50",
      stop: 1.5,
      target: 3
    }
  },
  ATRMomentum: {
    name: "ATR Momentum Burst",
    timeframe: "15m",
    indicators: ["ATR14", "PriceChange", "Volume"],
    rules: {
      long: "ATR spike > 2x AND price breaks range AND volume > 2x avg",
      short: "ATR spike > 2x AND price breaks down AND volume > 2x avg",
      stop: 1.5,
      target: 3
    }
  },
  MACDHistogram: {
    name: "MACD Histogram Divergence",
    timeframe: "1h",
    indicators: ["MACD", "MACD_Histogram", "Price"],
    rules: {
      long: "Histogram turning positive AND price makes higher low",
      short: "Histogram turning negative AND price makes lower high",
      stop: 2,
      target: 4
    }
  },
  VolumeWeighted: {
    name: "Volume Weighted Momentum",
    timeframe: "15m",
    indicators: ["VWAP", "Volume", "RSI"],
    rules: {
      long: "price > VWAP AND volume > 1.5x avg AND RSI > 55",
      short: "price < VWAP AND volume > 1.5x avg AND RSI < 45",
      stop: 1,
      target: 2
    }
  }
};
export default MOMENTUM;
