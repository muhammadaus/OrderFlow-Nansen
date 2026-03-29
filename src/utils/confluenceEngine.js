// Orderflow Confluence Engine
// Synthesizes all signals with reliability ranking

// Signal weight hierarchy (as per orderflow theory)
export const SIGNAL_WEIGHTS = {
  'absorption_divergence': 100,    // Highest reliability - direct failure of initiative
  'delta_divergence': 95,          // Aggression failure detection
  'sweep_rejection': 85,           // Forced participation + absorption
  'sweep_continuation': 40,        // Sweep without absorption (lower weight)
  'volume_acceptance': 70,         // Time-based validation (HVN/LVN)
  'cvd_trend_break': 55,           // Participation regime shift
  'imbalance_cluster': 40,         // Auction mechanics
  'sr_level': 25,                  // Pure S/R - memory, not causality
  'funding_extreme': 45,           // Derivatives signal
  'oi_divergence': 50              // Open interest divergence
};

export const calculateConfluence = (allSignals) => {
  if (!allSignals || allSignals.length === 0) {
    return {
      signals: [],
      confluenceScore: 0,
      direction: 'neutral',
      confidence: 0,
      tradeThesis: null,
      matrix: []
    };
  }

  // Calculate weighted score
  let bullishScore = 0;
  let bearishScore = 0;
  let totalWeight = 0;

  for (const signal of allSignals) {
    const weight = SIGNAL_WEIGHTS[signal.type] || 30;
    totalWeight += weight;

    if (signal.direction === 'bullish') {
      bullishScore += weight * (signal.strength / 100);
    } else if (signal.direction === 'bearish') {
      bearishScore += weight * (signal.strength / 100);
    }
  }

  const netScore = bullishScore - bearishScore;
  const maxPossibleScore = totalWeight;
  const normalizedScore = maxPossibleScore > 0 ? (netScore / maxPossibleScore) * 100 : 0;

  // Determine direction and confidence
  let direction, confidence;
  if (normalizedScore > 15) {
    direction = 'bullish';
    confidence = Math.min(95, 50 + normalizedScore);
  } else if (normalizedScore < -15) {
    direction = 'bearish';
    confidence = Math.min(95, 50 + Math.abs(normalizedScore));
  } else {
    direction = 'neutral';
    confidence = 30 + Math.abs(normalizedScore);
  }

  // Generate trade thesis
  const topSignals = [...allSignals]
    .sort((a, b) => (SIGNAL_WEIGHTS[b.type] || 30) - (SIGNAL_WEIGHTS[a.type] || 30))
    .slice(0, 3);

  const conflictingSignals = allSignals.filter(s =>
    (direction === 'bullish' && s.direction === 'bearish') ||
    (direction === 'bearish' && s.direction === 'bullish')
  );

  const currentPrice = 2800; // Would come from real data

  const tradeThesis = direction !== 'neutral' ? {
    direction,
    entry: direction === 'bullish'
      ? currentPrice * 0.998
      : currentPrice * 1.002,
    stop: direction === 'bullish'
      ? currentPrice * 0.985
      : currentPrice * 1.015,
    target: direction === 'bullish'
      ? currentPrice * 1.025
      : currentPrice * 0.975,
    riskReward: '1:1.67',
    reasoning: topSignals.map(s => s.description),
    warnings: conflictingSignals.length > 0
      ? [`${conflictingSignals.length} conflicting signal(s) present - reduce position size`]
      : [],
    confidence: Math.round(confidence),
    timeframe: confidence > 70 ? '1-4 hours' : '4-12 hours'
  } : null;

  // Build signal matrix for visualization
  const matrix = Object.keys(SIGNAL_WEIGHTS).map(signalType => {
    const matchingSignals = allSignals.filter(s => s.type === signalType);
    const hasSignal = matchingSignals.length > 0;
    const signalData = hasSignal ? matchingSignals[0] : null;

    return {
      type: signalType,
      weight: SIGNAL_WEIGHTS[signalType],
      active: hasSignal,
      direction: signalData?.direction || 'neutral',
      strength: signalData?.strength || 0,
      source: signalData?.source || '',
      description: signalData?.description || ''
    };
  }).sort((a, b) => b.weight - a.weight);

  return {
    signals: allSignals,
    confluenceScore: Math.round(Math.abs(normalizedScore)),
    direction,
    confidence: Math.round(confidence),
    tradeThesis,
    matrix,
    metrics: {
      bullishWeight: Math.round(bullishScore),
      bearishWeight: Math.round(bearishScore),
      totalSignals: allSignals.length,
      conflictingSignals: conflictingSignals.length,
      topSignalType: topSignals[0]?.type || 'none'
    }
  };
};

