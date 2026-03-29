const MAX_FOOTPRINT_POINTS = 30;
const UPDATE_INTERVAL = 20 * 60 * 1000; // 20 minutes

/**
 * Analyze institutional footprint with incremental update support
 * @param {object|null} existingData - Previous data for incremental update
 * @returns {object} Institutional analysis
 */
export const analyzeInstitutionalFootprint = (existingData = null) => {
  const now = Date.now();

  // Incremental update
  if (existingData && existingData._meta) {
    const timeSinceLast = now - existingData._meta.lastTimestamp;

    if (timeSinceLast < UPDATE_INTERVAL) {
      return existingData;
    }

    // Add new footprint data point
    const { footprint, smartMoneyFlow, _meta } = existingData;
    let basePrice = _meta.lastPrice || footprint[footprint.length - 1]?.price || 2800;

    const newFootprint = [...footprint.slice(-MAX_FOOTPRINT_POINTS + 1)];
    const time = new Date(now).toLocaleTimeString();

    // Price movement with institutional influence
    const institutionalImpact = Math.random() > 0.7 ? (Math.random() - 0.5) * 0.02 : 0;
    const marketNoise = (Math.random() - 0.5) * 0.005;
    basePrice = basePrice * (1 + institutionalImpact + marketNoise);

    // Volume with institutional clustering
    const baseVolume = 100000 + Math.random() * 500000;
    const institutionalMultiplier = Math.random() > 0.8 ? 3 + Math.random() * 5 : 1;
    const volume = baseVolume * institutionalMultiplier;

    newFootprint.push({
      time,
      price: parseFloat(basePrice.toFixed(2)),
      volume: Math.round(volume),
      activity: volume > 2000000 ? 'High' : volume > 1000000 ? 'Medium' : 'Low',
      description: volume > 2000000 ? 'Large institutional block detected' :
                   volume > 1000000 ? 'Medium institutional activity' : 'Normal retail flow'
    });

    // Add new smart money flow data point
    const newSmartMoneyFlow = [...smartMoneyFlow.slice(-23)];
    const currentHour = new Date(now).getHours();

    let inflowMultiplier = 1;
    let outflowMultiplier = 1;

    if (currentHour >= 8 && currentHour <= 16) {
      inflowMultiplier = 1.2 + Math.random() * 0.5;
    }
    if (currentHour >= 13 && currentHour <= 21) {
      outflowMultiplier = 1.1 + Math.random() * 0.4;
    }
    if (currentHour >= 22 || currentHour <= 6) {
      inflowMultiplier = 0.7 + Math.random() * 0.3;
      outflowMultiplier = 0.8 + Math.random() * 0.2;
    }

    const baseInflow = (10 + Math.random() * 40) * inflowMultiplier;
    const baseOutflow = (8 + Math.random() * 35) * outflowMultiplier;

    newSmartMoneyFlow.push({
      time,
      inflow: parseFloat(baseInflow.toFixed(1)),
      outflow: parseFloat(baseOutflow.toFixed(1)),
      net: parseFloat((baseInflow - baseOutflow).toFixed(1)),
      description: `Net flow: ${baseInflow > baseOutflow ? 'Positive' : 'Negative'}`
    });

    // Recalculate metrics
    const totalSmartMoney = newSmartMoneyFlow.reduce((sum, flow) => sum + Math.abs(flow.net), 0);
    const netFlow = newSmartMoneyFlow.reduce((sum, flow) => sum + flow.net, 0) / newSmartMoneyFlow.length;
    const whaleCount = existingData.whaleTransactions.filter(tx => tx.value > 1000000).length;

    const metrics = {
      smartMoneyActivity: totalSmartMoney > 300 ? 'High' : totalSmartMoney > 150 ? 'Medium' : 'Low',
      activityChange: Math.floor(-10 + Math.random() * 40),
      whaleCount,
      netFlow: netFlow / 50,
      institutionalScore: Math.floor(65 + Math.random() * 30),
      tvlGrowth: Math.floor(15 + Math.random() * 20),
      avgWhaleSize: existingData.metrics.avgWhaleSize,
      darkPoolShare: Math.floor(10 + Math.random() * 20),
      algoShare: Math.floor(60 + Math.random() * 20)
    };

    return {
      footprint: newFootprint,
      whaleTransactions: existingData.whaleTransactions,
      smartMoneyFlow: newSmartMoneyFlow,
      darkPool: existingData.darkPool,
      algorithmic: existingData.algorithmic,
      metrics,
      _meta: { lastTimestamp: now, lastPrice: basePrice }
    };
  }

  // First call: generate initial data
  const footprint = [];
  const whaleTransactions = [];
  const smartMoneyFlow = [];
  const darkPool = [];
  const algorithmic = [];

  // Generate institutional footprint data (price vs time with volume intensity)
  let basePrice = 2800;
  for (let i = 0; i < 30; i++) {
    const time = new Date(Date.now() - (30 - i) * 20 * 60 * 1000).toLocaleTimeString();
    
    // Price movement with institutional influence
    const institutionalImpact = Math.random() > 0.7 ? (Math.random() - 0.5) * 0.02 : 0;
    const marketNoise = (Math.random() - 0.5) * 0.005;
    basePrice = basePrice * (1 + institutionalImpact + marketNoise);
    
    // Volume with institutional clustering
    const baseVolume = 100000 + Math.random() * 500000;
    const institutionalMultiplier = Math.random() > 0.8 ? 3 + Math.random() * 5 : 1;
    const volume = baseVolume * institutionalMultiplier;
    
    footprint.push({
      time,
      price: parseFloat(basePrice.toFixed(2)),
      volume: Math.round(volume),
      activity: volume > 2000000 ? 'High' : volume > 1000000 ? 'Medium' : 'Low',
      description: volume > 2000000 ? 'Large institutional block detected' : 
                   volume > 1000000 ? 'Medium institutional activity' : 'Normal retail flow'
    });
  }
  
  // Generate whale transactions
  const assets = ['ETH', 'WBTC', 'USDC', 'DAI', 'LINK', 'UNI'];
  const protocols = ['Uniswap V3', 'Aave', 'Compound', 'Curve', 'Balancer'];
  const transactionTypes = ['Large Buy', 'Large Sell', 'Liquidity Add', 'Liquidity Remove', 'Protocol Migration'];
  
  for (let i = 0; i < 12; i++) {
    const asset = assets[Math.floor(Math.random() * assets.length)];
    const protocol = protocols[Math.floor(Math.random() * protocols.length)];
    const type = transactionTypes[Math.floor(Math.random() * transactionTypes.length)];
    
    const value = 500000 + Math.random() * 10000000; // $500K to $10M
    const direction = type.includes('Buy') || type.includes('Add') ? 'Buy' : 'Sell';
    const impact = (value / 10000000) * 5; // Price impact calculation
    
    const time = new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000).toLocaleTimeString();
    
    whaleTransactions.push({
      type,
      asset,
      protocol,
      value: Math.round(value),
      direction,
      impact: parseFloat(impact.toFixed(2)),
      time,
      walletType: determineWalletType(value),
      confidence: 85 + Math.random() * 15
    });
  }
  
  // Generate smart money flow data
  for (let i = 0; i < 24; i++) {
    const hour = new Date(Date.now() - (24 - i) * 60 * 60 * 1000).toLocaleTimeString();
    
    // Simulate institutional trading sessions
    let inflowMultiplier = 1;
    let outflowMultiplier = 1;
    
    const currentHour = new Date(Date.now() - (24 - i) * 60 * 60 * 1000).getHours();
    
    // London session (8-16 GMT)
    if (currentHour >= 8 && currentHour <= 16) {
      inflowMultiplier = 1.2 + Math.random() * 0.5;
    }
    // NY session (13-21 GMT)
    if (currentHour >= 13 && currentHour <= 21) {
      outflowMultiplier = 1.1 + Math.random() * 0.4;
    }
    // Asian session (22-6 GMT)
    if (currentHour >= 22 || currentHour <= 6) {
      inflowMultiplier = 0.7 + Math.random() * 0.3;
      outflowMultiplier = 0.8 + Math.random() * 0.2;
    }
    
    const baseInflow = (10 + Math.random() * 40) * inflowMultiplier; // Millions
    const baseOutflow = (8 + Math.random() * 35) * outflowMultiplier; // Millions
    
    smartMoneyFlow.push({
      time: hour,
      inflow: parseFloat(baseInflow.toFixed(1)),
      outflow: parseFloat(baseOutflow.toFixed(1)),
      net: parseFloat((baseInflow - baseOutflow).toFixed(1)),
      description: `Net flow: ${baseInflow > baseOutflow ? 'Positive' : 'Negative'}`
    });
  }
  
  // Generate dark pool activity
  const exchanges = ['Paradigm', 'Wintermute', 'Jump Trading', 'Alameda', 'Genesis', 'Cumberland'];
  
  for (const exchange of exchanges) {
    const activity = Math.random() > 0.6 ? 'High' : Math.random() > 0.3 ? 'Medium' : 'Low';
    const volume = activity === 'High' ? 50 + Math.random() * 200 :
                   activity === 'Medium' ? 20 + Math.random() * 80 :
                   5 + Math.random() * 30;
    
    darkPool.push({
      exchange,
      volume: parseFloat(volume.toFixed(1)),
      activity,
      transactions: Math.floor(volume / 5 + Math.random() * 20),
      description: `${activity} institutional OTC activity`
    });
  }
  
  // Generate algorithmic trading patterns
  const algorithmicPatterns = [
    {
      type: 'TWAP Execution',
      description: 'Time-weighted average price algorithm detected splitting large order',
      frequency: '15-minute intervals',
      confidence: 89,
      significance: 'High',
      timeframe: '4-6 hours',
      impact: 'Low slippage'
    },
    {
      type: 'Iceberg Orders',
      description: 'Large hidden orders revealed through small visible tranches',
      frequency: 'Every 2-3 trades',
      confidence: 76,
      significance: 'Medium',
      timeframe: '1-2 hours', 
      impact: 'Price support/resistance'
    },
    {
      type: 'Market Making Bot',
      description: 'Automated liquidity provision with tight bid-ask spreads',
      frequency: 'Continuous',
      confidence: 94,
      significance: 'High',
      timeframe: 'Ongoing',
      impact: 'Reduced volatility'
    },
    {
      type: 'Arbitrage Bot',
      description: 'Cross-protocol arbitrage opportunities being systematically captured',
      frequency: 'When opportunity arises',
      confidence: 82,
      significance: 'Medium',
      timeframe: 'Seconds',
      impact: 'Price convergence'
    },
    {
      type: 'Momentum Algorithm',
      description: 'Trend-following algorithm increasing position size on breakouts',
      frequency: 'On trend signals',
      confidence: 67,
      significance: 'Medium',
      timeframe: '30 minutes - 2 hours',
      impact: 'Trend amplification'
    },
    {
      type: 'Mean Reversion Bot',
      description: 'Algorithm buying dips and selling rallies around moving averages',
      frequency: 'At extreme deviations',
      confidence: 73,
      significance: 'Low',
      timeframe: '15-45 minutes',
      impact: 'Range-bound support'
    }
  ];
  
  // Calculate metrics
  const totalSmartMoney = smartMoneyFlow.reduce((sum, flow) => sum + Math.abs(flow.net), 0);
  const netFlow = smartMoneyFlow.reduce((sum, flow) => sum + flow.net, 0) / smartMoneyFlow.length;
  const whaleCount = whaleTransactions.filter(tx => tx.value > 1000000).length;
  
  const metrics = {
    smartMoneyActivity: totalSmartMoney > 300 ? 'High' : totalSmartMoney > 150 ? 'Medium' : 'Low',
    activityChange: Math.floor(-10 + Math.random() * 40), // -10% to +30%
    whaleCount,
    netFlow: netFlow / 50, // Normalize to -1 to 1
    institutionalScore: Math.floor(65 + Math.random() * 30),
    tvlGrowth: Math.floor(15 + Math.random() * 20),
    avgWhaleSize: (whaleTransactions.reduce((sum, tx) => sum + tx.value, 0) / whaleTransactions.length / 1000000).toFixed(1),
    darkPoolShare: Math.floor(10 + Math.random() * 20),
    algoShare: Math.floor(60 + Math.random() * 20)
  };
  
  return {
    footprint: footprint.slice(-20), // Last 20 data points
    whaleTransactions: whaleTransactions.sort((a, b) => b.value - a.value).slice(0, 8),
    smartMoneyFlow,
    darkPool: darkPool.sort((a, b) => b.volume - a.volume),
    algorithmic: algorithmicPatterns,
    metrics,
    _meta: { lastTimestamp: now, lastPrice: basePrice }
  };
};

