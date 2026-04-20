// TradeMind - LLM-Powered Accuracy Engine v4
// Uses LLM decision logic for improved signal quality

async function fetchOHLCV(symbol, start, end, interval) {
  const yfSymbol = symbol.includes(".")