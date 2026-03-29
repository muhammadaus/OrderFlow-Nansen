// Absorption Flow Analysis
// Real-time passive vs aggressive order comparison

const MAX_FLOW_POINTS = 61;
const INTERVAL_MS = 60 * 1000; // 1 minute

/**
 * Analyze absorption flow with incremental update support
 * @param {object|null} existingData - Previous data for incremental update
 * @returns {object} Absorption flow analysis
 */
export const analyzeAbsorptionFlow = (existingData = null) => {
  const now = Date.now();

  // Incremental update
  if (existingData && existingData._meta) {
    const timeSinceLast = now - existingData._meta.lastTimestamp;

    if (timeSinceLast < INTERVAL_MS) {
      return existingData;
    }

    const { flowData, _meta } = existingData;
    let cumulativeAggressive = _meta.cumulativeAggressive;
    let cumulativePassive = _meta.cumulativePassive;

    const pointsToAdd = Math.min(Math.floor(timeSinceLast / INTERVAL_MS), 3);
    const newFlowData = [...flowData];

    for (let i = 1; i <= pointsToAdd; i++) {
      const timestamp = _meta.lastTimestamp + i * INTERVAL_MS;
      const time = new Date(timestamp).toLocaleTimeString();

      const regime = Math.floor(timestamp / (15 * INTERVAL_MS)) % 4;
      let aggressiveBias = 1.0, passiveBias = 1.0;

      switch (regime) {
        case 0: aggressiveBias = 1.4; passiveBias = 0.8; break;
        case 1: aggressiveBias = 0.8; passiveBias = 1.5; break;
        case 2: aggressiveBias = 1.0; passiveBias = 1.0; break;
        case 3: aggressiveBias = 1.3; passiveBias = 1.3; break;
      }

      const baseVolume = 2000 + Math.random() * 3000;
      const aggressiveBuys = Math.round(baseVolume * (0.4 + Math.random() * 0.3) * aggressiveBias);
      const aggressiveSells = Math.round(baseVolume * (0.4 + Math.random() * 0.3) * aggressiveBias);
      const passiveBids = Math.round(baseVolume * (0.3 + Math.random() * 0.3) * passiveBias);
      const passiveAsks = Math.round(baseVolume * (0.3 + Math.random() * 0.3) * passiveBias);

      const totalAggressive = aggressiveBuys + aggressiveSells;
      const totalPassive = passiveBids + passiveAsks;
      const total = totalAggressive + totalPassive;

      cumulativeAggressive += totalAggressive;
      cumulativePassive += totalPassive;

      const absorptionRatio = total > 0 ? totalPassive / total : 0.5;
      const aggressiveNet = aggressiveBuys - aggressiveSells;
      const passiveNet = passiveBids - passiveAsks;

      let winner = 'neutral';
      if (absorptionRatio > 0.55 && Math.abs(passiveNet) > Math.abs(aggressiveNet)) winner = 'passive';
      else if (absorptionRatio < 0.45 && Math.abs(aggressiveNet) > totalPassive * 0.3) winner = 'initiative';

      newFlowData.push({
        time, timestamp: timestamp / 1000,
        aggressiveBuys, aggressiveSells, passiveBids, passiveAsks,
        totalAggressive, totalPassive, aggressiveNet, passiveNet,
        absorptionRatio: parseFloat(absorptionRatio.toFixed(2)),
        winner, cumulativeAggressive, cumulativePassive
      });
    }

    const finalFlowData = newFlowData.slice(-MAX_FLOW_POINTS);

    // Recalculate metrics
    const recentFlow = finalFlowData.slice(-10);
    const currentAbsorption = recentFlow.reduce((s, f) => s + f.absorptionRatio, 0) / recentFlow.length;
    const passiveWins = recentFlow.filter(f => f.winner === 'passive').length;
    const initiativeWins = recentFlow.filter(f => f.winner === 'initiative').length;

    let winningParticipant = 'neutral';
    if (passiveWins > initiativeWins + 2) winningParticipant = 'passive';
    else if (initiativeWins > passiveWins + 2) winningParticipant = 'initiative';

    const prediction = existingData.prediction; // Keep existing prediction

    return {
      flowData: finalFlowData,
      currentRatio: parseFloat(currentAbsorption.toFixed(2)),
      winningParticipant,
      prediction,
      metrics: existingData.metrics,
      interpretation: existingData.interpretation,
      _meta: { lastTimestamp: now, cumulativeAggressive, cumulativePassive }
    };
  }

  // First call: generate initial data
  const flowData = [];

  let cumulativeAggressive = 0;
  let cumulativePassive = 0;

  for (let i = 60; i >= 0; i--) {
    const time = new Date(now - i * 60 * 1000).toLocaleTimeString();
    const timestamp = (now - i * 60 * 1000) / 1000;

    // Simulate market regimes
    const regime = Math.floor(i / 15);
    let aggressiveBias, passiveBias;

    switch (regime % 4) {
      case 0: // Initiative winning (trending)
        aggressiveBias = 1.4;
        passiveBias = 0.8;
        break;
      case 1: // Passive winning (absorption/reversal)
        aggressiveBias = 0.8;
        passiveBias = 1.5;
        break;
      case 2: // Balanced
        aggressiveBias = 1.0;
        passiveBias = 1.0;
        break;
      case 3: // High volatility (both active)
        aggressiveBias = 1.3;
        passiveBias = 1.3;
        break;
    }

    // Generate flow volumes
    const baseVolume = 2000 + Math.random() * 3000;

    const aggressiveBuys = Math.round(baseVolume * (0.4 + Math.random() * 0.3) * aggressiveBias);
    const aggressiveSells = Math.round(baseVolume * (0.4 + Math.random() * 0.3) * aggressiveBias);
    const passiveBids = Math.round(baseVolume * (0.3 + Math.random() * 0.3) * passiveBias);
    const passiveAsks = Math.round(baseVolume * (0.3 + Math.random() * 0.3) * passiveBias);

    const totalAggressive = aggressiveBuys + aggressiveSells;
    const totalPassive = passiveBids + passiveAsks;
    const total = totalAggressive + totalPassive;

    cumulativeAggressive += totalAggressive;
    cumulativePassive += totalPassive;

    // Calculate absorption ratio (higher = more passive absorption)
    const absorptionRatio = total > 0 ? totalPassive / total : 0.5;

    // Determine winner
    const aggressiveNet = aggressiveBuys - aggressiveSells;
    const passiveNet = passiveBids - passiveAsks;

    let winner;
    if (absorptionRatio > 0.55 && Math.abs(passiveNet) > Math.abs(aggressiveNet)) {
      winner = 'passive';
    } else if (absorptionRatio < 0.45 && Math.abs(aggressiveNet) > totalPassive * 0.3) {
      winner = 'initiative';
    } else {
      winner = 'neutral';
    }

    flowData.push({
      time,
      timestamp,
      aggressiveBuys,
      aggressiveSells,
      passiveBids,
      passiveAsks,
      totalAggressive,
      totalPassive,
      aggressiveNet,
      passiveNet,
      absorptionRatio: parseFloat(absorptionRatio.toFixed(2)),
      winner,
      cumulativeAggressive,
      cumulativePassive
    });
  }

  // Calculate current metrics
  const recentFlow = flowData.slice(-10);
  const currentAbsorption = recentFlow.reduce((s, f) => s + f.absorptionRatio, 0) / recentFlow.length;

  // Determine overall winner
  const passiveWins = recentFlow.filter(f => f.winner === 'passive').length;
  const initiativeWins = recentFlow.filter(f => f.winner === 'initiative').length;

  let winningParticipant;
  if (passiveWins > initiativeWins + 2) {
    winningParticipant = 'passive';
  } else if (initiativeWins > passiveWins + 2) {
    winningParticipant = 'initiative';
  } else {
    winningParticipant = 'neutral';
  }

  // Generate prediction
  let prediction;
  if (winningParticipant === 'passive' && currentAbsorption > 0.55) {
    prediction = {
      direction: recentFlow[recentFlow.length - 1].passiveNet > 0 ? 'up' : 'down',
      confidence: Math.round(50 + currentAbsorption * 40),
      reasoning: 'Passive liquidity absorbing aggressive orders - likely reversal',
      timeframe: '15-30 minutes'
    };
  } else if (winningParticipant === 'initiative') {
    const netDirection = recentFlow[recentFlow.length - 1].aggressiveNet > 0;
    prediction = {
      direction: netDirection ? 'up' : 'down',
      confidence: Math.round(40 + (1 - currentAbsorption) * 40),
      reasoning: 'Initiative traders driving price - trend continuation likely',
      timeframe: '15-30 minutes'
    };
  } else {
    prediction = {
      direction: 'neutral',
      confidence: 30,
      reasoning: 'Balance between passive and aggressive - no clear direction',
      timeframe: 'Wait for imbalance'
    };
  }

  // Calculate aggregate metrics
  const totalAggressiveBuys = flowData.reduce((s, f) => s + f.aggressiveBuys, 0);
  const totalAggressiveSells = flowData.reduce((s, f) => s + f.aggressiveSells, 0);
  const totalPassiveBids = flowData.reduce((s, f) => s + f.passiveBids, 0);
  const totalPassiveAsks = flowData.reduce((s, f) => s + f.passiveAsks, 0);

  return {
    flowData,
    currentRatio: parseFloat(currentAbsorption.toFixed(2)),
    winningParticipant,
    prediction,
    metrics: {
      aggressiveBuys: totalAggressiveBuys,
      aggressiveSells: totalAggressiveSells,
      passiveBids: totalPassiveBids,
      passiveAsks: totalPassiveAsks,
      netAggressive: totalAggressiveBuys - totalAggressiveSells,
      netPassive: totalPassiveBids - totalPassiveAsks,
      avgAbsorptionRatio: parseFloat((flowData.reduce((s, f) => s + f.absorptionRatio, 0) / flowData.length).toFixed(2)),
      passiveWinRate: Math.round((passiveWins / recentFlow.length) * 100),
      initiativeWinRate: Math.round((initiativeWins / recentFlow.length) * 100)
    },
    interpretation: {
      absorptionHigh: currentAbsorption > 0.55,
      absorptionLow: currentAbsorption < 0.45,
      description: currentAbsorption > 0.55
        ? 'High absorption - passive traders dominating, reversal conditions'
        : currentAbsorption < 0.45
        ? 'Low absorption - aggressive traders in control, trend continuation'
        : 'Balanced flow - wait for clear imbalance',
      tradingTip: winningParticipant === 'passive'
        ? 'Look for reversal setups - aggressive traders are failing'
        : winningParticipant === 'initiative'
        ? 'Trade with momentum - initiative traders driving price'
        : 'No edge - wait for clearer signal'
    },
    _meta: { lastTimestamp: now, cumulativeAggressive, cumulativePassive }
  };
};

export const calculateAbsorptionRatio = (aggressive, passive) => {
  const total = aggressive + passive;
  if (total === 0) return 0.5;

  return passive / total;
};

export const determineWinner = (flowData, lookback = 10) => {
  const recent = flowData.slice(-lookback);

  const passiveScore = recent.reduce((s, f) => s + (f.winner === 'passive' ? 1 : 0), 0);
  const initiativeScore = recent.reduce((s, f) => s + (f.winner === 'initiative' ? 1 : 0), 0);

  if (passiveScore > initiativeScore + 2) return 'passive';
  if (initiativeScore > passiveScore + 2) return 'initiative';
  return 'neutral';
};
