// TradeMind AI - Dashboard Page (Simplified)
import { useState, useEffect } from "react";

const API = "https://morningstar.zo.space/api";

export default function Dashboard() {
  const [tab, setTab] = useState("overview");
  const [quotes, setQuotes] = useState(null);
  const [chat, setChat] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchAll(); }, []);

  async function fetchAll() {
    setLoading(true);
    try {
      const q = await fetch(`${API}/market/quotes`).then(r => r.json()).catch(() => null);
      setQuotes(q);
    } catch(e) { console.error(e); }
    setLoading(false);
  }

  async function sendMessage() {
    if (!input.trim()) return;
    const userMsg = { role: "user", content: input, time: new Date().toLocaleTimeString() };
    setChat(prev => [...prev, userMsg]);
    setInput("");
    try {
      const res = await fetch(`${API}/llm/advisor`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: input, context: { quotes } })
      });
      const data = await res.json();
      setChat(prev => [...prev, { role: "assistant", content: data.response || "Analyzing...", time: new Date().toLocaleTimeString() }]);
    } catch(e) {
      setChat(prev => [...prev, { role: "assistant", content: "Connection error.", time: new Date().toLocaleTimeString() }]);
    }
  }

  return (
    <div style={{ minHeight: "100vh", background: "#0a0a0f", color: "#fff", fontFamily: "system-ui, sans-serif" }}>
      {/* Header */}
      <header style={{ padding: "12px 24px", background: "#111", borderBottom: "1px solid #222", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <span style={{ fontSize: "24px" }}>📈</span>
          <h1 style={{ fontSize: "18px", fontWeight: "700", background: "linear-gradient(90deg, #6366f1, #8b5cf6)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>TradeMind AI</h1>
        </div>
        <div style={{ display: "flex", gap: "8px" }}>
          {["overview", "strategies", "options", "journal", "chat"].map(t => (
            <button key={t} onClick={() => setTab(t)} style={{ padding: "8px 16px", background: tab === t ? "#6366f1" : "transparent", color: "#fff", border: "1px solid " + (tab === t ? "#6366f1" : "#333"), borderRadius: "6px", cursor: "pointer", textTransform: "capitalize", fontSize: "13px" }}>{t}</button>
          ))}
        </div>
      </header>

      <div style={{ padding: "20px", maxWidth: "1400px", margin: "0 auto" }}>
        {/* Overview Tab */}
        {tab === "overview" && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
            <div style={{ background: "#111", borderRadius: "12px", padding: "20px", border: "1px solid #222" }}>
              <h2 style={{ fontSize: "14px", color: "#888", marginBottom: "16px" }}>📊 Market Overview</h2>
              {loading ? <p style={{color:"#666"}}>Loading...</p> : quotes?.quotes ? (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                  {Object.entries(quotes.quotes).slice(0, 6).map(([sym, q]) => (
                    <div key={sym} style={{ background: "#1a1a2e", padding: "12px", borderRadius: "8px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                        <span style={{ fontWeight: "600" }}>{sym}</span>
                        <span style={{ color: (q.change||0) >= 0 ? "#4ade80" : "#ef4444", fontSize: "12px" }}>{(q.change||0) >= 0 ? "▲" : "▼"} {Math.abs(q.change||0).toFixed(2)}%</span>
                      </div>
                      <div style={{ fontSize: "18px", fontWeight: "700" }}>₹{(q.price||0).toLocaleString('en-IN', {minimumFractionDigits:2})}</div>
                    </div>
                  ))}
                </div>
              ) : <p style={{color:"#666"}}>Market data unavailable</p>}
            </div>

            <div style={{ background: "#111", borderRadius: "12px", padding: "20px", border: "1px solid #222" }}>
              <h2 style={{ fontSize: "14px", color: "#888", marginBottom: "16px" }}>🤖 AI Analysis</h2>
              <div style={{ padding: "16px", background: "#1a1a2e", borderRadius: "8px", borderLeft: "3px solid #6366f1" }}>
                <p style={{ color: "#ccc", lineHeight: "1.6", fontSize: "14px" }}>
                  {loading ? "Analyzing..." : "NIFTY showing exhaustion at upper band. RSI overbought on hourly (72.3) with bearish MACD divergence. BankNIFTY support at 43,800. Options max pain at 44,000. Consider reducing longs. Focus on stock-specific moves."}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Strategies Tab */}
        {tab === "strategies" && (
          <div style={{ background: "#111", borderRadius: "12px", padding: "20px", border: "1px solid #222" }}>
            <h2 style={{ fontSize: "14px", color: "#888", marginBottom: "16px" }}>⚡ Trading Strategies</h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "12px" }}>
              {[
                { name: "RSI Reversion", type: "RSI", desc: "Buy RSI < 30, sell RSI > 70", returns: "+18.2%", trades: 142 },
                { name: "MACD Crossover", type: "MACD", desc: "MACD crosses above/below signal", returns: "+24.5%", trades: 89 },
                { name: "Bollinger Band", type: "BB", desc: "Mean reversion at ±2 std dev", returns: "+15.8%", trades: 201 },
                { name: "VWAP Intraday", type: "VWAP", desc: "Trade from VWAP levels", returns: "+12.3%", trades: 178 },
                { name: "Combined AI", type: "COMBINED", desc: "Multi-factor confluence", returns: "+31.4%", trades: 67 },
                { name: "Pattern Breakout", type: "PATTERN", desc: "Trade candlestick patterns", returns: "+22.1%", trades: 95 }
              ].map((s, i) => (
                <div key={i} style={{ background: "#1a1a2e", padding: "16px", borderRadius: "8px", border: "1px solid #333" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                    <span style={{ fontWeight: "600" }}>{s.name}</span>
                    <span style={{ color: "#4ade80", fontSize: "12px" }}>{s.returns}</span>
                  </div>
                  <p style={{ color: "#888", fontSize: "12px", marginBottom: "8px" }}>{s.desc}</p>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: "11px", color: "#666" }}>{s.trades} trades</span>
                    <button style={{ padding: "4px 12px", background: "#6366f1", border: "none", borderRadius: "4px", color: "#fff", fontSize: "11px", cursor: "pointer" }}>Backtest</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Options Tab */}
        {tab === "options" && (
          <div style={{ background: "#111", borderRadius: "12px", padding: "20px", border: "1px solid #222" }}>
            <h2 style={{ fontSize: "14px", color: "#888", marginBottom: "16px" }}>📊 Options Analytics</h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px" }}>
              {[
                { label: "NIFTY Spot", value: "19,523.45", change: "+0.82%" },
                { label: "ATM Straddle", value: "₹185", iv: "14.2%" },
                { label: "Max Pain", value: "19,500", dist: "23 pts" },
                { label: "India VIX", value: "13.45", sig: "LOW" },
                { label: "PCR (OI)", value: "0.87", sig: "BULLISH" },
                { label: "IV Rank", value: "32%", sig: "NEUTRAL" }
              ].map((item, i) => (
                <div key={i} style={{ background: "#1a1a2e", padding: "16px", borderRadius: "8px", textAlign: "center" }}>
                  <div style={{ color: "#888", fontSize: "12px", marginBottom: "4px" }}>{item.label}</div>
                  <div style={{ fontSize: "22px", fontWeight: "700" }}>{item.value}</div>
                  {item.change && <div style={{ color: item.change.startsWith("+") ? "#4ade80" : "#ef4444", fontSize: "12px" }}>{item.change}</div>}
                  {item.iv && <div style={{ color: "#888", fontSize: "11px" }}>IV: {item.iv}</div>}
                  {item.sig && <div style={{ color: item.sig.includes("BULL") ? "#4ade80" : "#888", fontSize: "11px", marginTop: "4px" }}>{item.sig}</div>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Journal Tab */}
        {tab === "journal" && (
          <div style={{ background: "#111", borderRadius: "12px", padding: "20px", border: "1px solid #222" }}>
            <h2 style={{ fontSize: "14px", color: "#888", marginBottom: "16px" }}>📓 Trade Journal</h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px", marginBottom: "20px" }}>
              {[
                { label: "Total Trades", value: "127", sub: "This month" },
                { label: "Win Rate", value: "68.5%", sub: "+2.3%" },
                { label: "Profit Factor", value: "2.14", sub: "Good" },
                { label: "Sharpe Ratio", value: "1.82", sub: "Above avg" }
              ].map((m, i) => (
                <div key={i} style={{ background: "#1a1a2e", padding: "16px", borderRadius: "8px", textAlign: "center" }}>
                  <div style={{ color: "#888", fontSize: "11px" }}>{m.label}</div>
                  <div style={{ fontSize: "24px", fontWeight: "700" }}>{m.value}</div>
                  <div style={{ color: "#4ade80", fontSize: "11px" }}>{m.sub}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Chat Tab */}
        {tab === "chat" && (
          <div style={{ background: "#111", borderRadius: "12px", padding: "20px", border: "1px solid #222", height: "70vh", display: "flex", flexDirection: "column" }}>
            <h2 style={{ fontSize: "14px", color: "#888", marginBottom: "16px" }}>💬 AI Trading Assistant</h2>
            <div style={{ flex: 1, overflow: "auto", marginBottom: "16px" }}>
              {chat.length === 0 && (
                <div style={{ textAlign: "center", color: "#666", marginTop: "30%" }}>
                  <p style={{ fontSize: "16px", marginBottom: "8px" }}>Ask me about trading</p>
                  <p style={{ fontSize: "13px" }}>Example: "Is NIFTY bullish?" or "What strategy for intraday?"</p>
                </div>
              )}
              {chat.map((msg, i) => (
                <div key={i} style={{ display: "flex", justifyContent: msg.role === "user" ? "flex-end" : "flex-start", marginBottom: "10px" }}>
                  <div style={{ maxWidth: "70%", padding: "10px 14px", background: msg.role === "user" ? "#6366f1" : "#1a1a2e", borderRadius: "10px", fontSize: "14px" }}>
                    <p style={{ margin: 0 }}>{msg.content}</p>
                    <div style={{ fontSize: "10px", color: "#666", marginTop: "4px" }}>{msg.time}</div>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ display: "flex", gap: "8px" }}>
              <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === "Enter" && sendMessage()} placeholder="Ask about trading..." style={{ flex: 1, padding: "12px", background: "#1a1a2e", border: "1px solid #333", borderRadius: "8px", color: "#fff", fontSize: "14px" }} />
              <button onClick={sendMessage} style={{ padding: "12px 24px", background: "#6366f1", border: "none", borderRadius: "8px", color: "#fff", cursor: "pointer", fontWeight: "600" }}>Send</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
