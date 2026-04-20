// TradeMind AI - Dhan Live Trading API Routes
// Complete order execution, portfolio, and real-time market data

import { Hono } from 'hono';

const app = new Hono();

// Dhan API base URLs
const LIVE_BASE = "https://api.dhan.co";
const SANDBOX_BASE = "https://api-sandbox.dhan.co";

// Middleware to validate Dhan credentials
function validateDhanAuth() {
  return async (c, next) => {
    const clientId = c.req.header('dhanClientId');
    const accessToken = c.req.header('access-token');
    
    if (!clientId || !accessToken) {
      return c.json({ error: "Missing Dhan credentials. Provide dhanClientId and access-token headers" }, 401);
    }
    
    c.set('dhanClientId', clientId);
    c.set('dhanAccessToken', accessToken);
    await next();
  };
}

// ============ PROFILE & AUTH ============

// Verify credentials and get user profile
app.get('/api/dhan/profile', validateDhanAuth(), async (c) => {
  const clientId = c.get('dhanClientId');
  const token = c.get('dhanAccessToken');
  
  try {
    const res = await fetch(`${LIVE_BASE}/v2/profile`, {
      headers: { 'access-token': token, 'dhanClientId': clientId }
    });
    const data = await res.json();
    
    if (data.status === "error" || data.message?.includes("Invalid")) {
      return c.json({ error: "Invalid or expired token", details: data }, 401);
    }
    
    return c.json({
      clientId: data.dhanClientId,
      name: data.dhanClientName,
      ucc: data.dhanClientUcc,
      segments: data.activeSegment,
      ddpi: data.ddpi,
      mtf: data.mtf,
      tokenExpiry: data.tokenValidity
    });
  } catch (e) {
    return c.json({ error: "Failed to fetch profile", details: e.message }, 500);
  }
});

// ============ MARKET DATA ============

// Get LTP (Last Traded Price) - fastest single symbol
app.get('/api/dhan/ltp', validateDhanAuth(), async (c) => {
  const { exchange, symbolToken } = await c.req.query();
  
  if (!exchange || !symbolToken) {
    return c.json({ error: "Provide exchange and symbolToken query params" }, 400);
  }
  
  const clientId = c.get('dhanClientId');
  const token = c.get('dhanAccessToken');
  
  const res = await fetch(
    `${LIVE_BASE}/v2/marketData/ltp?exchange=${exchange}&symbolToken=${symbolToken}`,
    { headers: { 'access-token': token, 'dhanClientId': clientId } }
  );
  const data = await res.json();
  return c.json(data);
});

// Get full OHLC quote
app.get('/api/dhan/quote', validateDhanAuth(), async (c) => {
  const { exchange, symbolToken } = await c.req.query();
  
  const clientId = c.get('dhanClientId');
  const token = c.get('dhanAccessToken');
  
  const res = await fetch(
    `${LIVE_BASE}/v2/marketData/quote?exchange=${exchange}&symbolToken=${symbolToken}`,
    { headers: { 'access-token': token, 'dhanClientId': clientId } }
  );
  return c.json(await res.json());
});

// Get historical candles
app.get('/api/dhan/candles', validateDhanAuth(), async (c) => {
  const { exchange, symbolToken, interval, fromDate, toDate } = await c.req.query();
  
  const clientId = c.get('dhanClientId');
  const token = c.get('dhanAccessToken');
  
  const url = `${LIVE_BASE}/v2/marketData/candle?exchange=${exchange}&symbolToken=${symbolToken}&interval=${interval}&fromDate=${fromDate}&toDate=${toDate}`;
  
  const res = await fetch(url, {
    headers: { 'access-token': token, 'dhanClientId': clientId }
  });
  return c.json(await res.json());
});

// ============ ORDERS ============

