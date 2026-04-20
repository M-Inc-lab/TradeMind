// TradeMind AI - Options Analytics & Greeks
// Black-Scholes, Greeks, IV analysis, Max Pain

export function blackScholes(S, K, T, r, sigma, type = 'call') {
  if (T <= 0 || sigma <= 0) return type === 'call' ? Math.max(S - K, 0) : Math.max(K - S, 0);
  const d1 = (Math.log(S / K) + (r + sigma * sigma / 2) * T) / (sigma * Math.sqrt(T));
  const d2 = d1 - sigma * Math.sqrt(T);
  const nd1 = normalCDF(d1), nd2 = normalCDF(d2);
  if (type === 'call') return S * nd1 - K * Math.exp(-r * T) * nd2;
  return K * Math.exp(-r * T) * (1 - nd2) - S * (1 - nd1);
}

function normalCDF(x) {
  const a1 = 0.254829592, a2 = -0.284496736, a3 = 1.421413741;
  const a4 = -1.453152027, a5 = 1.061405429, p = 0.3275911;
  const sign = x < 0 ? -1 : 1;
  x = Math.abs(x) / Math.sqrt(2);
  const t = 1 / (1 + p * x);
  return 0.5 * (1 + sign * (1 - Math.exp(-x * x) * t * (a1 + t * (a2 + t * (a3 + t * (a4 + t * a5))))));
}

export function calculateGreeks(S, K, T, r, sigma) {
  if (T <= 0 || sigma <= 0) return { delta: 0, gamma: 0, theta: 0, vega: 0 };
  const d1 = (Math.log(S / K) + (r + sigma * sigma / 2) * T) / (sigma * Math.sqrt(T));
  const d2 = d1 - sigma * Math.sqrt(T);
  const nd1 = normalCDF(d1), ndp1 = Math.exp(-d1 * d1 / 2) / Math.sqrt(2 * Math.PI);
  const gamma = ndp1 / (S * sigma * Math.sqrt(T));
  const vega = S * ndp1 * Math.sqrt(T) / 100;
  if (T < 1/365) return { delta: S > K ? 1 : 0, gamma, theta: 0, vega };
  const thetaCall = (-S * ndp1 * sigma / (2 * Math.sqrt(T)) - r * K * Math.exp(-r * T) * normalCDF(d2)) / 365;
  return {
    delta: nd1,
    gamma,
    theta: thetaCall,
    vega,
    deltaPut: nd1 - 1
  };
}

export function calculateIV(surface, spot, K, T, r, marketPrice, type = 'call') {
  let iv = 0.3, step = 0.001, maxIter = 100;
  for (let i = 0; i < maxIter; i++) {
    const price = blackScholes(spot, K, T, r, iv, type);
    if (Math.abs(price - marketPrice) < 0.01) break;
    const diff = price - marketPrice;
    const d1 = (Math.log(spot / K) + (r + iv * iv / 2) * T) / (iv * Math.sqrt(T));
    const vega = spot * Math.exp(-d1 * d1 / 2) * Math.sqrt(T) / 100;
    if (vega > 0.0001) iv -= diff / vega * 0.5;
    iv = Math.max(0.01, Math.min(5, iv));
  }
  return iv;
}

export function maxPain(optionsChain) {
  let maxPain = 0, maxPainValue = 0;
  const strikes = [...new Set(optionsChain.map(o => o.strike))];
  for (const strike of strikes) {
    const pain = optionsChain.filter(o => o.strike === strike).reduce((sum, o) => {
      if (o.type === 'call') return sum + Math.max(o.strike - spot, 0) * o.openInterest;
      return sum + Math.max(spot - o.strike, 0) * o.openInterest;
    }, 0);
    if (pain > maxPainValue) { maxPainValue = pain; maxPain = strike; }
  }
  return { maxPain, painValue: maxPainValue };
}

export function buildOptionChain(symbol, spot, expiry, strikesCount = 20) {
  const atmStrike = Math.round(spot / 50) * 50;
  const chain = [];
  for (let i = -strikesCount; i <= strikesCount; i++) {
    const strike = atmStrike + i * 50;
    const T = Math.max((expiry - Date.now()) / (365.25 * 24 * 3600 * 1000), 0.001);
    const iv = 0.15 + Math.abs(i) * 0.01;
    const r = 0.065;
    chain.push({
      strike,
      call: {
        ltp: blackScholes(spot, strike, T, r, iv, 'call'),
        iv,
        delta: calculateGreeks(spot, strike, T, r, iv).delta,
        gamma: calculateGreeks(spot, strike, T, r, iv).gamma,
        theta: calculateGreeks(spot, strike, T, r, iv).theta,
        vega: calculateGreeks(spot, strike, T, r, iv).vega
      },
      put: {
        ltp: blackScholes(spot, strike, T, r, iv, 'put'),
        iv,
        delta: calculateGreeks(spot, strike, T, r, iv).deltaPut,
        gamma: calculateGreeks(spot, strike, T, r, iv).gamma,
        theta: calculateGreeks(spot, strike, T, r, iv).theta,
        vega: calculateGreeks(spot, strike, T, r, iv).vega
      }
    });
  }
  return chain;
}

export function analyzeOI(candles, oiData) {
  const priceChange = candles.length > 1 ? (candles[candles.length-1].close - candles[candles.length-2].close) / candles[candles.length-2].close : 0;
  const oiChange = oiData.length > 1 ? (oiData[oiData.length-1].oi - oiData[oiData.length-2].oi) / oiData[oiData.length-2].oi : 0;
  let signal = 'NEUTRAL';
  if (priceChange > 0.01 && oiChange > 0.05) signal = 'STRONG_BULLISH';
  else if (priceChange < -0.01 && oiChange > 0.05) signal = 'BEARISH';
  else if (priceChange > 0.01 && oiChange < -0.05) signal = 'WEAK_BULLISH';
  else if (priceChange < -0.01 && oiChange < -0.05) signal = 'SHORT_COVERING';
  return { signal, priceChange: (priceChange * 100).toFixed(2) + '%', oiChange: (oiChange * 100).toFixed(2) + '%' };
}
