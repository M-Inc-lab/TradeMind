// TradeMind - All Strategies Index
import INTRADAY from './intraday.js';
import SWING from './swing.js';
import OPTIONS from './options.js';
import MOMENTUM from './momentum.js';
import ADVANCED from './advanced.js';

export const ALL_STRATEGIES = {
  ...INTRADAY,
  ...SWING,
  ...OPTIONS,
  ...MOMENTUM,
  ...ADVANCED
};

export const STRATEGY_CATEGORIES = {
  intraday: Object.keys(INTRADAY),
  swing: Object.keys(SWING),
  options: Object.keys(OPTIONS),
  momentum: Object.keys(MOMENTUM),
  advanced: Object.keys(ADVANCED)
};

export const STRATEGY_COUNT = Object.keys(ALL_STRATEGIES).length;

export default ALL_STRATEGIES;
