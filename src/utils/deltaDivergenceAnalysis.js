// Delta Divergence Analysis
// Detects aggression failure - when delta expands but price stalls (passive liquidity absorbing market orders)

const MAX_DATA_POINTS = 101;
const INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Generate a single divergence data point
 */
const generateSingleDivergencePoint = (lastPrice, lastCumulativeDelta, timestamp) => {
  const time = new Date(timestamp).toLocaleTimeString();
  const tsSeconds = timestamp / 1000;

  // Generate price movement with occasional divergence patterns
  const baseMovement = Math.sin(timestamp / 900000) * 0.003 + (Math.random() - 0.5) * 0.008;

  // 15% chance of divergence
  const isDivergenceCandle = Math.random() > 0.85;

  let delta;
  let priceChange;

  if (isDivergenceCandle) {
    const divergenceType = Math.random() > 0.5 ? 'bullish' : 'bearish';
    if (divergenceType === 'bullish') {
      priceChange = -0.002 - Math.random() * 0.003;
      delta = 800 + Math.random() * 1200;
    } else {
      priceChange = 0.002 + Math.random() * 0.003;
      delta = -(800 + Math.random() * 1200);
    }
  } else {
    priceChange = baseMovement;
    delta = priceChange * 50000 + (Math.random() - 0.5) * 400;
  }

  const price = lastPrice * (1 + priceChange);
  const cumulativeDelta = lastCumulativeDelta + delta;
  const volume = 1500 + Math.random() * 2500;
  const aggressionRatio = Math.abs(delta) / volume;
  const absorptionRatio = isDivergenceCandle ? 0.7 + Math.random() * 0.25 : 0.2 + Math.random() * 0.3;

  return {
    time,
    timestamp: tsSeconds,
    price: parseFloat(price.toFixed(2)),
    open: parseFloat((price * (1 - Math.random() * 0.002)).toFixed(2)),
    high: parseFloat((price * (1 + Math.random() * 0.003)).toFixed(2)),
    low: parseFloat((price * (1 - Math.random() * 0.003)).toFixed(2)),
    close: parseFloat(price.toFixed(2)),
    delta: Math.round(delta),
    cumulativeDelta: Math.round(cumulativeDelta),
    volume: Math.round(volume),
    aggressionRatio: parseFloat(aggressionRatio.toFixed(2)),
    absorptionRatio: parseFloat(absorptionRatio.toFixed(2)),
    isDivergence: isDivergenceCandle,
    priceChange
  };
};

/**
 * Analyze delta divergence with incremental update support
 * @param {object|null} existingData - Previous data for incremental update
 * @returns {object} Delta divergence analysis
 */
