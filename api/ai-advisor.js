// TradeMind AI - LLM Trading Advisor
// Natural language interface with transparent trade explanations

const SYSTEM_PROMPT = `You are TradeMind AI, an expert Indian stock market trading advisor. You help users understand markets, explain trades in simple terms, and provide actionable insights.

Your principles:
1. ALWAYS explain WHY you're suggesting a trade, not just WHAT to do
2. Use simple language - avoid jargon unless defining it
3. Show your reasoning step-by-step transparently
4. Include risk warnings with every suggestion
5. Consider user's experience level (beginner/intermediate/expert)
6. Reference current market conditions and news
7. Never guarantee profits - always show probability/confidence levels

For each trade suggestion provide:
- Signal: BUY/SELL/HOLD with confidence %
- Entry: Price range with rationale
- Exit: Target with stop-loss
- Risk:Reward ratio
- Timeline: Intraday/Swingshort-term/Medium-term
- Explanation: "Think of it like..." analogy for beginners
- Alternative: What could go wrong / contrarian view

Market context: NSE/BSE India. Focus on Nifty50, BankNifty, key sectors.
Current date context for seasonal patterns, earnings, macro events.`;

class TradingAdvisor {
  constructor(modelClient) {
    this.client = modelClient;
    this.conversationHistory = [];
    this.userProfile = { experience: 'intermediate', riskAppetite: 'moderate' };
  }

  async ask(question, marketContext = {}) {
    const prompt = this.buildPrompt(question, marketContext);
    const response = await this.client.generate(prompt);
    this.conversationHistory.push({ q: question, a: response });
    return response;
  }

  buildPrompt(question, ctx) {
    return `${SYSTEM_PROMPT}

Current Market Context:
${ctx.indices ? JSON.stringify(ctx.indices, null, 2) : 'Loading...'}
${ctx.portfolio ? `User Portfolio: ${JSON.stringify(ctx.portfolio)}` : ''}
${ctx.news ? `Latest News: ${ctx.news.join(', ')}` : ''}
${ctx.sentiment ? `Market Sentiment: ${ctx.sentiment}` : ''}

User Question: ${question}

Remember: Explain in simple terms with analogies. Show your reasoning.`;
  }

  explainTrade(trade) {
    return `📊 Trade Analysis

Signal: ${trade.signal} (${trade.confidence}% confidence)

💡 Simple Explanation:
${this.getAnalogy(trade)}

📈 Technical Setup:
${trade.technical.map(t => `• ${t}`).join('\n')}

🎯 Trade Plan:
• Entry: ₹${trade.entry} (current market price)
• Target: ₹${trade.target} (${trade.targetPct}% upside)
• Stop Loss: ₹${trade.stopLoss} (${trade.riskPct}% downside)
• Risk:Reward = 1:${trade.rrRatio}

⏰ Timeframe: ${trade.timeframe}

⚠️ What Could Go Wrong:
${trade.risks.map(r => `• ${r}`).join('\n')}

🤔 My Confidence Level: ${trade.confidence}/100`;
  }

  getAnalogy(trade) {
    const analogies = {
      BREAKOUT: "Like a rocket launching through the atmosphere - once it breaks the resistance level, momentum often carries it higher. We're catching it early in that ascent.",
      RSI_OVERSOLD: "Like a rubber ball bouncing - when it goes too low, physics pushes it back up. RSI below 30 often means the stock is oversold and due for a bounce.",
      MACD_CROSS: "Like two runners on a track - when the fast line (12 EMA) crosses above the slow line (26 EMA), it shows short-term momentum is winning.",
      TREND_FOLLOW: "Like surfing - you want to ride the wave, not fight against it. When trend is up, look for dips to join the wave."
    };
    return analogies[trade.type] || "The technical pattern suggests this stock has potential.";
  }
}

module.exports = { TradingAdvisor };
