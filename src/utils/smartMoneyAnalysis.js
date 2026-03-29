/**
 * Analyze SMC with incremental update support
 * @param {object|null} existingData - Previous data for incremental update
 * @returns {object} SMC analysis
 */
export const analyzeSmartMoneyConcepts = (existingData = null) => {
  const now = Date.now();
  const UPDATE_INTERVAL = 30 * 60 * 1000; // 30 minutes

  // Incremental update
  if (existingData && existingData._meta) {
    const timeSinceLast = now - existingData._meta.lastTimestamp;

    if (timeSinceLast < UPDATE_INTERVAL) {
      return existingData;
    }

    // Add new candle to price data
    const { priceData, _meta } = existingData;
    let basePrice = _meta.lastPrice || priceData[priceData.length - 1].close;

    const newPriceData = [...priceData.slice(-49)];
    const time = new Date(now).toLocaleTimeString();

    const volatility = 0.012;
    const trend = Math.sin(now / 600000) * 0.005;
    const priceChange = trend + (Math.random() - 0.5) * volatility;

    const open = basePrice;
    const close = basePrice * (1 + priceChange);
    const high = Math.max(open, close) * (1 + Math.random() * 0.003);
    const low = Math.min(open, close) * (1 - Math.random() * 0.003);

    newPriceData.push({
      time,
      open: parseFloat(open.toFixed(2)),
      high: parseFloat(high.toFixed(2)),
      low: parseFloat(low.toFixed(2)),
      close: parseFloat(close.toFixed(2))
    });

    // Determine current bias
    const recentPrices = newPriceData.slice(-10);
    const bias = recentPrices[recentPrices.length - 1].close > recentPrices[0].close ? 'Bullish' : 'Bearish';

    return {
      priceData: newPriceData,
      orderBlocks: existingData.orderBlocks,
      fairValueGaps: existingData.fairValueGaps,
      liquidityGrabs: existingData.liquidityGrabs,
      structureShifts: existingData.structureShifts,
      bias,
      inducements: existingData.inducements,
      _meta: { lastTimestamp: now, lastPrice: close }
    };
  }

  // First call: generate initial data
  const priceData = [];
  const orderBlocks = [];
  const fairValueGaps = [];
  const liquidityGrabs = [];
  const structureShifts = [];
  const inducements = [];

  let basePrice = 2800;
  let previousHigh = 0;
  let previousLow = 999999;
  let bias = 'Bullish';
  
  // Generate SMC analysis data
  for (let i = 50; i >= 0; i--) {
    const time = new Date(Date.now() - i * 30 * 60 * 1000).toLocaleTimeString();
    
    // Generate price movement with SMC patterns
    const volatility = 0.012;
    const trend = Math.sin(i / 10) * 0.005;
    const manipulation = i % 8 === 0 ? (Math.random() - 0.5) * 0.02 : 0; // Manipulation every 8 periods
    
    const priceChange = trend + (Math.random() - 0.5) * volatility + manipulation;
    
    // Calculate OHLC
    const open = basePrice;
    const close = basePrice * (1 + priceChange);
    const high = Math.max(open, close) * (1 + Math.random() * 0.003);
    const low = Math.min(open, close) * (1 - Math.random() * 0.003);
    
    basePrice = close;
    
    // Track highs and lows for structure analysis
    if (high > previousHigh) previousHigh = high;
    if (low < previousLow) previousLow = low;
    
    const candle = {
      time,
      open: parseFloat(open.toFixed(2)),
      high: parseFloat(high.toFixed(2)),
      low: parseFloat(low.toFixed(2)),
      close: parseFloat(close.toFixed(2))
    };
    
    // Detect Order Blocks
    if (i % 7 === 0) {
      const isRejection = Math.abs(close - open) > Math.abs(high - low) * 0.7;
      if (isRejection) {
        const obType = close > open ? 'Bullish' : 'Bearish';
        orderBlocks.push({
          price: obType === 'Bullish' ? low : high,
          type: obType,
          time,
          strength: 70 + Math.random() * 25,
          active: true,
          tested: Math.random() > 0.6,
          significance: isRejection ? 'High' : 'Medium'
        });
      }
    }
    
    // Detect Fair Value Gaps
    if (i > 2 && i % 5 === 0) {
      const gapSize = Math.abs(high - low) * 0.5;
      if (gapSize > basePrice * 0.008) { // Significant gap
        fairValueGaps.push({
          price: (high + low) / 2,
          type: close > open ? 'Bullish' : 'Bearish',
          size: (gapSize / basePrice) * 100,
          timeframe: '30M',
          filled: false,
          time
        });
      }
    }
    
    // Detect Liquidity Grabs
    if (manipulation !== 0) {
      const grabType = manipulation > 0 ? 'Buy-side' : 'Sell-side';
      liquidityGrabs.push({
        price: manipulation > 0 ? high : low,
        type: grabType,
        time,
        description: `${grabType} liquidity grabbed before reversal`,
        recent: i < 10,
        significance: 'High'
      });
      
      candle.liquidityGrab = true;
    }
    
    // Detect Structure Shifts
    if (i % 12 === 0) {
      const shiftType = Math.random() > 0.5 ? 'Break of Structure' : 'Change of Character';
      const direction = close > open ? 'Bullish' : 'Bearish';
      
      structureShifts.push({
        type: shiftType,
        direction,
        price: close,
        time,
        description: `${shiftType} detected - Market bias may shift to ${direction.toLowerCase()}`
      });
      
      candle.structureShift = shiftType;
      
      // Update bias based on structure shift
      if (direction === 'Bullish' && bias !== 'Bullish') bias = 'Bullish';
      if (direction === 'Bearish' && bias !== 'Bearish') bias = 'Bearish';
    }
    
    priceData.push(candle);
  }
  
  // Generate Inducements
  inducements.push(
    {
      type: 'Equal Highs',
      level: previousHigh * 0.998,
      description: 'Retail stops likely clustered above these highs',
      probability: 75
    },
    {
      type: 'Equal Lows',
      level: previousLow * 1.002,
      description: 'Retail stops likely clustered below these lows',
      probability: 80
    },
    {
      type: 'Previous Day High',
      level: basePrice * 1.015,
      description: 'PDH often acts as liquidity target',
      probability: 65
    },
    {
      type: 'Previous Day Low',
      level: basePrice * 0.985,
      description: 'PDL often acts as liquidity target',
      probability: 70
    }
  );
  
  return {
    priceData,
    orderBlocks: orderBlocks.slice(-15), // Keep recent ones
    fairValueGaps: fairValueGaps.slice(-10),
    liquidityGrabs: liquidityGrabs.slice(-8),
    structureShifts: structureShifts.slice(-6),
    bias,
    inducements,
    _meta: { lastTimestamp: now, lastPrice: basePrice }
  };
};

