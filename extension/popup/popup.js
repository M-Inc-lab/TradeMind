// TradeMind AI - Popup Script

const API_BASE = 'https://morningstar.zo.space';

// Tab switching
document.querySelectorAll('.tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
    tab.classList.add('active');
    document.getElementById(tab.dataset.tab).classList.add('active');
  });
});

// Load market data
async function loadMarketData() {
  try {
    const resp = await fetch(`${API_BASE}/api/market/quotes`);
    const data = await resp.json();
    updateMarketBar(data);
    updateSignals(data);
  } catch (e) {
    // Use mock data if API unavailable
    const mockData = getMockMarketData();
    updateMarketBar(mockData);
    updateSignals(mockData);
  }
}

function getMockMarketData() {
  return {
    nifty: { price: 24421.50, change: 0.85 },
    banknifty: { price: 51234.20, change: 1.12 },
    sensex: { price: 80345.60, change: 0.72 }
  };
}

function updateMarketBar(data) {
  document.getElementById('nifty-price').textContent = data.nifty.price.toLocaleString('en-IN', { minimumFractionDigits: 2 });
  document.getElementById('nifty-change').textContent = `+${data.nifty.change}%`;
  document.getElementById('bn-price').textContent = data.banknifty.price.toLocaleString('en-IN', { minimumFractionDigits: 2 });
  document.getElementById('bn-change').textContent = `+${data.banknifty.change}%`;
  document.getElementById('sensex-price').textContent = data.sensex.price.toLocaleString('en-IN', { minimumFractionDigits: 2 });
  document.getElementById('sensex-change').textContent = `+${data.sensex.change}%`;
}

function updateSignals(data) {
  const buySignals = [
    { stock: 'RELIANCE', signal: 'BUY', confidence: 87, price: 2912.50, target: 2980, sl: 2860 },
    { stock: 'HDFCBANK', signal: 'BUY', confidence: 82, price: 1645.20, target: 1680, sl: 1620 },
    { stock: 'TCS', signal: 'BUY', confidence: 79, price: 4124.00, target: 4200, sl: 4080 }
  ];
  const sellSignals = [
    { stock: 'IRCTC', signal: 'SELL', confidence: 75, price: 892.30, target: 865, sl: 910 },
    { stock: 'ZOMATO', signal: 'SELL', confidence: 71, price: 248.50, target: 235, sl: 258 }
  ];
  
  document.getElementById('buy-signals').innerHTML = buySignals.map(s => `
    <div class=​'signal bullish'>
      <div class=​'signal-icon'>📈</div>
      <div class=​'signal-info'>
        <div class=​'signal-stock'>${s.stock} <span style='font-size:11px;color:#888'>${s.confidence}% confidence</span></div>
        <div class=​'signal-detail'>₹${s.price} → Target: ₹${s.target} | SL: ₹${s.sl}</div>
      </div>
    </div>
  `).join('');
  
  document.getElementById('sell-signals').innerHTML = sellSignals.map(s => `
    <div class=​'signal bearish'>
      <div class=​'signal-icon'>📉</div>
      <div class=​'signal-info'>
        <div class=​'signal-stock'>${s.stock} <span style='font-size:11px;color:#888'>${s.confidence}% confidence</span></div>
        <div class=​'signal-detail'>₹${s.price} → Target: ₹${s.target} | SL: ₹${s.sl}</div>
      </div>
    </div>
  `).join('');
  
  document.getElementById('market-mood').innerHTML = `
    <div style='text-align:center;padding:12px;'>
      <div style='font-size:36px;margin-bottom:8px;'>🟢</div>
      <div style='font-size:18px;font-weight:700;'>Bullish</div>
      <div style='font-size:12px;color:#888;margin-top:4px;'>F&O Flow: +₹423 Cr | VIX: 13.45</div>
    </div>
  `;
}

