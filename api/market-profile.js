// TradeMind AI - Market Profile & VWAP Engine
// POC, Value Area, Volume Profile, TPO Analysis

export class MarketProfile {
  constructor() {
    this.tpoProfiles = new Map();
  }

  // Calculate VWAP with standard deviations
  calculateVWAP(candles, anchorDate = null) {
    let cumulativeTPV = 0, cumulativeVol = 0;
    for (const c of candles) {
      const typical = (c.high + c.low + c.close) / 3;
      cumulativeTPV += typical * c.volume;
      cumulativeVol += c.volume;
    }
    const vwap = cumulativeVol > 0 ? cumulativeTPV / cumulativeVol : 0;

    // Calculate standard deviation for bands
    let squaredDiff = 0;
    for (const c of candles) {
      const typical = (c.high + c.low + c.close) / 3;
      squaredDiff += Math.pow(typical - vwap, 2) * c.volume;
    }
    const stdDev = Math.sqrt(squaredDiff / cumulativeVol) || 0;

    return {
      vwap,
      upper1: vwap + stdDev,
      lower1: vwap - stdDev,
      upper2: vwap + 2 * stdDev,
      lower2: vwap - 2 * stdDev,
      stdDev
    };
  }

  // Volume Profile with POC
  calculateVolumeProfile(candles, buckets = 20) {
    if (candles.length === 0) return null;
    
    const min = Math.min(...candles.map(c => c.low));
    const max = Math.max(...candles.map(c => c.high));
    const bucketSize = (max - min) / buckets || 1;
    
    const profile = Array(buckets).fill(0);
    for (const c of candles) {
      for (let p = c.low; p < c.high; p += bucketSize) {
        const idx = Math.min(Math.floor((p - min) / bucketSize), buckets - 1);
        profile[idx] += c.volume;
      }
    }
    
    const totalVol = profile.reduce((a, b) => a + b, 0);
    const pocIdx = profile.indexOf(Math.max(...profile));
    const poc = min + (pocIdx + 0.5) * bucketSize;

    // Value Area (70% of volume)
    let cumVol = 0, vaStart = pocIdx, vaEnd = pocIdx;
    while (cumVol < totalVol * 0.35 && vaStart > 0) vaStart--;
    while (cumVol < totalVol * 0.35 && vaEnd < buckets - 1) vaEnd++;
    while (vaStart > 0 && cumVol < totalVol * 0.70) vaStart--;
    while (vaEnd < buckets - 1 && cumVol < totalVol * 0.70) vaEnd++;
    
    return {
      profile,
      poc,
      valueAreaHigh: min + (vaEnd + 1) * bucketSize,
      valueAreaLow: min + vaStart * bucketSize,
      pointOfControl: poc,
      totalVolume: totalVol,
      bucketSize
    };
  }

  // Session VWAP (Intraday)
  calculateSessionVWAP(ticks) {
    let cumTPV = 0, cumVol = 0;
    for (const t of ticks) {
      cumTPV += t.price * t.volume;
      cumVol += t.volume;
    }
    return cumVol > 0 ? cumTPV / cumVol : 0;
  }

  // Identify sessions (pre-market, regular, post-market)
  identifySessions(candles) {
    const sessions = { pre: [], regular: [], post: [] };
    for (const c of candles) {
      const hour = new Date(c.date).getUTCHours() + 5.5; // IST
      if (hour < 9.15) sessions.pre.push(c);
      else if (hour >= 9.15 && hour < 15.30) sessions.regular.push(c);
      else sessions.post.push(c);
    }
    return sessions;
  }
}

export const marketProfile = new MarketProfile();