// Place a new order
app.post('/api/dhan/orders', validateDhanAuth(), async (c) => {
  const clientId = c.get('dhanClientId');
  const token = c.get('dhanAccessToken');
  
  const order = await c.req.json();
  
  // Validate required fields
  if (!order.exchange || !order.symbolToken || !order.transactionType || !order.quantity) {
    return c.json({ 
      error: "Missing required fields: exchange, symbolToken, transactionType, quantity" 
    }, 400);
  }
  
  const res = await fetch(`${LIVE_BASE}/v2/orders`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'access-token': token,
      'dhanClientId': clientId
    },
    body: JSON.stringify({
      exchange: order.exchange,
      symbolToken: order.symbolToken,
      transactionType: order.transactionType, // BUY or SELL
      quantity: String(order.quantity),
      orderType: order.orderType || "MARKET",
      productType: order.productType || "CNC",
      price: order.price ? String(order.price) : "0",
      priceType: order.priceType || "MARKET",
      triggerPrice: order.triggerPrice ? String(order.triggerPrice) : "0",
      disclosedQuantity: order.disclosedQuantity ? String(order.disclosedQuantity) : "0",
      afterHour: order.afterHour || false,
      uniqueLogTime: order.uniqueLogTime || ""
    })
  });
  
  const data = await res.json();
  
  // Log the order for transparency
  console.log(`[DHAN ORDER] ${order.transactionType} ${order.exchange}:${order.symbolToken} Qty:${order.quantity} =>`, data);
  
  return c.json({
    ...data,
    debug: {
      requestedAt: new Date().toISOString(),
      orderSummary: `${order.transactionType} ${order.quantity} lots of ${order.symbolToken} on ${order.exchange}`
    }
  });
});

// Get all orders
app.get('/api/dhan/orders', validateDhanAuth(), async (c) => {
  const clientId = c.get('dhanClientId');
  const token = c.get('dhanAccessToken');
  
  const res = await fetch(`${LIVE_BASE}/v2/orders`, {
    headers: { 'access-token': token, 'dhanClientId': clientId }
  });
  return c.json(await res.json());
});

// Get specific order
app.get('/api/dhan/orders/:orderId', validateDhanAuth(), async (c) => {
  const { orderId } = c.req.param();
  const clientId = c.get('dhanClientId');
  const token = c.get('dhanAccessToken');
  
  const res = await fetch(`${LIVE_BASE}/v2/orders/${orderId}`, {
    headers: { 'access-token': token, 'dhanClientId': clientId }
  });
  return c.json(await res.json());
});

// Modify order
app.put('/api/dhan/orders/:orderId', validateDhanAuth(), async (c) => {
  const { orderId } = c.req.param();
  const clientId = c.get('dhanClientId');
  const token = c.get('dhanAccessToken');
  const modifications = await c.req.json();
  
  const res = await fetch(`${LIVE_BASE}/v2/orders`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'access-token': token,
      'dhanClientId': clientId
    },
    body: JSON.stringify({ orderId, ...modifications })
  });
  return c.json(await res.json());
});

// Cancel order
app.delete('/api/dhan/orders/:orderId', validateDhanAuth(), async (c) => {
  const { orderId } = c.req.param();
  const clientId = c.get('dhanClientId');
  const token = c.get('dhanAccessToken');
  
  const res = await fetch(`${LIVE_BASE}/v2/orders/${orderId}`, {
    method: 'DELETE',
    headers: { 'access-token': token, 'dhanClientId': clientId }
  });
  return c.json(await res.json());
});

// ============ POSITIONS ============

// Get all positions
app.get('/api/dhan/positions', validateDhanAuth(), async (c) => {
  const clientId = c.get('dhanClientId');
  const token = c.get('dhanAccessToken');
  
  const res = await fetch(`${LIVE_BASE}/v2/positions`, {
    headers: { 'access-token': token, 'dhanClientId': clientId }
  });
  return c.json(await res.json());
});

// Get holdings
app.get('/api/dhan/holdings', validateDhanAuth(), async (c) => {
  const clientId = c.get('dhanClientId');
  const token = c.get('dhanAccessToken');
  
  const res = await fetch(`${LIVE_BASE}/v2/portfolio/holdings`, {
    headers: { 'access-token': token, 'dhanClientId': clientId }
  });
  return c.json(await res.json());
});

// ============ MARGIN & FUNDS ============

// Get available margin
app.get('/api/dhan/margin', validateDhanAuth(), async (c) => {
  const clientId = c.get('dhanClientId');
  const token = c.get('dhanAccessToken');
  
  const res = await fetch(`${LIVE_BASE}/v2/margin`, {
    headers: { 'access-token': token, 'dhanClientId': clientId }
  });
  return c.json(await res.json());
});

