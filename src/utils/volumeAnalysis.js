/**
 * Generate volume profile with incremental update support
 * @param {object|null} existingData - Previous data for incremental update
 * @returns {object} Volume profile data
 */
export const generateVolumeProfile = (existingData = null) => {
  const numberOfLevels = 40;
  const priceRange = 200; // $200 range

  // Get current price from existing data or use default
  const currentPrice = existingData?._meta?.currentPrice || 2800;
  const basePrice = currentPrice;

  // If we have existing data, update incrementally
  if (existingData && existingData.profile && existingData.profile.length > 0) {
    const profile = existingData.profile.map(level => {
      // Add small random volume updates to existing levels
      const volumeChange = Math.round((Math.random() - 0.45) * 100);
      return {
        ...level,
        volume: Math.max(100, level.volume + volumeChange)
      };
    });

    // Recalculate POC and value area
    let maxVolume = 0;
    let pocPrice = basePrice;

    for (const level of profile) {
      if (level.volume > maxVolume) {
        maxVolume = level.volume;
        pocPrice = level.price;
      }
    }

    // Calculate Value Area (70% of volume)
    const totalVolume = profile.reduce((sum, level) => sum + level.volume, 0);
    const targetVolume = totalVolume * 0.7;

    const sortedByVolume = [...profile].sort((a, b) => b.volume - a.volume);
    let accumulatedVolume = 0;
    let valueAreaLevels = [];

    for (const level of sortedByVolume) {
      if (accumulatedVolume < targetVolume) {
        valueAreaLevels.push(level);
        accumulatedVolume += level.volume;
      } else {
        break;
      }
    }

    const valueAreaPrices = valueAreaLevels.map(l => l.price).sort((a, b) => a - b);
    const valueArea = {
      high: valueAreaPrices[valueAreaPrices.length - 1],
      low: valueAreaPrices[0]
    };

    // Generate delta data for the chart
    const deltaData = existingData.deltaData || generateDeltaDataPoints(30);
    const updatedDeltaData = updateDeltaDataPoints(deltaData);
    const deltaInsights = calculateDeltaInsights(updatedDeltaData);

    return {
      profile: profile.sort((a, b) => b.price - a.price),
      poc: pocPrice,
      valueArea,
      deltaData: updatedDeltaData,
      deltaInsights,
      _meta: {
        currentPrice: basePrice,
        lastUpdate: Date.now()
      }
    };
  }

  // First call: generate initial profile
  const profile = [];
  let maxVolume = 0;
  let pocPrice = basePrice;

  for (let i = 0; i < numberOfLevels; i++) {
    const price = basePrice - (priceRange / 2) + (i * priceRange / numberOfLevels);

    const distanceFromCenter = Math.abs(price - basePrice) / (priceRange / 2);
    const baseVolume = Math.exp(-Math.pow(distanceFromCenter, 2) * 3) * 5000;

    const randomFactor = 0.5 + Math.random();
    const spikeFactor = Math.random() > 0.85 ? 1.5 + Math.random() : 1;

    const volume = Math.round(baseVolume * randomFactor * spikeFactor);

    if (volume > maxVolume) {
      maxVolume = volume;
      pocPrice = price;
    }

    profile.push({
      price: parseFloat(price.toFixed(2)),
      volume
    });
  }

  // Calculate Value Area (70% of volume)
  const totalVolume = profile.reduce((sum, level) => sum + level.volume, 0);
  const targetVolume = totalVolume * 0.7;

  const sortedByVolume = [...profile].sort((a, b) => b.volume - a.volume);
  let accumulatedVolume = 0;
  let valueAreaLevels = [];

  for (const level of sortedByVolume) {
    if (accumulatedVolume < targetVolume) {
      valueAreaLevels.push(level);
      accumulatedVolume += level.volume;
    } else {
      break;
    }
  }

  const valueAreaPrices = valueAreaLevels.map(l => l.price).sort((a, b) => a - b);
  const valueArea = {
    high: valueAreaPrices[valueAreaPrices.length - 1],
    low: valueAreaPrices[0]
  };

  // Generate initial delta data
  const deltaData = generateDeltaDataPoints(30);
  const deltaInsights = calculateDeltaInsights(deltaData);

  return {
    profile: profile.sort((a, b) => b.price - a.price),
    poc: pocPrice,
    valueArea,
    deltaData,
    deltaInsights,
    _meta: {
      currentPrice: basePrice,
      lastUpdate: Date.now()
    }
  };
};

