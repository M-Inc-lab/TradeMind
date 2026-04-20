# TradeMind AI - Browser Extension Setup Guide

## Quick Installation

### Chrome/Edge (Chromium-based)

1. Open `chrome://extensions/`
2. Enable **Developer mode** (top right toggle)
3. Click **Load unpacked**
4. Select the `extension` folder from this project

### Firefox

1. Open `about:debugging#/runtime/this-firefox`
2. Click **Load Temporary Add-on**
3. Select `extension/manifest.json`

## Features After Installation

- 📊 **Overlay Widget**: Floating trading dashboard on any broker site
- 💬 **AI Chat**: Ask trading questions in plain English
- 📈 **Real-time Quotes**: Live NSE/BSE prices
- 🎯 **Trade Signals**: AI-generated buy/sell recommendations
- 🧬 **Strategy Evolution**: Watch genetic algorithms optimize strategies
- 📰 **Sentiment Tracker**: News + social media + FII/DII flow

## Broker API Configuration

Edit `extension/background.js` to add your broker credentials:

```javascript
const BROKER_CONFIGS = {
  dhan: { apiKey: 'YOUR_DHAN_KEY', secret: 'YOUR_SECRET' },
  upstox: { apiKey: 'YOUR_UPSTOX_KEY', secret: 'YOUR_SECRET' },
  shoonya: { apiKey: 'YOUR_SHOONYA_KEY', secret: 'YOUR_SECRET' }
};
```

Add secrets in [Zo Settings](/?t=settings&s=advanced) as environment variables.
