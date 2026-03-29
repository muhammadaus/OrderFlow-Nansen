const MAX_GAS_POINTS = 20;
const UPDATE_INTERVAL = 3 * 60 * 1000; // 3 minutes

/**
 * Scan MEV opportunities with incremental update support
 * @param {object|null} existingData - Previous data for incremental update
 * @returns {object} MEV opportunities analysis
 */
export const scanMEVOpportunities = (existingData = null) => {
  const now = Date.now();

  // Incremental update
  if (existingData && existingData._meta) {
    const timeSinceLast = now - existingData._meta.lastTimestamp;

    if (timeSinceLast < UPDATE_INTERVAL) {
      return existingData;
    }

    // Update gas data with new point
    const { gasData, _meta } = existingData;
    let baseGas = _meta.lastGas || gasData[gasData.length - 1]?.gasPrice || 45;

    const newGasData = [...gasData.slice(-MAX_GAS_POINTS + 1)];
    const time = new Date(now).toLocaleTimeString();
    const gasChange = (Math.random() - 0.5) * 20;
    baseGas = Math.max(20, Math.min(200, baseGas + gasChange));

    newGasData.push({
      time,
      gasPrice: Math.round(baseGas),
      description: `Network congestion: ${baseGas > 80 ? 'High' : baseGas > 50 ? 'Medium' : 'Low'}`
    });

    // Occasionally refresh opportunities (20% chance)
    let opportunities = existingData.opportunities;
    let arbitrage = existingData.arbitrage;
    let flashLoans = existingData.flashLoans;
    let sandwichAttacks = existingData.sandwichAttacks;

    if (Math.random() > 0.8) {
      // Refresh one random opportunity
      const idx = Math.floor(Math.random() * opportunities.length);
      if (opportunities[idx]) {
        opportunities = [...opportunities];
        opportunities[idx] = {
          ...opportunities[idx],
          estimatedProfit: opportunities[idx].estimatedProfit * (0.9 + Math.random() * 0.2),
          status: Math.random() > 0.3 ? 'active' : 'monitoring'
        };
      }
    }

    // Recalculate metrics
    const totalProfit = opportunities.reduce((sum, op) => sum + op.estimatedProfit, 0);
    const avgGas = newGasData.reduce((sum, g) => sum + g.gasPrice, 0) / newGasData.length;
    const gasChangePercent = ((newGasData[newGasData.length - 1].gasPrice - newGasData[0].gasPrice) / newGasData[0].gasPrice) * 100;

    const metrics = {
      totalOpportunities: opportunities.length,
      activeOpportunities: opportunities.filter(op => op.status === 'active').length,
      totalPotentialProfit: totalProfit,
      currentGas: newGasData[newGasData.length - 1]?.gasPrice || 45,
      gasChange: Math.round(gasChangePercent),
      gasLow: Math.min(...newGasData.map(g => g.gasPrice)),
      gasHigh: Math.max(...newGasData.map(g => g.gasPrice)),
      successRate: 73,
      competitionLevel: 'High',
      activeBots: 247 + Math.floor(Math.random() * 20 - 10),
      blockspaceUsage: 40 + Math.floor(Math.random() * 10)
    };

    return {
      opportunities,
      arbitrage,
      flashLoans,
      gasData: newGasData,
      sandwichAttacks,
      metrics,
      _meta: { lastTimestamp: now, lastGas: baseGas }
    };
  }

  // First call: generate initial data
  const opportunities = [];
  const arbitrage = [];
  const flashLoans = [];
  const gasData = [];
  const sandwichAttacks = [];

  // Generate MEV opportunities
  const mevTypes = ['arbitrage', 'sandwich', 'liquidation', 'frontrun'];
  const protocols = ['Uniswap V3', 'Balancer', 'Curve', 'SushiSwap', 'PancakeSwap'];
  
  for (let i = 0; i < 8; i++) {
    const type = mevTypes[Math.floor(Math.random() * mevTypes.length)];
    const protocol = protocols[Math.floor(Math.random() * protocols.length)];
    
    let estimatedProfit = 0;
    let risk = 'Medium';
    let description = '';
    
    switch (type) {
      case 'arbitrage':
        estimatedProfit = 200 + Math.random() * 1500;
        risk = estimatedProfit > 1000 ? 'Low' : 'Medium';
        description = `Price difference between ${protocol} and competitor DEX`;
        break;
      case 'sandwich':
        estimatedProfit = 500 + Math.random() * 2000;
        risk = 'High';
        description = `Large transaction detected on ${protocol} - frontrun opportunity`;
        break;
      case 'liquidation':
        estimatedProfit = 800 + Math.random() * 5000;
        risk = 'Medium';
        description = `Undercollateralized position ready for liquidation on ${protocol}`;
        break;
      case 'frontrun':
        estimatedProfit = 100 + Math.random() * 800;
        risk = 'High';
        description = `Transaction ordering opportunity on ${protocol}`;
        break;
    }
    
    opportunities.push({
      id: i + 1,
      type,
      protocol,
      estimatedProfit,
      risk,
      description,
      status: Math.random() > 0.3 ? 'active' : 'monitoring',
      timeWindow: Math.floor(2 + Math.random() * 15), // minutes
      gasRequired: Math.floor(150000 + Math.random() * 300000),
      successProbability: Math.floor(60 + Math.random() * 35)
    });
  }
  
  // Generate arbitrage opportunities
  const pairs = ['ETH/USDC', 'WBTC/ETH', 'DAI/USDC', 'USDT/USDC', 'LINK/ETH'];
  const exchanges = ['Uniswap', 'SushiSwap', 'Balancer', 'Curve', '1inch'];
  
  for (let i = 0; i < 6; i++) {
    const pair = pairs[Math.floor(Math.random() * pairs.length)];
    const exchange1 = exchanges[Math.floor(Math.random() * exchanges.length)];
    let exchange2 = exchanges[Math.floor(Math.random() * exchanges.length)];
    while (exchange2 === exchange1) {
      exchange2 = exchanges[Math.floor(Math.random() * exchanges.length)];
    }
    
    const spread = 0.1 + Math.random() * 2.5; // 0.1% to 2.6% spread
    const volume = 10000 + Math.random() * 90000;
    const profit = volume * (spread / 100);
    
    arbitrage.push({
      pair,
      exchange1,
      exchange2,
      spread,
      volume,
      profit,
      description: `${spread.toFixed(2)}% price difference between exchanges`
    });
  }
  
  // Generate flash loan opportunities
  const flashLoanStrategies = [
    'Arbitrage ETH/USDC across 3 DEXs',
    'Liquidation on Compound + Aave',
    'Collateral swap optimization',
    'Debt refinancing arbitrage',
    'Yield farming position rebalance',
    'Cross-protocol lending arbitrage'
  ];
  
  const assets = ['ETH', 'USDC', 'DAI', 'WBTC', 'USDT'];
  const protocolsFL = ['Aave', 'dYdX', 'Balancer', 'Uniswap V3'];
  
  for (let i = 0; i < 6; i++) {
    const strategy = flashLoanStrategies[Math.floor(Math.random() * flashLoanStrategies.length)];
    const asset = assets[Math.floor(Math.random() * assets.length)];
    const protocol = protocolsFL[Math.floor(Math.random() * protocolsFL.length)];
    
    const potential = 300 + Math.random() * 2000;
    const risk = potential > 1500 ? 'High' : potential > 800 ? 'Medium' : 'Low';
    
    flashLoans.push({
      strategy,
      asset,
      protocol,
      potential,
      risk,
      timeWindow: Math.floor(5 + Math.random() * 20),
      description: `${strategy} using ${asset} flash loan from ${protocol}`
    });
  }
  
  // Generate gas price data
  let baseGas = 45;
  for (let i = 0; i < 20; i++) {
    const time = new Date(Date.now() - (20 - i) * 3 * 60 * 1000).toLocaleTimeString();
    const gasChange = (Math.random() - 0.5) * 20; // ±10 gwei change
    baseGas = Math.max(20, Math.min(200, baseGas + gasChange));
    
    gasData.push({
      time,
      gasPrice: Math.round(baseGas),
      description: `Network congestion: ${baseGas > 80 ? 'High' : baseGas > 50 ? 'Medium' : 'Low'}`
    });
  }
  
  // Generate sandwich attack opportunities
  for (let i = 0; i < 4; i++) {
    const volume = 50000 + Math.random() * 500000;
    const slippage = 1 + Math.random() * 5; // 1-6% slippage
    const profit = volume * (slippage / 100) * 0.3; // 30% of slippage capture
    
    sandwichAttacks.push({
      targetTx: `Large ${pairs[Math.floor(Math.random() * pairs.length)]} swap`,
      volume,
      slippage,
      profit,
      gasNeeded: Math.floor(45 + slippage * 5),
      risk: slippage > 3 ? 'Low' : 'Medium',
      successRate: Math.floor(85 - slippage * 5),
      timeToExecution: Math.floor(1 + Math.random() * 3) // blocks
    });
  }
  
  // Calculate metrics
  const totalProfit = opportunities.reduce((sum, op) => sum + op.estimatedProfit, 0);
  const avgGas = gasData.reduce((sum, g) => sum + g.gasPrice, 0) / gasData.length;
  const gasChange = ((gasData[gasData.length - 1].gasPrice - gasData[0].gasPrice) / gasData[0].gasPrice) * 100;
  
  const metrics = {
    totalOpportunities: opportunities.length,
    activeOpportunities: opportunities.filter(op => op.status === 'active').length,
    totalPotentialProfit: totalProfit,
    currentGas: gasData[gasData.length - 1]?.gasPrice || 45,
    gasChange: Math.round(gasChange),
    gasLow: Math.min(...gasData.map(g => g.gasPrice)),
    gasHigh: Math.max(...gasData.map(g => g.gasPrice)),
    successRate: 73,
    competitionLevel: 'High',
    activeBots: 247,
    blockspaceUsage: 40
  };
  
  return {
    opportunities: opportunities.sort((a, b) => b.estimatedProfit - a.estimatedProfit),
    arbitrage: arbitrage.sort((a, b) => b.profit - a.profit),
    flashLoans: flashLoans.sort((a, b) => b.potential - a.potential),
    gasData,
    sandwichAttacks: sandwichAttacks.sort((a, b) => b.profit - a.profit),
    metrics,
    _meta: { lastTimestamp: now, lastGas: baseGas }
  };
};