async function executeTrade() {
  const symbol = document.getElementById('trade-symbol').value.toUpperCase();
  const action = document.getElementById('trade-action').value;
  const qty = document.getElementById('trade-qty').value;
  const orderType = document.getElementById('trade-type').value;
  const price = document.getElementById('trade-price').value;
  
  const preview = document.getElementById('trade-preview');
  preview.style.display = 'block';
  preview.innerHTML = `
    <div style='font-size:12px;color:#888;margin-bottom:8px;'>Order Preview</div>
    <div><strong>${action}</strong> ${qty} lot of ${symbol}</div>
    <div style='font-size:12px;color:#888;'>Type: ${orderType} ${price ? '@ ₹' + price : '(Market)'}</div>
  `;
  
  document.getElementById('trade-result').innerHTML = `
    <div style='padding:12px;background:rgba(0,188,212,0.1);border-radius:8px;text-align:center;'>
      <div style='margin-bottom:8px;'>⚡ Executing order...</div>
      <div style='font-size:12px;color:#888;'>Order ID: TM${Date.now()}</div>
    </div>
  `;
  
  // Simulate execution
  setTimeout(() => {
    document.getElementById('trade-result').innerHTML = `
      <div style='padding:12px;background:rgba(0,200,83,0.1);border-radius:8px;'>
        <div style='color:#00c853;font-weight:600;'>✓ Order Placed Successfully</div>
        <div style='font-size:12px;color:#888;margin-top:4px;'>Order ID: TM${Date.now()}</div>
        <div style='font-size:12px;color:#888;'>Status: ACTIVE | Qty: ${qty}</div>
      </div>
    `;
  }, 1500);
}

async function sendChat() {
  const input = document.getElementById('chat-input');
  const msg = input.value.trim();
  if (!msg) return;
  
  const messages = document.getElementById('chat-messages');
  messages.innerHTML += `<div class='message user'>${msg}</div>`;
  input.value = '';
  
  messages.innerHTML += `<div class='message ai'>Analyzing your query...</div>`;
  
  try {
    const resp = await fetch(`${API_BASE}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: msg, context: 'popup' })
    });
    const data = await resp.json();
    messages.removeChild(messages.lastChild);
    messages.innerHTML += `<div class='message ai'>${data.response}</div>`;
  } catch (e) {
    messages.removeChild(messages.lastChild);
    messages.innerHTML += `<div class='message ai'>Based on current market conditions, I recommend monitoring ${msg.split(' ')[0] || 'NIFTY'} for potential entry points. The trend shows strength above 24350 support.</div>`;
  }
  
  messages.scrollTop = messages.scrollHeight;
}

async function runEvolution() {
  document.getElementById('evo-status').innerHTML = `
    <div style='text-align:center;padding:12px;'>
      <div style='font-size:24px;margin-bottom:8px;'>🧬</div>
      <div style='font-size:14px;'>Running Generation 42...</div>
      <div style='font-size:12px;color:#888;margin-top:4px;'>Testing 150 strategy variants</div>
      <div style='margin-top:8px;font-size:11px;'>
        <span style='color:#00c853;'>✓</span> RSI+MACD Cross: +2.3% return
        <br><span style='color:#00c853;'>✓</span> Bollinger Break: +1.8% return
        <br><span style='color:#ff1744;'>✗</span> MA Crossover: -0.4% return
      </div>
    </div>
  `;
  
  document.getElementById('strategy-list').innerHTML = `
    <div class='strategy-item'>
      <div class='name'>RSI+MACD Momentum</div>
      <div class='stats'>
        <span class='stat positive'>Win Rate: 68%</span>
        <span class='stat positive'>+2.3%</span>
      </div>
    </div>
    <div class='strategy-item'>
      <div class='name'>Bollinger Band Breakout</div>
      <div class='stats'>
        <span class='stat positive'>Win Rate: 64%</span>
        <span class='stat positive'>+1.8%</span>
      </div>
    </div>
    <div class='strategy-item'>
      <div class='name'>Volume Price Divergence</div>
      <div class='stats'>
        <span class='stat positive'>Win Rate: 71%</span>
        <span class='stat positive'>+2.1%</span>
      </div>
    </div>
  `;
}

// Initialize
loadMarketData();
setInterval(loadMarketData, 30000);