/**
 * Generate trading insights with incremental update support
 * @param {object|null} existingData - Previous data for incremental update
 * @returns {object} Trading insights
 */
export const generateTradingInsights = (existingData = null) => {
  const now = Date.now();
  const UPDATE_INTERVAL = 30000; // 30 seconds

  // Incremental update - just refresh some values
  if (existingData && existingData._meta) {
    const timeSinceLast = now - existingData._meta.lastTimestamp;

    if (timeSinceLast < UPDATE_INTERVAL) {
      return existingData;
    }

    // Update dynamic values
    const updatedInsights = existingData.insights.map(insight => ({
      ...insight,
      confidence: Math.max(50, Math.min(95, insight.confidence + (Math.random() - 0.5) * 5))
    }));

    const updatedStrategies = existingData.strategies.map(strategy => ({
      ...strategy,
      winRate: Math.max(50, Math.min(85, strategy.winRate + (Math.random() - 0.5) * 3))
    }));

    // Update risk score dynamically
    const updatedRisk = {
      ...existingData.risk,
      score: Math.max(30, Math.min(90, existingData.risk.score + (Math.random() - 0.5) * 10)),
      momentum: Math.max(40, Math.min(95, existingData.risk.momentum + (Math.random() - 0.5) * 8))
    };

    return {
      insights: updatedInsights,
      strategies: updatedStrategies,
      marketRegime: existingData.marketRegime || getMarketRegime(),
      alertLevel: existingData.alertLevel,
      risk: updatedRisk,
      _meta: { lastTimestamp: now }
    };
  }

  // First call: generate initial insights
  const insights = [
    {
      title: "Funding Rate Divergence",
      description: "Funding rates showing extreme positive bias while price consolidates near key resistance. This suggests over-leveraged longs vulnerable to squeeze.",
      priority: "critical",
      signal: "bearish",
      confidence: 85,
      timeframe: "4H",
      actionItems: [
        "Monitor for long liquidation cascades",
        "Consider short positions with tight stops", 
        "Watch for funding rate normalization"
      ]
    },
    {
      title: "Volume Profile Gap Fill",
      description: "Large volume gap between $2,750-$2,780 suggests this area will act as magnet for price action. Currently trading above this zone.",
      priority: "high",
      signal: "neutral",
      confidence: 78,
      timeframe: "1D",
      actionItems: [
        "Set alerts for gap zone entry",
        "Prepare for potential pullback",
        "Volume confirmation needed for breakdown"
      ]
    },
    {
      title: "Smart Money Accumulation",
      description: "Large block trades and absorption patterns indicate institutional accumulation below $2,790. Delta showing consistent buying despite price consolidation.",
      priority: "high", 
      signal: "bullish",
      confidence: 82,
      timeframe: "2H",
      actionItems: [
        "Look for entries on dips to accumulation zone",
        "Monitor delta for continued absorption",
        "Target breakout above $2,820"
      ]
    },
    {
      title: "Liquidation Cascade Setup",
      description: "High concentration of long liquidations stacked above $2,830. Break above this level could trigger violent short squeeze.",
      priority: "medium",
      signal: "bullish",
      confidence: 75,
      timeframe: "1H",
      actionItems: [
        "Watch for break of $2,830 with volume",
        "Prepare for rapid price expansion", 
        "Use wide stops due to volatility risk"
      ]
    },
    {
      title: "Market Structure Shift",
      description: "Higher lows being printed with decreasing volume. Suggests accumulation phase may be ending soon.",
      priority: "medium",
      signal: "bullish", 
      confidence: 71,
      timeframe: "6H",
      actionItems: [
        "Monitor for volume expansion on next leg up",
        "Look for break of previous high",
        "Invalidation below recent low"
      ]
    }
  ];

  const strategies = [
    {
      name: "Funding Rate Mean Reversion",
      description: "Short when funding exceeds +0.1%, long when below -0.1%",
      status: "setup",
      entry: "2825",
      target: "2795", 
      stop: "2835",
      riskReward: "3:1",
      winRate: 68
    },
    {
      name: "Liquidity Sweep Fade",
      description: "Fade the sweep of major liquidity levels with quick reversal",
      status: "active", 
      entry: "2788",
      target: "2810",
      stop: "2780",
      riskReward: "2.8:1",
      winRate: 72
    },
    {
      name: "Volume Profile Gap Play",
      description: "Long the gap fill between major volume clusters",
      status: "pending",
      entry: "2765",
      target: "2790",
      stop: "2750", 
      riskReward: "1.7:1",
      winRate: 61
    }
  ];

  return {
    insights,
    strategies,
    marketRegime: getMarketRegime(),
    alertLevel: 'medium',
    risk: {
      score: 65,
      volatilityRegime: 'Elevated',
      correlationShift: 0.15,
      smartMoney: 'Accumulating',
      momentum: 73
    },
    _meta: { lastTimestamp: now }
  };
};

export const getMarketRegime = () => {
  // Simulate market regime detection
  const regimes = [
    {
      type: 'trending',
      description: 'Clear directional movement with momentum',
      characteristics: ['Higher highs/lows', 'Volume confirmation', 'Momentum divergence rare']
    },
    {
      type: 'ranging', 
      description: 'Sideways consolidation between levels',
      characteristics: ['Defined support/resistance', 'Mean reversion', 'Breakout potential building']
    },
    {
      type: 'volatile',
      description: 'High volatility, unpredictable moves',
      characteristics: ['Large price swings', 'News driven', 'Risk management critical'] 
    },
    {
      type: 'quiet',
      description: 'Low volatility, compressed ranges',
      characteristics: ['Tight ranges', 'Low volume', 'Anticipate expansion']
    }
  ];

  // For demo, return ranging market
  return regimes[1];
};