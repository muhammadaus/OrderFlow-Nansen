// Imbalance Cluster Analysis
// Footprint-style bid/ask imbalance stacking to identify unfinished auctions

const MAX_FOOTPRINT_ROWS = 350;
const UPDATE_INTERVAL = 5 * 60 * 1000; // 5 minutes

/**
 * Analyze imbalances with incremental update support
 * @param {object|null} existingData - Previous data for incremental update
 * @returns {object} Imbalance analysis
 */
export const analyzeImbalances = (existingData = null) => {
  const now = Date.now();

  // Incremental update
  if (existingData && existingData._meta) {
    const timeSinceLast = now - existingData._meta.lastTimestamp;

    if (timeSinceLast < UPDATE_INTERVAL) {
      return existingData;
    }

    // Update footprint data slightly
    const updatedFootprint = existingData.footprintData.map(fp => ({
      ...fp,
      bidVolume: Math.max(100, fp.bidVolume + Math.round((Math.random() - 0.45) * 100)),
      askVolume: Math.max(100, fp.askVolume + Math.round((Math.random() - 0.45) * 100))
    })).map(fp => {
      const total = fp.bidVolume + fp.askVolume;
      const imbalanceRatio = total > 0 ? (fp.askVolume - fp.bidVolume) / total : 0;
      return {
        ...fp,
        totalVolume: total,
        imbalanceRatio: parseFloat(imbalanceRatio.toFixed(2)),
        direction: imbalanceRatio > 0.3 ? 'ask' : imbalanceRatio < -0.3 ? 'bid' : 'neutral',
        isSignificant: Math.abs(imbalanceRatio) > 0.3,
        delta: fp.bidVolume - fp.askVolume,
        intensity: Math.min(1, total / 3000)
      };
    });

    // Recalculate metrics
    const bidDominantLevels = updatedFootprint.filter(f => f.direction === 'bid').length;
    const askDominantLevels = updatedFootprint.filter(f => f.direction === 'ask').length;
    const neutralLevels = updatedFootprint.filter(f => f.direction === 'neutral').length;

    return {
      footprintData: updatedFootprint,
      imbalances: existingData.imbalances,
      unfinishedAuctions: existingData.unfinishedAuctions,
      metrics: {
        bidDominance: Math.round((bidDominantLevels / updatedFootprint.length) * 100),
        askDominance: Math.round((askDominantLevels / updatedFootprint.length) * 100),
        neutralZones: Math.round((neutralLevels / updatedFootprint.length) * 100),
        dominantSide: bidDominantLevels > askDominantLevels ? 'bid' : askDominantLevels > bidDominantLevels ? 'ask' : 'neutral',
        stackedImbalanceCount: existingData.imbalances.length,
        unfinishedAuctionCount: existingData.unfinishedAuctions.length
      },
      _meta: { lastTimestamp: now }
    };
  }

  // First call: generate initial data
  const footprintData = [];
  const imbalances = [];
  const unfinishedAuctions = [];

  const basePrice = 2800;
  const priceStep = 2; // $2 price levels
  const timeStep = 5 * 60 * 1000; // 5-minute candles

  // Generate footprint grid (time x price)
  for (let t = 30; t >= 0; t--) {
    const time = new Date(now - t * timeStep).toLocaleTimeString();
    const timestamp = (now - t * timeStep) / 1000;

    // Price oscillates around base
    const priceOffset = Math.sin(t / 8) * 20 + (Math.random() - 0.5) * 10;
    const candleCenter = basePrice + priceOffset;

    // Generate multiple price levels for this time period
    for (let p = -5; p <= 5; p++) {
      const priceLevel = Math.round(candleCenter + p * priceStep);

      // Volume distribution - higher near center, lower at extremes
      const distanceFromCenter = Math.abs(p);
      const volumeMultiplier = Math.max(0.1, 1 - distanceFromCenter * 0.15);

      const baseVolume = 500 + Math.random() * 1500;
      const bidVolume = Math.round(baseVolume * volumeMultiplier * (0.3 + Math.random() * 0.7));
      const askVolume = Math.round(baseVolume * volumeMultiplier * (0.3 + Math.random() * 0.7));

      // Create imbalances at certain price levels
      const isImbalanceZone = (priceLevel % 10 === 0) && Math.random() > 0.6;
      let adjustedBid = bidVolume;
      let adjustedAsk = askVolume;

      if (isImbalanceZone) {
        // Create a significant imbalance
        if (Math.random() > 0.5) {
          adjustedBid = bidVolume * (2 + Math.random() * 2);
        } else {
          adjustedAsk = askVolume * (2 + Math.random() * 2);
        }
      }

      const total = adjustedBid + adjustedAsk;
      const imbalanceRatio = total > 0 ? (adjustedAsk - adjustedBid) / total : 0;
      const direction = imbalanceRatio > 0.3 ? 'ask' : imbalanceRatio < -0.3 ? 'bid' : 'neutral';
      const isSignificant = Math.abs(imbalanceRatio) > 0.3;

      footprintData.push({
        time,
        timestamp,
        priceLevel,
        bidVolume: Math.round(adjustedBid),
        askVolume: Math.round(adjustedAsk),
        totalVolume: Math.round(total),
        imbalanceRatio: parseFloat(imbalanceRatio.toFixed(2)),
        direction,
        isSignificant,
        delta: Math.round(adjustedBid - adjustedAsk),
        intensity: Math.min(1, total / 3000) // For heatmap coloring
      });
    }
  }

  // Find stacked imbalances (same direction at consecutive price levels)
  const groupedByTime = {};
  for (const fp of footprintData) {
    if (!groupedByTime[fp.time]) groupedByTime[fp.time] = [];
    groupedByTime[fp.time].push(fp);
  }

  for (const [time, levels] of Object.entries(groupedByTime)) {
    levels.sort((a, b) => a.priceLevel - b.priceLevel);

    let stackStart = null;
    let stackDirection = null;
    let stackCount = 0;

    for (let i = 0; i < levels.length; i++) {
      const level = levels[i];

      if (level.isSignificant && level.direction !== 'neutral') {
        if (stackDirection === level.direction) {
          stackCount++;
        } else {
          // Save previous stack if significant
          if (stackCount >= 3 && stackStart !== null) {
            imbalances.push({
              id: `imb-${time}-${stackStart.priceLevel}`,
              time,
              priceStart: stackStart.priceLevel,
              priceEnd: levels[i - 1].priceLevel,
              direction: stackDirection,
              stackSize: stackCount,
              avgImbalance: parseFloat((levels.slice(i - stackCount, i)
                .reduce((s, l) => s + Math.abs(l.imbalanceRatio), 0) / stackCount).toFixed(2)),
              totalVolume: levels.slice(i - stackCount, i)
                .reduce((s, l) => s + l.totalVolume, 0),
              strength: Math.min(100, stackCount * 20 + 40)
            });
          }

          stackStart = level;
          stackDirection = level.direction;
          stackCount = 1;
        }
      } else {
        // Reset stack
        if (stackCount >= 3 && stackStart !== null) {
          imbalances.push({
            id: `imb-${time}-${stackStart.priceLevel}`,
            time,
            priceStart: stackStart.priceLevel,
            priceEnd: levels[i - 1].priceLevel,
            direction: stackDirection,
            stackSize: stackCount,
            avgImbalance: parseFloat((levels.slice(i - stackCount, i)
              .reduce((s, l) => s + Math.abs(l.imbalanceRatio), 0) / stackCount).toFixed(2)),
            totalVolume: levels.slice(i - stackCount, i)
              .reduce((s, l) => s + l.totalVolume, 0),
            strength: Math.min(100, stackCount * 20 + 40)
          });
        }
        stackStart = null;
        stackDirection = null;
        stackCount = 0;
      }
    }
  }

  // Identify unfinished auctions (price levels with strong imbalance that weren't revisited)
  const uniquePriceLevels = [...new Set(footprintData.map(f => f.priceLevel))];

  for (const priceLevel of uniquePriceLevels) {
    const levelsAtPrice = footprintData.filter(f => f.priceLevel === priceLevel);
    const hasStrongImbalance = levelsAtPrice.some(l => Math.abs(l.imbalanceRatio) > 0.5);
    const dominantDirection = levelsAtPrice.reduce((s, l) => s + l.imbalanceRatio, 0) > 0 ? 'ask' : 'bid';

    if (hasStrongImbalance && Math.random() > 0.7) {
      unfinishedAuctions.push({
        id: `ua-${priceLevel}`,
        priceLevel,
        dominantSide: dominantDirection,
        imbalanceStrength: Math.round(60 + Math.random() * 35),
        likelihood: Math.round(50 + Math.random() * 40),
        reason: dominantDirection === 'bid'
          ? 'Strong bid absorption - price likely to return and test bids'
          : 'Strong ask absorption - price likely to return and test asks',
        tradingTip: dominantDirection === 'bid'
          ? 'Look for longs if price returns to this level'
          : 'Look for shorts if price returns to this level'
      });
    }
  }

  // Calculate overall metrics
  const bidDominantLevels = footprintData.filter(f => f.direction === 'bid').length;
  const askDominantLevels = footprintData.filter(f => f.direction === 'ask').length;
  const neutralLevels = footprintData.filter(f => f.direction === 'neutral').length;

  const dominantSide = bidDominantLevels > askDominantLevels ? 'bid' :
                       askDominantLevels > bidDominantLevels ? 'ask' : 'neutral';

  return {
    footprintData,
    imbalances,
    unfinishedAuctions,
    metrics: {
      bidDominance: Math.round((bidDominantLevels / footprintData.length) * 100),
      askDominance: Math.round((askDominantLevels / footprintData.length) * 100),
      neutralZones: Math.round((neutralLevels / footprintData.length) * 100),
      dominantSide,
      stackedImbalanceCount: imbalances.length,
      unfinishedAuctionCount: unfinishedAuctions.length
    },
    _meta: { lastTimestamp: now }
  };
};

export const calculateImbalance = (bid, ask, threshold = 0.3) => {
  const total = bid + ask;
  if (total === 0) return { side: 'neutral', ratio: 0, isSignificant: false };

  const ratio = (ask - bid) / total;
  const side = ratio > threshold ? 'ask' : ratio < -threshold ? 'bid' : 'neutral';

  return {
    side,
    ratio: parseFloat(ratio.toFixed(2)),
    isSignificant: Math.abs(ratio) > threshold
  };
};

export const findStackedImbalances = (imbalances, minStack = 3) => {
  return imbalances.filter(imb => imb.stackSize >= minStack);
};
