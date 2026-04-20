// TradeMind AI - TRAINING PIPELINE v7
// Goal: 85% accuracy first, then 93%

const STRATEGIES = [
  // Momentum strategies
  { name: 'RSI_OVERSOLD_MOMENTUM', fn: (c) => {
    const rsi = c.rsi; const ema9 = c.ema9; const ema21 = c.ema21;
    const macd = c.macd; const volume = c.volumeRatio;
    let score = 0; let signals = [];
    if (rsi < 30 && ema9 > ema21) { score += 4; signals.push('RSI oversold + uptrend'); }
    if (rsi < 25) { score += 3; signals.push('RSI < 25'); }
    if (macd > 0 && c.macdSignal > 0) { score += 2; signals.push('MACD bullish'); }
    if (volume > 1.5) { score += 2; signals.push('High volume'); }
    return { score, signals, signal: score >= 6 ? 'BUY' : null };
  }},
  { name: 'MACD_CROSS_ABOVE', fn: (c) => {
    const { macd, macdSignal, ema9, ema21, rsi } = c;
    let score = 0; let signals = [];
    if (macd > macdSignal && c.macdPrev <= c.macdSignalPrev) { score += 5; signals.push('MACD golden cross'); }
    if (ema9 > ema21) { score += 2; signals.push('EMA9 > EMA21'); }
    if (rsi < 60) { score += 1; signals.push('RSI not overbought'); }
    return { score, signals, signal: score >= 5 ? 'BUY' : null };
  }},
  { name: 'BOLLINGER_BOUNCE', fn: (c) => {
    const { close, lowerBand, ema21, volumeRatio, rsi } = c;
    let score = 0; let signals = [];
    if (close < lowerBand) { score += 5; signals.push('Below lower Bollinger'); }
    if (close > lowerBand && close < ema21 * 1.02) { score += 3; signals.push('Bouncing from support'); }
    if (volumeRatio > 1.2) { score += 2; signals.push('Volume confirming bounce'); }
    if (rsi < 40) { score += 2; signals.push('RSI confirming oversold'); }
    return { score, signals, signal: score >= 5 ? 'BUY' : null };
  }},
  // Mean reversion
  { name: 'MEAN_REVERSION', fn: (c) => {
    const { close, sma20, rsi, volumeRatio } = c;
    const dev = (close - sma20) / sma20 * 100;
    let score = 0; let signals = [];
    if (dev < -3) { score += 4; signals.push(`Price ${dev.toFixed(1)}% below SMA20`); }
    if (rsi < 35) { score += 3; signals.push('RSI oversold'); }
    if (volumeRatio > 1.3) { score += 2; signals.push('High volume on decline'); }
    if (dev < -5) { score += 2; signals.push('Extreme deviation'); }
    return { score, signals, signal: score >= 6 ? 'BUY' : null };
  }},
  // Trend following
  { name: 'TREND_PULLBACK', fn: (c) => {
    const { ema9, ema21, ema50, rsi, volumeRatio } = c;
    let score = 0; let signals = [];
    if (ema9 > ema21 && ema21 > ema50) { score += 4; signals.push('Strong uptrend'); }
    if (rsi < 45 && rsi > 30) { score += 3; signals.push('Pullback in uptrend'); }
    if (volumeRatio > 1.2) { score += 2; signals.push('Volume on pullback'); }
    return { score, signals, signal: score >= 6 ? 'BUY' : null };
  }},
  { name: 'EMA9_EMA21_CROSS', fn: (c) => {
    const { ema9, ema21, ema50, rsi } = c;
    let score = 0; let signals = [];
    if (ema9 > ema21) { score += 4; signals.push('EMA9 crossed above EMA21'); }
    if (ema21 > ema50) { score += 2; signals.push('Long-term uptrend'); }
    if (rsi < 55) { score += 1; signals.push('RSI healthy'); }
    return { score, signals, signal: score >= 5 ? 'BUY' : null };
  }},
  // Volume-based
  { name: 'VOLUME_SPIKE', fn: (c) => {
    const { volumeRatio, ema9, ema21, rsi, sma20 } = c;
    let score = 0; let signals = [];
    if (volumeRatio > 2.5) { score += 4; signals.push('Major volume spike'); }
    if (c.close > sma20) { score += 2; signals.push('Above SMA20'); }
    if (ema9 > ema21) { score += 2; signals.push('Short-term uptrend'); }
    if (rsi < 55) { score += 1; signals.push('RSI OK'); }
    return { score, signals, signal: score >= 6 ? 'BUY' : null };
  }},
  // Breakout
  { name: 'RESISTANCE_BREAK', fn: (c) => {
    const { close, high20, ema9, ema21, volumeRatio } = c;
    let score = 0; let signals = [];
    if (close > high20) { score += 5; signals.push('20-day high breakout'); }
    if (ema9 > ema21) { score += 2; signals.push('Uptrend confirmed'); }
    if (volumeRatio > 1.5) { score += 3; signals.push('Volume confirms breakout'); }
    return { score, signals, signal: score >= 7 ? 'BUY' : null };
  }},
  // SELL strategies
  { name: 'RSI_OVERBOUGHT_MOMENTUM', fn: (c) => {
    const rsi = c.rsi; const ema9 = c.ema9; const ema21 = c.ema21;
    let score = 0; let signals = [];
    if (rsi > 70 && ema9 < ema21) { score += 4; signals.push('RSI overbought + downtrend'); }
    if (rsi > 75) { score += 3; signals.push('RSI > 75'); }
    if (c.macd < 0) { score += 2; signals.push('MACD bearish'); }
    return { score, signals, signal: score >= 6 ? 'SELL' : null };
  }},
  { name: 'MACD_CROSS_BELOW', fn: (c) => {
    const { macd, macdSignal, ema9, ema21, rsi } = c;
    let score = 0; let signals = [];
    if (macd < macdSignal && c.macdPrev >= c.macdSignalPrev) { score += 5; signals.push('MACD death cross'); }
    if (ema9 < ema21) { score += 2; signals.push('EMA9 below EMA21'); }
    if (rsi > 40) { score += 1; signals.push('RSI not oversold'); }
    return { score, signals, signal: score >= 5 ? 'SELL' : null };
  }},
  { name: 'BOLLINGER_OVERBOUGHT', fn: (c) => {
    const { close, upperBand, ema21, rsi, volumeRatio } = c;
    let score = 0; let signals = [];
    if (close > upperBand) { score += 5; signals.push('Above upper Bollinger'); }
    if (rsi > 60) { score += 2; signals.push('RSI overbought'); }
    if (volumeRatio < 0.8) { score += 2; signals.push('Low volume on spike'); }
    return { score, signals, signal: score >= 5 ? 'SELL' : null };
  }},
];

export { STRATEGIES };