// TradeMind AI - Trade Journal & Performance Analytics
// Win rate, Sharpe, Sortino, expectancy, drawdown, trade journal

export class TradeJournal {
  constructor() {
    this.trades = [];
  }

  addTrade(trade) {
    this.trades.push({
      id: Date.now(),
      entryTime: trade.entryTime || new Date().toISOString(),
      exitTime: trade.exitTime || null,
      symbol: trade.symbol,
      type: trade.type, // LONG, SHORT
      entryPrice: trade.entryPrice,
      exitPrice: trade.exitPrice || null,
      quantity: trade.quantity,
      pnl: trade.pnl || 0,
      pnlPercent: 0,
      strategy: trade.strategy || 'manual',
      timeframe: trade.timeframe || 'intraday',
      tags: trade.tags || [],
      notes: trade.notes || '',
      status: trade.exitPrice ? 'closed' : 'open'
    });
    if (trade.exitPrice) this.calculatePnL(this.trades.length - 1);
    return this.trades[this.trades.length - 1];
  }

  calculatePnL(idx) {
    const t = this.trades[idx];
    const mult = t.type === 'SHORT' ? -1 : 1;
    t.pnl = (t.exitPrice - t.entryPrice) * t.quantity * mult;
    t.pnlPercent = ((t.exitPrice - t.entryPrice) / t.entryPrice) * 100 * mult;
  }

  updateTrade(idx, updates) {
    Object.assign(this.trades[idx], updates);
    if (updates.exitPrice) this.calculatePnL(idx);
    return this.trades[idx];
  }

  getMetrics() {
    const closed = this.trades.filter(t => t.status === 'closed');
    if (closed.length === 0) return null;

    const wins = closed.filter(t => t.pnl > 0);
    const losses = closed.filter(t => t.pnl <= 0);
    const totalPnL = closed.reduce((s, t) => s + t.pnl, 0);
    const avgWin = wins.length ? wins.reduce((s, t) => s + t.pnl, 0) / wins.length : 0;
    const avgLoss = losses.length ? Math.abs(losses.reduce((s, t) => s + t.pnl, 0) / losses.length) : 1;
    const returns = closed.map(t => t.pnlPercent / 100);
    const avgReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
    const stdReturn = Math.sqrt(returns.reduce((s, r) => s + Math.pow(r - avgReturn, 2), 0) / returns.length) || 1;
    const negReturns = returns.filter(r => r < 0);
    const downDev = Math.sqrt(negReturns.reduce((s, r) => s + r * r, 0) / (negReturns.length || 1));

    // Drawdown
    let peak = 0, maxDD = 0, running = 0;
    for (const t of closed) {
      running += t.pnl;
      if (running > peak) peak = running;
      const dd = peak > 0 ? (peak - running) / peak : 0;
      if (dd > maxDD) maxDD = dd;
    }

    // Win by strategy
    const byStrategy = {};
    for (const t of closed) {
      if (!byStrategy[t.strategy]) byStrategy[t.strategy] = { wins: 0, losses: 0, pnl: 0 };
      byStrategy[t.strategy].wins += t.pnl > 0 ? 1 : 0;
      byStrategy[t.strategy].losses += t.pnl <= 0 ? 1 : 0;
      byStrategy[t.strategy].pnl += t.pnl;
    }

    return {
      totalTrades: closed.length,
      winRate: (wins.length / closed.length) * 100,
      profitFactor: avgLoss > 0 ? (avgWin * wins.length) / (avgLoss * losses.length) : Infinity,
      expectancy: (wins.length / closed.length) * avgWin - (losses.length / closed.length) * avgLoss,
      sharpeRatio: avgReturn / stdDev * Math.sqrt(252),
      sortinoRatio: avgReturn / downDev * Math.sqrt(252),
      maxDrawdown: maxDD * 100,
      totalPnL,
      avgWin,
      avgLoss,
      bestTrade: Math.max(...closed.map(t => t.pnl)),
      worstTrade: Math.min(...closed.map(t => t.pnl)),
      consecutiveWins: this.getConsecutive('win'),
      consecutiveLosses: this.getConsecutive('loss'),
      byStrategy,
      recentTrades: closed.slice(-10).reverse()
    };
  }

  getConsecutive(type) {
    let max = 0, curr = 0;
    for (const t of this.trades) {
      if (t.status !== 'closed') continue;
      const isWin = t.pnl > 0;
      if ((type === 'win' && isWin) || (type === 'loss' && !isWin)) { curr++; max = Math.max(max, curr); }
      else curr = 0;
    }
    return max;
  }

  exportJournal() {
    return this.trades.map(t => ({
      ...t,
      entryTime: t.entryTime ? new Date(t.entryTime).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }) : '',
      exitTime: t.exitTime ? new Date(t.exitTime).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }) : ''
    }));
  }
}

export const journal = new TradeJournal();