const determineWalletType = (value) => {
  if (value > 10000000) return 'Institutional Fund';
  if (value > 5000000) return 'Whale Trader';
  if (value > 1000000) return 'High Net Worth';
  return 'Large Retail';
};

export const detectInstitutionalPatterns = (transactionData) => {
  const patterns = [];
  
  // TWAP pattern detection
  const timeIntervals = groupTransactionsByTime(transactionData, 15); // 15-minute intervals
  
  timeIntervals.forEach(interval => {
    if (interval.transactions.length > 5 && interval.volumeConsistency > 0.7) {
      patterns.push({
        type: 'TWAP',
        confidence: interval.volumeConsistency * 100,
        timeframe: `${interval.duration} minutes`,
        impact: 'Systematic execution reducing market impact'
      });
    }
  });
  
  // Iceberg order detection
  const orderSizes = transactionData.map(tx => tx.size);
  const avgSize = orderSizes.reduce((sum, size) => sum + size, 0) / orderSizes.length;
  
  const suspiciousPatterns = orderSizes.filter(size => 
    size < avgSize * 0.3 && // Small visible size
    transactionData.filter(tx => tx.size === size).length > 3 // Repeated
  );
  
  if (suspiciousPatterns.length > 0) {
    patterns.push({
      type: 'Iceberg',
      confidence: 75,
      timeframe: 'Variable',
      impact: 'Hidden liquidity providing support/resistance'
    });
  }
  
  return patterns;
};

