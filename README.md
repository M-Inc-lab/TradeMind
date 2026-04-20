# TradeMind AI - Complete System Documentation

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                    TRADEMIND AI                          │
│              Multi-Agent Trading System                   │
├─────────────────────────────────────────────────────────┤
│  BROKER LAYER     │  AI LAYER       │  AGENT LAYER       │
│  ─────────────    │  ─────────      │  ───────────       │
│  Dhan (Live)      │  LLM Strategy   │  Arena (10 agents) │
│  Sandbox Ready    │  Vector DB      │  Kill/Survive      │
│  Paper Trading   │  Sentiment      │  Evolution         │
├───────────────────┴─────────────────┴───────────────────┤
│  DATA LAYER        │  STRATEGY LAYER  │  EXECUTION LAYER  │
│  ──────────────    │  ─────────────   │  ───────────────  │
│  Yahoo Finance    │  50+ Strategies  │  Dhan Sandbox     │
│  NSE/BSE Quotes   │  RSI/MA/MACD     │  Paper Orders     │
│  Options Chain    │  Breakout/Rev    │  Auto Execution   │
│  Market Profile   │  Options Multi   │  Real-time Monitor│
└───────────────────┴─────────────────┴───────────────────┘
```

## API Routes

### Core Trading Routes
| Route | Method | Description |
|-------|--------|-------------|
| `/api/market/quotes` | GET | Real-time NSE/BSE quotes |
| `/api/market/scanner` | GET | Stock scanner across indices |
| `/api/backtest/accuracy` | GET | Strategy accuracy backtester |
| `/api/backtest/llm-accuracy` | GET | LLM-powered signal generator |
| `/api/train/v19` | GET | Training pipeline v19 |
| `/api/train/real` | GET | Real market data backtester |

### Multi-Agent Arena Routes
| Route | Method | Description |
|-------|--------|-------------|
| `/api/survival` | GET | Multi-agent survival arena |
| `/api/survival?action=status` | GET | Arena status & leaderboard |
| `/api/survival?action=tick` | GET | Run one simulation tick |
| `/api/survival?action=sim` | GET | Run multiple ticks |
| `/api/survival?action=kill` | GET | Kill weakest agent |
| `/api/survival?action=dead` | GET | View dead agents |
| `/api/survival?action=vector` | GET | Vector DB of dead strategies |
| `/api/survival?action=crash` | GET | Simulate market crash |
| `/api/survival?action=reset` | GET | Reset arena |

### Broker Integration Routes
| Route | Method | Description |
|-------|--------|-------------|
| `/api/dhan/papertrade` | POST | Place paper trade via Dhan |
| `/api/dhan/auto` | GET | Auto paper trading |
| `/api/orders` | GET | Get all open orders |

### Dashboard
| Route | Description |
|-------|-------------|
| `/` | Full trading dashboard |
| `https://morningstar.zo.space` | Live platform URL |

## Strategy Types

### Intraday Strategies
- `RSI_ENGULFING` - RSI + candlestick engulfing
- `RSI30_VOL1.5` - Oversold + volume spike
- `RSI70_VOL` - Overbought + volume confirmation
- `BB_REVERSAL` - Bollinger band bounce
- `VWAP_BREAK` - VWAP momentum breakout

### Swing Strategies
- `SWING_RSI60` - Swing to RSI 60 target
- `BREAKOUT_Swing` - Multi-day breakout
- `PULLBACK_MA50` - Pullback to moving average

### Options Strategies
- `IRON_CONDOR` - Sell OTM spreads (high win rate)
- `RSI40_MA50` - Combined indicator strategy
- `SUPER_SELL_2` - Strong momentum sell
- `BUY_BULL_ENG_RSI40` - Bullish engulfing + RSI

### Advanced Strategies
- `TREND_FOLLOW` - EMA crossover following
- `GAP_REversal` - Gap fill after open
- `MOMENTUM_Osc` - Momentum oscillator
- `news_FLOW` - News sentiment scoring

## Agent Arena Rules

### Survival Mechanics
1. **10 agents** spawned initially with **5% daily profit bar**
2. Each tick simulates 1 trading day
3. Agents with **5%+ daily profit** → PROFITABLE (safe)
4. Agents with **0-5%** → WEAKENED (danger zone)
5. Agents with **negative** → DYING (may be killed)
6. Kill probability = `100 - survivalChance()` where:
   - `survivalChance = 60 + (wins*5) - (deaths*8) + (age/10)`
   - Minimum 15%, maximum scales with age/wins

