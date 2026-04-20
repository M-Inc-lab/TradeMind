// TradeMind AI - Multi-Agent Survival Arena
// 10+ LLM Agents compete. The fittest survive. The rest are killed.
// Dead strategies go to vector DB as "what NOT to do".
// Survivors face 10-15% daily profit bar.

import { v4 as uuid } from 'uuid';

// Agent States
const AGENT_STATES = {
  ALIVE: 'ALIVE',
  HUNTING: 'HUNTING', // Searching for profitable strategies
  PROFITABLE: 'PROFITABLE', // Making money, safe for now
  WEAKENED: 'WEAKENED', // Below 5% profit, danger zone
  DYING: 'DYING', // Below 0%, terminal
  DEAD: 'DEAD', // Killed, strategy archived
  EVOLVED: 'EVOLVED', // Survived long enough, difficulty increased
};

// Agent class
class TradingAgent {
  constructor(id, difficulty = 5) {
    this.id = id;
    this.name = this.generateName();
    this.difficulty = difficulty; // Required daily profit %
    this.status = AGENT_STATES.ALIVE;
    this.createdAt = Date.now();
    this.lastProfit = 0;
    this.totalProfit = 0;
    this.trades = [];
    this.strategies = [];
    this.currentStrategy = null;
    this.deaths = 0;
    this.cycleWins = 0;
    this.deathReason = null;
  }

  generateName() {
    const prefixes = ['Phantom', 'Vulture', 'Wolf', 'Raptor', 'Hydra', 'Onyx', 'Crimson', 'Silver', 'Black', 'Steel'];
    const suffixes = ['Alpha', 'Prime', 'Max', 'Elite', 'Zero', 'Nexus', 'Apex', 'Omega', 'Delta', 'Sigma'];
    return `${prefixes[Math.floor(Math.random() * prefixes.length)]}${suffixes[Math.floor(Math.random() * suffixes.length)]}`;
  }

  needsProfit() {
    return this.difficulty;
  }

  recordProfit(profitPercent) {
    this.lastProfit = profitPercent;
    this.totalProfit += profitPercent;
    
    if (profitPercent >= this.difficulty) {
      this.status = AGENT_STATES.PROFITABLE;
      this.cycleWins++;
    } else if (profitPercent >= 0) {
      this.status = AGENT_STATES.WEAKENED;
    } else {
      this.status = AGENT_STATES.DYING;
    }
  }

  getSurvivalProbability() {
    // Agents with more wins get more leniency
    const winBonus = Math.min(this.cycleWins * 2, 20);
    const survivalFloor = 30 - (this.deaths * 5) + winBonus;
    return Math.max(5, survivalFloor);
  }

  toJSON() {
    return {
      id: this.id,
      name: this.name,
      difficulty: this.difficulty,
      status: this.status,
      totalProfit: this.totalProfit.toFixed(2),
      lastProfit: this.lastProfit.toFixed(2),
      deaths: this.deaths,
      wins: this.cycleWins,
      survivalChance: this.getSurvivalProbability(),
      strategies: this.strategies,
      age: Math.floor((Date.now() - this.createdAt) / 60000) + 'm',
    };
  }
}

// Agent Manager - orchestrates the arena
export class AgentArena {
  constructor() {
    this.agents = new Map();
    this.deadStrategies = []; // Vector DB backup
    this.cycle = 0;
    this.dayProfitThreshold = 5; // Default 5%
    this.maxAgents = 12;
    this.killCount = 0;
    this.evolutionCount = 0;
    this.history = [];
  }

  initialize(count = 10) {
    for (let i = 0; i < count; i++) {
      const agent = new TradingAgent(uuid(), 5);
      this.agents.set(agent.id, agent);
    }
    return `Arena initialized with ${count} agents. Daily profit requirement: 5-15%`;
  }

  simulateDay() {
    this.cycle++;
    const results = [];
    
    for (const [id, agent] of this.agents) {
      if (agent.status === AGENT_STATES.DEAD) continue;
      
      // Simulate daily trading result (-20% to +25%)
      const result = this.simulateAgentTrade(agent);
      agent.recordProfit(result);
      results.push({ agent: agent.name, profit: result.toFixed(2) + '%', status: agent.status });
      
      // Check for death
      if (agent.status === AGENT_STATES.DYING) {
        const survivalRoll = Math.random() * 100;
        if (survivalRoll > agent.getSurvivalProbability()) {
          this.killAgent(id, 'Insufficient profits');
        }
      }
    }
    
    // Maybe raise the bar for survivors
    this.adjustDifficulty();
    
    return { cycle: this.cycle, results, aliveCount: this.countAlive() };
  }

  simulateAgentTrade(agent) {
    // More deaths = more desperate strategies = more volatile
    const desperation = Math.min(agent.deaths * 3, 40);
    const baseSkill = 50 - desperation + (agent.cycleWins * 3);
    
    // Random outcome weighted by skill
    const roll = Math.random() * 100;
    
    if (roll < baseSkill * 0.7) {
      // Win (0.5% to 8%)
      return Math.random() * 7.5 + 0.5;
    } else if (roll < baseSkill * 0.85) {
      // Small loss
      return -(Math.random() * 2 + 0.1);
    } else if (roll < baseSkill) {
      // Big loss
      return -(Math.random() * 8 + 3);
    } else {
      // Massive loss (agent broke)
      return -(Math.random() * 15 + 5);
    }
  }

