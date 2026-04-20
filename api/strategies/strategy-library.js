// TradeMind AI - Complete Trading Strategy Library
// 15+ strategies across all timeframes and asset classes

const STRATEGIES = {
  // ========== INTRADAY STRATEGIES ==========
  
  VWAPReversion: {
    name: "VWAP Reversion",
    category: "intraday",
    timeframe: "5m",
    description: "Mean reversion strategy playing VWAP bounces",
    indicators: ["VWAP", "RSI", "Volume"],
    conditions: {
      entry: {
        long: "price < VWAP AND RSI < 35 AND price touches VWAP support",
        short: "price > VWAP AND RSI > 65 AND price rejects VWAP resistance"
      },
      exit: {
        target: "RSI reaches 50 OR price moves 1.5% from entry",
        stop: "price crosses VWAP with 0.5% breach"
      }
    },
    risk: { maxLossPerTrade: 1.5, dailyLimit: 3 }
  },

  OpeningRangeBreakout: {
    name: "Opening Range Breakout (ORB)",
    category: "intraday",
    timeframe: "5m",
    description: "Trade the first 30min range breakout with volume confirmation",
    indicators: ["High", "Low", "Volume", "BollingerBand"],
    conditions: {
      entry: {
        long: "price breaks above 30min_high AND volume > 1.5x_avg AND time > 9:45",
        short: "price breaks below 30min_low AND volume > 1.5x_avg AND time > 9:45"
      },
      exit: {
        target: "2x ATR from entry",
        stop: "return to range mid"
      }
    },
    risk: { maxLossPerTrade: 2, dailyLimit: 4 }
  },

  GapFill: {
    name: "Gap Fill Strategy",
    category: "intraday",
    timeframe: "15m",
    description: "Fade the gap with expectation of fill by 10:30-11:00",
    indicators: ["PrevClose", "Open", "VWAP", "RSI"],
    conditions: {
      entry: {
        long: "gap_down > 0.5% AND price bounces from intraday low AND RSI > 40",
        short: "gap_up > 0.5% AND price rejects intraday high AND RSI < 60"
      },
      exit: {
        target: "50% gap fill",
        stop: "full gap filled against position"
      }
    },
    risk: { maxLossPerTrade: 2, dailyLimit: 3 }
  },

  MarketOpenScalp: {
    name: "First 15min Scalp",
    category: "intraday",
    timeframe: "1m",
    description: "Quick scalp 5-10 pips in first 15 minutes",
    indicators: ["EMA9", "EMA21", "Volume", "BollingerBand"],
    conditions: {
      entry: {
        long: "EMA9 crosses above EMA21 AND price > VWAP AND volume spike",
        short: "EMA9 crosses below EMA21 AND price < VWAP AND volume spike"
      },
      exit: { target: "8 points", stop: "10 points" }
    },
    risk: { maxLossPerTrade: 0.75, dailyLimit: 6 }
  },

  // ========== SWING STRATEGIES ==========

  RSIBreakout: {
    name: "RSI Momentum Breakout",
    category: "swing",
    timeframe: "1h",
    description: "RSI breakout with volume confirmation for 2-5 day swings",
    indicators: ["RSI", "SMA20", "Volume", "ADX"],
    conditions: {
      entry: {
        long: "RSI crosses above 55 AND price > SMA20 AND ADX > 25 AND volume > 1.5x",
        short: "RSI crosses below 45 AND price < SMA20 AND ADX > 25 AND volume > 1.5x"
      },
      exit: {
        target: "RSI reaches 70 (long) or 30 (short)",
        stop: "RSI reverts through 50"
      }
    },
    risk: { maxLossPerTrade: 4, weeklyLimit: 8 }
  },

  MACDCross: {
    name: "MACD Trend Following",
    category: "swing",
    timeframe: "4h",
    description: "MACD histogram shift with trend confirmation",
    indicators: ["MACD", "SignalLine", "EMA50", "EMA200"],
    conditions: {
      entry: {
        long: "MACD crosses above signal AND MACD histogram > 0 AND price > EMA50",
        short: "MACD crosses below signal AND MACD histogram < 0 AND price < EMA50"
      },
      exit: {
        target: "3x ATR",
        stop: "MACD cross in opposite direction"
      }
    },
    risk: { maxLossPerTrade: 5, weeklyLimit: 6 }
  },

  BollingerBounce: {
    name: "Bollinger Band Bounce",
    category: "swing",
    timeframe: "1h",
    description: "Mean reversion at band extremes",
    indicators: ["BollingerBand(20,2)", "RSI", "Volume"],
    conditions: {
      entry: {
        long: "price touches lower_band AND RSI < 30 AND volume > avg",
        short: "price touches upper_band AND RSI > 70 AND volume > avg"
      },
      exit: {
        target: "middle_band (SMA20)",
        stop: "opposite_band breach"
      }
    },
    risk: { maxLossPerTrade: 3.5, weeklyLimit: 5 }
  },

  SupertrendPullback: {
    name: "Supertrend Pullback",
    category: "swing",
    timeframe: "1h",
    description: "Enter on pullback to Supertrend line",
    indicators: ["Supertrend(10,3)", "EMA21", "RSI"],
    conditions: {
      entry: {
        long: "supertrend_up AND price retraces TO supertrend_line AND RSI > 45",
        short: "supertrend_down AND price retraces TO supertrend_line AND RSI < 55"
      },
      exit: {
        target: "last 5 candles high/low",
        stop: "supertrend flip"
      }
    },
    risk: { maxLossPerTrade: 3, weeklyLimit: 6 }
  },

  // ========== OPTIONS STRATEGIES ==========

  IronCondor: {
    name: "Iron Condor (Weekly)",
    category: "options",
    timeframe: "daily",
    description: "Sell OTM spreads on index, collect premium",
    indicators: ["IVRank", "Price", "Support", "Resistance"],
    conditions: {
      entry: {
        open: "IVRank > 30 AND price near resistance (short PUT) or support (short CALL)",
        wings: "8-10 point wide wings, 5-7 point width each"
      },
      adjust: {
        if_price_approaches_short_strike: "roll further OTM",
        if_IV_expands: "widen wings or reduce size"
      },
      exit: {
        profit: "close at 50% of premium received",
        loss: "close at 80% of max loss"
      }
    },
    risk: { maxLossPerTrade: 2, weeklyLimit: 2 }
  },

  BullPutSpread: {
    name: "Bull Put Spread",
    category: "options",
    timeframe: "weekly",
    description: "Bullish put spread on bullish stocks",
    indicators: ["Support", "IV", "Trend", "RSI"],
    conditions: {
      entry: {
        long: "RSI > 50 AND price above SMA20 AND IV > 25",
        setup: "short_put at support level, long_put 5% below"
      },
      exit: {
        target: "75% premium capture",
        stop: "price closes below long_put strike"
      }
    },
    risk: { maxLossPerTrade: 3, weeklyLimit: 3 }
  },

  StraddlePlay: {
    name: "Long Straddle (Earnings)",
    category: "options",
    timeframe: "event",
    description: "Play earnings/comedy announcement volatility",
    indicators: ["IV", "IVRank", "HistoricalMove"],
    conditions: {
      entry: {
        long: "IVRank < 20 AND upcoming event within 2 weeks",
        setup: "ATM straddle, cost < 8% of stock price"
      },
      exit: {
        target: "straddle doubles OR 2 days before event",
        stop: "straddle drops 50%"
      }
    },
    risk: { maxLossPerTrade: 2, monthlyLimit: 4 }
  },

  // ========== MULTI-TIMEFRAME STRATEGIES ==========

  TrendContinuity: {
    name: "Trend Continuation (HTF → LTF)",
    category: "multitimeframe",
    timeframe: "4h→15m",
    description: "Entry on HTF trend with LTF confirmation",
    indicators: ["EMA200(HTF)", "RSI(HTF)", "EMA50(LTF)", "MACD(LTF)"],
    conditions: {
      entry: {
        long: "price > EMA200(HTF) AND RSI(HTF) > 50 AND EMA50(LTF) trending up AND MACD(LTF) histogram positive"
      },
      exit: {
        target: "2:1 reward-to-risk OR HTF RSI overbought",
        stop: "HTF EMA200 breach"
      }
    },
    risk: { maxLossPerTrade: 3, weeklyLimit: 5 }
  },

  SupportResistance: {
    name: "S/R Flip Strategy",
    category: "multitimeframe",
    timeframe: "1h→15m",
    description: "Broken support becomes resistance (and vice versa)",
    indicators: ["Support", "Resistance", "Volume", "RSI"],
    conditions: {
      entry: {
        long: "price tests former resistance AS new support AND volume > avg AND RSI > 45",
        short: "price tests former support AS new resistance AND volume > avg AND RSI < 55"
      },
      exit: {
        target: "next S/R level (1.5x distance)",
        stop: "level breach with 0.3%"
      }
    },
    risk: { maxLossPerTrade: 2.5, weeklyLimit: 6 }
  },

  // ========== ARBITRAGE STRATEGIES ==========

  IndexArbitrage: {
    name: "Nifty-BankNifty Spread",
    category: "arbitrage",
    timeframe: "5m",
    description: "Trade spread between Nifty and BankNifty correlation",
    indicators: ["Correlation", "Spread", "ZScore"],
    conditions: {
      entry: {
        long: "ZScore < -2 (Nifty cheap vs BankNifty)",
        short: "ZScore > 2 (Nifty expensive vs BankNifty)"
      },
      exit: {
        target: "ZScore = 0 (spread normalize)",
        stop: "ZScore > 3 OR < -3"
      }
    },
    risk: { maxLossPerTrade: 1, dailyLimit: 4 }
  },

  CalendarSpread: {
    name: "Nifty Current vs Next Month",
    category: "arbitrage",
    timeframe: "30m",
    description: "Calendar spread between expiry months",
    indicators: ["FuturePrice", "OptionPrice", "Carry", "TimeValue"],
    conditions: {
      entry: {
        long: "carry positive AND spread > 1.5x carrying cost",
        spread: "buy next month, sell current month"
      },
      exit: {
        target: "spread narrows to cost of carry",
        stop: "spread widens > 2x"
      }
    },
    risk: { maxLossPerTrade: 1.5, weeklyLimit: 3 }
  },

  // ========== MEAN REVERSION STRATEGIES ==========

  ParabolicSARReversal: {
    name: "Parabolic SAR Reversal",
    category: "mean-reversion",
    timeframe: "1h",
    description: "Catch reversals at parabolic points",
    indicators: ["ParabolicSAR", "ATR", "RSI"],
    conditions: {
      entry: {
        long: "PSAR flips to bullish AND RSI < 35 AND price > VWAP",
        short: "PSAR flips to bearish AND RSI > 65 AND price < VWAP"
      },
      exit: {
        target: "2x ATR",
        stop: "PSAR flip"
      }
    },
    risk: { maxLossPerTrade: 2.5, weeklyLimit: 5 }
  },

  ATRChannelBreak: {
    name: "ATR Channel Trading",
    category: "mean-reversion",
    timeframe: "15m",
    description: "Trade channels based on ATR volatility",
    indicators: ["High", "Low", "ATR", "EMA"],
    conditions: {
      entry: {
        long: "price breaks below lower_channel AND RSI < 35 AND volume spike",
        short: "price breaks above upper_channel AND RSI > 65 AND volume spike"
      },
      exit: {
        target: "middle_channel",
        stop: "opposite_channel breach"
      }
    },
    risk: { maxLossPerTrade: 1.5, dailyLimit: 5 }
  },

  // ========== MOMENTUM STRATEGIES ==========

  RSI2Period: {
    name: "RSI-2 Reversal",
    category: "momentum",
    timeframe: "5m",
    description: "Extreme RSI-2 readings for quick reversals",
    indicators: ["RSI(2)", "SMA20", "Volume"],
    conditions: {
      entry: {
        long: "RSI(2) < 10 AND price > SMA20 AND bullish candle pattern",
        short: "RSI(2) > 90 AND price < SMA20 AND bearish candle pattern"
      },
      exit: {
        target: "RSI(2) reaches 50",
        stop: "RSI(2) reaches opposite extreme OR 20-point move"
      }
    },
    risk: { maxLossPerTrade: 1, dailyLimit: 8 }
  },

  VolumeProfileBreak: {
    name: "Volume Profile Breakout",
    category: "momentum",
    timeframe: "15m",
    description: "Trade POC (Point of Control) breaks with high volume",
    indicators: ["POC", "VPOC", "Volume", "Price"],
    conditions: {
      entry: {
        long: "price breaks above VPOC WITH volume > 2x_avg AND time < 14:00",
        short: "price breaks below VPOC WITH volume > 2x_avg AND time < 14:00"
      },
      exit: {
        target: "next standard deviation level",
        stop: "POC reclaim"
      }
    },
    risk: { maxLossPerTrade: 2, dailyLimit: 5 }
  },

  // ========== PAIRS TRADING ==========

  PairsTrading: {
    name: "Nifty50 Stock Pairs",
    category: "pairs",
    timeframe: "1h",
    description: "Mean reversion in correlated stock pairs",
    indicators: ["Correlation", "ZScore", "Spread"],
    conditions: {
      entry: {
        long: "ZScore < -2 AND correlation > 0.7",
        pairs: "HDFC-HDFCBANK, RELIANCE-ADANI, TCS-INFY"
      },
      exit: {
        target: "ZScore = 0",
        stop: "ZScore > 3 OR correlation breaks"
      }
    },
    risk: { maxLossPerTrade: 1.5, weeklyLimit: 4 }
  }
};

module.exports = STRATEGIES;