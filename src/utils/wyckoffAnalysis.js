/**
 * Analyze Wyckoff phases with incremental update support
 * @param {object|null} existingData - Previous data for incremental update
 * @returns {object} Wyckoff analysis
 */
export const analyzeWyckoffPhases = (existingData = null) => {
  const now = Date.now();
  const INTERVAL_MS = 60 * 60 * 1000; // 1 hour

  // Incremental update
  if (existingData && existingData._meta) {
    const timeSinceLast = now - existingData._meta.lastTimestamp;

    if (timeSinceLast < INTERVAL_MS / 2) {
      return existingData;
    }

    const { priceData, _meta } = existingData;
    let basePrice = _meta.lastPrice || priceData[priceData.length - 1].price;

    // Add new data point if enough time has passed
    if (timeSinceLast >= INTERVAL_MS) {
      const newPriceData = [...priceData.slice(-59)];
      const time = new Date(now).toLocaleTimeString();

      const currentPhase = existingData.phase.name;
      let priceChange = 0;
      let volumeMultiplier = 1;

      switch (currentPhase) {
        case 'Accumulation':
          priceChange = (Math.random() - 0.5) * 0.01;
          volumeMultiplier = 0.8 + Math.random() * 0.4;
          break;
        case 'Markup':
          priceChange = 0.008 + Math.random() * 0.015;
          volumeMultiplier = 1.2;
          break;
        case 'Distribution':
          priceChange = (Math.random() - 0.5) * 0.012;
          volumeMultiplier = 1.1 + Math.random() * 0.5;
          break;
        case 'Markdown':
          priceChange = -0.008 - Math.random() * 0.012;
          volumeMultiplier = 1.3;
          break;
      }

      basePrice = basePrice * (1 + priceChange);
      const volume = Math.round((1000 + Math.random() * 2000) * volumeMultiplier);

      newPriceData.push({
        time,
        price: parseFloat(basePrice.toFixed(2)),
        volume,
        phase: currentPhase,
        wyckoffPoint: null,
        signal: null,
        phaseTransition: false,
        priceChange: priceChange * 100
      });

      // Update phase progress
      const updatedPhase = {
        ...existingData.phase,
        progress: Math.min(99, existingData.phase.progress + 1)
      };

      return {
        priceData: newPriceData,
        phase: updatedPhase,
        compositeMan: existingData.compositeMan,
        effortVsResult: existingData.effortVsResult,
        events: existingData.events,
        _meta: { lastTimestamp: now, lastPrice: basePrice }
      };
    }

    return existingData;
  }

  // First call: generate initial data
  const priceData = [];
  const events = [];
  const effortVsResult = [];

  let basePrice = 2800;
  let currentPhase = 'Accumulation';
  let phaseProgress = 65;
  
  // Generate comprehensive Wyckoff analysis data
  for (let i = 60; i >= 0; i--) {
    const time = new Date(Date.now() - i * 60 * 60 * 1000).toLocaleTimeString();
    
    // Determine phase based on position in cycle
    let phase = currentPhase;
    let wyckoffPoint = null;
    let signal = null;
    let phaseTransition = false;
    
    // Phase evolution logic
    if (i > 45) {
      phase = 'Accumulation';
      if (i === 55) wyckoffPoint = 'PS - Preliminary Support';
      if (i === 50) wyckoffPoint = 'SC - Selling Climax';
      if (i === 47) wyckoffPoint = 'AR - Automatic Rally';
    } else if (i > 30) {
      phase = 'Markup';
      if (i === 45) {
        wyckoffPoint = 'SOS - Sign of Strength';
        phaseTransition = true;
      }
      if (i === 35) wyckoffPoint = 'LPS - Last Point of Support';
    } else if (i > 15) {
      phase = 'Distribution';
      if (i === 30) {
        wyckoffPoint = 'PSY - Preliminary Supply';
        phaseTransition = true;
      }
      if (i === 25) wyckoffPoint = 'BC - Buying Climax';
      if (i === 20) wyckoffPoint = 'AD - Automatic Decline';
    } else {
      phase = 'Markdown';
      if (i === 15) {
        wyckoffPoint = 'SOW - Sign of Weakness';
        phaseTransition = true;
      }
      if (i === 8) wyckoffPoint = 'LPSY - Last Point of Supply';
    }
    
    // Generate price movement based on Wyckoff phase
    let priceChange = 0;
    let volumeMultiplier = 1;
    
    switch (phase) {
      case 'Accumulation':
        priceChange = (Math.random() - 0.5) * 0.01; // Sideways movement
        volumeMultiplier = wyckoffPoint ? 2.5 : 0.8; // High volume on key events
        if (wyckoffPoint === 'SC - Selling Climax') {
          priceChange = -0.03; // Sharp decline
          volumeMultiplier = 4;
        }
        if (wyckoffPoint === 'AR - Automatic Rally') {
          priceChange = 0.02; // Sharp rally
          volumeMultiplier = 3;
        }
        break;
        
      case 'Markup':
        priceChange = 0.008 + Math.random() * 0.015; // Generally up
        volumeMultiplier = 1.2;
        signal = 'Trend following active - Hold longs';
        break;
        
      case 'Distribution':
        priceChange = (Math.random() - 0.5) * 0.012; // Volatile sideways
        volumeMultiplier = wyckoffPoint ? 3 : 1.1;
        if (wyckoffPoint === 'BC - Buying Climax') {
          priceChange = 0.025; // Final surge
          volumeMultiplier = 4;
        }
        if (wyckoffPoint === 'AD - Automatic Decline') {
          priceChange = -0.015; // Quick drop
          volumeMultiplier = 2.5;
        }
        break;
        
      case 'Markdown':
        priceChange = -0.008 - Math.random() * 0.012; // Generally down
        volumeMultiplier = 1.3;
        signal = 'Downtrend active - Avoid longs';
        break;
    }
    
    basePrice = basePrice * (1 + priceChange);
    const volume = Math.round((1000 + Math.random() * 2000) * volumeMultiplier);
    
    priceData.push({
      time,
      price: parseFloat(basePrice.toFixed(2)),
      volume,
      phase,
      wyckoffPoint,
      signal,
      phaseTransition,
      priceChange: priceChange * 100
    });
    
    // Add significant events
    if (wyckoffPoint) {
      events.push({
        time,
        name: wyckoffPoint.split(' - ')[1],
        price: basePrice.toFixed(2),
        icon: getWyckoffIcon(wyckoffPoint),
        phase,
        significance: 'High'
      });
    }
    
    // Effort vs Result analysis
    if (i % 3 === 0) {
      const analysis = analyzeEffortVsResult(volume, priceChange * 100);
      effortVsResult.push({
        volume,
        priceChange: priceChange * 100,
        analysis: analysis.interpretation,
        significance: analysis.significance
      });
    }
  }
  
  // Determine current market phase and composite man intent
  const recentData = priceData.slice(-10);
  const avgVolume = recentData.reduce((sum, d) => sum + d.volume, 0) / recentData.length;
  const priceRange = Math.max(...recentData.map(d => d.price)) - Math.min(...recentData.map(d => d.price));
  const currentPhaseObj = getCurrentPhaseAnalysis(currentPhase, phaseProgress, priceRange, avgVolume);
  
  const compositeMan = analyzeCompositeMan(recentData, currentPhase);
  
  return {
    priceData,
    phase: currentPhaseObj,
    compositeMan,
    effortVsResult,
    events,
    _meta: { lastTimestamp: now, lastPrice: basePrice }
  };
};