export const analyzeDeltaDivergence = (existingData = null) => {
  const now = Date.now();

  // Incremental update
  if (existingData && existingData.priceData && existingData.priceData.length > 0) {
    const { priceData, divergences, _meta } = existingData;
    const lastTimestamp = _meta?.lastTimestamp || now - INTERVAL_MS;
    const lastPrice = _meta?.lastPrice || priceData[priceData.length - 1].close;
    const lastCumulativeDelta = _meta?.cumulativeDelta || priceData[priceData.length - 1].cumulativeDelta;

    const timeSinceLast = now - lastTimestamp;

    if (timeSinceLast < INTERVAL_MS) {
      return existingData;
    }

    const pointsToAdd = Math.min(Math.floor(timeSinceLast / INTERVAL_MS), 3);
    const newPriceData = [...priceData];
    const newDivergences = [...divergences];

    let currentPrice = lastPrice;
    let currentDelta = lastCumulativeDelta;

    for (let i = 1; i <= pointsToAdd; i++) {
      const timestamp = lastTimestamp + i * INTERVAL_MS;
      const point = generateSingleDivergencePoint(currentPrice, currentDelta, timestamp);

      newPriceData.push(point);
      currentPrice = point.close;
      currentDelta = point.cumulativeDelta;

      // Record divergence if detected
      if (point.isDivergence) {
        const strength = 60 + Math.random() * 35;
        const divergenceType = point.delta > 0 ? 'bullish' : 'bearish';
        newDivergences.push({
          id: `div-${timestamp}`,
          time: point.time,
          timestamp: point.timestamp,
          type: divergenceType,
          priceLevel: point.price,
          deltaValue: point.delta,
          priceChange: (point.priceChange * 100).toFixed(2) + '%',
          strength: Math.round(strength),
          description: divergenceType === 'bullish'
            ? 'Aggressive selling absorbed - potential reversal up'
            : 'Aggressive buying absorbed - potential reversal down',
          outcome: 'pending'
        });
      }
    }

    // Maintain rolling windows
    const finalPriceData = newPriceData.slice(-MAX_DATA_POINTS);
    const finalDivergences = newDivergences.slice(-20);

    // Calculate metrics
    const recentData = finalPriceData.slice(-10);
    const recentDivergences = finalDivergences.filter(d => d.outcome === 'pending');
    const currentDivergence = recentDivergences.length > 0 ? recentDivergences[recentDivergences.length - 1] : null;

    const bullishDivergences = finalDivergences.filter(d => d.type === 'bullish').length;
    const bearishDivergences = finalDivergences.filter(d => d.type === 'bearish').length;
    const avgStrength = finalDivergences.length > 0
      ? finalDivergences.reduce((sum, d) => sum + d.strength, 0) / finalDivergences.length
      : 0;

    const lastCandles = finalPriceData.slice(-5);
    const totalDelta = lastCandles.reduce((sum, c) => sum + Math.abs(c.delta), 0);
    const totalPriceMove = Math.abs(lastCandles[4].price - lastCandles[0].price);
    const aggressionFailure = totalDelta > 0 ? (1 - (totalPriceMove / (totalDelta / 100))) : 0;

    return {
      priceData: finalPriceData,
      divergences: finalDivergences,
      currentDivergence,
      metrics: {
        bullishDivergences,
        bearishDivergences,
        activeCount: recentDivergences.length,
        avgStrength: Math.round(avgStrength),
        aggressionFailureRatio: Math.max(0, Math.min(1, aggressionFailure)).toFixed(2)
      },
      _meta: {
        lastTimestamp: now,
        lastPrice: currentPrice,
        cumulativeDelta: currentDelta
      }
    };
  }

  // First call: generate initial dataset
  const priceData = [];
  const divergences = [];
  let price = 2800;
  let cumulativeDelta = 0;

  for (let i = 100; i >= 0; i--) {
    const timestamp = now - i * INTERVAL_MS;
    const time = new Date(timestamp).toLocaleTimeString();
    const tsSeconds = timestamp / 1000;

    // Generate price movement with occasional divergence patterns
    const baseMovement = Math.sin(i / 15) * 0.003 + (Math.random() - 0.5) * 0.008;

    // Every 15-25 candles, create a divergence setup
    const isDivergenceCandle = (i % 20 >= 17 && i % 20 <= 19) || (i % 25 >= 22 && i % 25 <= 24);

    let delta;
    let priceChange;

    if (isDivergenceCandle) {
      // Divergence: High delta but price stalls or reverses
      const divergenceType = Math.random() > 0.5 ? 'bullish' : 'bearish';

      if (divergenceType === 'bullish') {
        // Bearish price action but positive delta (buyers being absorbed)
        priceChange = -0.002 - Math.random() * 0.003;
        delta = 800 + Math.random() * 1200; // Strong positive delta
      } else {
        // Bullish price action but negative delta (sellers being absorbed)
        priceChange = 0.002 + Math.random() * 0.003;
        delta = -(800 + Math.random() * 1200); // Strong negative delta
      }

      // Record divergence event
      if (i % 20 === 18 || i % 25 === 23) {
        const strength = 60 + Math.random() * 35;
        divergences.push({
          id: `div-${i}`,
          time,
          timestamp,
          type: divergenceType,
          priceLevel: price,
          deltaValue: delta,
          priceChange: (priceChange * 100).toFixed(2) + '%',
          strength: Math.round(strength),
          description: divergenceType === 'bullish'
            ? 'Aggressive selling absorbed - potential reversal up'
            : 'Aggressive buying absorbed - potential reversal down',
          outcome: Math.random() > 0.3 ? 'confirmed' : 'pending'
        });
      }
    } else {
      // Normal market behavior - delta correlates with price
      priceChange = baseMovement;
      delta = priceChange * 50000 + (Math.random() - 0.5) * 400;
    }

    price *= (1 + priceChange);
    cumulativeDelta += delta;

    // Calculate aggression metrics
    const volume = 1500 + Math.random() * 2500;
    const aggressionRatio = Math.abs(delta) / volume;
    const absorptionRatio = isDivergenceCandle ? 0.7 + Math.random() * 0.25 : 0.2 + Math.random() * 0.3;

    priceData.push({
      time,
      timestamp,
      price: parseFloat(price.toFixed(2)),
      open: parseFloat((price * (1 - Math.random() * 0.002)).toFixed(2)),
      high: parseFloat((price * (1 + Math.random() * 0.003)).toFixed(2)),
      low: parseFloat((price * (1 - Math.random() * 0.003)).toFixed(2)),
      close: parseFloat(price.toFixed(2)),
      delta: Math.round(delta),
      cumulativeDelta: Math.round(cumulativeDelta),
      volume: Math.round(volume),
      aggressionRatio: parseFloat(aggressionRatio.toFixed(2)),
      absorptionRatio: parseFloat(absorptionRatio.toFixed(2)),
      isDivergence: isDivergenceCandle
    });
  }

  // Calculate current divergence if active
  const recentData = priceData.slice(-10);
  const recentDivergences = divergences.filter(d => d.outcome === 'pending');
  const currentDivergence = recentDivergences.length > 0 ? recentDivergences[recentDivergences.length - 1] : null;

  // Calculate aggregate metrics
  const bullishDivergences = divergences.filter(d => d.type === 'bullish').length;
  const bearishDivergences = divergences.filter(d => d.type === 'bearish').length;
  const avgStrength = divergences.length > 0
    ? divergences.reduce((sum, d) => sum + d.strength, 0) / divergences.length
    : 0;

  // Calculate current aggression failure ratio
  const lastCandles = priceData.slice(-5);
  const totalDelta = lastCandles.reduce((sum, c) => sum + Math.abs(c.delta), 0);
  const totalPriceMove = Math.abs(lastCandles[4].price - lastCandles[0].price);
  const aggressionFailure = totalDelta > 0 ? (1 - (totalPriceMove / (totalDelta / 100))) : 0;

  return {
    priceData,
    divergences,
    currentDivergence,
    metrics: {
      bullishDivergences,
      bearishDivergences,
      activeCount: recentDivergences.length,
      avgStrength: Math.round(avgStrength),
      aggressionFailureRatio: Math.max(0, Math.min(1, aggressionFailure)).toFixed(2)
    },
    _meta: {
      lastTimestamp: now,
      lastPrice: price,
      cumulativeDelta
    }
  };
};

