// TradeMind AI - Content Script
// Injects trading overlay onto trading platforms

(function() {
  // Prevent multiple injections
  if (window.tradeMindInjected) return;
  window.tradeMindInjected = true;

  // Configuration
  const API_BASE = "https://morningstar.zo.space";
  
  // Create overlay container
  function createOverlay() {
    const overlay = document.createElement("div");
    overlay.id = "trademind-overlay";
    overlay.innerHTML = getOverlayHTML();
    document.body.appendChild(overlay);
    
    // Initialize event handlers
    initializeOverlay();
  }

  function getOverlayHTML() {
    return `
      <div class="trademind-widget" id="trademind-widget">
        <div class="trademind-header">
          <div class="trademind-logo">
            <span class="logo-icon">📈</span>
            <span class="logo-text">TradeMind AI</span>
          </div>
          <div class="trademind-controls">
            <button class="btn-minimize" id="btn-minimize">−</button>
            <button class="btn-close" id="btn-close">×</button>
          </div>
        </div>
        
        <div class="trademind-market-bar">
          <div class="market-item" id="nifty-price">
            <span class="symbol">NIFTY</span>
            <span class="price">--</span>
            <span class="change">--</span>
          </div>
          <div class="market-item" id="banknifty-price">
            <span class="symbol">BANK</span>
            <span class="price">--</span>
            <span class="change">--</span>
          </div>
        </div>
        
        <div class="trademind-tabs">
          <button class="tab active" data-tab="dashboard">Dashboard</button>
          <button class="tab" data-tab="signals">Signals</button>
          <button class="tab" data-tab="portfolio">Portfolio</button>
          <button class="tab" data-tab="chat">AI Chat</button>
        </div>
        
        <div class="trademind-content">
          <!-- Dashboard Tab -->
          <div class="tab-content active" id="tab-dashboard">
            <div class="dashboard-grid">
              <div class="signal-card buy-signal">
                <div class="signal-header">
                  <span class="signal-icon">🟢</span>
                  <span class="signal-type">BUY SIGNAL</span>
                </div>
                <div class="signal-details">
                  <div class="stock-name">RELIANCE</div>
                  <div class="entry-price">Entry: ₹2,850</div>
                  <div class="target">Target: ₹2,920</div>
                  <div class="stop-loss">SL: ₹2,830</div>
                  <div class="confidence">Confidence: 78%</div>
                </div>
                <button class="btn-trade" onclick="executeSignal('BUY', 'RELIANCE')">Execute Trade</button>
              </div>
              
              <div class="signal-card sell-signal">
                <div class="signal-header">
                  <span class="signal-icon">🔴</span>
                  <span class="signal-type">SELL SIGNAL</span>
                </div>
                <div class="signal-details">
                  <div class="stock-name">BANKNIFTY</div>
                  <div class="entry-price">Entry: ₹55,200</div>
                  <div class="target">Target: ₹54,800</div>
                  <div class="stop-loss">SL: ₹55,400</div>
                  <div class="confidence">Confidence: 72%</div>
                </div>
                <button class="btn-trade" onclick="executeSignal('SELL', 'BANKNIFTY')">Execute Trade</button>
              </div>
            </div>
            
            <div class="ai-explanation">
              <div class="explanation-header">
                <span class="ai-icon">🤖</span>
                <span>AI Analysis</span>
              </div>
              <div class="explanation-text">
                <p>RELIANCE showing bullish momentum with RSI at 65 and MACD crossover. Volume is 2.5x average. Support at ₹2,830 providing good risk-reward ratio.</p>
                <button class="btn-learn-more">Learn More</button>
              </div>
            </div>
          </div>
          
          <!-- Signals Tab -->
          <div class="tab-content" id="tab-signals">
            <div class="signals-list">
              <div class="signal-item">
                <div class="signal-badge buy">BUY</div>
                <div class="signal-info">
                  <div class="stock">HDFCBANK</div>
                  <div class="price">₹1,680 | Target: ₹1,720 | SL: ₹1,660</div>
                </div>
                <div class="signal-score">82%</div>
              </div>
              <div class="signal-item">
                <div class="signal-badge sell">SELL</div>
                <div class="signal-info">
                  <div class="stock">TATASTEEL</div>
                  <div class="price">₹145 | Target: ₹140 | SL: ₹148</div>
                </div>
                <div class="signal-score">68%</div>
              </div>
              <div class="signal-item">
                <div class="signal-badge buy">BUY</div>
                <div class="signal-info">
                  <div class="stock">NIFTY</div>
                  <div class="price">₹23,800 | Target: ₹24,000 | SL: ₹23,650</div>
                </div>
                <div class="signal-score">75%</div>
              </div>
            </div>
          </div>
          
          <!-- Portfolio Tab -->
          <div class="tab-content" id="tab-portfolio">
            <div class="portfolio-summary">
              <div class="summary-item">
                <span class="label">Total Value</span>
                <span class="value">₹1,25,000</span>
              </div>
              <div class="summary-item profit">
                <span class="label">P&L</span>
                <span class="value">+₹3,450 (+2.8%)</span>
              </div>
            </div>
            
            <div class="positions-list">
              <div class="position-item">
                <div class="position-info">
                  <div class="stock">RELIANCE</div>
                  <div class="qty">Qty: 10</div>
                </div>
                <div class="position-pnl">
                  <div class="current">₹28,500</div>
                  <div class="pnl positive">+₹150</div>
                </div>
              </div>
              <div class="position-item">
                <div class="position-info">
                  <div class="stock">TCS</div>
                  <div class="qty">Qty: 5</div>
                </div>
                <div class="position-pnl">
                  <div class="current">₹22,500</div>
                  <div class="pnl positive">+₹320</div>
                </div>
              </div>
            </div>
          </div>
          
          <!-- Chat Tab -->
          <div class="tab-content" id="tab-chat">
            <div class="chat-container">
              <div class="chat-messages" id="chat-messages">
                <div class="message bot">
                  <div class="message-content">
                    Hello! I'm your AI trading assistant. Ask me about:
                    <ul>
                      <li>Stock analysis and signals</li>
                      <li>Trading strategies</li>
                      <li>Market sentiment</li>
                      <li>Risk management</li>
                    </ul>
                  </div>
                </div>
              </div>
              <div class="chat-input-container">
                <input type="text" id="chat-input" placeholder="Ask about stocks, strategies..." />
                <button id="btn-send">➤</button>
              </div>
            </div>
          </div>
        </div>
        
        <div class="trademind-footer">
          <div class="market-mood">
            <span class="mood-indicator positive">🟢 Bullish</span>
          </div>
          <div class="connection-status">
            <span class="status-dot"></span>
            <span>Connected</span>
          </div>
        </div>
      </div>
      
      <!-- Floating toggle button -->
      <button class="trademind-toggle" id="trademind-toggle">
        <span class="toggle-icon">📈</span>
      </button>
    `;
  }

  function initializeOverlay() {
    // Tab switching
    document.querySelectorAll(".trademind-tabs .tab").forEach(tab => {
      tab.addEventListener("click", () => {
        const tabName = tab.dataset.tab;
        
        // Update tab buttons
        document.querySelectorAll(".trademind-tabs .tab").forEach(t => t.classList.remove("active"));
        tab.classList.add("active");
        
        // Update tab content
        document.querySelectorAll(".tab-content").forEach(c => c.classList.remove("active"));
        document.getElementById(`tab-${tabName}`).classList.add("active");
      });
    });

    // Minimize button
    document.getElementById("btn-minimize").addEventListener("click", () => {
      const widget = document.getElementById("trademind-widget");
      widget.classList.toggle("minimized");
    });

    // Close button
    document.getElementById("btn-close").addEventListener("click", () => {
      const widget = document.getElementById("trademind-widget");
      widget.classList.add("hidden");
    });

    // Toggle button
    document.getElementById("trademind-toggle").addEventListener("click", () => {
      const widget = document.getElementById("trademind-widget");
      widget.classList.remove("hidden");
      widget.classList.remove("minimized");
    });

    // Chat functionality
    document.getElementById("btn-send").addEventListener("click", sendChatMessage);
    document.getElementById("chat-input").addEventListener("keypress", (e) => {
      if (e.key === "Enter") sendChatMessage();
    });

    // Start real-time updates
    startDataUpdates();
  }

  // Real-time market data updates
  function startDataUpdates() {
    updateMarketData();
    setInterval(updateMarketData, 5000);
  }

  async function updateMarketData() {
    try {
      // Fetch from zo.space API (which aggregates broker data)
      const response = await fetch(`${API_BASE}/api/market/quick`);
      const data = await response.json();
      
      if (data.nifty) {
        updatePriceDisplay("nifty-price", data.nifty);
      }
      if (data.banknifty) {
        updatePriceDisplay("banknifty-price", data.banknifty);
      }
    } catch (error) {
      console.log("Market data update failed, using cache");
    }
  }

  function updatePriceDisplay(elementId, data) {
    const element = document.getElementById(elementId);
    if (!element) return;
    
    const price = element.querySelector(".price");
    const change = element.querySelector(".change");
    
    if (price) price.textContent = data.price?.toFixed(2) || "--";
    if (change) {
      const changeValue = data.change || 0;
      change.textContent = `${changeValue >= 0 ? "+" : ""}${changeValue.toFixed(2)}%`;
      change.className = `change ${changeValue >= 0 ? "positive" : "negative"}`;
    }
  }

  // Trade execution
  window.executeSignal = async function(action, symbol) {
    const confirmMessage = `${action} ${symbol}? This will execute a real trade.`;
    
    if (confirm(confirmMessage)) {
      try {
        // Send to background script for execution
        const response = await chrome.runtime.sendMessage({
          type: "EXECUTE_TRADE",
          trade: {
            symbol,
            type: action,
            quantity: 1, // Default quantity
            price: "MARKET" // Market order
          }
        });
        
        if (response.success) {
          alert(`Trade executed successfully! Order ID: ${response.orderId}`);
        } else {
          alert(`Trade failed: ${response.error}`);
        }
      } catch (error) {
        alert("Trade execution error. Please try again.");
      }
    }
  };

  // Chat functionality
  window.sendChatMessage = async function() {
    const input = document.getElementById("chat-input");
    const message = input.value.trim();
    
    if (!message) return;
    
    // Add user message
    addChatMessage(message, "user");
    input.value = "";
    
    // Send to AI
    try {
      const response = await fetch(`${API_BASE}/api/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ message })
      });
      
      const data = await response.json();
      addChatMessage(data.response, "bot");
    } catch (error) {
      addChatMessage("Sorry, I couldn't process your request. Please try again.", "bot");
    }
  };

  function addChatMessage(content, type) {
    const container = document.getElementById("chat-messages");
    const messageDiv = document.createElement("div");
    messageDiv.className = `message ${type}`;
    messageDiv.innerHTML = `<div class="message-content">${content}</div>`;
    container.appendChild(messageDiv);
    container.scrollTop = container.scrollHeight;
  }

  // Pattern detection on web pages
  function detectStockSymbols() {
    const text = document.body.innerText;
    const symbolPattern = /\b([A-Z]{2,5})\b/g;
    const matches = text.match(symbolPattern);
    
    if (matches) {
      // Notify background script of detected symbols
      chrome.runtime.sendMessage({
        type: "DETECTED_SYMBOLS",
        symbols: [...new Set(matches)]
      });
    }
  }

  // Initialize
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", createOverlay);
  } else {
    createOverlay();
  }
})();