export const detectOrderBlocks = (candleData) => {
  const orderBlocks = [];
  
  for (let i = 2; i < candleData.length - 1; i++) {
    const current = candleData[i];
    const previous = candleData[i - 1];
    const next = candleData[i + 1];
    
    // Bullish Order Block: Strong rejection from low with follow-through
    const isBullishOB = (
      current.low < previous.low &&
      current.close > current.open &&
      next.low > current.low &&
      (current.close - current.low) > (current.high - current.close) * 1.5
    );
    
    // Bearish Order Block: Strong rejection from high with follow-through
    const isBearishOB = (
      current.high > previous.high &&
      current.close < current.open &&
      next.high < current.high &&
      (current.high - current.close) > (current.close - current.low) * 1.5
    );
    
    if (isBullishOB) {
      orderBlocks.push({
        price: current.low,
        type: 'Bullish',
        time: current.time,
        strength: calculateOrderBlockStrength(current, previous, next),
        active: true,
        tested: false
      });
    }
    
    if (isBearishOB) {
      orderBlocks.push({
        price: current.high,
        type: 'Bearish', 
        time: current.time,
        strength: calculateOrderBlockStrength(current, previous, next),
        active: true,
        tested: false
      });
    }
  }
  
  return orderBlocks;
};

export const detectFairValueGaps = (candleData) => {
  const fvgs = [];
  
  for (let i = 1; i < candleData.length - 1; i++) {
    const previous = candleData[i - 1];
    const current = candleData[i];
    const next = candleData[i + 1];
    
    // Bullish FVG: Current low > Previous high (gap up)
    if (current.low > previous.high) {
      const gapSize = current.low - previous.high;
      const gapPercent = (gapSize / current.close) * 100;
      
      if (gapPercent > 0.5) { // Significant gap
        fvgs.push({
          price: (current.low + previous.high) / 2,
          type: 'Bullish',
          size: gapPercent,
          timeframe: '30M',
          filled: false,
          time: current.time
        });
      }
    }
    
    // Bearish FVG: Current high < Previous low (gap down)
    if (current.high < previous.low) {
      const gapSize = previous.low - current.high;
      const gapPercent = (gapSize / current.close) * 100;
      
      if (gapPercent > 0.5) { // Significant gap
        fvgs.push({
          price: (previous.low + current.high) / 2,
          type: 'Bearish',
          size: gapPercent,
          timeframe: '30M',
          filled: false,
          time: current.time
        });
      }
    }
  }
  
  return fvgs;
};

export const detectLiquidityGrabs = (candleData) => {
  const grabs = [];
  
  for (let i = 5; i < candleData.length - 1; i++) {
    const current = candleData[i];
    const recentData = candleData.slice(i - 5, i);
    
    // Find recent highs and lows
    const recentHigh = Math.max(...recentData.map(c => c.high));
    const recentLow = Math.min(...recentData.map(c => c.low));
    
    // Buy-side liquidity grab: Brief spike above recent high then reversal
    if (current.high > recentHigh * 1.002 && current.close < current.open) {
      grabs.push({
        price: current.high,
        type: 'Buy-side',
        time: current.time,
        description: 'Buy-side liquidity grabbed - stops triggered above highs',
        recent: true,
        reversal: true
      });
    }
    
    // Sell-side liquidity grab: Brief spike below recent low then reversal  
    if (current.low < recentLow * 0.998 && current.close > current.open) {
      grabs.push({
        price: current.low,
        type: 'Sell-side',
        time: current.time,
        description: 'Sell-side liquidity grabbed - stops triggered below lows',
        recent: true,
        reversal: true
      });
    }
  }
  
  return grabs;
};

const calculateOrderBlockStrength = (current, previous, next) => {
  // Factors that increase Order Block strength:
  // 1. Size of rejection (wick vs body ratio)
  // 2. Follow-through in next candle
  // 3. Volume (simulated based on range)
  
  const rejectionSize = current.close > current.open ? 
    (current.close - current.low) / (current.high - current.low) :
    (current.high - current.close) / (current.high - current.low);
    
  const followThrough = Math.abs(next.close - current.close) / current.close;
  const volatility = (current.high - current.low) / current.close;
  
  const baseStrength = 50;
  const rejectionBonus = rejectionSize * 30;
  const followThroughBonus = followThrough * 100;
  const volatilityBonus = volatility * 50;
  
  return Math.min(95, baseStrength + rejectionBonus + followThroughBonus + volatilityBonus);
};