export const calculateInstitutionalScore = (footprintData, whaleTransactions, flowData) => {
  let score = 0;
  let factors = [];
  
  // Factor 1: Whale transaction frequency (0-25 points)
  const whaleFrequency = whaleTransactions.length / 24; // Per hour
  const whaleScore = Math.min(25, whaleFrequency * 10);
  score += whaleScore;
  factors.push({ name: 'Whale Activity', score: whaleScore, weight: 25 });
  
  // Factor 2: Smart money flow consistency (0-25 points)
  const flowConsistency = calculateFlowConsistency(flowData);
  const flowScore = flowConsistency * 25;
  score += flowScore;
  factors.push({ name: 'Flow Consistency', score: flowScore, weight: 25 });
  
  // Factor 3: Volume clustering (0-25 points)
  const volumeClustering = calculateVolumeClustering(footprintData);
  const volumeScore = volumeClustering * 25;
  score += volumeScore;
  factors.push({ name: 'Volume Clustering', score: volumeScore, weight: 25 });
  
  // Factor 4: Time-based patterns (0-25 points)
  const timePatterns = detectTimeBasedPatterns(footprintData);
  const timeScore = timePatterns * 25;
  score += timeScore;
  factors.push({ name: 'Time Patterns', score: timeScore, weight: 25 });
  
  return {
    totalScore: Math.round(score),
    factors,
    interpretation: score > 80 ? 'Very High Institutional Activity' :
                   score > 60 ? 'High Institutional Activity' :
                   score > 40 ? 'Moderate Institutional Activity' :
                   'Low Institutional Activity'
  };
};

