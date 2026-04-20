// TradeMind AI - Broker Integration Layer
// Supports: Dhan (LIVE!), Upstox, Shoonya/Finvasia, Angel One

import { DhanAdapter } from './dhan-adapter.js';

// ============ DHAN ADAPTER (LIVE TRADING!) ============
export class DhanBroker {
  constructor(clientId, accessToken, isSandbox = false) {
    this.adapter = new DhanAdapter(clientId, accessToken, isSandbox);
    this.name = "Dhan";
    this.type = isSandbox ? "Dhan Sandbox" : "Dhan Live";
  }

  async getProfile() {
    if (this.adapter.isSandbox) {
      return { status: "sandbox", clientId: this.adapter.clientId };
    }
    return this.adapter.getProfile();
  }

  async getQuotes(exchange, symbolToken) {
    return this.adapter.getQuotes(exchange, symbolToken);
  }

  async getLTP(exchange, symbolToken) {
    return this.adapter.getLTP(exchange, symbolToken);
  }

  async getCandles(exchange, symbolToken, interval, from, to) {
    if (this.adapter.isSandbox) {
      // Sandbox doesn't have real historical data
      return { candles: [], note: "Historical data not available in sandbox" };
    }
    return this.adapter.getHistoricalCandles(exchange, symbolToken, interval, from, to);
  }

  async placeOrder(params) {
    if (this.adapter.isSandbox) {
      return this.adapter.placeSandboxOrder(params);
    }
    return this.adapter.placeOrder(params);
  }

  async cancelOrder(orderId) {
    return this.adapter.cancelOrder(orderId);
  }

  async getOrders() {
    return this.adapter.getOrderBook();
  }

  async getPositions() {
    return this.adapter.getPositions();
  }

  async getHoldings() {
    return this.adapter.getHoldings();
  }

  async getMargin() {
    return this.adapter.getMargin();
  }

  async getOptionChain(exchange, symbolToken, expiry) {
    return this.adapter.getOptionChain(exchange, symbolToken, expiry);
  }

  // Helper: Get NSE token for symbol name
  async resolveSymbol(symbolName) {
    return this.adapter.searchSymbol(symbolName);
  }
}

// Trade execution engine with risk management
class ExecutionEngine {
  constructor() {
    this.maxPositionSize = 0.05; // 5% of portfolio per trade
    this.maxLossPerTrade = 0.02; // 2% stop loss
    this.maxDailyLoss = 0.05; // 5% daily loss limit
    this.dailyPnL = 0;
    this.positions = new Map();
  }

  calculatePositionSize(capital, price, riskPercent = 0.02) {
    return Math.floor((capital * riskPercent) / price);
  }

  async execute(signal, broker, capital) {
    // Risk checks
    if (this.dailyPnL < -capital * this.maxDailyLoss) {
      return { rejected: true, reason: 'Daily loss limit reached' };
    }

    const positionValue = signal.price * signal.quantity;
    if (positionValue > capital * this.maxPositionSize) {
      signal.quantity = this.calculatePositionSize(capital, signal.price);
    }

    // Place order
    try {
      const order = await broker.placeOrder({
        symbol: signal.symbol,
        side: signal.action === 'BUY' ? 'BUY' : 'SELL',
        type: signal.orderType || 'MARKET',
        quantity: signal.quantity,
        productType: signal.productType || 'CNC',
        price: signal.price,
        triggerPrice: signal.stopLoss,
        exchange: signal.exchange || 'NSE'
      });

      this.positions.set(signal.symbol, {
        ...signal,
        orderId: order.orderId,
        timestamp: Date.now()
      });

      return { success: true, order };
    } catch (e) {
      return { rejected: true, reason: e.message };
    }
  }

  updateDailyPnL(pnl) {
    this.dailyPnL += pnl;
    if (this.dailyPnL > 0) this.dailyPnL = 0; // Only track losses
  }
}

export { DhanBroker, ExecutionEngine };
