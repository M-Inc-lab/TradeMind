// TradeMind - Advanced & Specialized Strategies
const ADVANCED = {
  PairTrading: {
    name: "Pairs Trading (Correlation)",
    timeframe: "1h",
    description: "Long/Short correlated pairs when spread widens",
    indicators: ["Correlation", "Spread", "ZScore", "RSI"],
    rules: {
      entry: "ZScore > 2 OR ZScore < -2",
      exit: "ZScore returns to 0",
      pairs: {
        long: "RELIANCE",
        short: "HDFCBANK",
        correlationThreshold: 0.85
      },
      stop: 2,
      target: 0
    }
  },
  GannSquareNine: {
    name: "Gann Square of 9",
    timeframe: "1d",
    description: "Gann time/price symmetry calculations",
    indicators: ["GannAngles", "GannSquare", "PriceCycles"],
    rules: {
      entry: "Price at key Gann level AND support/resistance confirmed",
      exit: { target: "Next Gann level", stop: "Previous Gann level" },
      stop: 3,
      target: 0
    }
  },
  ElliotWave: {
    name: "Elliot Wave Trading",
    timeframe: "4h",
    description: "Trade impulse waves with斐bonacci retracements",
    indicators: ["EWLabel", "Fib38", "Fib61", "RSI", "Volume"],
    rules: {
      entry: "Wave 3 or 5 start AND Fib retracement confirmed",
      exit: { target: "Next wave target", stop: "Wave invalidation" },
      stop: "Wave 2 low/high",
      target: 0
    }
  },
  FibonacciConfluence: {
    name: "Fib Confluence Zones",
    timeframe: "1h",
    description: "Multiple fib levels converging create strong zones",
    indicators: ["Fib23", "Fib38", "Fib50", "Fib61", "Fib78", "Volume"],
    rules: {
      entry: "Price at 2+ Fib confluence AND candle rejection",
      exit: { target: "Next Fib level", stop: "Beyond confluence" },
      stop: 1.5,
      target: 0
    }
  },
  ICTSmartMoney: {
    name: "ICT Smart Money",
    timeframe: "1h",
    description: "Trade institutional levels, order blocks, FVGs",
    indicators: ["OrderBlocks", "FVG", "LiquidityPools", "EqualHighs", "EqualLows"],
    rules: {
      entry: "Order block formed AND market returns to FVG",
      exit: { target: "Next liquidity sweep", stop: "Block breach" },
      stop: "FVG high/low",
      target: 0
    }
  },
  VolumeImbalance: {
    name: "Volume Imbalance",
    timeframe: "5m",
    description: "Identify large orders one side (upstack/downstack)",
    indicators: ["BidAskVolume", "Delta", "Absorption", "PriceAction"],
    rules: {
      entry: "Large imbalance AND price direction confirms",
      exit: { target: "Imbalance resolved", stop: "Reverse imbalance" },
      stop: 0.5,
      target: 1.5
    }
  },
  MarketProfile: {
    name: "Market Profile / TPO",
    timeframe: "30m",
    description: "Trade Value Area boundaries and POC rejections",
    indicators: ["POC", "VAH", "VAL", "TPO", "Volume"],
    rules: {
      entry: "POC rejected AND move toward VAH/VAL",
      exit: { target: "VAH or VAL", stop: "VA breach" },
      stop: 0.75,
      target: 2
    }
  },
  DeltaTPOC: {
    name: "Delta TPO Profile",
    timeframe: "30m",
    description: "Volume-weighted market profile with delta analysis",
    indicators: ["DeltaCumulative", "POC", "VAH", "VAL", "VolumeNode"],
    rules: {
      entry: "Delta divergence at VAH/VAL AND TPO single print",
      exit: { target: "POC", stop: "Single print violation" },
      stop: 0.5,
      target: 1.5
    }
  }
};
export default ADVANCED;
