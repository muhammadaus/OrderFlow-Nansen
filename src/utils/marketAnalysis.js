export const detectMarketSignals = (orderflowData) => {
  const signals = [];
  const candles = orderflowData.candles;
  const volume = orderflowData.volume;
  
  // Detect exhaustion patterns
  for (let i = 2; i < candles.length - 1; i++) {
    const current = candles[i];
    const prev = candles[i - 1];
    const prev2 = candles[i - 2];
    const vol = volume[i];
    const prevVol = volume[i - 1];
    
    // Exhaustion: High volume but small price movement
    const priceRange = Math.abs(current.close - current.open);
    const avgRange = Math.abs(prev.close - prev.open);
    const volumeSpike = vol.value > prevVol.value * 1.5;
    const smallRange = priceRange < avgRange * 0.7;
    
    if (volumeSpike && smallRange) {
      signals.push({
        time: current.time,
        type: 'exhaustion',
        direction: current.close > prev.close ? 'bullish' : 'bearish',
        message: `Volume exhaustion detected at $${current.close.toFixed(2)}`
      });
    }
    
    // Absorption: Price holds level despite selling/buying pressure
    const priceStability = Math.abs(current.close - prev.close) < avgRange * 0.3;
    const highVolume = vol.value > prevVol.value * 1.2;
    
    if (priceStability && highVolume) {
      signals.push({
        time: current.time,
        type: 'absorption',
        direction: 'neutral',
        message: `Price absorption at $${current.close.toFixed(2)} - institutional activity`
      });
    }
  }
  
  // Generate contextual tip based on recent signals
  let tip = "Monitor volume and price action for exhaustion patterns.";
  const recentSignals = signals.slice(-3);
  
  if (recentSignals.filter(s => s.type === 'exhaustion').length >= 2) {
    tip = "Multiple exhaustion signals detected - potential reversal zone. Watch for confirmation.";
  } else if (recentSignals.filter(s => s.type === 'absorption').length >= 2) {
    tip = "Strong absorption pattern - large players active. Expect breakout after accumulation.";
  }
  
  return { signals, tip };
};

/**
 * Analyze market structure with incremental update support
 * @param {object|null} existingData - Previous data for incremental update
 * @returns {object} Market structure data
 */
