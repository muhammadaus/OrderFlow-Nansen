// CVD Trend Break Analysis
// Identifies structural CVD breaks vs micro pullbacks

const MAX_CVD_POINTS = 101;
const INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Analyze CVD trends with incremental update support
 * @param {object|null} existingData - Previous data for incremental update
 * @returns {object} CVD analysis
 */
export const analyzeCVDTrends = (existingData = null) => {
  const now = Date.now();

  // Incremental update
  if (existingData && existingData._meta) {
    const timeSinceLast = now - existingData._meta.lastTimestamp;

    if (timeSinceLast < INTERVAL_MS) {
      return existingData;
    }

    const { cvdData, trendLines, breaks, _meta } = existingData;
    let price = _meta.lastPrice || cvdData[cvdData.length - 1].price;
    let cvd = _meta.lastCvd || cvdData[cvdData.length - 1].cvd;

    const pointsToAdd = Math.min(Math.floor(timeSinceLast / INTERVAL_MS), 3);
    const newCvdData = [...cvdData];

    for (let i = 1; i <= pointsToAdd; i++) {
      const timestamp = _meta.lastTimestamp + i * INTERVAL_MS;
      const time = new Date(timestamp).toLocaleTimeString();

      const trendBias = Math.sin(timestamp / 1500000) > 0 ? 0.55 : 0.45;
      const volume = 1000 + Math.random() * 2000;
      const delta = volume * (trendBias - 0.5 + (Math.random() - 0.5) * 0.4);
      cvd += delta;

      const priceChange = delta / 50000 + (Math.random() - 0.5) * 0.005;
      price *= (1 + priceChange);

      newCvdData.push({
        time,
        timestamp: timestamp / 1000,
        cvd: Math.round(cvd),
        delta: Math.round(delta),
        price: parseFloat(price.toFixed(2)),
        volume: Math.round(volume)
      });
    }

    const finalCvdData = newCvdData.slice(-MAX_CVD_POINTS);

    // Recalculate divergence
    const recentData = finalCvdData.slice(-20);
    const priceChange = (recentData[19].price - recentData[0].price) / recentData[0].price;
    const cvdChange = (recentData[19].cvd - recentData[0].cvd) / Math.abs(recentData[0].cvd || 1);

    let divergence;
    if (priceChange > 0.01 && cvdChange < -0.1) {
      divergence = { active: true, type: 'bearish', strength: Math.min(100, Math.abs(cvdChange) * 200), description: 'Price rising but CVD falling', tradingTip: 'Uptrend losing steam' };
    } else if (priceChange < -0.01 && cvdChange > 0.1) {
      divergence = { active: true, type: 'bullish', strength: Math.min(100, cvdChange * 200), description: 'Price falling but CVD rising', tradingTip: 'Downtrend losing steam' };
    } else {
      divergence = { active: false, type: 'none', strength: 0, description: 'CVD and price aligned', tradingTip: 'Trade with the trend' };
    }

    const lastCVD = finalCvdData[finalCvdData.length - 1].cvd;
    const cvd20PeriodsAgo = finalCvdData[finalCvdData.length - 21]?.cvd || 0;
    const cvdBias = lastCVD > cvd20PeriodsAgo + 1000 ? 'bullish' : lastCVD < cvd20PeriodsAgo - 1000 ? 'bearish' : 'neutral';

    return {
      cvdData: finalCvdData,
      trendLines: existingData.trendLines,
      breaks: existingData.breaks,
      divergence,
      cvdBias,
      metrics: {
        ...existingData.metrics,
        hasDivergence: divergence.active
      },
      _meta: { lastTimestamp: now, lastPrice: price, lastCvd: cvd }
    };
  }

  // First call: generate initial data
  const cvdData = [];
  const trendLines = [];
  const breaks = [];

  let price = 2800;
  let cvd = 0;

  // Generate CVD and price data
  for (let i = 100; i >= 0; i--) {
    const time = new Date(now - i * 5 * 60 * 1000).toLocaleTimeString();
    const timestamp = (now - i * 5 * 60 * 1000) / 1000;

    // Create trending and ranging periods
    const period = Math.floor(i / 25);
    let trendBias = 0;

    switch (period % 4) {
      case 0: trendBias = 0.6; break;  // Uptrend
      case 1: trendBias = 0.5; break;  // Ranging
      case 2: trendBias = 0.4; break;  // Downtrend
      case 3: trendBias = 0.5; break;  // Ranging
    }

    // Delta generation with trend bias
    const volume = 1000 + Math.random() * 2000;
    const delta = volume * (trendBias - 0.5 + (Math.random() - 0.5) * 0.4);
    cvd += delta;

    // Price movement (mostly correlated with CVD, sometimes divergent)
    const priceChange = delta / 50000 + (Math.random() - 0.5) * 0.005;
    price *= (1 + priceChange);

    cvdData.push({
      time,
      timestamp,
      cvd: Math.round(cvd),
      delta: Math.round(delta),
      price: parseFloat(price.toFixed(2)),
      volume: Math.round(volume)
    });
  }

  // Calculate trend lines using linear regression on segments
  const segmentSize = 20;
  for (let s = 0; s < Math.floor(cvdData.length / segmentSize); s++) {
    const segment = cvdData.slice(s * segmentSize, (s + 1) * segmentSize);

    // Simple linear regression
    const n = segment.length;
    const sumX = segment.reduce((sum, _, i) => sum + i, 0);
    const sumY = segment.reduce((sum, d) => sum + d.cvd, 0);
    const sumXY = segment.reduce((sum, d, i) => sum + i * d.cvd, 0);
    const sumX2 = segment.reduce((sum, _, i) => sum + i * i, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    const startValue = intercept;
    const endValue = slope * (n - 1) + intercept;

    trendLines.push({
      id: `trend-${s}`,
      startTime: segment[0].time,
      endTime: segment[segment.length - 1].time,
      startTimestamp: segment[0].timestamp,
      endTimestamp: segment[segment.length - 1].timestamp,
      startValue: Math.round(startValue),
      endValue: Math.round(endValue),
      slope: parseFloat(slope.toFixed(2)),
      direction: slope > 10 ? 'up' : slope < -10 ? 'down' : 'flat',
      active: s === Math.floor(cvdData.length / segmentSize) - 1
    });
  }

  // Detect trend breaks
  for (let i = 1; i < trendLines.length; i++) {
    const prevTrend = trendLines[i - 1];
    const currTrend = trendLines[i];

    // Direction change indicates a break
    if (prevTrend.direction !== currTrend.direction &&
        prevTrend.direction !== 'flat' && currTrend.direction !== 'flat') {

      const breakMagnitude = Math.abs(currTrend.startValue - prevTrend.endValue);
      const significance = breakMagnitude > 2000 ? 'macro' : 'micro';

      // Find the corresponding price at break point
      const breakDataPoint = cvdData.find(d => d.time === currTrend.startTime);

      breaks.push({
        id: `break-${i}`,
        time: currTrend.startTime,
        timestamp: currTrend.startTimestamp,
        type: currTrend.direction === 'up' ? 'bullish' : 'bearish',
        magnitude: Math.round(breakMagnitude),
        significance,
        priceAtBreak: breakDataPoint?.price || 0,
        cvdAtBreak: breakDataPoint?.cvd || 0,
        prevDirection: prevTrend.direction,
        newDirection: currTrend.direction,
        description: significance === 'macro'
          ? `Major CVD ${currTrend.direction === 'up' ? 'bullish' : 'bearish'} break - participation shift`
          : `Minor CVD inflection - possible pullback`,
        tradingTip: significance === 'macro'
          ? `Strong ${currTrend.direction === 'up' ? 'buying' : 'selling'} regime change - trade with new direction`
          : 'Wait for confirmation before acting on this break'
      });
    }
  }

  // Calculate CVD-Price divergence
  const recentData = cvdData.slice(-20);
  const priceChange = (recentData[19].price - recentData[0].price) / recentData[0].price;
  const cvdChange = (recentData[19].cvd - recentData[0].cvd) / Math.abs(recentData[0].cvd || 1);

  let divergence = null;
  if (priceChange > 0.01 && cvdChange < -0.1) {
    divergence = {
      active: true,
      type: 'bearish',
      strength: Math.min(100, Math.abs(cvdChange) * 200),
      description: 'Price rising but CVD falling - bearish divergence',
      tradingTip: 'Uptrend losing steam - consider taking profits or shorting on confirmation'
    };
  } else if (priceChange < -0.01 && cvdChange > 0.1) {
    divergence = {
      active: true,
      type: 'bullish',
      strength: Math.min(100, cvdChange * 200),
      description: 'Price falling but CVD rising - bullish divergence',
      tradingTip: 'Downtrend losing steam - look for long entries on confirmation'
    };
  } else {
    divergence = {
      active: false,
      type: 'none',
      strength: 0,
      description: 'CVD and price aligned - no divergence',
      tradingTip: 'Trade with the trend - CVD confirms price action'
    };
  }

  // Current CVD bias
  const lastCVD = cvdData[cvdData.length - 1].cvd;
  const cvd20PeriodsAgo = cvdData[cvdData.length - 21]?.cvd || 0;
  const cvdBias = lastCVD > cvd20PeriodsAgo + 1000 ? 'bullish' :
                  lastCVD < cvd20PeriodsAgo - 1000 ? 'bearish' : 'neutral';

  // Add trend line values to cvdData for charting
  const cvdDataWithTrend = cvdData.map((d, i) => {
    const segmentIndex = Math.min(Math.floor(i / segmentSize), trendLines.length - 1);
    const trend = trendLines[segmentIndex];
    const posInSegment = i % segmentSize;
    const trendValue = trend ? trend.startValue + (trend.slope * posInSegment) : d.cvd;

    return {
      ...d,
      trendLineValue: Math.round(trendValue)
    };
  });

  return {
    cvdData: cvdDataWithTrend,
    trendLines,
    breaks,
    divergence,
    cvdBias,
    metrics: {
      totalBreaks: breaks.length,
      macroBreaks: breaks.filter(b => b.significance === 'macro').length,
      microBreaks: breaks.filter(b => b.significance === 'micro').length,
      currentTrendSlope: trendLines[trendLines.length - 1]?.slope || 0,
      hasDivergence: divergence.active
    },
    _meta: { lastTimestamp: now, lastPrice: price, lastCvd: cvd }
  };
};

export const detectCVDBreak = (cvdData, trendLine, threshold = 0.05) => {
  if (cvdData.length === 0) return null;

  const lastCVD = cvdData[cvdData.length - 1].cvd;
  const expectedCVD = trendLine.endValue;
  const deviation = (lastCVD - expectedCVD) / Math.abs(expectedCVD);

  if (Math.abs(deviation) > threshold) {
    return {
      broken: true,
      direction: deviation > 0 ? 'bullish' : 'bearish',
      deviation: parseFloat((deviation * 100).toFixed(1)) + '%'
    };
  }

  return { broken: false };
};

export const calculateCVDPriceDivergence = (cvdData, priceData, lookback = 20) => {
  if (cvdData.length < lookback || priceData.length < lookback) {
    return { divergent: false };
  }

  const cvdSlice = cvdData.slice(-lookback);
  const priceSlice = priceData.slice(-lookback);

  const cvdChange = (cvdSlice[lookback - 1] - cvdSlice[0]) / Math.abs(cvdSlice[0] || 1);
  const priceChange = (priceSlice[lookback - 1] - priceSlice[0]) / priceSlice[0];

  // Divergence when signs differ significantly
  if (cvdChange * priceChange < 0 && Math.abs(cvdChange) > 0.1 && Math.abs(priceChange) > 0.01) {
    return {
      divergent: true,
      type: priceChange > 0 ? 'bearish' : 'bullish',
      cvdChange: (cvdChange * 100).toFixed(1) + '%',
      priceChange: (priceChange * 100).toFixed(1) + '%'
    };
  }

  return { divergent: false };
};
