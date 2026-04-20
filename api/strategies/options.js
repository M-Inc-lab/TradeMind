// TradeMind - Options Strategies
const OPTIONS = {
  Straddle: {
    name: "Option Straddle",
    type: "options",
    description: "Buy ATM straddle before major events (budget, RBI meet)",
    rules: {
      entry: "Buy ATM CE + ATM PE same strike, same expiry",
      exit: { profitTarget: 100, stopLoss: 50 },
      indicators: ["IV", "ATM Strike", "Event Calendar"]
    },
    risk: { maxLoss: "Premium paid", reward: "Unlimited" }
  },
  IronCondor: {
    name: "Iron Condor",
    type: "options",
    description: "Range-bound strategy with defined risk",
    rules: {
      entry: "Sell OTM Put + Sell OTM Call (both wings)",
      exit: { profitTarget: 80, stopLoss: 50 },
      indicators: ["IV Rank", "BollingerBand", "Support", "Resistance"]
    },
    risk: { maxLoss: "Width - Credit", reward: "Credit received" }
  },
  BullCallSpread: {
    name: "Bull Call Spread",
    type: "options",
    description: "Bullish with limited risk, lower cost than naked call",
    rules: {
      entry: "Buy ATM Call + Sell OTM Call (higher strike)",
      exit: { profitTarget: 100, stopLoss: 50 },
      indicators: ["RSI", "Support", "Trend"]
    },
    risk: { maxLoss: "Net Debit", reward: "Width - Net Debit" }
  },
  BearPutSpread: {
    name: "Bear Put Spread",
    type: "options",
    description: "Bearish with limited risk, lower cost than naked put",
    rules: {
      entry: "Buy ATM Put + Sell OTM Put (lower strike)",
      exit: { profitTarget: 100, stopLoss: 50 },
      indicators: ["RSI", "Resistance", "Trend"]
    },
    risk: { maxLoss: "Net Debit", reward: "Width - Net Debit" }
  },
  RatioSpread: {
    name: "Call Ratio Backspread",
    type: "options",
    description: "Bullish play with credit or low cost, profit from surge",
    rules: {
      entry: "Sell 1 ATM Call + Buy 2 OTM Calls",
      exit: { profitTarget: 200, stopLoss: -50 },
      indicators: ["IV", "Trend", "Volume"]
    },
    risk: { maxLoss: "Difference in strikes - Net credit", reward: "Unlimited" }
  },
  JadeLizard: {
    name: "Jade Lizard",
    type: "options",
    description: "No upside risk short put spread, collect premium",
    rules: {
      entry: "Sell OTM Put (lower wing) + Sell OTM Call (higher wing) + Buy further OTM Call",
      exit: { profitTarget: 80, stopLoss: 50 },
      indicators: ["IV Rank", "Support", "Resistance"]
    },
    risk: { maxLoss: "Call wing loss - Premium", reward: "Total premium" }
  },
  PoorMansCoveredCall: {
    name: "Poor Man's Covered Call",
    type: "options",
    description: "Use LEAPS as stock replacement, sell covered calls",
    rules: {
      entry: "Buy deep ITM LEAPS + Sell OTM covered call",
      exit: { profitTarget: 50, stopLoss: 30 },
      indicators: ["Delta", "IV", "Trend"]
    },
    risk: { maxLoss: "LEAPS premium", reward: "Call premium + upside" }
  },
  CalendarSpread: {
    name: "Calendar Spread",
    type: "options",
    description: "Profit from time decay differential",
    rules: {
      entry: "Sell near-term option + Buy same strike, farther expiry",
      exit: { profitTarget: 100, stopLoss: 50 },
      indicators: ["IV Term structure", "Time to expiry"]
    },
    risk: { maxLoss: "Net Debit", reward: "Width - Net Debit" }
  }
};
export default OPTIONS;