export const analyzeMarketStructure = (existingData = null) => {
  const MAX_DATA_POINTS = 31;
  const INTERVAL_MS = 60 * 60 * 1000; // 1 hour

  // Incremental update
  if (existingData && existingData.data && existingData.data.length > 0) {
    const { data, _meta } = existingData;
    const lastTimestamp = _meta?.lastTimestamp || Date.now() - INTERVAL_MS;
    let price = _meta?.lastPrice || data[data.length - 1].price;

    const now = Date.now();
    const timeSinceLast = now - lastTimestamp;

    // If not enough time passed, just update the current candle
    if (timeSinceLast < INTERVAL_MS) {
      const newData = [...data];
      const lastPoint = { ...newData[newData.length - 1] };

      // Update price with small movement
      const movement = (Math.random() - 0.5) * 0.003;
      price *= (1 + movement);
      lastPoint.price = parseFloat(price.toFixed(2));
      lastPoint.ema20 = parseFloat((price * (0.98 + Math.random() * 0.04)).toFixed(2));

      newData[newData.length - 1] = lastPoint;

      return {
        ...existingData,
        data: newData,
        _meta: { ...existingData._meta, lastPrice: price }
      };
    }

    // Add new data points
    const pointsToAdd = Math.min(Math.floor(timeSinceLast / INTERVAL_MS), 3);
    const newData = [...data];

    for (let i = 1; i <= pointsToAdd; i++) {
      const timestamp = lastTimestamp + i * INTERVAL_MS;
      const time = new Date(timestamp).toLocaleTimeString();

      const phase = Math.floor(Date.now() / (8 * INTERVAL_MS)) % 4;
      let movement = 0;

      switch (phase) {
        case 0: movement = (Math.random() - 0.5) * 0.01; break;
        case 1: movement = 0.005 + Math.random() * 0.01; break;
        case 2: movement = (Math.random() - 0.5) * 0.015; break;
        case 3: movement = -0.005 - Math.random() * 0.01; break;
      }

      price *= (1 + movement);

      newData.push({
        time,
        price: parseFloat(price.toFixed(2)),
        ema20: parseFloat((price * (0.98 + Math.random() * 0.04)).toFixed(2)),
        ema50: parseFloat((price * (0.96 + Math.random() * 0.08)).toFixed(2)),
        support: parseFloat((price * 0.985).toFixed(2)),
        resistance: parseFloat((price * 1.015).toFixed(2)),
        tip: phase === 0 ? "Accumulation phase - look for breakout" :
             phase === 1 ? "Markup phase - trend following" :
             phase === 2 ? "Distribution - take profits" :
             "Markdown - wait for bottom"
      });
    }

    // Maintain rolling window
    const finalData = newData.slice(-MAX_DATA_POINTS);

    // Calculate key levels
    const prices = finalData.map(d => d.price);
    const highestPrice = Math.max(...prices);
    const lowestPrice = Math.min(...prices);
    const currentPrice = prices[prices.length - 1];

    const keyLevels = [
      { price: highestPrice, type: 'resistance', label: 'Major Resistance' },
      { price: lowestPrice, type: 'support', label: 'Major Support' },
      { price: currentPrice * 1.02, type: 'resistance', label: 'Near Resistance' },
      { price: currentPrice * 0.98, type: 'support', label: 'Near Support' }
    ];

    const recentPrices = prices.slice(-5);
    const isUptrend = recentPrices[4] > recentPrices[0];
    const volatility = Math.abs(recentPrices[4] - recentPrices[0]) / recentPrices[0];

    let marketPhase;
    if (volatility < 0.01) marketPhase = 'Accumulation';
    else if (isUptrend && volatility > 0.02) marketPhase = 'Markup';
    else if (!isUptrend && volatility > 0.02) marketPhase = 'Markdown';
    else marketPhase = 'Distribution';

    return {
      data: finalData,
      keyLevels,
      phase: marketPhase,
      _meta: { lastTimestamp: Date.now(), lastPrice: price }
    };
  }

  // First call: generate initial dataset
  const data = [];
  const keyLevels = [];
  let price = 2800;
  const now = Date.now();

  for (let i = 30; i >= 0; i--) {
    const time = new Date(now - i * INTERVAL_MS).toLocaleTimeString();
    const phase = Math.floor(i / 8);
    let movement = 0;

    switch (phase % 4) {
      case 0: movement = (Math.random() - 0.5) * 0.01; break;
      case 1: movement = 0.005 + Math.random() * 0.01; break;
      case 2: movement = (Math.random() - 0.5) * 0.015; break;
      case 3: movement = -0.005 - Math.random() * 0.01; break;
    }

    price *= (1 + movement);

    data.push({
      time,
      price: parseFloat(price.toFixed(2)),
      ema20: parseFloat((price * (0.98 + Math.random() * 0.04)).toFixed(2)),
      ema50: parseFloat((price * (0.96 + Math.random() * 0.08)).toFixed(2)),
      support: parseFloat((price * 0.985).toFixed(2)),
      resistance: parseFloat((price * 1.015).toFixed(2)),
      tip: phase % 4 === 0 ? "Accumulation phase - look for breakout" :
           phase % 4 === 1 ? "Markup phase - trend following" :
           phase % 4 === 2 ? "Distribution - take profits" :
           "Markdown - wait for bottom"
    });
  }

  const prices = data.map(d => d.price);
  const highestPrice = Math.max(...prices);
  const lowestPrice = Math.min(...prices);
  const currentPrice = prices[prices.length - 1];

  keyLevels.push(
    { price: highestPrice, type: 'resistance', label: 'Major Resistance' },
    { price: lowestPrice, type: 'support', label: 'Major Support' },
    { price: currentPrice * 1.02, type: 'resistance', label: 'Near Resistance' },
    { price: currentPrice * 0.98, type: 'support', label: 'Near Support' }
  );

  const recentPrices = prices.slice(-5);
  const isUptrend = recentPrices[4] > recentPrices[0];
  const volatility = Math.abs(recentPrices[4] - recentPrices[0]) / recentPrices[0];

  let marketPhase;
  if (volatility < 0.01) marketPhase = 'Accumulation';
  else if (isUptrend && volatility > 0.02) marketPhase = 'Markup';
  else if (!isUptrend && volatility > 0.02) marketPhase = 'Markdown';
  else marketPhase = 'Distribution';

  return {
    data,
    keyLevels,
    phase: marketPhase,
    _meta: { lastTimestamp: now, lastPrice: price }
  };
};

