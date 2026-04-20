// TradeMind AI - Content Script (Floating Panel)
(function() {
  const panel = document.createElement('div');
  panel.id = 'trademind-float';
  panel.innerHTML = `<div class="tm-hdr"><span>🤖 TradeMind</span><button id="tm-toggle">−</button></div>
  <div class="tm-body">
    <div class="tm-acc"><span id="tm-acc-val">--</span><small>% accuracy</small></div>
    <div id="tm-sigs">Loading...</div>
    <button id="tm-trade" class="tm-btn">Trade INFY</button>
  </div>`;
  
  const sty = document.createElement('style');
  sty.textContent = `#trademind-float{position:fixed;bottom:20px;right:20px;z-index:99999;width:280px;background:#0f172a;border:1px solid #334155;border-radius:12px;font-family:system-ui,sans-serif;box-shadow:0 20px 60px rgba(0,0,0,.5);color:#fff}
  #trademind-float.collapsed .tm-body{display:none}#trademind-float.collapsed #tm-toggle{content:'+'}
  .tm-hdr{background:#1e293b;padding:12px 16px;border-radius:12px 12px 0 0;display:flex;justify-content:space-between;align-items:center;font-weight:600;font-size:14px}
  .tm-hdr button{background:none;border:none;color:#94a3b8;font-size:20px;cursor:pointer;padding:0;width:24px;height:24px}
  .tm-body{padding:16px}.tm-acc{text-align:center;margin-bottom:12px}.tm-acc span{font-size:36px;font-weight:700;color:#22c55e}.tm-acc small{display:block;color:#64748b;font-size:11px}
  #tm-sigs{max-height:200px;overflow-y:auto}.tm-sig{padding:8px;margin:6px 0;background:#1e293b;border-radius:6px;font-size:12px;display:flex;justify-content:space-between;align-items:center}
  .tm-sig-buy{border-left:3px solid #22c55e}.tm-sig-sell{border-left:3px solid #ef4444}
  .tm-pnl{font-weight:600}.tm-pnl.pos{color:#22c55e}.tm-pnl.neg{color:#ef4444}
  .tm-btn{width:100%;padding:10px;background:#22c55e;border:none;border-radius:8px;color:#fff;font-weight:600;cursor:pointer;margin-top:8px}
  .tm-btn:hover{background:#16a34a}`;
  document.head.appendChild(sty);
  document.body.appendChild(panel);
  
  document.getElementById('tm-toggle').onclick = () => panel.classList.toggle('collapsed');
  document.getElementById('tm-trade').onclick = () => chrome.runtime.sendMessage({type:'TRADE',symbol:'INFY',signal:'BUY',qty:5}, r=>alert('Order: '+(r.orderId||r.error||'OK')));
  
  chrome.runtime.sendMessage({type:'GET_DATA'}, r => {
    if(r && r.accuracy) {
      const acc = r.accuracy.accuracy || 0;
      document.getElementById('tm-acc-val').textContent = acc.toFixed(1);
      document.getElementById('tm-acc-val').style.color = acc>=85?'#22c55e':acc>=60?'#eab308':'#ef4444';
    }
    if(r && r.signals && r.signals.length) {
      document.getElementById('tm-sigs').innerHTML = r.signals.slice(0,5).map(s => 
        `<div class="tm-sig tm-sig-${s.signal.toLowerCase()}"><span>${s.signal} ${s.symbol}</span><span class="tm-pnl ${s.win?'pos':'neg'}">${s.win?'+':''}${s.pnlPct?.toFixed(1)}%</span></div>`
      ).join('');
    }
  });
})();