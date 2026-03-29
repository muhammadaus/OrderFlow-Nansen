/**
 * Mock Stream Generator
 * Creates streaming mock data that simulates real-time updates
 * Used as default data source before switching to live APIs
 */

/**
 * Create a mock stream that periodically generates new data
 * @param {function} generator - Function that generates data
 * @param {number} intervalMs - Update interval in milliseconds
 * @returns {object} Stream object with subscribe method
 */
export function createMockStream(generator, intervalMs = 1000) {
  let subscribers = [];
  let interval = null;
  let lastData = null;

  return {
    /**
     * Subscribe to stream updates
     * @param {function} callback - Called with new data on each update
     * @returns {function} Unsubscribe function
     */
    subscribe(callback) {
      subscribers.push(callback);

      // Start streaming if not already
      if (!interval) {
        // Initial data
        lastData = generator();
        subscribers.forEach(cb => cb(lastData));

        // Start interval
        interval = setInterval(() => {
          lastData = generator(lastData);
          subscribers.forEach(cb => cb(lastData));
        }, intervalMs);
      } else if (lastData) {
        // Send last known data to new subscriber
        callback(lastData);
      }

      // Return unsubscribe function
      return () => {
        subscribers = subscribers.filter(s => s !== callback);
        if (subscribers.length === 0 && interval) {
          clearInterval(interval);
          interval = null;
        }
      };
    },

    /**
     * Get current data without subscribing
     */
    getCurrent() {
      if (!lastData) {
        lastData = generator();
      }
      return lastData;
    },

    /**
     * Check if stream is active
     */
    isActive() {
      return interval !== null;
    },

    /**
     * Get subscriber count
     */
    getSubscriberCount() {
      return subscribers.length;
    }
  };
}

/**
 * Create a price ticker that simulates real-time price changes
 * @param {number} basePrice - Starting price
 * @param {number} volatility - Price volatility (0-1)
 * @param {number} intervalMs - Update interval
 */
export function createPriceTicker(basePrice = 2800, volatility = 0.001, intervalMs = 1000) {
  let currentPrice = basePrice;
  let trend = 0;

  const generator = () => {
    // Random walk with slight trend persistence
    trend = trend * 0.95 + (Math.random() - 0.5) * 0.1;
    const change = (Math.random() - 0.5 + trend) * volatility;
    currentPrice *= (1 + change);

    return {
      time: Math.floor(Date.now() / 1000),
      price: parseFloat(currentPrice.toFixed(2)),
      change: parseFloat((change * 100).toFixed(4)),
      source: 'mock'
    };
  };

  return createMockStream(generator, intervalMs);
}

/**
 * Create a volume ticker that simulates trading volume
 * @param {number} baseVolume - Base volume per tick
 * @param {number} intervalMs - Update interval
 */
export function createVolumeTicker(baseVolume = 100000, intervalMs = 5000) {
  let cumulativeVolume = 0;

  const generator = () => {
    // Random volume with occasional spikes
    const spike = Math.random() > 0.9 ? 3 + Math.random() * 5 : 1;
    const volume = baseVolume * (0.5 + Math.random()) * spike;
    cumulativeVolume += volume;

    const buyRatio = 0.4 + Math.random() * 0.2;

    return {
      time: Math.floor(Date.now() / 1000),
      volume: Math.round(volume),
      buyVolume: Math.round(volume * buyRatio),
      sellVolume: Math.round(volume * (1 - buyRatio)),
      cumulativeVolume: Math.round(cumulativeVolume),
      trades: Math.round(volume / 1000),
      source: 'mock'
    };
  };

  return createMockStream(generator, intervalMs);
}

/**
 * Create a candle stream that builds OHLCV candles over time
 * @param {number} basePrice - Starting price
 * @param {string} timeframe - Candle timeframe ('1m', '5m', '15m', '1h')
 * @param {number} updateMs - How often to update current candle
 */
export function createCandleStream(basePrice = 2800, timeframe = '1m', updateMs = 1000) {
  const timeframes = {
    '1m': 60000,
    '5m': 300000,
    '15m': 900000,
    '1h': 3600000
  };

  const candleMs = timeframes[timeframe] || 60000;
  let currentCandle = null;
  let candles = [];
  let price = basePrice;

  const generator = (lastData) => {
    const now = Date.now();
    const candleStart = Math.floor(now / candleMs) * candleMs;
    const candleTime = Math.floor(candleStart / 1000);

    // Price movement
    const volatility = 0.002;
    const change = (Math.random() - 0.5) * volatility;
    price *= (1 + change);

    // Volume
    const volume = 1000 + Math.random() * 2000;

    // Check if new candle
    if (!currentCandle || currentCandle.time !== candleTime) {
      // Save previous candle
      if (currentCandle) {
        candles.push({ ...currentCandle });
        if (candles.length > 100) candles.shift();
      }

      // Start new candle
      currentCandle = {
        time: candleTime,
        open: price,
        high: price,
        low: price,
        close: price,
        volume: volume
      };
    } else {
      // Update current candle
      currentCandle.high = Math.max(currentCandle.high, price);
      currentCandle.low = Math.min(currentCandle.low, price);
      currentCandle.close = price;
      currentCandle.volume += volume;
    }

    return {
      candles: [...candles, currentCandle],
      currentCandle: { ...currentCandle },
      isNewCandle: lastData?.currentCandle?.time !== candleTime,
      source: 'mock'
    };
  };

  return createMockStream(generator, updateMs);
}