const groupTransactionsByTime = (transactions, intervalMinutes) => {
  const intervals = [];
  const intervalMs = intervalMinutes * 60 * 1000;
  
  // Group transactions into time intervals
  const groupedTx = transactions.reduce((groups, tx) => {
    const intervalStart = Math.floor(new Date(tx.time).getTime() / intervalMs) * intervalMs;
    if (!groups[intervalStart]) {
      groups[intervalStart] = [];
    }
    groups[intervalStart].push(tx);
    return groups;
  }, {});
  
  // Analyze each interval
  Object.entries(groupedTx).forEach(([timestamp, txs]) => {
    const sizes = txs.map(tx => tx.size);
    const avgSize = sizes.reduce((sum, size) => sum + size, 0) / sizes.length;
    const variance = sizes.reduce((sum, size) => sum + Math.pow(size - avgSize, 2), 0) / sizes.length;
    const volumeConsistency = 1 - (Math.sqrt(variance) / avgSize); // Lower variance = higher consistency
    
    intervals.push({
      timestamp: parseInt(timestamp),
      transactions: txs,
      duration: intervalMinutes,
      volumeConsistency: Math.max(0, Math.min(1, volumeConsistency))
    });
  });
  
  return intervals;
};

const calculateFlowConsistency = (flowData) => {
  const netFlows = flowData.map(d => d.net);
  const avgFlow = netFlows.reduce((sum, flow) => sum + flow, 0) / netFlows.length;
  const variance = netFlows.reduce((sum, flow) => sum + Math.pow(flow - avgFlow, 2), 0) / netFlows.length;
  
  // Normalize consistency score (lower variance = higher consistency)
  return Math.max(0, 1 - (Math.sqrt(variance) / 50));
};