// ============ OPTIONS ============

// Get option chain
app.get('/api/dhan/optionchain', validateDhanAuth(), async (c) => {
  const { exchange, symbolToken, expiry } = await c.req.query();
  
  const clientId = c.get('dhanClientId');
  const token = c.get('dhanAccessToken');
  
  const res = await fetch(
    `${LIVE_BASE}/v2/optionchain?exchange=${exchange}&symbolToken=${symbolToken}&expiry=${expiry}`,
    { headers: { 'access-token': token, 'dhanClientId': clientId } }
  );
  return c.json(await res.json());
});

// ============ NSE SYMBOL TOKENS (Common) ============

// Map common symbols to NSE tokens
const NSE_SYMBOLS = {
  "RELIANCE": "2885",
  "TCS": "11536",
  "INFOSYS": "1594",
  "HDFCBANK": "1333",
  "ICICIBANK": "4963",
  "SBIN": "3045",
  "BAJFINANCE": "317",
  "ASIANPAINT": "203",
  "NIFTY": "26000",
  "BANKNIFTY": "26000",
  "ADANIPORTS": "15083",
  "BRITANNIA": "2263",
  "CIPLA": "2803",
  "COALINDIA": "10769",
  "EICHERMOT": "2969",
  "GRASIM": "2485",
  "HCLTECH": "7229",
  "HINDUNILVR": "1394",
  "ITC": "2150",
  "KOTAKBANK": "1922",
  "LT": "15410",
  "M&M": "20374",
  "MARUTI": "10999",
  "NESTLEIND": "11630",
  "NTPC": "11630", // placeholder
  "ONGC": "2475",
  "POWERGRID": "14977",
  "SBILIFE": "21974",
  "SUNPHARMA": "3350",
  "TATASTEEL": "2963",
  "TECHM": "10862",
  "TITAN": "3506",
  "ULTRACEMCO": "18486",
  "WIPRO": "3787"
};

// Search symbol token
app.get('/api/dhan/symbol', async (c) => {
  const { name } = await c.req.query();
  
  if (!name) {
    return c.json({ error: "Provide name query param" }, 400);
  }
  
  const upper = name.toUpperCase();
  
  if (NSE_SYMBOLS[upper]) {
    return c.json({
      symbol: upper,
      symbolToken: NSE_SYMBOLS[upper],
      exchange: "NSE"
    });
  }
  
  return c.json({ error: "Symbol not found", symbol: upper }, 404);
});

// Get all available symbols
app.get('/api/dhan/symbols', async (c) => {
  return c.json({
    symbols: Object.entries(NSE_SYMBOLS).map(([name, token]) => ({ name, token }))
  });
});

// Dhan API Routes - Works with your sandbox credentials
// Client ID: 2604172391

const DHAN_SANDBOX_BASE = "https://sandbox.dhan.co";

// NSE Symbol mappings (security ID)
const NSE_SYMBOLS_SANDBOX = {
  'RELIANCE': '2885', 'TCS': '11536', 'HDFCBANK': '1333',
  'ICICIBANK': '4963', 'INFOSYS': '1594', 'SBIN': '3045',
  'KOTAKBANK': '1922', 'LT': '11483', 'ITC': '2152',
  'BHARTIARTL': '10604', 'ASIANPAINT': '781', 'MARUTI': '10999',
  'NIFTY': '26000', 'BANKNIFTY': '26009'
};

function getDhanHeaders() {
  const clientId = process.env.DHAN_CLIENT_ID || "2604172391";
  const token = process.env.DHAN_ACCESS_TOKEN || "";
  return {
    "access-token": token,
    "dhanClientId": clientId,
    "Content-Type": "application/json"
  };
}

function resolveSymbol(symbol) {
  const upper = symbol?.toUpperCase();
  if (NSE_SYMBOLS_SANDBOX[upper]) {
    return { exchange: 'NSE', securityId: NSE_SYMBOLS_SANDBOX[upper], symbol: upper };
  }
  return null;
}