export const detectDivergence = (priceData, lookback = 10) => {
  if (priceData.length < lookback) return null;

  const recent = priceData.slice(-lookback);
  const priceChange = (recent[lookback - 1].price - recent[0].price) / recent[0].price;
  const deltaSum = recent.reduce((sum, d) => sum + d.delta, 0);

  // Divergence when price and delta move opposite directions
  if (priceChange > 0.005 && deltaSum < -500) {
    return {
      type: 'bearish',
      strength: Math.min(100, Math.abs(deltaSum) / 10),
      description: 'Price rising but aggressive sellers dominating - bearish divergence'
    };
  }

  if (priceChange < -0.005 && deltaSum > 500) {
    return {
      type: 'bullish',
      strength: Math.min(100, deltaSum / 10),
      description: 'Price falling but aggressive buyers dominating - bullish divergence'
    };
  }

  return null;
};

export const calculateAggressionFailure = (volume, delta, priceChange) => {
  // High volume + high delta + small price change = aggression absorbed
  const expectedMove = Math.abs(delta) / 1000; // Expected move based on delta
  const actualMove = Math.abs(priceChange);

  if (expectedMove === 0) return 0;

  const failureRatio = 1 - (actualMove / expectedMove);
  return Math.max(0, Math.min(1, failureRatio));
};