const getWyckoffIcon = (wyckoffPoint) => {
  const point = wyckoffPoint.split(' - ')[0];
  switch(point) {
    case 'PS': return '🔵';
    case 'SC': return '💥';
    case 'AR': return '🚀';
    case 'ST': return '🔄';
    case 'SOS': return '💪';
    case 'LPS': return '✅';
    case 'PSY': return '🟡';
    case 'BC': return '🎯';
    case 'AD': return '⬇️';
    case 'SOW': return '⚠️';
    case 'LPSY': return '🛑';
    default: return '📍';
  }
};

const analyzeEffortVsResult = (volume, priceChange) => {
  const volumeNormalized = volume / 3000; // Normalize to 0-1 scale
  const priceChangeAbs = Math.abs(priceChange);
  
  if (volumeNormalized > 0.8 && priceChangeAbs > 1.5) {
    return {
      interpretation: 'High effort, high result - Natural move',
      significance: 'Normal'
    };
  } else if (volumeNormalized > 0.8 && priceChangeAbs < 0.5) {
    return {
      interpretation: 'High effort, low result - Potential reversal',
      significance: 'High'
    };
  } else if (volumeNormalized < 0.3 && priceChangeAbs > 1.2) {
    return {
      interpretation: 'Low effort, high result - Professional interest',
      significance: 'High'
    };
  } else {
    return {
      interpretation: 'Low effort, low result - Consolidation',
      significance: 'Low'
    };
  }
};