export const generateMockSignals = () => {
  // Generate realistic mock signals from various sources
  const signals = [];
  const now = Date.now();

  // Delta Divergence signals
  if (Math.random() > 0.4) {
    signals.push({
      id: `sig-dd-${now}`,
      type: 'delta_divergence',
      direction: Math.random() > 0.5 ? 'bullish' : 'bearish',
      strength: 60 + Math.random() * 35,
      source: 'DeltaDivergence',
      timestamp: now,
      priceLevel: 2800 + (Math.random() - 0.5) * 50,
      description: 'Aggressive orders being absorbed - divergence detected',
      confidence: 70 + Math.random() * 25
    });
  }

  // Absorption signals
  if (Math.random() > 0.5) {
    signals.push({
      id: `sig-abs-${now}`,
      type: 'absorption_divergence',
      direction: Math.random() > 0.5 ? 'bullish' : 'bearish',
      strength: 65 + Math.random() * 30,
      source: 'AbsorptionFlow',
      timestamp: now,
      priceLevel: 2800 + (Math.random() - 0.5) * 40,
      description: 'Passive liquidity dominating - absorption pattern',
      confidence: 75 + Math.random() * 20
    });
  }

  // Sweep signals
  if (Math.random() > 0.5) {
    const isAbsorbed = Math.random() > 0.3;
    signals.push({
      id: `sig-sw-${now}`,
      type: isAbsorbed ? 'sweep_rejection' : 'sweep_continuation',
      direction: Math.random() > 0.5 ? 'bullish' : 'bearish',
      strength: 55 + Math.random() * 40,
      source: 'LiquiditySweepMonitor',
      timestamp: now,
      priceLevel: 2800 + (Math.random() - 0.5) * 60,
      description: isAbsorbed
        ? 'Liquidity sweep absorbed - reversal signal'
        : 'Liquidity sweep with continuation',
      confidence: 60 + Math.random() * 30
    });
  }

  // CVD Break signals
  if (Math.random() > 0.6) {
    signals.push({
      id: `sig-cvd-${now}`,
      type: 'cvd_trend_break',
      direction: Math.random() > 0.5 ? 'bullish' : 'bearish',
      strength: 50 + Math.random() * 35,
      source: 'CVDTrendBreak',
      timestamp: now,
      priceLevel: 2800 + (Math.random() - 0.5) * 30,
      description: 'CVD structural break detected',
      confidence: 55 + Math.random() * 30
    });
  }

  // Imbalance signals
  if (Math.random() > 0.5) {
    signals.push({
      id: `sig-imb-${now}`,
      type: 'imbalance_cluster',
      direction: Math.random() > 0.5 ? 'bullish' : 'bearish',
      strength: 40 + Math.random() * 40,
      source: 'ImbalanceCluster',
      timestamp: now,
      priceLevel: 2800 + (Math.random() - 0.5) * 20,
      description: 'Stacked imbalances indicating auction failure',
      confidence: 50 + Math.random() * 30
    });
  }

  // Volume acceptance signals
  if (Math.random() > 0.6) {
    signals.push({
      id: `sig-vol-${now}`,
      type: 'volume_acceptance',
      direction: Math.random() > 0.5 ? 'bullish' : 'bearish',
      strength: 50 + Math.random() * 30,
      source: 'VolumeProfile',
      timestamp: now,
      priceLevel: 2800 + (Math.random() - 0.5) * 25,
      description: 'High volume node acceptance zone',
      confidence: 60 + Math.random() * 25
    });
  }

  // S/R signals (lower weight)
  if (Math.random() > 0.4) {
    signals.push({
      id: `sig-sr-${now}`,
      type: 'sr_level',
      direction: Math.random() > 0.5 ? 'bullish' : 'bearish',
      strength: 35 + Math.random() * 35,
      source: 'MarketStructure',
      timestamp: now,
      priceLevel: 2800 + (Math.random() - 0.5) * 40,
      description: 'Price at key support/resistance level',
      confidence: 40 + Math.random() * 30
    });
  }

  return signals;
};

export const generateTradeThesis = (confluenceData, currentPrice) => {
  if (confluenceData.direction === 'neutral') {
    return null;
  }

  const { direction, confidence, signals } = confluenceData;

  // Entry is slightly better than current price
  const entry = direction === 'bullish'
    ? currentPrice * 0.998
    : currentPrice * 1.002;

  // Stop based on confidence level
  const stopDistance = confidence > 70 ? 0.015 : 0.02;
  const stop = direction === 'bullish'
    ? entry * (1 - stopDistance)
    : entry * (1 + stopDistance);

  // Target based on R:R
  const targetDistance = stopDistance * 1.67;
  const target = direction === 'bullish'
    ? entry * (1 + targetDistance)
    : entry * (1 - targetDistance);

  return {
    direction,
    entry: parseFloat(entry.toFixed(2)),
    stop: parseFloat(stop.toFixed(2)),
    target: parseFloat(target.toFixed(2)),
    riskReward: '1:1.67',
    confidence,
    reasoning: signals.slice(0, 3).map(s => s.description),
    warnings: []
  };
};

export const rankSignalReliability = (signals) => {
  return [...signals]
    .map(s => ({
      ...s,
      reliabilityRank: SIGNAL_WEIGHTS[s.type] || 30
    }))
    .sort((a, b) => b.reliabilityRank - a.reliabilityRank);
};

/**
 * Analyze confluence with incremental update support
 * @param {object|null} existingData - Previous data for incremental update
 * @returns {object} Confluence analysis
 */
export const analyzeConfluence = (existingData = null) => {
  const now = Date.now();
  const UPDATE_INTERVAL = 10000; // 10 seconds

  // Incremental update
  if (existingData && existingData._meta) {
    const timeSinceLast = now - existingData._meta.lastTimestamp;

    if (timeSinceLast < UPDATE_INTERVAL) {
      return existingData;
    }

    // Generate some new signals and merge with existing
    const newSignals = generateMockSignals();
    const mergedSignals = [...existingData.signals.slice(-5), ...newSignals.slice(0, 3)];

    const result = calculateConfluence(mergedSignals);
    return {
      ...result,
      _meta: { lastTimestamp: now }
    };
  }

  // First call: generate initial confluence
  const signals = generateMockSignals();
  const result = calculateConfluence(signals);
  return {
    ...result,
    _meta: { lastTimestamp: now }
  };
};
