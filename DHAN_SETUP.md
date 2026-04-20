# Dhan API Setup Guide for TradeMind AI

## Your Sandbox Credentials

**Client ID**: `2604172391` (from your screenshot)

This is your **Sandbox Client ID** - for testing only, doesn't execute real orders.

---

## How to Get a Live API Key

### For **Live Trading** (Real money):

1. **Have a Dhan Account**
   - Open account at [dhan.co](https://www.dhan.co) if you don't have one

2. **Get API Key & Secret**
   - Login to [web.dhan.co](https://web.dhan.co)
   - Go to **My Profile → Access DhanHQ APIs**
   - Click **'API key'** tab
   - Enter app name (e.g., "TradeMind AI")
   - Copy the **API Key** and **API Secret**
   - These are valid for **12 months**

3. **Generate Access Token** (3-step OAuth):
   ```
   STEP 1: Get consent
   POST https://auth.dhan.co/app/generate-consent?client_id=YOUR_CLIENT_ID
   Headers: app_id: YOUR_API_KEY, app_secret: YOUR_API_SECRET
   
   STEP 2: Open in browser (user logs in)
   https://auth.dhan.co/login/consentApp-login?consentAppId={consentAppId from Step 1}
   
   STEP 3: Exchange token for access token
   POST https://auth.dhan.co/app/consumeApp-consent?tokenId={tokenId from Step 2}
   Headers: app_id: YOUR_API_KEY, app_secret: YOUR_API_SECRET
   ```

4. **Save Credentials in TradeMind**
   - Go to [Settings > Advanced](/?t=settings&s=advanced)
   - Add secrets:
     - `DHAN_CLIENT_ID` = Your client ID (e.g., `2604172391`)
     - `DHAN_ACCESS_TOKEN` = The JWT access token from Step 3

---

## For **Sandbox Testing** (No real money):

### Get Sandbox Access Token:

1. Go to [Dhan DevPortal](https://developers.dhan.co) (sandbox.dhan.co)
2. Login with your Dhan account
3. Generate a **Sandbox Token**
4. Use the token with your sandbox client ID `2604172391`

**Sandbox API Base URL**: `https://api-sandbox.dhan.co`

---

## Quick Test - Verify Your Credentials

```bash
# Test Dhan profile endpoint
curl -X GET "https://api.dhan.co/v2/profile" \
  -H "access-token: YOUR_ACCESS_TOKEN" \
  -H "dhanClientId: YOUR_CLIENT_ID"

# Response should include your name, segments, token validity
```

---

## Common NSE Symbol Tokens

| Symbol | Token | Symbol | Token |
|--------|-------|--------|-------|
| RELIANCE | 2885 | HDFCBANK | 1333 |
| TCS | 11536 | ICICIBANK | 4963 |
| INFOSYS | 1594 | SBIN | 3045 |
| NIFTY | 26000 | BANKNIFTY | 26000 |

Full list in `dhan-routes.js` → `/api/dhan/symbols` endpoint.

---

## Setup Checklist

- [ ] Get Dhan account (live) OR login to DevPortal (sandbox)
- [ ] Generate API key & secret (or sandbox token)
- [ ] Complete OAuth flow to get access token (live)
- [ ] Save `DHAN_CLIENT_ID` and `DHAN_ACCESS_TOKEN` to [Settings > Advanced](/?t=settings&s=advanced)
- [ ] Test connection at `/api/dhan/profile`
- [ ] Start trading!

---

## TradeMind Dhan API Routes

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/dhan/profile` | GET | Verify credentials |
| `/api/dhan/ltp` | GET | Get last traded price |
| `/api/dhan/quote` | GET | Get full OHLC quote |
| `/api/dhan/candles` | GET | Get historical candles |
| `/api/dhan/orders` | GET/POST | List orders / Place order |
| `/api/dhan/orders/:id` | GET/PUT/DELETE | Get/modify/cancel order |
| `/api/dhan/positions` | GET | Current positions |
| `/api/dhan/holdings` | GET | Portfolio holdings |
| `/api/dhan/margin` | GET | Available margin |
| `/api/dhan/optionchain` | GET | Options chain |
| `/api/dhan/symbol` | GET | Resolve symbol name to token |

---

## Example Trade Request

```javascript
// Place a BUY order for RELIANCE
POST /api/dhan/orders
{
  "exchange": "NSE",
  "symbolToken": "2885",
  "transactionType": "BUY",
  "quantity": "10",
  "orderType": "MARKET",
  "productType": "CNC"
}
```

Headers required:
- `dhanClientId: 2604172391` (or your live client ID)
- `access-token: YOUR_ACCESS_TOKEN`