const getCurrentPhaseAnalysis = (phase, progress, priceRange, avgVolume) => {
  const phaseAnalysis = {
    'Accumulation': {
      subPhase: progress > 80 ? 'Late Stage' : progress > 50 ? 'Mid Stage' : 'Early Stage',
      nextPhase: 'Markup',
      timeframe: '2-6 weeks',
      alert: progress > 85 ? {
        type: 'warning',
        title: 'Accumulation Nearing End',
        message: 'Prepare for potential markup phase. Look for Sign of Strength (SOS).'
      } : null
    },
    'Markup': {
      subPhase: progress > 80 ? 'Exhaustion Zone' : progress > 50 ? 'Trending' : 'Early Markup',
      nextPhase: 'Distribution',
      timeframe: '1-3 months',
      alert: progress > 85 ? {
        type: 'critical',
        title: 'Markup Phase Exhausting',
        message: 'High probability of distribution phase beginning. Prepare exit strategy.'
      } : null
    },
    'Distribution': {
      subPhase: progress > 80 ? 'Final Distribution' : progress > 50 ? 'Active Distribution' : 'Early Distribution',
      nextPhase: 'Markdown',
      timeframe: '2-8 weeks',
      alert: progress > 70 ? {
        type: 'critical',
        title: 'Distribution Active',
        message: 'Smart money exiting. Avoid new longs, prepare for markdown.'
      } : null
    },
    'Markdown': {
      subPhase: progress > 80 ? 'Oversold Zone' : progress > 50 ? 'Active Decline' : 'Early Markdown',
      nextPhase: 'Re-accumulation',
      timeframe: '1-2 months',
      alert: progress > 85 ? {
        type: 'warning',
        title: 'Markdown Exhausting',
        message: 'Potential re-accumulation phase approaching. Monitor for selling climax.'
      } : null
    }
  };
  
  return {
    name: phase,
    progress,
    ...phaseAnalysis[phase]
  };
};

const analyzeCompositeMan = (recentData, phase) => {
  const volumeTrend = recentData[recentData.length - 1].volume > recentData[0].volume;
  const priceTrend = recentData[recentData.length - 1].price > recentData[0].price;
  
  let intent, strength;
  
  switch (phase) {
    case 'Accumulation':
      intent = 'Accumulating';
      strength = volumeTrend && !priceTrend ? 85 : 65;
      break;
    case 'Markup':
      intent = 'Marking Up';
      strength = volumeTrend && priceTrend ? 90 : 70;
      break;
    case 'Distribution':
      intent = 'Distributing';
      strength = volumeTrend && priceTrend ? 80 : 75;
      break;
    case 'Markdown':
      intent = 'Marking Down';
      strength = volumeTrend && !priceTrend ? 85 : 70;
      break;
    default:
      intent = 'Neutral';
      strength = 50;
  }
  
  return { intent, strength };
};