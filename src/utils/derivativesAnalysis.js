/**
 * Generate funding rate data with incremental update support
 * @param {object|null} existingData - Previous data for incremental update
 * @returns {object} Funding rate data
 */
export const generateFundingRateData = (existingData = null) => {
  const now = Date.now();
  const INTERVAL_MS = 3 * 60 * 60 * 1000; // 3 hours

  // Incremental update
  if (existingData && existingData._meta) {
    const timeSinceLast = now - existingData._meta.lastTimestamp;

    if (timeSinceLast < INTERVAL_MS / 3) { // Update every hour
      return existingData;
    }

    // Update current funding slightly
    const lastFunding = existingData.current;
    const fundingChange = (Math.random() - 0.5) * 0.002;
    const newFunding = Math.max(-0.015, Math.min(0.015, lastFunding + fundingChange));

    // If enough time for new data point, add it
    if (timeSinceLast >= INTERVAL_MS) {
      const newData = [...existingData.data.slice(-7)];
      const newAlerts = [...existingData.alerts];

      const time = new Date(now).toLocaleTimeString();
      let insight = "";

      if (Math.abs(newFunding) > 0.01) {
        insight = "Extreme funding rate - reversal risk high";
        newAlerts.push({ severity: 'high', message: `Extreme funding rate detected: ${(newFunding * 100).toFixed(4)}%` });
      } else if (Math.abs(newFunding) > 0.005) {
        insight = "High funding rate - monitor for position adjustments";
      } else if (newFunding > 0.001) {
        insight = "Longs paying shorts - bullish sentiment";
      } else if (newFunding < -0.001) {
        insight = "Shorts paying longs - bearish sentiment";
      }

      newData.push({ time, fundingRate: parseFloat(newFunding.toFixed(6)), insight });

      return {
        data: newData,
        current: newFunding,
        alerts: newAlerts.slice(-5),
        _meta: { lastTimestamp: now }
      };
    }

    return {
      ...existingData,
      current: newFunding,
      _meta: { lastTimestamp: now }
    };
  }

  // First call: generate initial data
  const data = [];
  const alerts = [];
  let currentFunding = 0;

  // Generate 24 hours of funding rate data (3 hour intervals)
  for (let i = 8; i >= 0; i--) {
    const time = new Date(Date.now() - i * 3 * 60 * 60 * 1000).toLocaleTimeString();
    
    // Simulate funding rate evolution
    const baseRate = 0.0001; // 0.01% base
    const marketSentiment = Math.sin(i / 2) * 0.005; // Market cycles
    const volatility = (Math.random() - 0.5) * 0.003; // Random component
    const extremeEvent = Math.random() > 0.9 ? (Math.random() - 0.5) * 0.02 : 0; // 10% chance of extreme
    
    const fundingRate = baseRate + marketSentiment + volatility + extremeEvent;
    
    if (i === 0) currentFunding = fundingRate;
    
    let insight = "";
    if (Math.abs(fundingRate) > 0.01) {
      insight = "Extreme funding rate - reversal risk high";
      alerts.push({
        severity: 'high',
        message: `Extreme funding rate detected: ${(fundingRate * 100).toFixed(4)}%`
      });
    } else if (Math.abs(fundingRate) > 0.005) {
      insight = "High funding rate - monitor for position adjustments";
      alerts.push({
        severity: 'medium', 
        message: `Elevated funding rate: ${(fundingRate * 100).toFixed(4)}%`
      });
    } else if (fundingRate > 0.001) {
      insight = "Longs paying shorts - bullish sentiment";
    } else if (fundingRate < -0.001) {
      insight = "Shorts paying longs - bearish sentiment";
    }
    
    data.push({
      time,
      fundingRate: parseFloat(fundingRate.toFixed(6)),
      insight
    });
  }
  
  return {
    data,
    current: currentFunding,
    alerts,
    _meta: { lastTimestamp: now }
  };
};

/**
 * Analyze open interest with incremental update support
 * @param {object|null} existingData - Previous data for incremental update
 * @returns {object} Open interest data
 */