// Helper function to generate delta data points
const generateDeltaDataPoints = (count) => {
  const data = [];
  let cumulativeDelta = 0;
  const now = Date.now();

  for (let i = count; i >= 0; i--) {
    const time = new Date(now - i * 60 * 1000).toLocaleTimeString();
    const trend = Math.sin(i / 8) * 150;
    const noise = (Math.random() - 0.5) * 200;
    const delta = Math.round(trend + noise);
    cumulativeDelta += delta;

    data.push({
      time,
      delta,
      cumulativeDelta: Math.round(cumulativeDelta)
    });
  }

  return data;
};

// Helper function to update delta data points incrementally
const updateDeltaDataPoints = (existingData) => {
  if (!existingData || existingData.length === 0) {
    return generateDeltaDataPoints(30);
  }

  const newData = [...existingData.slice(-29)];
  const lastPoint = newData[newData.length - 1];
  const time = new Date().toLocaleTimeString();

  const trend = Math.sin(Date.now() / 60000) * 150;
  const noise = (Math.random() - 0.5) * 200;
  const delta = Math.round(trend + noise);
  const cumulativeDelta = (lastPoint?.cumulativeDelta || 0) + delta;

  newData.push({
    time,
    delta,
    cumulativeDelta: Math.round(cumulativeDelta)
  });

  return newData;
};

// Helper function to calculate delta insights
const calculateDeltaInsights = (deltaData) => {
  if (!deltaData || deltaData.length < 5) {
    return { bias: 'neutral', strength: 50, divergence: false };
  }

  const recentDeltas = deltaData.slice(-10).map(d => d.delta);
  const avgDelta = recentDeltas.reduce((sum, d) => sum + d, 0) / recentDeltas.length;

  const bias = avgDelta > 30 ? 'bullish' : avgDelta < -30 ? 'bearish' : 'neutral';
  const strength = Math.min(100, Math.max(0, 50 + Math.abs(avgDelta) / 3));

  // Check for divergence (delta direction vs cumulative trend)
  const firstCum = deltaData[deltaData.length - 5]?.cumulativeDelta || 0;
  const lastCum = deltaData[deltaData.length - 1]?.cumulativeDelta || 0;
  const cumTrend = lastCum > firstCum;
  const deltaTrend = avgDelta > 0;
  const divergence = cumTrend !== deltaTrend;

  return { bias, strength, divergence };
};

/**
 * Analyze delta with incremental update support
 * @param {object|null} existingData - Previous data for incremental update
 * @returns {object} Delta analysis data
 */
