/**
 * Orderflow Data Generator
 * Supports incremental updates - appends new data to existing data
 * Respects timeframe setting for candle periods
 */

// Rolling window size
const MAX_CANDLES = 100;

// Timeframe to seconds mapping
const TIMEFRAME_SECONDS = {
  '1m': 60,
  '5m': 300,
  '15m': 900,
  '1h': 3600,
  '4h': 14400,
  '1d': 86400
};

/**
 * Get candle interval from localStorage or default to 5m
 */
const getCandleInterval = () => {
  if (typeof window === 'undefined') return 300; // 5m default
  const timeframe = localStorage.getItem('tradingTimeframe') || '5m';
  return TIMEFRAME_SECONDS[timeframe] || 300;
};

/**
 * Generate a single candle based on the last price
 * @param {number} lastPrice - The previous closing price
 * @param {number} timestamp - The candle timestamp (seconds)
 * @param {number} cumulativeDelta - Current cumulative delta
 * @returns {object} New candle, volume, and delta data
 */
const generateSingleCandle = (lastPrice, timestamp, cumulativeDelta) => {
  // Generate realistic price movement
  const volatility = 0.008;
  const trend = Math.sin(Date.now() / 60000) * 0.001;
  const noise = (Math.random() - 0.5) * volatility;
  const change = trend + noise;

  const open = lastPrice;
  const close = lastPrice * (1 + change);
  const high = Math.max(open, close) * (1 + Math.random() * 0.003);
  const low = Math.min(open, close) * (1 - Math.random() * 0.003);

  // Volume with some clustering
  const baseVolume = 1000 + Math.random() * 2000;
  const volumeSpike = Math.random() > 0.9 ? 3 : 1;
  const volume = baseVolume * volumeSpike;

  // Delta calculation
  const buyRatio = change > 0 ? 0.6 + Math.random() * 0.2 : 0.3 + Math.random() * 0.2;
  const delta = volume * (buyRatio - 0.5) * 2;
  const newCumulativeDelta = cumulativeDelta + delta;

  return {
    candle: {
      time: timestamp,
      open: parseFloat(open.toFixed(2)),
      high: parseFloat(high.toFixed(2)),
      low: parseFloat(low.toFixed(2)),
      close: parseFloat(close.toFixed(2))
    },
    volume: {
      time: timestamp,
      value: Math.round(volume),
      color: change > 0 ? '#22c55e' : '#ef4444'
    },
    delta: {
      time: timestamp,
      value: Math.round(newCumulativeDelta)
    },
    cumulativeDelta: newCumulativeDelta
  };
};

/**
 * Generate initial orderflow data (first call)
 * @returns {object} Initial data with candles, volume, delta
 */
const generateInitialOrderflowData = () => {
  const now = Date.now();
  const candleInterval = getCandleInterval(); // Respect timeframe setting
  const data = { candles: [], volume: [], delta: [], _meta: { candleInterval } };

  let price = 2800;
  let cumulativeDelta = 0;

  for (let i = MAX_CANDLES; i >= 0; i--) {
    const time = Math.floor((now - (i * candleInterval * 1000)) / 1000);

    // Generate realistic price movement
    const volatility = 0.015;
    const trend = Math.sin(i / 20) * 0.002;
    const noise = (Math.random() - 0.5) * volatility;
    const change = trend + noise;

    const open = price;
    const close = price * (1 + change);
    const high = Math.max(open, close) * (1 + Math.random() * 0.005);
    const low = Math.min(open, close) * (1 - Math.random() * 0.005);

    price = close;

    // Volume with some clustering
    const baseVolume = 1000 + Math.random() * 2000;
    const volumeSpike = Math.random() > 0.9 ? 3 : 1;
    const volume = baseVolume * volumeSpike;

    // Delta calculation
    const buyRatio = change > 0 ? 0.6 + Math.random() * 0.2 : 0.3 + Math.random() * 0.2;
    const delta = volume * (buyRatio - 0.5) * 2;
    cumulativeDelta += delta;

    data.candles.push({
      time,
      open: parseFloat(open.toFixed(2)),
      high: parseFloat(high.toFixed(2)),
      low: parseFloat(low.toFixed(2)),
      close: parseFloat(close.toFixed(2))
    });

    data.volume.push({
      time,
      value: Math.round(volume),
      color: change > 0 ? '#22c55e' : '#ef4444'
    });

    data.delta.push({
      time,
      value: Math.round(cumulativeDelta)
    });
  }

  // Store metadata for next incremental update
  data._meta = {
    lastPrice: price,
    lastTimestamp: data.candles[data.candles.length - 1].time,
    cumulativeDelta,
    candleInterval
  };

  return data;
};