export const calculateMEVProfitability = (opportunity, gasPrice, competitionLevel) => {
  const baseProfit = opportunity.estimatedProfit;
  const gasCost = (opportunity.gasRequired / 1000000) * gasPrice * 30; // Rough ETH price
  
  // Competition factor reduces profitability
  const competitionMultiplier = competitionLevel === 'High' ? 0.6 : 
                               competitionLevel === 'Medium' ? 0.8 : 1.0;
  
  const netProfit = (baseProfit - gasCost) * competitionMultiplier;
  
  return {
    grossProfit: baseProfit,
    gasCost,
    netProfit: Math.max(0, netProfit),
    profitMargin: netProfit / baseProfit,
    recommendedAction: netProfit > 100 ? 'Execute' : netProfit > 50 ? 'Monitor' : 'Skip'
  };
};

export const detectSandwichOpportunities = (mempool) => {
  // Simulate mempool transaction analysis
  const largeTrades = mempool.filter(tx => 
    tx.value > 50000 && 
    tx.slippage > 1 && 
    tx.type === 'swap'
  );
  
  return largeTrades.map(trade => ({
    hash: trade.hash,
    frontrunProfit: trade.value * (trade.slippage / 100) * 0.4,
    backrunProfit: trade.value * (trade.slippage / 100) * 0.3,
    totalProfit: trade.value * (trade.slippage / 100) * 0.7,
    gasRequired: 200000 + (trade.value / 1000),
    risk: trade.slippage > 3 ? 'Low' : 'Medium',
    timeWindow: 1 // blocks
  }));
};