/**
 * Create an orderbook stream with bid/ask updates
 * @param {number} midPrice - Mid price
 * @param {number} depth - Number of levels
 * @param {number} intervalMs - Update interval
 */
export function createOrderbookStream(midPrice = 2800, depth = 20, intervalMs = 500) {
  const generator = () => {
    const spread = midPrice * 0.0005;
    const bids = [];
    const asks = [];

    for (let i = 0; i < depth; i++) {
      const bidPrice = midPrice - spread / 2 - i * (midPrice * 0.0002);
      const askPrice = midPrice + spread / 2 + i * (midPrice * 0.0002);

      // Liquidity decreases with distance from mid
      const baseLiquidity = 50000 * Math.exp(-i * 0.1);
      const variation = 0.5 + Math.random();

      bids.push({
        price: parseFloat(bidPrice.toFixed(2)),
        quantity: parseFloat((baseLiquidity * variation).toFixed(2)),
        total: 0
      });

      asks.push({
        price: parseFloat(askPrice.toFixed(2)),
        quantity: parseFloat((baseLiquidity * variation).toFixed(2)),
        total: 0
      });
    }

    // Calculate cumulative totals
    let bidTotal = 0;
    let askTotal = 0;
    bids.forEach(b => { bidTotal += b.quantity; b.total = bidTotal; });
    asks.forEach(a => { askTotal += a.quantity; a.total = askTotal; });

    return {
      time: Math.floor(Date.now() / 1000),
      bids,
      asks,
      spread: parseFloat(spread.toFixed(2)),
      spreadPercent: parseFloat((spread / midPrice * 100).toFixed(4)),
      bidTotal,
      askTotal,
      imbalance: parseFloat(((bidTotal - askTotal) / (bidTotal + askTotal)).toFixed(4)),
      source: 'mock'
    };
  };

  return createMockStream(generator, intervalMs);
}

/**
 * Create a trade stream with individual trades
 * @param {number} midPrice - Current price
 * @param {number} tradesPerSecond - Average trades per second
 */
export function createTradeStream(midPrice = 2800, tradesPerSecond = 2) {
  const intervalMs = 1000 / tradesPerSecond;
  let tradeId = Date.now();

  const generator = () => {
    tradeId++;
    const side = Math.random() > 0.5 ? 'buy' : 'sell';
    const priceVariation = (Math.random() - 0.5) * midPrice * 0.001;
    const price = midPrice + priceVariation;

    // Trade size follows power law distribution
    const baseSize = 0.1;
    const sizeFactor = Math.pow(Math.random(), 2) * 10;
    const size = baseSize + sizeFactor;

    return {
      id: tradeId,
      time: Math.floor(Date.now() / 1000),
      price: parseFloat(price.toFixed(2)),
      size: parseFloat(size.toFixed(4)),
      side,
      value: parseFloat((price * size).toFixed(2)),
      source: 'mock'
    };
  };

  return createMockStream(generator, intervalMs);
}

/**
 * Create a delta stream tracking buy/sell pressure
 * @param {number} intervalMs - Update interval
 */
export function createDeltaStream(intervalMs = 1000) {
  let cumulativeDelta = 0;

  const generator = () => {
    // Delta varies with some persistence
    const deltaChange = (Math.random() - 0.5) * 500;
    cumulativeDelta += deltaChange;

    const buyVolume = 10000 + Math.random() * 5000;
    const sellVolume = 10000 + Math.random() * 5000;
    const delta = buyVolume - sellVolume;

    return {
      time: Math.floor(Date.now() / 1000),
      delta: Math.round(delta),
      cumulativeDelta: Math.round(cumulativeDelta),
      buyVolume: Math.round(buyVolume),
      sellVolume: Math.round(sellVolume),
      ratio: parseFloat((buyVolume / (buyVolume + sellVolume)).toFixed(3)),
      source: 'mock'
    };
  };

  return createMockStream(generator, intervalMs);
}

export default {
  createMockStream,
  createPriceTicker,
  createVolumeTicker,
  createCandleStream,
  createOrderbookStream,
  createTradeStream,
  createDeltaStream
};