export const analyzeOpenInterest = (existingData = null) => {
  const now = Date.now();
  const INTERVAL_MS = 60 * 60 * 1000; // 1 hour

  // Incremental update
  if (existingData && existingData._meta) {
    const timeSinceLast = now - existingData._meta.lastTimestamp;

    if (timeSinceLast < INTERVAL_MS / 2) {
      return existingData;
    }

    const lastData = existingData.data[existingData.data.length - 1];
    const oiChange = (Math.random() - 0.5) * 0.08;
    const newOI = Math.max(25000000, lastData.openInterest * (1 + oiChange));
    const priceChange = (Math.random() - 0.5) * 0.015;
    const newPrice = lastData.price * (1 + priceChange);

    if (timeSinceLast >= INTERVAL_MS) {
      const newData = [...existingData.data.slice(-19)];
      const time = new Date(now).toLocaleTimeString();

      const oiTrend = newOI > existingData.data[0].openInterest;
      const priceTrend = newPrice > existingData.data[0].price;
      let insight = "";

      if (oiTrend && priceTrend) insight = "Strong uptrend - OI and price rising together";
      else if (oiTrend && !priceTrend) insight = "Strong downtrend - fresh shorts entering";
      else if (!oiTrend && priceTrend) insight = "Short covering rally - weak hands out";
      else insight = "Long liquidation - selling pressure";

      newData.push({ time, openInterest: Math.round(newOI), price: parseFloat(newPrice.toFixed(2)), insight });

      const recentData = newData.slice(-5);
      const oiUp = recentData[4].openInterest > recentData[0].openInterest;
      const priceUp = recentData[4].price > recentData[0].price;

      let bias = 'neutral', strength = 'moderate';
      if (oiUp && priceUp) { bias = 'bullish'; strength = 'strong'; }
      else if (!oiUp && !priceUp) { bias = 'bearish'; strength = 'strong'; }
      else if (oiUp && !priceUp) { bias = 'bearish'; strength = 'moderate'; }
      else if (!oiUp && priceUp) { bias = 'bullish'; strength = 'weak'; }

      return {
        data: newData,
        trend: oiUp ? 'increasing' : 'decreasing',
        sentiment: { bias, strength },
        alerts: existingData.alerts,
        _meta: { lastTimestamp: now }
      };
    }

    return existingData;
  }

  // First call: generate initial data
  const data = [];
  const alerts = [];
  let trend = 'stable';

  const baseOI = 50000000; // $50M base open interest
  let currentOI = baseOI;
  let priceBase = 2800;
  
  for (let i = 20; i >= 0; i--) {
    const time = new Date(Date.now() - i * 60 * 60 * 1000).toLocaleTimeString();
    
    // Generate OI changes
    const trendFactor = Math.sin(i / 5) * 0.1; // Gradual trend
    const volatilityFactor = (Math.random() - 0.5) * 0.05; // Random changes
    const eventFactor = Math.random() > 0.95 ? (Math.random() - 0.5) * 0.3 : 0; // 5% chance of major event
    
    const oiChange = trendFactor + volatilityFactor + eventFactor;
    currentOI = Math.max(baseOI * 0.5, currentOI * (1 + oiChange));
    
    // Generate corresponding price
    const priceChange = (Math.random() - 0.5) * 0.02 + trendFactor * 0.5;
    priceBase = priceBase * (1 + priceChange);
    
    let insight = "";
    
    // Analyze OI vs Price relationship
    if (i < 5) { // Recent data
      const oiTrend = currentOI > baseOI * 1.1 ? 'increasing' : 
                     currentOI < baseOI * 0.9 ? 'decreasing' : 'stable';
      const priceTrend = priceBase > 2800 * 1.02 ? 'up' : 
                         priceBase < 2800 * 0.98 ? 'down' : 'flat';
      
      if (oiTrend === 'increasing' && priceTrend === 'up') {
        insight = "Strong uptrend - OI and price rising together";
        trend = 'increasing';
      } else if (oiTrend === 'increasing' && priceTrend === 'down') {
        insight = "Strong downtrend - fresh shorts entering";
        trend = 'increasing';
      } else if (oiTrend === 'decreasing' && priceTrend === 'up') {
        insight = "Short covering rally - weak hands out";
        trend = 'decreasing';
      } else if (oiTrend === 'decreasing' && priceTrend === 'down') {
        insight = "Long liquidation - selling pressure";
        trend = 'decreasing';
      }
      
      // Generate alerts for significant changes
      if (Math.abs(oiChange) > 0.15) {
        alerts.push({
          severity: 'high',
          message: `Major OI change: ${(oiChange * 100).toFixed(1)}% - ${insight}`
        });
      }
    }
    
    data.push({
      time,
      openInterest: Math.round(currentOI),
      price: parseFloat(priceBase.toFixed(2)),
      insight
    });
  }
  
  // Determine market sentiment
  const recentData = data.slice(-5);
  const oiTrend = recentData[4].openInterest > recentData[0].openInterest;
  const priceTrend = recentData[4].price > recentData[0].price;
  
  let bias = 'neutral';
  let strength = 'moderate';
  
  if (oiTrend && priceTrend) {
    bias = 'bullish';
    strength = 'strong';
  } else if (!oiTrend && !priceTrend) {
    bias = 'bearish'; 
    strength = 'strong';
  } else if (oiTrend && !priceTrend) {
    bias = 'bearish';
    strength = 'moderate';
  } else if (!oiTrend && priceTrend) {
    bias = 'bullish';
    strength = 'weak';
  }
  
  return {
    data,
    trend,
    sentiment: { bias, strength },
    alerts,
    _meta: { lastTimestamp: now }
  };
};

/**
 * Combined Funding Rate and Open Interest data generator
 * This combines both datasets for the FundingRateOI component
 * @param {object|null} existingData - Previous data for incremental update
 * @returns {object} Combined funding rate and open interest data
 */
export const generateFundingOIData = (existingData = null) => {
  // Generate funding rate data
  const fundingResult = generateFundingRateData(
    existingData?._meta?.fundingMeta ? { data: existingData.fundingData, current: existingData.currentFunding, alerts: existingData.alerts?.filter(a => a.type === 'funding'), _meta: existingData._meta.fundingMeta } : null
  );

  // Generate open interest data
  const oiResult = analyzeOpenInterest(
    existingData?._meta?.oiMeta ? { data: existingData.oiData, trend: existingData.oiTrend, sentiment: existingData.marketSentiment, alerts: existingData.alerts?.filter(a => a.type === 'oi'), _meta: existingData._meta.oiMeta } : null
  );

  // Combine alerts from both sources
  const combinedAlerts = [
    ...fundingResult.alerts.map(a => ({ ...a, type: 'funding' })),
    ...oiResult.alerts.map(a => ({ ...a, type: 'oi' }))
  ].slice(-5); // Keep only last 5 alerts

  return {
    fundingData: fundingResult.data,
    oiData: oiResult.data,
    currentFunding: fundingResult.current,
    oiTrend: oiResult.trend,
    marketSentiment: oiResult.sentiment,
    alerts: combinedAlerts,
    _meta: {
      lastTimestamp: Date.now(),
      fundingMeta: fundingResult._meta,
      oiMeta: oiResult._meta
    }
  };
};