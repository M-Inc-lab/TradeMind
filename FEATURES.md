# TradeMind AI - Features Guide

## 🚀 Live Platform
**Dashboard**: https://morningstar.zo.space

## Available APIs
| Endpoint | Purpose |
|----------|---------|
| `GET /api/market/quotes` | Real-time NSE/BSE quotes |
| `POST /api/chat` | LLM trading assistant |
| `POST /api/evolution/strategy` | Evolve trading strategies |
| `POST /api/sentiment` | Multi-source sentiment |
| `POST /api/papertrading` | Paper trading engine |
| `GET /api/options/chain` | Options chain analysis |
| `POST /api/analysis/multitimeframe` | MTF analysis |
| `POST /api/alerts` | Alert management |
| `POST /api/portfolio/analytics` | Risk analytics |
| `POST /api/voice` | Voice commands |
| `GET/POST /api/community` | Social/copy trading |

---

## 1. Evolutionary Strategy Engine

### How It Works
- **Population**: 20 strategies per generation
- **Genome**: Combination of indicators + conditions + parameters
- **Selection**: Top 20% by Sharpe ratio survive
- **Crossover**: Pairs swap genes randomly
- **Mutation**: 10% chance per gene

### Supported Indicators
- RSI (14), MACD (12,26,9), SMA/EMA (5-200)
- Bollinger Bands (20,2), ATR (14), ADX (14)
- CCI (20), Stochastic (14,3), MFI (14)
- VWAP, Supertrend, Ichimoku Cloud

### Example Strategy Genome
```json
{
  "genes": [
    { "indicator": "RSI", "params": { "period": 14 }, "condition": "CROSSES_ABOVE", "threshold": 30 },
    { "indicator": "MACD", "params": { "fast": 12, "slow": 26 }, "condition": "ABOVE", "value": 0 }
  ],
  "action": "BUY",
  "stopLoss": 2.5,
  "target": 5.0,
  "timeframe": "INTRADAY"
}
```

---

## 2. Sentiment Analysis

### Sources & Weights
| Source | Weight | Data |
|--------|--------|------|
| News | 40% | Economic times, MoneyControl, BS |
| Social | 20% | Twitter/X, StockTwits |
| FII/DII | 25% | NSE BSE daily cash data |
| Options | 15% | PCR, OI buildup, Max Pain |

### Sentiment Score
- **+1 to -1**: -1 (极度看跌) to +1 (极度看涨)
- **Confidence**: 0-100% based on source agreement
- **Key Events**: News catalysts highlighted

---

## 3. Browser Extension

### Installation
1. Chrome: `chrome://extensions` → Developer mode → Load unpacked → select `extension/` folder
2. Firefox: `about:debugging#/runtime/this-firefox` → Load Temporary Add-on → select `manifest.json`

### Features
- **Overlay Widget**: Floating chat + signals on any page
- **Context Injection**: AI analysis on broker sites
- **Quick Commands**: `/trade RELIANCE 2500` or `/alert NIFTY 22500`
- **Notifications**: Trade alerts, price crosses

### Permissions
- `activeTab`: Current tab interaction
- `storage`: Local settings
- `nativeMessaging`: Backend communication

---

## 4. Paper Trading

### Features
- ₹10L starting capital
- Real-time price simulation
- P&L tracking with % returns
- Trade history with reasoning
- Win rate statistics

### API Usage
```bash
curl -X POST https://morningstar.zo.space/api/papertrading \
  -H "Content-Type: application/json" \
  -d '{"action":"execute","order":{"symbol":"RELIANCE","action":"BUY","quantity":10,"price":2500}}'
```

---

## 5. Options Analysis

### Features
- ATM + 6 strikes above/below
- CE/PE IV comparison
- PCR by strike
- Max Pain calculation
- OI buildup detection
- Greeks (Delta, Gamma, Theta, Vega)

---

## 6. Multi-Timeframe Analysis

### Confluence Detection
- Checks: 5m, 15m, 1H, 4H, 1D
- Trend alignment = higher confidence
- Divergence alerts

---

## 7. AI Chat Interface

### Capabilities
- Plain English queries
- Trade explanations in simple terms
- Strategy recommendations
- Risk analysis
- Portfolio queries

### Example Queries
- "What's a good swing trade for next week?"
- "Explain why NIFTY might go up today"
- "Should I buy HDFC at current price?"
- "What does RSI 65 mean for RELIANCE?"

---

## 8. Alert System

### Alert Types
| Type | Trigger |
|------|---------|
| PRICE_ABOVE | Price crosses above target |
| PRICE_BELOW | Price crosses below target |
| RSI_OVERBOUGHT | RSI > 70 |
| RSI_OVERSOLD | RSI < 30 |
| PRICE_CROSS_EMA | Price crosses EMA |
| VOLUME_SPIKE | Volume > 3x 20-day avg |
| NEWS_CATALYST | Breaking news on symbol |

### Delivery
- In-app notification
- Telegram (future)
- SMS (future)
- Browser notification

---

## 9. Voice Commands

### Supported Commands
- "Buy RELIANCE at market"
- "Sell NIFTY 22500 call"
- "What's the price of TCS?"
- "Show my portfolio"
- "Set alert for NIFTY at 22500"
- "Find me a momentum trade"

---

## 10. Community Features

### Copy Trading
- Follow top traders
- Auto-mirror trades
- Set allocation %
- Track performance

### Strategy Marketplace
- Share evolved strategies
- Rate strategies
- Subscribe to premium

### Leaderboards
- Monthly/Weekly/All-time
- Returns %, Sharpe, Win rate
- Trade count

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    TradeMind AI Platform                     │
├─────────────────────────────────────────────────────────────┤
│  Browser Extension  │  zo.space Web  │  Mobile (future)      │
├─────────────────────┼─────────────────┼──────────────────────┤
│  Overlay Widget     │  Dashboard UI   │  Responsive pages   │
│  Context Injection  │  Charts          │  Quick actions       │
│  Quick Commands     │  Trade signals  │  Notifications      │
├─────────────────────┴─────────────────┴──────────────────────┤
│                        API Gateway                            │
├─────────────────────────────────────────────────────────────┤
│  /chat    │ /market   │ /evolution │ /sentiment │ /paper   │
│  /alerts  │ /options  │ /portfolio │ /voice     │ /community│
├─────────────────────────────────────────────────────────────┤
│                    Trading Intelligence                       │
├─────────────────────────────────────────────────────────────┤
│  Evolutionary Engine  │  Sentiment  │  Risk Analytics       │
│  Strategy Backtester  │  Pipeline   │  Position Sizer       │
├───────────────────────┴─────────────┴───────────────────────┤
│                    Data Sources                              │
├─────────────────────────────────────────────────────────────┤
│  Broker APIs  │  News APIs  │  Social  │  Exchange Feeds     │
│  Dhan/Upstox │  NewsAPI    │  Twitter │  NSE BSE            │
└─────────────────────────────────────────────────────────────┘
```

---

## Roadmap

### v1.1 (This Week)
- [ ] Broker API integration
- [ ] Real WebSocket prices
- [ ] Actual trade execution

### v1.2 (Next Week)
- [ ] TradingView charts embed
- [ ] Options strategy builder
- [ ] Telegram alerts

### v1.3 (Month 2)
- [ ] Mobile app
- [ ] Copy trading launch
- [ ] Strategy marketplace

### v2.0 (Quarter 2)
- [ ] Multi-broker support
- [ ] Institutional features
- [ ] API for third-party devs