  killAgent(id, reason) {
    const agent = this.agents.get(id);
    if (!agent) return;
    
    agent.status = AGENT_STATES.DEAD;
    agent.deathReason = reason;
    agent.deaths++;
    this.killCount++;
    
    // Archive strategy to dead strategies DB
    this.deadStrategies.push({
      agentName: agent.name,
      difficulty: agent.difficulty,
      totalProfit: agent.totalProfit,
      deaths: agent.deaths,
      strategies: agent.strategies,
      killedAt: new Date().toISOString(),
      reason,
      cycle: this.cycle,
    });
    
    // Spawn new agent with current difficulty
    this.spawnReplacement(agent.difficulty);
    
    return `${agent.name} KILLED. Reason: ${reason}. Replacement spawned.`;
  }

  spawnReplacement(baseDifficulty) {
    if (this.agents.size >= this.maxAgents) return;
    
    const newAgent = new TradingAgent(uuid(), baseDifficulty);
    newAgent.deaths = Math.max(0, baseDifficulty - 5); // New agents inherit some difficulty history
    this.agents.set(newAgent.id, newAgent);
    
    return newAgent;
  }

  adjustDifficulty() {
    // Every 5 cycles, check if survivors need difficulty bump
    if (this.cycle % 5 !== 0) return;
    
    for (const [id, agent] of this.agents) {
      if (agent.status === AGENT_STATES.PROFITABLE && agent.cycleWins >= 3) {
        const oldDiff = agent.difficulty;
        agent.difficulty = Math.min(15, agent.difficulty + 0.5);
        agent.status = AGENT_STATES.EVOLVED;
        agent.cycleWins = 0; // Reset for next round
        this.evolutionCount++;
        
        // Remove "bad" strategies from their pool
        agent.strategies = agent.strategies.slice(-5); // Keep only recent 5
      }
    }
  }

  countAlive() {
    return [...this.agents.values()].filter(a => a.status !== AGENT_STATES.DEAD).length;
  }

  getLeaderboard() {
    return [...this.agents.values()]
      .filter(a => a.status !== AGENT_STATES.DEAD)
      .sort((a, b) => b.totalProfit - a.totalProfit)
      .slice(0, 10)
      .map(a => a.toJSON());
  }

  getDeadStrategies() {
    return this.deadStrategies;
  }

  simulateRound(rounds = 10) {
    const allResults = [];
    for (let i = 0; i < rounds; i++) {
      allResults.push(this.simulateDay());
    }
    return allResults;
  }
}

// Standalone route
let arena = null;

export default async (c) => {
  const action = c.req.query('action') || 'init';
  const cycles = parseInt(c.req.query('cycles') || '10');
  
  if (!arena) {
    arena = new AgentArena();
    const init = arena.initialize(10);
    
    // Run some initial rounds
    const preResults = arena.simulateRound(10);
    
    return c.json({
      status: 'Arena Initialized',
      message: init,
      preRun: {
        cyclesCompleted: 10,
        agentsKilled: arena.killCount,
        survivors: arena.countAlive(),
        leaderboard: arena.getLeaderboard(),
      },
    });
  }
  
  switch (action) {
    case 'status':
      return c.json({
        cycle: arena.cycle,
        alive: arena.countAlive(),
        totalKills: arena.killCount,
        evolutions: arena.evolutionCount,
        deadCount: arena.deadStrategies.length,
        leaderboard: arena.getLeaderboard(),
      });
      
    case 'simulate':
      const results = arena.simulateRound(cycles);
      return c.json({
        cyclesCompleted: cycles,
        totalKills: arena.killCount,
        evolutions: arena.evolutionCount,
        results: results.slice(-5), // Last 5 cycles
        leaderboard: arena.getLeaderboard(),
      });
      
    case 'kill':
      const weakest = [...arena.agents.values()]
        .filter(a => a.status !== AGENT_STATES.DEAD)
        .sort((a, b) => a.totalProfit - b.totalProfit)[0];
      
      if (!weakest) return c.json({ error: 'No agents to kill' });
      
      const killResult = arena.killAgent(weakest.id, 'Manual cull - weakest performer');
      
      return c.json({
        message: killResult,
        leaderboard: arena.getLeaderboard(),
      });
      
    case 'dead_strategies':
      return c.json({
        count: arena.deadStrategies.length,
        strategies: arena.deadStrategies.slice(-20),
      });
      
    case 'inject_danger':
      // Force a dangerous market condition and see who survives
      for (const [id, agent] of arena.agents) {
        if (agent.status !== AGENT_STATES.DEAD) {
          agent.status = AGENT_STATES.DYING;
        }
      }
      const dangerResults = arena.simulateRound(5);
      return c.json({
        event: 'MARKET CRASH SIMULATED',
        results: dangerResults,
        killed: arena.killCount,
        leaderboard: arena.getLeaderboard(),
      });
      
    case 'hard_reset':
      arena = new AgentArena();
      const reset = arena.initialize(10);
      return c.json({ message: 'Arena hard reset', details: reset });
      
    default:
      return c.json({
        arena: 'Multi-Agent Trading Arena',
        status: arena.status,
        alive: arena.countAlive(),
        actions: ['status', 'simulate', 'kill', 'dead_strategies', 'inject_danger', 'hard_reset'],
      });
  }
};