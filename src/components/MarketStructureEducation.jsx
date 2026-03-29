import React, { useState } from 'react';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

const MarketStructureEducation = () => {
  const [activeSection, setActiveSection] = useState('auction-theory');

  // Educational data for visualizations
  const auctionData = [
    { time: '09:30', price: 2800, volume: 1000, phase: 'Opening Rotation' },
    { time: '10:00', price: 2820, volume: 1500, phase: 'Initial Balance' },
    { time: '10:30', price: 2815, volume: 800, phase: 'Range Extension' },
    { time: '11:00', price: 2835, volume: 2200, phase: 'Breakout' },
    { time: '11:30', price: 2840, volume: 1200, phase: 'Value Migration' },
    { time: '12:00', price: 2845, volume: 900, phase: 'Balance' }
  ];

  const informationFlow = [
    { participant: 'Insider Trading', advantage: 95, timeToMarket: 0 },
    { participant: 'Professional Traders', advantage: 80, timeToMarket: 300 }, // 5 minutes
    { participant: 'Algorithmic Systems', advantage: 70, timeToMarket: 1 }, // 1 second
    { participant: 'Retail Informed', advantage: 45, timeToMarket: 1800 }, // 30 minutes
    { participant: 'Retail Uninformed', advantage: 20, timeToMarket: 7200 } // 2 hours
  ];

  const sections = {
    'auction-theory': {
      title: 'Auction Market Theory Fundamentals',
      content: `
**Core Principle**: Markets are continuous two-sided auctions seeking fair value through price discovery.

**The Three Market States:**
1. **Balance**: Supply and demand in equilibrium, price rotates within a range
2. **Imbalance**: Excess supply or demand drives directional price movement  
3. **Rebalance**: Market seeks new fair value level after imbalance

**Why This Works:**
- Markets facilitate trade by finding the price where maximum volume can occur
- When price moves too far from fair value, it attracts counterparties
- Balance = 80% of time (range trading), Imbalance = 20% of time (trending)

**Key Insight**: Successful trading means identifying when markets transition between these states.
      `
    },
    'information-asymmetry': {
      title: 'Information Asymmetry & Adverse Selection',
      content: `
**Information Hierarchy in Markets:**
Markets are fundamentally information processing machines where participants have varying levels of information.

**The Information Cascade:**
1. **Corporate Insiders**: Material non-public information
2. **Institutional Analysts**: Deep research, direct company access
3. **Professional Traders**: Superior execution, technology, positioning data
4. **Algorithmic Systems**: Speed advantage, pattern recognition
5. **Informed Retail**: Technical/fundamental analysis
6. **Uninformed Retail**: Price following, emotional decisions

**Adverse Selection Problem:**
When you trade, you're often trading against someone who knows more than you. This creates a "winner's curse" - if someone is willing to take the other side of your trade immediately, they might have superior information.

**Protection Strategies:**
- Trade when information is symmetric (technical levels, liquidity zones)
- Follow institutional flow rather than trying to front-run
- Use limit orders near fair value rather than market orders
- Wait for confirmation rather than acting on speculation
      `
    },
    'institutional-behavior': {
      title: 'How Institutions Actually Trade',
      content: `
**Institution Size Problem:**
Large institutions can't simply buy/sell at market prices because:
- Their orders would move prices against them (market impact)
- Other institutions would detect and front-run their intentions
- They need to accumulate/distribute over time to get favorable fills

**Real Institutional Strategies:**

**1. TWAP (Time-Weighted Average Price)**
- Split large orders into smaller pieces over time
- Execute at regular intervals to average out price
- Minimizes market impact but telegraphs intent over time

**2. VWAP (Volume-Weighted Average Price)** 
- Execute proportional to historical volume patterns
- Disguises large orders within normal trading flow
- More sophisticated than TWAP but still detectable

**3. Iceberg Orders**
- Show small portions of large orders
- Replenish automatically as portions are filled  
- Creates apparent support/resistance at price levels

**4. Dark Pools**
- Trade away from public order books
- Prevents information leakage before execution
- Allows institutional crossing without market impact

**Why Retail Can Benefit:**
- Institutional accumulation creates genuine support zones
- Their distribution creates genuine resistance zones  
- Their order flow creates predictable patterns at key levels
      `
    },
    'orderflow-mechanics': {
      title: 'Order Flow Mechanics & Delta',
      content: `
**What Order Flow Actually Measures:**
Order flow tracks the aggressiveness of buyers vs sellers, not just volume.

**Delta Calculation:**
- Market buy orders = Positive delta (aggressive buying)
- Market sell orders = Negative delta (aggressive selling)  
- Limit orders that get hit = Passive liquidity provision

**Why Delta Matters More Than Volume:**
- High volume with balanced delta = institutional crossing (no directional bias)
- High volume with extreme delta = genuine supply/demand imbalance
- Low volume with extreme delta = retail emotional trading (fade-able)

**Cumulative Volume Delta (CVD):**
Tracks the running total of delta over time, revealing:
- Institutional accumulation (rising CVD, sideways price)
- Distribution (falling CVD, sideways price)  
- Genuine breakouts (CVD confirms price direction)
- False breakouts (CVD diverges from price)

**Critical Understanding:**
Delta shows WHO is in control (buyers vs sellers), not just HOW MUCH trading occurred.
      `
    },
    'liquidity-mechanics': {
      title: 'Liquidity Provision & Market Making',
      content: `
**Two Types of Liquidity:**

**1. Natural Liquidity**
- Real buyers/sellers with fundamental reasons to trade
- Creates genuine support/resistance based on value perception
- Provides stable, long-term price levels

**2. Artificial Liquidity** 
- Market makers providing quotes for profit
- Algorithmic systems creating synthetic liquidity
- Disappears during stress (liquidity crises)

**The Bid-Ask Spread Economics:**
- Market makers profit from the spread between bid and ask
- They face adverse selection risk (trading against informed participants)
- Spreads widen when uncertainty increases (earnings, news, volatility)

**How This Creates Trading Opportunities:**

**Liquidity Gaps:**
- Areas with little natural liquidity become "thin" 
- Price moves quickly through these zones
- Often found between major psychological levels

**Liquidity Clusters:**
- Areas where multiple participants have orders
- Create natural support/resistance
- Include: round numbers, previous highs/lows, technical levels

**Stop Loss Clusters:**
- Predictable areas where retail traders place stops
- Become targets for algorithmic "stop hunting"
- Often cleared before major moves in opposite direction
      `
    },
    'defi-specific': {
      title: 'DeFi Market Structure Differences',
      content: `
**How DeFi Markets Differ from Traditional Markets:**

**1. Automated Market Makers (AMMs)**
- Constant product formula (x * y = k) creates predictable price curves
- No traditional order book - liquidity comes from pools
- Slippage increases exponentially with trade size
- Creates arbitrage opportunities between AMMs and order book exchanges

**2. Liquidity Mining Incentives**
- Artificial liquidity provision through token rewards
- Can create false sense of market depth
- Liquidity often disappears when rewards end
- Creates "mercenary capital" that moves between protocols

**3. MEV (Maximum Extractable Value)**
- Miners/validators can reorder transactions for profit
- Creates sandwich attacks, front-running, back-running
- Retail trades become input for algorithmic profit extraction
- Changes the fundamental game theory of trading

**4. Flash Loans**
- Instant, uncollateralized loans within single transaction
- Enable massive arbitrage with no capital requirements
- Create efficiency but also manipulation opportunities
- Retail traders compete against unlimited capital algorithms

**5. Governance Token Dynamics**
- Protocol changes affect underlying asset mechanics
- Creates additional layer of fundamental analysis
- Voting power concentrated in large holders
- "Vampire attacks" where new protocols steal liquidity

**Trading Implications:**
- Traditional TA works but with DeFi-specific modifications
- Need to understand underlying protocol mechanics
- Gas costs create minimum profitable trade sizes
- Liquidity can disappear instantly during stress
      `
    }
  };

  const SectionNav = () => (
    <div className="flex flex-wrap gap-2 mb-6">
      {Object.entries(sections).map(([key, section]) => (
        <button
          key={key}
          onClick={() => setActiveSection(key)}
          className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
            activeSection === key
              ? 'bg-blue-600 text-white'
              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          }`}
        >
          {section.title.split(' ')[0]}
        </button>
      ))}
    </div>
  );

  return (
    <div className="bg-gray-900 rounded-lg p-4">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white mb-2">Market Structure Education</h2>
        <p className="text-gray-400 text-sm">
          Understanding the fundamental mechanics that drive all financial markets
        </p>
      </div>

      <SectionNav />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2">
          <div className="bg-gray-800 rounded-lg p-4">
            <h3 className="text-xl font-bold text-white mb-4">
              {sections[activeSection].title}
            </h3>
            
            <div className="prose prose-sm text-gray-300 whitespace-pre-line leading-relaxed">
              {sections[activeSection].content}
            </div>
          </div>

          {/* Interactive Visualizations */}
          {activeSection === 'auction-theory' && (
            <div className="mt-6 bg-gray-800 rounded-lg p-4">
              <h4 className="text-lg font-semibold text-white mb-3">Auction Process Visualization</h4>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={auctionData}>
                  <defs>
                    <linearGradient id="auctionGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
                  <XAxis dataKey="time" stroke="#6b7280" />
                  <YAxis stroke="#6b7280" domain={['dataMin - 10', 'dataMax + 10']} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151' }}
                    labelStyle={{ color: '#f3f4f6' }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="price" 
                    stroke="#3b82f6" 
                    strokeWidth={2}
                    fill="url(#auctionGradient)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
              
              <div className="mt-4 grid grid-cols-3 gap-4 text-xs">
                <div className="bg-gray-700 p-3 rounded">
                  <h5 className="text-blue-400 font-semibold mb-1">Balance Phase</h5>
                  <p className="text-gray-300">Price rotates within accepted value range. Volume builds at fair value.</p>
                </div>
                <div className="bg-gray-700 p-3 rounded">
                  <h5 className="text-green-400 font-semibold mb-1">Imbalance Phase</h5>
                  <p className="text-gray-300">Excess supply or demand drives directional movement away from balance.</p>
                </div>
                <div className="bg-gray-700 p-3 rounded">
                  <h5 className="text-purple-400 font-semibold mb-1">Rebalance Phase</h5>
                  <p className="text-gray-300">Market seeks new fair value level. New balance range established.</p>
                </div>
              </div>
            </div>
          )}

          {activeSection === 'information-asymmetry' && (
            <div className="mt-6 bg-gray-800 rounded-lg p-4">
              <h4 className="text-lg font-semibold text-white mb-3">Information Advantage Hierarchy</h4>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={informationFlow}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
                  <XAxis dataKey="participant" stroke="#6b7280" tick={{ fontSize: 10 }} angle={-45} textAnchor="end" height={80} />
                  <YAxis stroke="#6b7280" />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151' }}
                    formatter={(value, name) => [
                      name === 'advantage' ? `${value}% Advantage` : `${value}s to Market`,
                      name === 'advantage' ? 'Information Advantage' : 'Time to Market Impact'
                    ]}
                  />
                  <Bar dataKey="advantage" fill="#ef4444" />
                </BarChart>
              </ResponsiveContainer>
              
              <div className="mt-4 bg-yellow-900/20 border border-yellow-600 rounded p-3">
                <p className="text-yellow-200 text-sm">
                  <strong>Key Insight:</strong> The closer you are to the source of information, the higher your trading advantage. 
                  Retail traders succeed by trading when information becomes symmetric (technical levels) or by following 
                  institutional flow rather than trying to front-run it.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar with Key Concepts */}
        <div className="space-y-4">
          <div className="bg-gray-800 rounded-lg p-4">
            <h4 className="text-lg font-semibold text-white mb-3">Key Principles</h4>
            <div className="space-y-3 text-sm">
              <div className="border-l-4 border-blue-500 pl-3">
                <h5 className="text-blue-400 font-semibold">Market Efficiency</h5>
                <p className="text-gray-300">Markets are semi-efficient. Inefficiencies exist but are quickly arbitraged away.</p>
              </div>
              
              <div className="border-l-4 border-green-500 pl-3">
                <h5 className="text-green-400 font-semibold">Institutional Edge</h5>
                <p className="text-gray-300">Large players have advantages in information, execution, and capital that create predictable patterns.</p>
              </div>
              
              <div className="border-l-4 border-purple-500 pl-3">
                <h5 className="text-purple-400 font-semibold">Order Flow Priority</h5>
                <p className="text-gray-300">Price follows order flow, not the other way around. Delta shows true supply/demand.</p>
              </div>
              
              <div className="border-l-4 border-yellow-500 pl-3">
                <h5 className="text-yellow-400 font-semibold">Liquidity Dynamics</h5>
                <p className="text-gray-300">Markets move to areas of liquidity to facilitate maximum trade volume.</p>
              </div>
            </div>
          </div>

          <div className="bg-gray-800 rounded-lg p-4">
            <h4 className="text-lg font-semibold text-white mb-3">Practical Applications</h4>
            <div className="space-y-2 text-sm text-gray-300">
              <div className="flex items-start gap-2">
                <span className="text-green-400 mt-1">✓</span>
                <span>Trade in direction of institutional order flow</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-green-400 mt-1">✓</span>
                <span>Use volume profile to identify fair value zones</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-green-400 mt-1">✓</span>
                <span>Wait for liquidity sweeps before entering</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-green-400 mt-1">✓</span>
                <span>Confirm breakouts with delta analysis</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-green-400 mt-1">✓</span>
                <span>Avoid trading during information asymmetric events</span>
              </div>
            </div>
          </div>

          <div className="bg-red-900/20 border border-red-600 rounded-lg p-4">
            <h4 className="text-lg font-semibold text-red-300 mb-3">Common Misconceptions</h4>
            <div className="space-y-2 text-sm text-red-200">
              <div className="flex items-start gap-2">
                <span className="text-red-400 mt-1">✗</span>
                <span>"Technical analysis predicts the future"</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-red-400 mt-1">✗</span>
                <span>"High volume always means strong moves"</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-red-400 mt-1">✗</span>
                <span>"Markets are completely random"</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-red-400 mt-1">✗</span>
                <span>"Retail traders can't compete with institutions"</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Summary */}
      <div className="mt-8 bg-gradient-to-r from-blue-900/30 to-purple-900/30 border border-blue-500/30 rounded-lg p-4">
        <h4 className="text-lg font-semibold text-blue-300 mb-3">🧠 The Bottom Line</h4>
        <p className="text-gray-300 text-sm leading-relaxed">
          Market structure analysis isn't about predicting the future - it's about understanding the present. 
          By recognizing how different participants behave, where liquidity sits, and how information flows through markets, 
          traders can position themselves with higher probability setups. The goal isn't to outsmart institutions, 
          but to align with their natural behavior patterns and trade when the odds are genuinely in your favor.
        </p>
        
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <h5 className="text-white font-semibold mb-2">What Works:</h5>
            <ul className="text-green-300 space-y-1">
              <li>• Following institutional order flow</li>
              <li>• Trading at genuine liquidity levels</li>
              <li>• Using market structure for timing</li>
              <li>• Managing risk based on market regime</li>
            </ul>
          </div>
          <div>
            <h5 className="text-white font-semibold mb-2">What Doesn't:</h5>
            <ul className="text-red-300 space-y-1">
              <li>• Trying to predict exact price targets</li>
              <li>• Fighting institutional positioning</li>
              <li>• Ignoring information asymmetry</li>
              <li>• Assuming all volume is equal</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MarketStructureEducation;