export const analyzeDelta = (existingData = null) => {
  const MAX_DATA_POINTS = 50;
  const INTERVAL_MS = 2 * 60 * 1000; // 2 minutes

  // Incremental update
  if (existingData && existingData.data && existingData.data.length > 0) {
    const { data, _meta } = existingData;
    const lastTimestamp = _meta?.lastTimestamp || Date.now() - INTERVAL_MS;
    let cumulativeDelta = _meta?.cumulativeDelta || data[data.length - 1].cumulativeDelta;

    const now = Date.now();
    const timeSinceLast = now - lastTimestamp;

    // If not enough time passed, return existing data
    if (timeSinceLast < INTERVAL_MS) {
      return existingData;
    }

    // Add new data points
    const pointsToAdd = Math.min(Math.floor(timeSinceLast / INTERVAL_MS), 3);
    const newData = [...data];

    for (let i = 1; i <= pointsToAdd; i++) {
      const timestamp = lastTimestamp + i * INTERVAL_MS;
      const time = new Date(timestamp).toLocaleTimeString();

      const trend = Math.sin(Date.now() / 60000) * 200;
      const noise = (Math.random() - 0.5) * 300;
      const spike = Math.random() > 0.9 ? (Math.random() - 0.5) * 1000 : 0;

      const delta = trend + noise + spike;
      cumulativeDelta += delta;

      newData.push({
        time,
        delta: Math.round(delta),
        cumulativeDelta: Math.round(cumulativeDelta)
      });
    }

    // Maintain rolling window
    const finalData = newData.slice(-MAX_DATA_POINTS);

    // Analyze delta patterns
    const recentDeltas = finalData.slice(-10).map(d => d.delta);
    const avgDelta = recentDeltas.reduce((sum, d) => sum + d, 0) / recentDeltas.length;
    const deltaVolatility = Math.sqrt(recentDeltas.reduce((sum, d) => sum + Math.pow(d - avgDelta, 2), 0) / recentDeltas.length);

    const bias = avgDelta > 50 ? 'bullish' : avgDelta < -50 ? 'bearish' : 'neutral';
    const strength = deltaVolatility > 200 ? 'High volatility' : 'Stable';

    const priceTrend = finalData.slice(-5).map((_, idx, arr) => arr[idx].cumulativeDelta - arr[0].cumulativeDelta);
    const isRising = priceTrend[priceTrend.length - 1] > 0;
    const deltaRising = avgDelta > 0;
    const divergence = isRising !== deltaRising;

    return {
      data: finalData,
      insights: {
        bias,
        strength,
        divergence,
        momentum: Math.min(100, Math.max(0, 50 + avgDelta / 10))
      },
      _meta: {
        lastTimestamp: Date.now(),
        cumulativeDelta
      }
    };
  }

  // First call: generate initial dataset
  const data = [];
  let cumulativeDelta = 0;
  const now = Date.now();

  for (let i = MAX_DATA_POINTS; i >= 0; i--) {
    const time = new Date(now - i * INTERVAL_MS).toLocaleTimeString();

    const trend = Math.sin(i / 10) * 200;
    const noise = (Math.random() - 0.5) * 300;
    const spike = Math.random() > 0.9 ? (Math.random() - 0.5) * 1000 : 0;

    const delta = trend + noise + spike;
    cumulativeDelta += delta;

    data.push({
      time,
      delta: Math.round(delta),
      cumulativeDelta: Math.round(cumulativeDelta)
    });
  }

  // Analyze delta patterns
  const recentDeltas = data.slice(-10).map(d => d.delta);
  const avgDelta = recentDeltas.reduce((sum, d) => sum + d, 0) / recentDeltas.length;
  const deltaVolatility = Math.sqrt(recentDeltas.reduce((sum, d) => sum + Math.pow(d - avgDelta, 2), 0) / recentDeltas.length);

  const bias = avgDelta > 50 ? 'bullish' : avgDelta < -50 ? 'bearish' : 'neutral';
  const strength = deltaVolatility > 200 ? 'High volatility' : 'Stable';

  const priceTrend = data.slice(-5).map((_, idx, arr) => arr[idx].cumulativeDelta - arr[0].cumulativeDelta);
  const isRising = priceTrend[priceTrend.length - 1] > 0;
  const deltaRising = avgDelta > 0;
  const divergence = isRising !== deltaRising;

  return {
    data,
    insights: {
      bias,
      strength,
      divergence,
      momentum: Math.min(100, Math.max(0, 50 + avgDelta / 10))
    },
    _meta: {
      lastTimestamp: now,
      cumulativeDelta
    }
  };
};