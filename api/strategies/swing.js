// TradeMind - Swing & Positional Strategies
const SWING = {
  MACDTrend: {
    name: "MACD Trend Following",
    timeframe: "1h",
    indicators: ["MACD", "Signal", "SMA200"],
    rules: {
      long: "MACD > Signal AND MACD > 0 AND price > SMA200",
      short: "MACD < Signal AND MACD < 0 AND price < SMA200",
      stop: 2,
      target: "3:1 RR"
    }
  },
  BollingerBandSqueeze: {
    name: "BB Squeeze Play",
    timeframe: "4h",
    indicators: ["BB20", "ATR", "Volume"],
    rules: {
      long: "BBwidth < 0.05 AND ATR trending up AND volume expansion",
      short: "BBwidth < 0.05 AND ATR trending down",
      stop: "BB_lower - 1.5*ATR",
      target: "BB_upper"
    }
  },
  RSI21Swing: {
    name: "RSI 21 Swing",
    timeframe: "4h",
    indicators: ["RSI21", "SMA50", "RSI14"],
    rules: {
      long: "RSI21 > 50 AND RSI14 > 55 AND price > SMA50",
      short: "RSI21 < 50 AND RSI14 < 45 AND price < SMA50",
      stop: 2.5,
      target: 5
    }
  },
  VolumeProfileSwing: {
    name: "Volume Profile Swing",
    timeframe: "1d",
    indicators: ["POC", "VAH", "VAL", "Volume"],
    rules: {
      long: "price > POC AND volume > 1.2x_avg",
      short: "price < POC AND volume > 1.2x_avg",
      stop: "VAL (long) / VAH (short)",
      target: "POC + 2*ATR"
    }
  },
  EMACrossover: {
    name: "EMA 50/200 Crossover",
    timeframe: "1d",
    indicators: ["EMA50", "EMA200", "RSI"],
    rules: {
      long: "EMA50 > EMA200 AND RSI > 55",
      short: "EMA50 < EMA200 AND RSI < 45",
      stop: 3,
      target: 8
    }
  },
  SupplyDemand: {
    name: "Supply Demand Zones",
    timeframe: "4h",
    indicators: ["PriceAction", "Volume", "RSI"],
    rules: {
      long: "price returns to demand zone AND RSI diverging",
      short: "price returns to supply zone AND RSI converging",
      stop: "zone breach + 0.5%",
      target: "next zone"
    }
  },
  PullbackMA: {
    name: "MA Pullback Strategy",
    timeframe: "1h",
    indicators: ["EMA20", "EMA50", "RSI", "Volume"],
    rules: {
      long: "price pulls back to EMA20 AND RSI > 40 AND bounces with volume",
      short: "price rallies to EMA20 AND RSI < 60 AND rejects with volume",
      stop: "below pullback low + 0.5%",
      target: "2:1 RR"
    }
  },
  ADXTrend: {
    name: "ADX Trend Strength",
    timeframe: "4h",
    indicators: ["ADX", "DIPlus", "DIMinus", "EMA20"],
    rules: {
      long: "ADX > 25 AND DIPlus > DIMinus AND price > EMA20",
      short: "ADX > 25 AND DIMinus > DIPlus AND price < EMA20",
      stop: 2,
      target: "ADX weakening"
    }
  }
};
export default SWING;