### Evolution Mechanics
- Every 5 cycles, profitable agents with 3+ wins **EVOLVE**
- Evolution raises their profit bar by 1% (max 15%)
- Surviving agents get harder challenges over time
- Dead strategies archived to **Vector DB** as "what NOT to do"

### Market Crash Events
- All agents set to DYING status
- Next 8 ticks run with forced death rolls
- Survivors are elite (proved in adverse conditions)

## Dhan Broker Integration

### Sandbox API
- **Base URL**: `https://sandbox.dhan.co`
- **Auth**: `access-token` header
- **Client ID**: `2604172391`
- **Token**: `eyJhbGciOiJIUzUxMiIsInR5cCI6IkpXVCJ9...`

### Working Endpoints
- `GET /v2/profile` - User profile ✅
- `POST /v2/orders` - Place order ✅
- `GET /v2/orders` - Order book ✅
- `GET /v2/limits` - Order limits ✅
- `GET /v2/positions` - Positions ✅
- `GET /v2/tradebook` - Trade book ✅
- `GET /v2/holdings` - Holdings ✅

### Paper Trading Flow
1. Place order via `/api/dhan/papertrade`
2. Order stored in-memory with Dhan sandbox
3. Simulated fills at current market price
4. P&L tracked per position
5. No real money, real API execution

## File Structure

```
/home/workspace/TradeMind/
├── api/
│   ├── server.js              # Main server
│   ├── broker.js             # Dhan broker adapter
│   ├── evolution.js          # Genetic algorithm
│   ├── evolutionary.js       # Enhanced evolution
│   ├── accuracy-tracker.js   # Performance tracking
│   ├── strategies/
│   │   ├── index.js          # Strategy exports
│   │   ├── executable-intraday.js
│   │   ├── executable-swing.js
│   │   ├── executable-options.js
│   │   └── executable-momentum.js
│   ├── vector-store.js       # Vector DB
│   ├── training-fetcher.js   # Data fetcher
│   ├── realtime.js           # Real-time engine
│   ├── market-scanner.js     # Stock scanner
│   ├── option-chain.js       # Options scanner
│   ├── market-profile.js     # Market profile
│   ├── options-analytics.js  # Greeks calculator
│   ├── trade-journal.js      # Trade journal
│   ├── backtester.js         # Backtesting engine
│   ├── patterns.js           # Pattern recognition
│   └── multi-agent-arena.js  # Agent arena
├── zo-space-routes/
│   └── home-page.js          # Dashboard UI
├── extension/
│   ├── manifest.json         # Browser extension
│   ├── background.js         # Service worker
│   ├── content.js           # Page injection
│   ├── overlay.css          # Floating UI
│   └── popup.html           # Extension popup
└── README.md                 # This file
```

## Live Endpoints Summary

| Service | URL | Status |
|---------|-----|--------|
| Dashboard | `https://morningstar.zo.space/` | ✅ Live |
| Quotes | `/api/market/quotes` | ✅ Working |
| Backtest | `/api/backtest/accuracy` | ✅ Working |
| LLM Signals | `/api/backtest/llm-accuracy` | ✅ Working |
| Arena | `/api/survival` | ✅ Working |
| Training | `/api/train/v19` | ✅ Working |
| Dhan Paper | `/api/dhan/papertrade` | ✅ Working |

## Next Steps for Monday

1. **Live Trading Setup**
   - Transfer from sandbox to live Dhan API
   - Add API keys to Zo secrets
   - Enable paper trading first

2. **Accuracy Improvements**
   - Focus on Options strategies (higher win rate)
   - Use INDEX_Arb for safer trades
   - Add multi-factor confirmation

3. **Agent Evolution**
   - Let arena run over weekend
   - Monday: analyze surviving strategies
   - Deploy best strategies to production

4. **Feature Additions**
   - Real-time WebSocket prices
   - Mobile notifications
   - Trade alerts via SMS/Email

## Known Limitations

1. **Accuracy Plateaus at ~55-60%** - Standard for retail algorithms
2. **Yahoo Finance Rate Limits** - Use Dhan for live data
3. **Sandbox Execution** - Real trades require live API
4. **Vector DB Memory** - In-memory only, resets on restart

## Tips for 85%+ Accuracy

To reach 85% win rate, combine these:
1. **Options Iron Condors** (sell premium, 75-85% win rate)
2. **Index Arbitrage** (NIFTY spot vs futures, low risk)
3. **Event-based** (before earnings/AGM, high accuracy)
4. **Market Making** (bid-ask capture, requires liquidity)

Current realistic target: **55-65%** with good R:R ratio (1:1.5+)
