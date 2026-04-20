// TradeMind AI - Dhan Broker Adapter
// Supports both Live (api.dhan.co) and Sandbox (sandbox.dhan.co) trading

const DHAN_CONFIG = {
  live: {
    baseUrl: "https://api.dhan.co",
    profile: "https://api.dhan.co/v2/profile",
  },
  sandbox: {
    baseUrl: "https://sandbox.dhan.co",
    profile: "https://sandbox.dhan.co/v2/profile",
  }
};

export class DhanAdapter {
  constructor(clientId, accessToken, isSandbox = false) {
    this.clientId = clientId;
    this.accessToken = accessToken;
    this.isSandbox = isSandbox;
    this.config = isSandbox ? DHAN_CONFIG.sandbox : DHAN_CONFIG.live;
  }

  getHeaders() {
    return {
      "access-token": this.accessToken,
      "dhanClientId": this.clientId,
      "Content-Type": "application/json"
    };
  }

  // Test connection - verify credentials work
  async getProfile() {
    try {
      const response = await fetch(this.config.profile, {
        headers: this.getHeaders()
      });
      return await response.json();
    } catch (error) {
      return { error: error.message };
    }
  }

  // Get Last Traded Price for a symbol
  async getLTP(exchange, securityId) {
    try {
      const url = `${this.config.baseUrl}/v2/ltp?exchange=${exchange}&securityId=${securityId}`;
      const response = await fetch(url, { headers: this.getHeaders() });
      return await response.json();
    } catch (error) {
      return { error: error.message };
    }
  }

  // Get full quote with OHLC
  async getQuote(exchange, securityId) {
    try {
      const url = `${this.config.baseUrl}/v2/quotes?exchange=${exchange}&securityId=${securityId}`;
      const response = await fetch(url, { headers: this.getHeaders() });
      return await response.json();
    } catch (error) {
      return { error: error.message };
    }
  }

  // Get historical candles
  async getHistoricalCandles(exchange, securityId, interval, from, to) {
    try {
      const url = `${this.config.baseUrl}/v2/candles?exchange=${exchange}&securityId=${securityId}&symbol=${securityId}&interval=${interval}&from=${from}&to=${to}`;
      const response = await fetch(url, { headers: this.getHeaders() });
      return await response.json();
    } catch (error) {
      return { error: error.message };
    }
  }

  // Place order
  async placeOrder(params) {
    try {
      const response = await fetch(`${this.config.baseUrl}/v2/orders`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          exchange: params.exchange || 'NSE',
          securityId: params.securityId || params.symbolToken,
          transactionType: params.transactionType || params.side,
          quantity: params.quantity,
          orderType: params.orderType || 'MARKET',
          productType: params.productType || 'CNC',
          price: params.price || '0',
          triggerPrice: params.triggerPrice || '0',
          disclosedQuantity: params.disclosedQuantity || '0',
          afterMarketOrder: params.afterMarketOrder || false,
          amoTime: params.amoTime || 'OPEN',
          plegalAccountId: params.plegalAccountId || ''
        })
      });
      return await response.json();
    } catch (error) {
      return { error: error.message };
    }
  }

  // Place sandbox order (simulated)
  async placeSandboxOrder(params) {
    const orderId = 'SB' + Date.now();
    return {
      orderId,
      status: 'SANDBOX_SIMULATED',
      message: 'Sandbox order - no real execution',
      params,
      timestamp: new Date().toISOString()
    };
  }

  // Get order book
  async getOrderBook() {
    try {
      const response = await fetch(`${this.config.baseUrl}/v2/orders`, {
        headers: this.getHeaders()
      });
      return await response.json();
    } catch (error) {
      return { error: error.message };
    }
  }

  // Get positions
  async getPositions() {
    try {
      const response = await fetch(`${this.config.baseUrl}/v2/positions`, {
        headers: this.getHeaders()
      });
      return await response.json();
    } catch (error) {
      return { error: error.message };
    }
  }

  // Get holdings
  async getHoldings() {
    try {
      const response = await fetch(`${this.config.baseUrl}/v2/holdings`, {
        headers: this.getHeaders()
      });
      return await response.json();
    } catch (error) {
      return { error: error.message };
    }
  }

  // Get margin
  async getMargin() {
    try {
      const response = await fetch(`${this.config.baseUrl}/v2/margins`, {
        headers: this.getHeaders()
      });
      return await response.json();
    } catch (error) {
      return { error: error.message };
    }
  }

  // Search symbol
  async searchSymbol(symbolName) {
    // NSE common symbols mapping
    const SYMBOLS = {
      'RELIANCE': { securityId: '2885', exchange: 'NSE', name: 'RELIANCE' },
      'TCS': { securityId: '11536', exchange: 'NSE', name: 'TCS' },
      'HDFCBANK': { securityId: '1333', exchange: 'NSE', name: 'HDFC Bank' },
      'ICICIBANK': { securityId: '4963', exchange: 'NSE', name: 'ICICI Bank' },
      'INFOSYS': { securityId: '1594', exchange: 'NSE', name: 'Infosys' },
      'SBIN': { securityId: '3045', exchange: 'NSE', name: 'State Bank' },
      'NIFTY': { securityId: '26000', exchange: 'NSE', name: 'Nifty 50' },
      'BANKNIFTY': { securityId: '26009', exchange: 'NSE', name: 'Bank Nifty' },
      'RELIANCE': { securityId: '2885', exchange: 'NSE', name: 'Reliance' },
      'KOTAKBANK': { securityId: '1922', exchange: 'NSE', name: 'Kotak Bank' },
      'LT': { securityId: '11483', exchange: 'NSE', name: 'Larsen & Toubro' },
      'ITC': { securityId: '2152', exchange: 'NSE', name: 'ITC' },
      'BHARTIARTL': { securityId: '10604', exchange: 'NSE', name: 'Bharti Airtel' },
      'ASIANPAINT': { securityId: '781', exchange: 'NSE', name: 'Asian Paints' },
      'MARUTI': { securityId: '10999', exchange: 'NSE', name: 'Maruti Suzuki' }
    };
    return SYMBOLS[symbolName.toUpperCase()] || null;
  }
}