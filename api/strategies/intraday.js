// TradeMind - Intraday Strategies (Part 1)
const INTRADAY = {
  VWAPReversion: {
    name: "VWAP Reversion",
    timeframe: "5m",
    indicators: ["VWAP", "RSI", "Volume"],
    rules: {
      long: "price < VWAP AND RSI < 35",
      short: "price > VWAP AND RSI > 65",
      stop: 0.5,
      target: 1.5
    }
  },
  ORB: {
    name: "Opening Range Breakout",
    timeframe: "5m",
    indicators: ["RangeHigh", "RangeLow", "Volume"],
    rules: {
      long: "price > 30min_high AND volume > 1.5x_avg",
      short: "price < 30min_low AND volume > 1.5x_avg",
      stop: 0.75,
      target: 2.0
    }
  },
  SuperTrendTrail: {
    name: "SuperTrend Trailing",
    timeframe: "5m",
    indicators: ["SuperTrend", "ADX"],
    rules: {
      long: "SuperTrend flips bullish AND ADX > 25",
      short: "SuperTrend flips bearish AND ADX > 25",
      stop: "atr_14",
      target: "2:1 RR"
    }
  },
  RSI15Reversion: {
    name: "RSI 15 Min Reversion",
    timeframe: "5m",
    indicators: ["RSI9", "SMA20", "Volume"],
    rules: {
      long: "RSI < 30 AND price > SMA20 AND volume spike",
      short: "RSI > 70 AND price < SMA20 AND volume spike",
      stop: "atr_14",
      target: "1.5%"
    }
  },
  BankNiftyIntraday: {
    name: "BankNifty Intraday",
    timeframe: "5m",
    indicators: ["EMA13", "EMA34", "RSI", "Volume"],
    rules: {
      long: "EMA13 > EMA34 AND RSI > 50 AND breakout",
      short: "EMA13 < EMA34 AND RSI < 50 AND breakdown",
      stop: 0.75,
      target: 2.5
    }
  }
};
export default INTRADAY;