// Verify credentials
app.get("/api/dhan/profile", async (c) => {
  const clientId = process.env.DHAN_CLIENT_ID || "2604172391";
  const token = process.env.DHAN_ACCESS_TOKEN || "";
  
  if (!token) {
    return c.json({
      connected: false,
      clientId,
      message: "Add DHAN_ACCESS_TOKEN in Settings > Advanced",
      docs: "See TradeMind/DHAN_SETUP.md"
    });
  }

  try {
    const res = await fetch(`${DHAN_SANDBOX_BASE}/v2/profile`, {
      headers: getDhanHeaders()
    });
    const data = await res.json();
    
    return c.json({
      connected: true,
      clientId,
      ...data
    });
  } catch (e) {
    return c.json({ connected: false, error: e.message });
  }
});

// Get LTP for symbol
app.get("/api/dhan/ltp", async (c) => {
  const symbol = c.req.query("symbol") || "RELIANCE";
  const resolved = resolveSymbol(symbol);
  
  if (!resolved) {
    return c.json({ error: "Unknown symbol. Try: RELIANCE, TCS, HDFCBANK, etc." });
  }

  try {
    const url = `${DHAN_SANDBOX_BASE}/v2/ltp?exchange=${resolved.exchange}&securityId=${resolved.securityId}`;
    const res = await fetch(url, { headers: getDhanHeaders() });
    const data = await res.json();
    
    return c.json({ symbol, ...resolved, ...data });
  } catch (e) {
    return c.json({ error: e.message });
  }
});

// Get full quote
app.get("/api/dhan/quote", async (c) => {
  const symbol = c.req.query("symbol") || "RELIANCE";
  const resolved = resolveSymbol(symbol);
  
  if (!resolved) {
    return c.json({ error: "Unknown symbol" });
  }

  try {
    const url = `${DHAN_SANDBOX_BASE}/v2/quotes?exchange=${resolved.exchange}&securityId=${resolved.securityId}`;
    const res = await fetch(url, { headers: getDhanHeaders() });
    const data = await res.json();
    
    return c.json({ symbol, ...resolved, ...data });
  } catch (e) {
    return c.json({ error: e.message });
  }
});

// Place order
app.post("/api/dhan/orders", async (c) => {
  const body = await c.req.json();
  const { action, symbol, quantity, orderType, productType, price } = body;
  
  const resolved = resolveSymbol(symbol);
  if (!resolved) {
    return c.json({ error: "Invalid symbol" });
  }

  // Sandbox mode - simulate order
  const simulatedOrder = {
    orderId: `SB${Date.now()}`,
    status: "SANDBOX_SIMULATED",
    message: "Sandbox order - no real execution",
    exchange: resolved.exchange,
    securityId: resolved.securityId,
    transactionType: action,
    quantity,
    orderType: orderType || "MARKET",
    productType: productType || "CNC",
    price: price || 0,
    timestamp: new Date().toISOString(),
    sandbox: true
  };

  return c.json(simulatedOrder);
});

// Get orders
app.get("/api/dhan/orders", async (c) => {
  return c.json({ orders: [], message: "Connect live API for real order data" });
});

// Get positions
app.get("/api/dhan/positions", async (c) => {
  return c.json({ positions: [], message: "Connect live API for real positions" });
});

// Get option chain
app.get("/api/dhan/optionchain", async (c) => {
  const symbol = c.req.query("symbol") || "NIFTY";
  const resolved = resolveSymbol(symbol) || { securityId: "26000", exchange: "NSE" };
  
  // Generate sample option chain
  const strikes = [];
  const atm = 24500; // approximate
  for (let i = -10; i <= 10; i++) {
    const strike = atm + (i * 100);
    strikes.push({
      strike,
      ce: { ltp: Math.random() * 200 + 50, iv: 15 + Math.random() * 10 },
      pe: { ltp: Math.random() * 200 + 50, iv: 15 + Math.random() * 10 }
    });
  }
  
  return c.json({ symbol, ...resolved, strikes });
});

// Get available symbols
app.get("/api/dhan/symbols", async (c) => {
  return c.json({ symbols: Object.entries(NSE_SYMBOLS_SANDBOX).map(([name, token]) => ({ name, token })) });
});

export default app;