/**
 * Generate footprint chart data with price-level breakdown
 * Shows bid/ask volume at each price level for exhaustion/absorption analysis
 * @param {object|null} existingData - Previous data for incremental update
 * @returns {object} Footprint chart data
 */
export const detectExhaustionAbsorption = (existingData = null) => {
  const NUM_PRICE_LEVELS = 12;
  const PRICE_STEP = 2; // $2 per level
  const NUM_HISTORY_PERIODS = 6;
  const INTERVAL_MS = 60 * 1000; // 1 minute intervals for heatmap

  const now = Date.now();
  const basePrice = existingData?._meta?.basePrice || 2840;

  // Generate price levels centered around current price
  const generatePriceLevels = (centerPrice, historyIndex = 0) => {
    const levels = [];
    const startPrice = centerPrice + (NUM_PRICE_LEVELS / 2) * PRICE_STEP;

    for (let i = 0; i < NUM_PRICE_LEVELS; i++) {
      const priceLevel = startPrice - (i * PRICE_STEP);

      // Generate bid/ask volumes with some patterns
      const baseVolume = 500 + Math.random() * 2000;
      const imbalanceFactor = Math.random();

      let bidVolume, askVolume;

      // Create interesting patterns at certain levels
      if (i === Math.floor(NUM_PRICE_LEVELS / 2)) {
        // POC level - high volume, relatively balanced
        bidVolume = baseVolume * 2 + Math.random() * 1000;
        askVolume = baseVolume * 2 + Math.random() * 1000;
      } else if (i === 2 || i === 3) {
        // Resistance area - more asks
        bidVolume = baseVolume * 0.4;
        askVolume = baseVolume * 1.5;
      } else if (i === NUM_PRICE_LEVELS - 3 || i === NUM_PRICE_LEVELS - 2) {
        // Support area - more bids
        bidVolume = baseVolume * 1.5;
        askVolume = baseVolume * 0.4;
      } else {
        // Random distribution
        if (imbalanceFactor > 0.5) {
          bidVolume = baseVolume * (0.8 + Math.random() * 0.8);
          askVolume = baseVolume * (0.3 + Math.random() * 0.5);
        } else {
          bidVolume = baseVolume * (0.3 + Math.random() * 0.5);
          askVolume = baseVolume * (0.8 + Math.random() * 0.8);
        }
      }

      bidVolume = Math.round(bidVolume);
      askVolume = Math.round(askVolume);
      const delta = bidVolume - askVolume;
      const totalVolume = bidVolume + askVolume;
      const imbalanceRatio = totalVolume > 0 ? delta / totalVolume : 0;

      levels.push({
        priceLevel,
        bidVolume,
        askVolume,
        delta,
        totalVolume,
        imbalanceRatio
      });
    }

    return levels;
  };

  // Generate current footprint levels
  const currentLevels = generatePriceLevels(basePrice);

  // Find POC (Point of Control) - highest volume level
  let pocIndex = 0;
  let maxVolume = 0;
  currentLevels.forEach((level, idx) => {
    if (level.totalVolume > maxVolume) {
      maxVolume = level.totalVolume;
      pocIndex = idx;
    }
  });

  // Detect exhaustion and absorption patterns
  let currentSignal = null;
  let exhaustionLevel = null;
  let absorptionLevel = null;

  currentLevels.forEach((level, idx) => {
    // Exhaustion: High volume but extreme imbalance (market trying but failing)
    if (level.totalVolume > 2500 && Math.abs(level.imbalanceRatio) > 0.6) {
      if (level.delta > 0) {
        // Bullish exhaustion - heavy buying but may be topping
        exhaustionLevel = idx;
        currentSignal = {
          type: 'bullish_exhaustion',
          priceLevel: level.priceLevel,
          description: `Heavy buying at $${level.priceLevel} with ${level.bidVolume} bid vs ${level.askVolume} ask - potential exhaustion`,
          tip: 'High buy volume but price struggling. Watch for reversal if no follow-through.'
        };
      } else {
        // Bearish exhaustion - heavy selling but may be bottoming
        exhaustionLevel = idx;
        currentSignal = {
          type: 'bearish_exhaustion',
          priceLevel: level.priceLevel,
          description: `Heavy selling at $${level.priceLevel} with ${level.askVolume} ask vs ${level.bidVolume} bid - selling climax`,
          tip: 'Selling climax pattern. Look for reversal confirmation.'
        };
      }
    }

    // Absorption: High volume but balanced (large player absorbing)
    if (level.totalVolume > 3000 && Math.abs(level.imbalanceRatio) < 0.15) {
      absorptionLevel = idx;
      currentSignal = {
        type: 'absorption',
        priceLevel: level.priceLevel,
        description: `Strong absorption at $${level.priceLevel} - ${level.totalVolume} total volume with balanced flow`,
        tip: 'Institutional accumulation/distribution. Expect breakout after consolidation.'
      };
    }

    // Imbalance detection (3:1 ratio)
    const bidAskRatio = level.bidVolume / (level.askVolume || 1);
    level.hasImbalance = bidAskRatio > 3 || bidAskRatio < 0.33;
    level.imbalanceType = bidAskRatio > 3 ? 'bid' : bidAskRatio < 0.33 ? 'ask' : null;
  });

  // Mark special levels
  currentLevels[pocIndex].isPOC = true;
  if (exhaustionLevel !== null) {
    currentLevels[exhaustionLevel].isExhaustion = true;
  }
  if (absorptionLevel !== null) {
    currentLevels[absorptionLevel].isAbsorption = true;
  }

  // Generate historical snapshots for heatmap
  const history = [];
  for (let t = NUM_HISTORY_PERIODS - 1; t >= 0; t--) {
    const timeLabel = t === 0 ? 'NOW' : `-${t}m`;
    const timestamp = now - t * INTERVAL_MS;

    // Generate simplified delta data for each price level at this time
    const snapshot = currentLevels.map((level, idx) => {
      // Add some variation from current state
      const variation = (Math.random() - 0.5) * 0.4;
      const historicalDelta = level.delta * (0.8 + variation);
      const historicalVolume = level.totalVolume * (0.7 + Math.random() * 0.6);

      return {
        priceLevel: level.priceLevel,
        delta: Math.round(historicalDelta),
        volume: Math.round(historicalVolume),
        dominance: historicalDelta > 0 ? 'bid' : 'ask'
      };
    });

    history.push({
      time: timeLabel,
      timestamp,
      levels: snapshot
    });
  }

  // Calculate overall metrics
  const totalBidVolume = currentLevels.reduce((sum, l) => sum + l.bidVolume, 0);
  const totalAskVolume = currentLevels.reduce((sum, l) => sum + l.askVolume, 0);
  const overallDelta = totalBidVolume - totalAskVolume;
  const signalStrength = currentSignal
    ? Math.min(95, 50 + Math.abs(currentLevels[exhaustionLevel || absorptionLevel || pocIndex].imbalanceRatio) * 50)
    : 50;

  return {
    footprint: currentLevels,
    history,
    poc: {
      priceLevel: currentLevels[pocIndex].priceLevel,
      volume: currentLevels[pocIndex].totalVolume
    },
    metrics: {
      totalBidVolume,
      totalAskVolume,
      overallDelta,
      dominantSide: overallDelta > 0 ? 'Buyers' : 'Sellers',
      imbalanceCount: currentLevels.filter(l => l.hasImbalance).length
    },
    currentSignal,
    strength: Math.round(signalStrength),
    currentPrice: basePrice,
    _meta: {
      lastTimestamp: now,
      basePrice: basePrice + (Math.random() - 0.5) * 4 // Small price drift
    }
  };
};