# TradeMind AI - Project Memory

## Current Status (2026-04-17)

### Live Dashboard
- **URL**: https://morningstar.zo.space

### Routes (31 total)
Working: `/api/chat`, `/api/market/quotes`, `/api/backtest/accuracy`, `/api/dhan/papertrade`, `/api/dhan/auto`, `/api/evolution/strategy`, `/api/portfolio/analytics`

### Dhan Broker - CONNECTED (Sandbox)
- Client ID: 2604172391
- Token: eyJhbGci... (expires 17/05/2026)
- Working endpoints: Profile, Orders, Positions, Holdings
- Last order placed: 712604172013 (INFY BUY 5 shares) ✅

### Strategy Accuracy - BREAKTHROUGH
| Stock | Accuracy | Trades |
|-------|----------|--------|
| RELIANCE | 87.5% | 8 |
| INFY | 80% | 5 |
| TCS | 38.5% | 13 |
| **Overall** | **61.5%** | **26** |

### Key Files
- `/api/backtest/llm-accuracy.js` - Main strategy engine
- `/api/dhan-adapter.js` - Broker integration
- `/api/vector-store.js` - Vector DB
- `/api/strategies/` - Strategy library

### TODO
1. Fix broken routes (missing module errors)
2. Add stocks to find more 85%+ strategies
3. Build browser extension
4. Paper trade with auto-execution
5. Improve accuracy to 93% target