export const optimizeGasStrategy = (opportunities, currentGasPrice, gasHistory) => {
  // Analyze gas price trends
  const gasTrend = gasHistory.slice(-5).reduce((trend, current, idx, arr) => {
    if (idx === 0) return 0;
    return trend + (current.gasPrice - arr[idx - 1].gasPrice);
  }, 0) / 4;
  
  // Recommend gas strategy
  const strategy = {
    currentPrice: currentGasPrice,
    trend: gasTrend > 5 ? 'Rising Fast' : gasTrend > 0 ? 'Rising' : gasTrend < -5 ? 'Falling Fast' : 'Stable',
    recommendations: []
  };
  
  opportunities.forEach(op => {
    const profitability = calculateMEVProfitability(op, currentGasPrice, 'High');
    
    if (profitability.netProfit > 200) {
      strategy.recommendations.push({
        opportunity: op.id,
        action: 'Execute immediately',
        gasPrice: currentGasPrice + 5, // Slight premium for faster execution
        reasoning: 'High profitability, execute before competition'
      });
    } else if (profitability.netProfit > 100 && gasTrend <= 0) {
      strategy.recommendations.push({
        opportunity: op.id,
        action: 'Execute if gas drops',
        gasPrice: currentGasPrice - 5,
        reasoning: 'Profitable if gas price decreases'
      });
    } else {
      strategy.recommendations.push({
        opportunity: op.id,
        action: 'Monitor',
        reasoning: 'Wait for better conditions'
      });
    }
  });
  
  return strategy;
};