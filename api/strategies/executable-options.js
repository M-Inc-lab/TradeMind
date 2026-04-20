// TradeMind - Options Strategies with Greeks
// Black-Scholes pricing, Greeks, IV calculations

export function blackScholesCall(S, K, T, r, sigma) {
  if (T <= 0) return Math.max(0, S - K);
  const d1 = (Math.log(S / K) + (r + sigma * sigma / 2) * T) / (sigma * Math.sqrt(T));
  const d2 = d1 - sigma * Math.sqrt(T);
  return S * normCDF(d1) - K * Math.exp(-r * T) * normCDF(d2);
}

export function blackScholesPut(S, K, T, r, sigma) {
  if (T <= 0) return Math.max(0, K - S);
  const d1 = (Math.log(S / K) + (r + sigma * sigma / 2) * T) / (sigma * Math.sqrt(T));
  const d2 = d1 - sigma * Math.sqrt(T);
  return K * Math.exp(-r * T) * normCDF(-d2) - S * normCDF(-d1);
}

function normCDF(x) {
  const a1 = 0.254829592, a2 = -0.284496736, a3 = 1.421413741, a4 = -1.453152027, a5 = 1.061405429, p = 0.3275911;
  const sign = x < 0 ? -1 : 1;
  x = Math.abs(x) / Math.sqrt(2);
  const t = 1 / (1 + p * x);
  return 0.5 * (1 + sign * (1 - Math.exp(-x * x) * (a1 * t + a2 * t * t + a3 * t * t * t + a4 * t * t * t * t + a5 * t * t * t * t * t)));
}

// Greeks calculations
export function calcGreeks(S, K, T, r, sigma, type = 'call') {
  if (T <= 0) return { delta: type === 'call' ? (S > K ? 1 : 0) : (S < K ? -1 : 0), gamma: 0, theta: 0, vega: 0, rho: 0 };
  const d1 = (Math.log(S / K) + (r + sigma * sigma / 2) * T) / (sigma * Math.sqrt(T));
  const d2 = d1 - sigma * Math.sqrt(T);
  const delta = type === 'call' ? normCDF(d1) : normCDF(d1) - 1;
  const gamma = normCDF(d1) / (S * sigma * Math.sqrt(T));
  const theta = -(S * normCDF(d1) * sigma) / (2 * Math.sqrt(T)) - r * K * Math.exp(-r * T) * (type === 'call' ? normCDF(d2) : normCDF(-d2));
  const vega = S * Math.sqrt(T) * normCDF(d1) / 100;
  const rho = type === 'call' ? K * T * Math.exp(-r * T) * normCDF(d2) / 100 : -K * T * Math.exp(-r * T) * normCDF(-d2) / 100;
  return { delta, gamma, theta: theta / 365, vega, rho };
}

// Implied Volatility (Newton-Raphson)
export function calcIV(marketPrice, S, K, T, r, type = 'call') {
  let sigma = 0.3, tolerance = 0.0001;
  for (let i = 0; i < 100; i++) {
    const price = type === 'call' ? blackScholesCall(S, K, T, r, sigma) : blackScholesPut(S, K, T, r, sigma);
    const diff = price - marketPrice;
    if (Math.abs(diff) < tolerance) break;
    const greeks = calcGreeks(S, K, T, r, sigma, type);
    sigma -= diff / (greeks.vega * 100);
    sigma = Math.max(0.01, Math.min(5, sigma));
  }
  return sigma;
}

// Options strategies
export const IronCondor = {
  name: 'Iron Condor', type: 'options',
  params: { width: 5, wings: 2, deltaTarget: 0.30 },
  
  analyze(spotPrice, iv, daysToExpiry, riskFreeRate = 0.065) {
    const T = daysToExpiry / 365;
    const atmStrike = Math.round(spotPrice / 100) * 100;
    const wingWidth = this.params.wings * 100;
    
    const strikes = {
      putLong: atmStrike - wingWidth - this.params.width * 10,
      putShort: atmStrike - wingWidth,
      callShort: atmStrike + wingWidth,
      callLong: atmStrike + wingWidth + this.params.width * 10
    };
    
    const premiums = {
      putLong: blackScholesPut(strikes.putLong, strikes.putLong, T, riskFreeRate, iv) * 100,
      putShort: blackScholesPut(strikes.putShort, strikes.putShort, T, riskFreeRate, iv) * 100,
      callShort: blackScholesCall(strikes.callShort, strikes.callShort, T, riskFreeRate, iv) * 100,
      callLong: blackScholesCall(strikes.callLong, strikes.callLong, T, riskFreeRate, iv) * 100
    };
    
    const netPremium = premiums.putShort + premiums.callShort - premiums.putLong - premiums.callLong;
    const maxProfit = netPremium;
    const maxLoss = (wingWidth - this.params.width * 10) * 100 - netPremium;
    const breakeven = [strikes.putShort - netPremium / 100, strikes.callShort + netPremium / 100];
    
    return {
      strikes, premiums, netPremium, maxProfit, maxLoss, breakeven,
      riskReward: Math.abs(maxProfit / maxLoss),
      probProfit: 1 - 2 * this.params.deltaTarget
    };
  }
};

export const LongStraddle = {
  name: 'Long Straddle', type: 'options',
  params: { impliedMovePct: 5 },
  
  analyze(spotPrice, iv, daysToExpiry, riskFreeRate = 0.065) {
    const T = daysToExpiry / 365;
    const atmStrike = Math.round(spotPrice / 100) * 100;
    
    const callPrem = blackScholesCall(spotPrice, atmStrike, T, riskFreeRate, iv) * 100;
    const putPrem = blackScholesPut(spotPrice, atmStrike, T, riskFreeRate, iv) * 100;
    const totalPrem = callPrem + putPrem;
    
    const breakevenUp = atmStrike + totalPrem;
    const breakevenDown = atmStrike - totalPrem;
    const moveNeeded = (totalPrem / atmStrike) * 100;
    
    // Greeks
    const callGreeks = calcGreeks(spotPrice, atmStrike, T, riskFreeRate, iv, 'call');
    const putGreeks = calcGreeks(spotPrice, atmStrike, T, riskFreeRate, iv, 'put');
    
    return {
      strike: atmStrike, callPrem, putPrem, totalPrem,
      breakevenUp, breakevenDown, moveNeeded,
      delta: callGreeks.delta + putGreeks.delta,
      gamma: callGreeks.gamma + putGreeks.gamma,
      theta: callGreeks.theta + putGreeks.theta,
      vega: callGreeks.vega + putGreeks.vega,
      maxProfit: 'Unlimited',
      maxLoss: totalPrem
    };
  }
};

export const BullCallSpread = {
  name: 'Bull Call Spread', type: 'options',
  analyze(spotPrice, iv, daysToExpiry, riskFreeRate = 0.065) {
    const T = daysToExpiry / 365;
    const otmStrike = Math.round(spotPrice * 1.02 / 100) * 100;
    const itmStrike = otmStrike - (otmStrike * 0.05);
    
    const longCall = blackScholesCall(spotPrice, itmStrike, T, riskFreeRate, iv) * 100;
    const shortCall = blackScholesCall(spotPrice, otmStrike, T, riskFreeRate, iv) * 100;
    const netPrem = longCall - shortCall;
    
    const maxProfit = (otmStrike - itmStrike) * 100 - netPrem;
    const maxLoss = netPrem;
    const breakeven = itmStrike + netPrem / 100;
    
    return { itmStrike, otmStrike, longCall, shortCall, netPrem, maxProfit, maxLoss, breakeven, riskReward: Math.abs(maxProfit / maxLoss) };
  }
};