/**
 * Generate orderflow data - supports incremental updates
 * @param {object|null} existingData - Previous data for incremental update
 * @returns {object} Updated data with candles, volume, delta
 */
export const generateOrderflowData = (existingData = null) => {
  // First call: generate full initial dataset
  if (!existingData || !existingData.candles || existingData.candles.length === 0) {
    return generateInitialOrderflowData();
  }

  // Check if timeframe has changed - regenerate if so
  const currentInterval = getCandleInterval();
  const existingInterval = existingData._meta?.candleInterval;
  if (existingInterval && existingInterval !== currentInterval) {
    // Timeframe changed, regenerate from scratch
    return generateInitialOrderflowData();
  }

  // Incremental update: append new candle(s)
  const { candles, volume, delta, _meta } = existingData;
  const lastPrice = _meta?.lastPrice || candles[candles.length - 1].close;
  const lastTimestamp = _meta?.lastTimestamp || candles[candles.length - 1].time;
  const cumulativeDelta = _meta?.cumulativeDelta || delta[delta.length - 1].value;

  // Calculate how many new candles to add based on time elapsed
  const now = Math.floor(Date.now() / 1000);
  const timeSinceLastCandle = now - lastTimestamp;
  const candleInterval = _meta?.candleInterval || getCandleInterval(); // Respect timeframe setting

  // If not enough time has passed, just return existing data with updated current candle
  if (timeSinceLastCandle < candleInterval) {
    // Update the last candle with new price action
    const lastCandle = { ...candles[candles.length - 1] };
    const priceMove = (Math.random() - 0.5) * 0.002 * lastPrice;
    const newPrice = lastCandle.close + priceMove;

    lastCandle.close = parseFloat(newPrice.toFixed(2));
    lastCandle.high = Math.max(lastCandle.high, newPrice);
    lastCandle.low = Math.min(lastCandle.low, newPrice);

    const updatedCandles = [...candles.slice(0, -1), lastCandle];

    return {
      candles: updatedCandles,
      volume: [...volume],
      delta: [...delta],
      _meta: {
        lastPrice: newPrice,
        lastTimestamp,
        cumulativeDelta,
        candleInterval
      }
    };
  }

  // Add new candle(s) for elapsed time
  const candlesToAdd = Math.min(Math.floor(timeSinceLastCandle / candleInterval), 5); // Max 5 at a time

  let currentPrice = lastPrice;
  let currentDelta = cumulativeDelta;
  const newCandles = [...candles];
  const newVolume = [...volume];
  const newDelta = [...delta];

  for (let i = 1; i <= candlesToAdd; i++) {
    const newTimestamp = lastTimestamp + (i * candleInterval);
    const result = generateSingleCandle(currentPrice, newTimestamp, currentDelta);

    newCandles.push(result.candle);
    newVolume.push(result.volume);
    newDelta.push(result.delta);

    currentPrice = result.candle.close;
    currentDelta = result.cumulativeDelta;
  }

  // Maintain rolling window
  const finalCandles = newCandles.slice(-MAX_CANDLES);
  const finalVolume = newVolume.slice(-MAX_CANDLES);
  const finalDelta = newDelta.slice(-MAX_CANDLES);

  return {
    candles: finalCandles,
    volume: finalVolume,
    delta: finalDelta,
    _meta: {
      lastPrice: currentPrice,
      lastTimestamp: finalCandles[finalCandles.length - 1].time,
      cumulativeDelta: currentDelta,
      candleInterval
    }
  };
};