const calculateVolumeClustering = (footprintData) => {
  const volumes = footprintData.map(d => d.volume);
  const totalVolume = volumes.reduce((sum, vol) => sum + vol, 0);
  
  // Calculate Gini coefficient for volume distribution
  volumes.sort((a, b) => a - b);
  let cumulativeVolume = 0;
  let giniSum = 0;
  
  volumes.forEach((volume, index) => {
    cumulativeVolume += volume;
    giniSum += (2 * (index + 1) - volumes.length - 1) * volume;
  });
  
  const gini = giniSum / (volumes.length * totalVolume);
  return Math.abs(gini); // Higher Gini = more clustering = more institutional
};

const detectTimeBasedPatterns = (footprintData) => {
  // Analyze if high-volume transactions cluster around specific times
  const hourlyVolume = {};
  
  footprintData.forEach(point => {
    const hour = new Date().getHours(); // Simplified for demo
    if (!hourlyVolume[hour]) hourlyVolume[hour] = [];
    hourlyVolume[hour].push(point.volume);
  });
  
  const hourlyAvgs = Object.entries(hourlyVolume).map(([hour, volumes]) => ({
    hour: parseInt(hour),
    avgVolume: volumes.reduce((sum, vol) => sum + vol, 0) / volumes.length
  }));
  
  const totalAvg = hourlyAvgs.reduce((sum, h) => sum + h.avgVolume, 0) / hourlyAvgs.length;
  const significantHours = hourlyAvgs.filter(h => h.avgVolume > totalAvg * 1.5).length;
  
  return significantHours / 24; // Proportion of hours with significant activity
};