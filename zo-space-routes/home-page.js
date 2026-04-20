// TradeMind AI - Home Page Route
// Main dashboard with market overview, AI chat, and portfolio

import { useState } from "react";

export default function Home() {
  const [chatInput, setChatInput] = useState("");
  const [messages, setMessages] = useState([
    { role: "assistant", content: "Namaste! I'm TradeMind AI. How can I help you with trading today? Ask me about stocks, strategies, or request a trade analysis." }
  ]);
  const [loading, setLoading] = useState(false);

  const handleChat = async (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    
    const userMsg = { role: "user", content: chatInput };
    setMessages(prev => [...prev, userMsg]);
    setChatInput("");
    setLoading(true);
    
    try {
      const resp = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: chatInput, user: "morningstar" })
      });
      const data = await resp.json();
      setMessages(prev => [...prev, { role: "assistant", content: data.response }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: "assistant", content: "Sorry, I encountered an error. Please try again." }]);
    }
    setLoading(false);
  };

  return (
    <div style={{ minHeight: "100vh", background: "#0a0a14", color: "#fff", padding: "20px" }}>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <span style={{ fontSize: "32px" }}>📈</span>
          <div>
            <h1 style={{ fontSize: "24px", fontWeight: "bold" }}>TradeMind AI</h1>
            <p style={{ color: "#888", fontSize: "12px" }}>Indian Market Intelligence</p>
          </div>
        </div>
        <div style={{ display: "flex", gap: "8px" }}>
          <span style={{ padding: "6px 12px", background: "#1a1a2e", borderRadius: "8px", fontSize: "12px" }}>🔴 NIFTY <span style={{ color: "#4ade80" }}>22,450 +0.45%</span></span>
          <span style={{ padding: "6px 12px", background: "#1a1a2e", borderRadius: "8px", fontSize: "12px" }}>🔴 BANK NIFTY <span style={{ color: "#4ade80" }}>48,120 +0.32%</span></span>
        </div>
      </header>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 380px", gap: "20px", height: "calc(100vh - 140px)" }}>
        {/* Main Panel */}
        <div style={{ background: "#12121c", borderRadius: "16px", padding: "20px", display: "flex", flexDirection: "column" }}>
          <h2 style={{ fontSize: "16px", marginBottom: "16px", color: "#888" }}>💬 Trading Assistant</h2>
          
          <div style={{ flex: 1, overflowY: "auto", marginBottom: "16px" }}>
            {messages.map((msg, i) => (
              <div key={i} style={{ 
                display: "flex", 
                justifyContent: msg.role === "user" ? "flex-end" : "flex-start",
                marginBottom: "12px"
              }}>
                <div style={{
                  maxWidth: "80%",
                  padding: "12px 16px",
                  borderRadius: "12px",
                  background: msg.role === "user" ? "#3b82f6" : "#1a1a2e",
                }}>
                  <p style={{ fontSize: "14px", lineHeight: "1.5" }}>{msg.content}</p>
                </div>
              </div>
            ))}
            {loading && <div style={{ padding: "12px", color: "#888" }}>Thinking...</div>}
          </div>

          <form onSubmit={handleChat} style={{ display: "flex", gap: "8px" }}>
            <input
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Ask about trading... e.g., 'Should I buy HDFC Bank at current price?'"
              style={{
                flex: 1,
                padding: "12px 16px",
                borderRadius: "12px",
                border: "1px solid #333",
                background: "#1a1a2e",
                color: "#fff",
                fontSize: "14px"
              }}
            />
            <button type="submit" style={{
              padding: "12px 24px",
              background: "#3b82f6",
              border: "none",
              borderRadius: "12px",
              color: "#fff",
              fontWeight: "bold",
              cursor: "pointer"
            }}>
              Send
            </button>
          </form>
        </div>

        {/* Side Panel */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {/* Quick Actions */}
          <div style={{ background: "#12121c", borderRadius: "16px", padding: "16px" }}>
            <h3 style={{ fontSize: "14px", marginBottom: "12px", color: "#888" }}>⚡ Quick Actions</h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
              {[
                { label: "Analyze Stock", icon: "🔍", prompt: "Analyze" },
                { label: "Options Setup", icon: "📊", prompt: "Options" },
                { label: "News Sentiment", icon: "📰", prompt: "News" },
                { label: "Build Strategy", icon: "🧬", prompt: "Strategy" }
              ].map(action => (
                <button key={action.label} onClick={() => setChatInput(action.prompt)} style={{
                  padding: "12px",
                  background: "#1a1a2e",
                  border: "1px solid #333",
                  borderRadius: "10px",
                  color: "#fff",
                  cursor: "pointer",
                  fontSize: "12px"
                }}>
                  <span style={{ fontSize: "18px" }}>{action.icon}</span>
                  <p style={{ marginTop: "4px" }}>{action.label}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Portfolio Summary */}
          <div style={{ background: "#12121c", borderRadius: "16px", padding: "16px" }}>
            <h3 style={{ fontSize: "14px", marginBottom: "12px", color: "#888" }}>💼 Portfolio</h3>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
              <span style={{ color: "#888", fontSize: "13px" }}>Total Value</span>
              <span style={{ fontWeight: "bold" }}>₹12,45,890</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
              <span style={{ color: "#888", fontSize: "13px" }}>Day P&L</span>
              <span style={{ color: "#4ade80", fontWeight: "bold" }}>+₹8,450 (+0.68%)</span>
            </div>
            <div style={{ height: "1px", background: "#333", margin: "12px 0" }}></div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "#888", fontSize: "13px" }}>Open Positions</span>
              <span style={{ fontWeight: "bold" }}>5</span>
            </div>
          </div>

          {/* Top Movers */}
          <div style={{ background: "#12121c", borderRadius: "16px", padding: "16px", flex: 1 }}>
            <h3 style={{ fontSize: "14px", marginBottom: "12px", color: "#888" }}>🚀 Top Gainers</h3>
            {["RELIANCE", "INFY", "TCS", "HDFCBANK", "ICICIBANK"].map((stock, i) => (
              <div key={stock} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #222" }}>
                <span style={{ fontSize: "13px" }}>{stock}</span>
                <span style={{ fontSize: "13px", color: "#4ade80" }}>+{(Math.random() * 5).toFixed(2)}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
