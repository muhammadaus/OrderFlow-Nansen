// Liquidity Sweep Analysis
// Detects stop hunts and whether swept liquidity was absorbed or drove continuation

const MAX_SWEEP_EVENTS = 15;
const UPDATE_INTERVAL = 60000; // 1 minute

/**
 * Analyze liquidity sweeps with incremental update support
 * @param {object|null} existingData - Previous data for incremental update
 * @returns {object} Liquidity sweep analysis
 */
export const analyzeLiquiditySweeps = (existingData = null) => {
  const now = Date.now();

  // Incremental update
  if (existingData && existingData._meta) {
    const timeSinceLast = now - existingData._meta.lastTimestamp;

    if (timeSinceLast < UPDATE_INTERVAL) {
      return existingData;
    }

    // Maybe add a new sweep event
    const sweepEvents = [...existingData.sweepEvents];
    const priceLadder = existingData.priceLadder.map(level => ({
      ...level,
      bidLiquidity: Math.max(500, level.bidLiquidity + (Math.random() - 0.45) * 500),
      askLiquidity: Math.max(500, level.askLiquidity + (Math.random() - 0.45) * 500)
    }));

    // 20% chance of new sweep event
    if (Math.random() > 0.8) {
      const direction = Math.random() > 0.5 ? 'buy-side' : 'sell-side';
      const isAbsorbed = Math.random() > 0.3;
      const sweepPrice = direction === 'buy-side'
        ? 2750 + Math.floor(Math.random() * 5) * 10
        : 2800 + Math.floor(Math.random() * 5) * 10;

      sweepEvents.unshift({
        id: `sweep-${now}`,
        time: new Date(now).toLocaleTimeString(),
        timestamp: now / 1000,
        price: sweepPrice,
        direction,
        outcome: isAbsorbed ? 'absorbed' : 'continuation',
        liquidityCleared: Math.round(2000 + Math.random() * 8000),
        priceReaction: parseFloat((isAbsorbed
          ? (direction === 'buy-side' ? 0.5 + Math.random() * 1.5 : -(0.5 + Math.random() * 1.5))
          : (direction === 'buy-side' ? -(0.3 + Math.random() * 0.7) : 0.3 + Math.random() * 0.7)).toFixed(2)),
        volumeSpike: parseFloat((2 + Math.random() * 4).toFixed(1)),
        confidence: isAbsorbed ? 70 + Math.random() * 25 : 50 + Math.random() * 30,
        stopsTriggered: Math.round(200 + Math.random() * 1000),
        rejectionCandles: isAbsorbed ? Math.floor(1 + Math.random() * 3) : 0,
        description: isAbsorbed
          ? `${direction === 'buy-side' ? 'Long' : 'Short'} stops swept and absorbed - reversal likely`
          : `${direction === 'buy-side' ? 'Long' : 'Short'} stops triggered continuation`
      });
    }

    // Maintain rolling window
    const finalSweeps = sweepEvents.slice(0, MAX_SWEEP_EVENTS);

    // Recalculate stats
    const totalSweeps = finalSweeps.length;
    const absorbedSweeps = finalSweeps.filter(s => s.outcome === 'absorbed').length;
    const recentSweeps = finalSweeps.filter(s => (now / 1000) - s.timestamp < 3600);

    return {
      sweepEvents: finalSweeps,
      priceLadder,
      currentSweep: recentSweeps.length > 0 ? recentSweeps[0] : null,
      stats: {
        totalSweeps,
        absorbedSweeps,
        continuationSweeps: totalSweeps - absorbedSweeps,
        absorptionRate: Math.round((absorbedSweeps / totalSweeps) * 100),
        avgVolumeSpike: parseFloat((finalSweeps.reduce((s, e) => s + e.volumeSpike, 0) / totalSweeps).toFixed(1)),
        recentSweepCount: recentSweeps.length
      },
      nearbyLiquidity: existingData.nearbyLiquidity,
      _meta: { lastTimestamp: now }
    };
  }

  // First call: generate initial data
  const sweepEvents = [];
  const priceLadder = [];
  let price = 2800;

  // Generate price ladder with liquidity levels
  const liquidityLevels = [];
  for (let i = 0; i < 20; i++) {
    const levelPrice = 2750 + i * 10;
    const isKeyLevel = i % 5 === 0;

    liquidityLevels.push({
      price: levelPrice,
      bidLiquidity: isKeyLevel ? 5000 + Math.random() * 10000 : 1000 + Math.random() * 3000,
      askLiquidity: isKeyLevel ? 5000 + Math.random() * 10000 : 1000 + Math.random() * 3000,
      type: levelPrice < price ? 'buy-side' : 'sell-side',
      isKeyLevel,
      stopCluster: isKeyLevel ? Math.round(500 + Math.random() * 2000) : Math.round(100 + Math.random() * 500)
    });
  }

  // Generate sweep events
  const sweepCount = 8 + Math.floor(Math.random() * 5);

  for (let i = 0; i < sweepCount; i++) {
    const timeOffset = Math.floor(Math.random() * 24 * 60); // Random time in last 24h
    const time = new Date(now - timeOffset * 60 * 1000).toLocaleTimeString();
    const timestamp = (now - timeOffset * 60 * 1000) / 1000;

    const direction = Math.random() > 0.5 ? 'buy-side' : 'sell-side';
    const sweepPrice = direction === 'buy-side'
      ? 2750 + Math.floor(Math.random() * 5) * 10
      : 2800 + Math.floor(Math.random() * 5) * 10;

    // 70% of sweeps get absorbed (institutional trap), 30% continuation
    const isAbsorbed = Math.random() > 0.3;
    const outcome = isAbsorbed ? 'absorbed' : 'continuation';

    const liquidityCleared = 2000 + Math.random() * 8000;
    const volumeSpike = 2 + Math.random() * 4;
    const priceReaction = isAbsorbed
      ? (direction === 'buy-side' ? 0.5 + Math.random() * 1.5 : -(0.5 + Math.random() * 1.5))
      : (direction === 'buy-side' ? -(0.3 + Math.random() * 0.7) : 0.3 + Math.random() * 0.7);

    sweepEvents.push({
      id: `sweep-${i}`,
      time,
      timestamp,
      price: sweepPrice,
      direction,
      outcome,
      liquidityCleared: Math.round(liquidityCleared),
      priceReaction: parseFloat(priceReaction.toFixed(2)),
      volumeSpike: parseFloat(volumeSpike.toFixed(1)),
      confidence: isAbsorbed ? 70 + Math.random() * 25 : 50 + Math.random() * 30,
      stopsTriggered: Math.round(200 + Math.random() * 1000),
      rejectionCandles: isAbsorbed ? Math.floor(1 + Math.random() * 3) : 0,
      description: isAbsorbed
        ? `${direction === 'buy-side' ? 'Long' : 'Short'} stops swept and absorbed - reversal likely`
        : `${direction === 'buy-side' ? 'Long' : 'Short'} stops triggered continuation`
    });
  }

  // Sort by time
  sweepEvents.sort((a, b) => b.timestamp - a.timestamp);

  // Build price ladder with sweep markers
  for (const level of liquidityLevels) {
    const sweepsAtLevel = sweepEvents.filter(s => Math.abs(s.price - level.price) < 5);
    const wasSwept = sweepsAtLevel.length > 0;
    const lastSweep = wasSwept ? sweepsAtLevel[0] : null;

    priceLadder.push({
      ...level,
      wasSwept,
      sweepTime: lastSweep?.time || null,
      sweepOutcome: lastSweep?.outcome || null,
      remainingLiquidity: wasSwept
        ? Math.max(0, level.bidLiquidity + level.askLiquidity - (lastSweep?.liquidityCleared || 0))
        : level.bidLiquidity + level.askLiquidity
    });
  }

  // Calculate statistics
  const totalSweeps = sweepEvents.length;
  const absorbedSweeps = sweepEvents.filter(s => s.outcome === 'absorbed').length;
  const continuationSweeps = sweepEvents.filter(s => s.outcome === 'continuation').length;
  const absorptionRate = totalSweeps > 0 ? (absorbedSweeps / totalSweeps) * 100 : 0;

  // Current sweep status
  const recentSweeps = sweepEvents.filter(s => (now / 1000) - s.timestamp < 3600); // Last hour
  const currentSweep = recentSweeps.length > 0 ? recentSweeps[0] : null;

  // Nearby liquidity analysis
  const nearbyBuySide = priceLadder
    .filter(l => l.type === 'buy-side' && !l.wasSwept)
    .sort((a, b) => b.price - a.price)[0];
  const nearbySSellSide = priceLadder
    .filter(l => l.type === 'sell-side' && !l.wasSwept)
    .sort((a, b) => a.price - b.price)[0];

  return {
    sweepEvents,
    priceLadder,
    currentSweep,
    stats: {
      totalSweeps,
      absorbedSweeps,
      continuationSweeps,
      absorptionRate: Math.round(absorptionRate),
      avgVolumeSpike: parseFloat((sweepEvents.reduce((s, e) => s + e.volumeSpike, 0) / totalSweeps).toFixed(1)),
      recentSweepCount: recentSweeps.length
    },
    nearbyLiquidity: {
      buySide: nearbyBuySide,
      sellSide: nearbySSellSide,
      buySideDistance: nearbyBuySide ? ((price - nearbyBuySide.price) / price * 100).toFixed(2) + '%' : 'N/A',
      sellSideDistance: nearbySSellSide ? ((nearbySSellSide.price - price) / price * 100).toFixed(2) + '%' : 'N/A'
    },
    _meta: { lastTimestamp: now }
  };
};

export const detectSweep = (currentPrice, previousHigh, previousLow, volume, avgVolume) => {
  const isVolumeSpike = volume > avgVolume * 1.5;

  // Buy-side sweep (long stops)
  if (currentPrice < previousLow && isVolumeSpike) {
    return {
      detected: true,
      direction: 'buy-side',
      level: previousLow,
      volumeRatio: volume / avgVolume
    };
  }

  // Sell-side sweep (short stops)
  if (currentPrice > previousHigh && isVolumeSpike) {
    return {
      detected: true,
      direction: 'sell-side',
      level: previousHigh,
      volumeRatio: volume / avgVolume
    };
  }

  return { detected: false };
};

export const analyzeSweepOutcome = (sweepCandle, followingCandles) => {
  if (followingCandles.length < 2) return 'pending';

  const sweepDirection = sweepCandle.close < sweepCandle.open ? 'down' : 'up';
  const followingDirection = followingCandles[1].close > sweepCandle.close ? 'up' : 'down';

  // If price reverses after sweep, it was absorbed
  if (sweepDirection !== followingDirection) {
    return 'absorbed';
  }

  return 'continuation';
};
