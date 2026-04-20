// TradeMind AI - Background Service Worker
const API = 'https://morningstar.zo.space/api';
const DHAN_TOKEN = 'eyJhbGciOiJIUzUxMiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbkNvbnN1bWVyVHlwZSI6IlNFTEYiLCJwYXJ0bmVySWQiOiIiLCJkaGFuQ2xpZW50SWQiOiIyNjA0MTcyMzkxIiwid2ViaG9va1VybCI6IiIsImlzcyI6ImRoYW4iLCJleHAiOjE3Nzg5OTA0MTZ9.z8f_JNrHuX0vFyCSTikbQf7zdoHWhzDPxL5VHQNn0eiJKKQWUNdxUtasmf-hfE5ouwEPTEBf4UoT-Q1gDI-x-w';

let cache = { signals: [], accuracy: null, lastFetch: 0 };

chrome.runtime.onMessage.addListener((msg, _, reply) => {
  if (msg.type === 'GET_DATA') reply(cache);
  if (msg.type === 'REFRESH') refreshData().then(reply);
  if (msg.type === 'TRADE') placeOrder(msg.symbol, msg.signal, msg.qty).then(reply);
  return true;
});

async function refreshData() {
  try {
    const res = await fetch(`${API}/backtest/llm-accuracy?symbols=RELIANCE,INFY,TCS&start=2024-01-01&end=2025-04-01`);
    const data = await res.json();
    cache = { signals: data.recentTrades || [], accuracy: data.summary || {}, lastFetch: Date.now() };
    chrome.runtime.sendMessage({ type: 'DATA_UPDATED', data: cache });
    return { success: true, ...cache };
  } catch(e) { return { success: false, error: e.message }; }
}

async function placeOrder(symbol, signal, qty) {
  try {
    const res = await fetch(`${API}/dhan/papertrade?symbol=${symbol}&signal=${signal}&quantity=${qty}`, { method: 'POST' });
    return await res.json();
  } catch(e) { return { error: e.message }; }
}

setInterval(refreshData, 60000);
refreshData();
console.log('TradeMind AI: Background service active');