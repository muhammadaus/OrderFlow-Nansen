const MAX_TAS_ENTRIES = 200;
const UPDATE_INTERVAL = 15 * 1000; // 15 seconds (faster updates for time & sales)

/**
 * Generate market profile with incremental update support
 * @param {object|null} existingData - Previous data for incremental update
 * @returns {object} Market profile analysis
 */
export const generateMarketProfile = (existingData = null) => {
  const now = Date.now();

  // Incremental update
  if (existingData && existingData._meta) {
    const timeSinceLast = now - existingData._meta.lastTimestamp;

    if (timeSinceLast < UPDATE_INTERVAL) {
      return existingData;
    }

    // Update time and sales data
    const { timeAndSales, tpo, volumeProfile, valueArea, _meta } = existingData;
    let basePrice = _meta.lastPrice || valueArea.poc || 2800;

    const newTimeAndSales = [...timeAndSales.slice(-MAX_TAS_ENTRIES + 5)];

    // Add several new time and sales entries
    for (let i = 0; i < 5; i++) {
      const time = new Date(now - (5 - i) * 3000).toLocaleTimeString();
      const priceMove = (Math.random() - 0.5) * 10;
      const price = basePrice + priceMove;
      const size = Math.round(100 + Math.random() * 5000);
      const side = Math.random() > 0.5 ? 'Buy' : 'Sell';

      newTimeAndSales.push({
        time,
        price: parseFloat(price.toFixed(2)),
        size,
        side
      });

      basePrice = price; // Update for next iteration
    }

    // Slightly update TPO frequencies
    const updatedTpo = tpo.map(level => {
      const freqChange = Math.random() > 0.9 ? 1 : 0;
      return {
        ...level,
        frequency: level.frequency + freqChange,
        volume: level.volume + Math.round((Math.random() - 0.3) * 200)
      };
    });

    // Slightly update volume profile
    const updatedVolumeProfile = volumeProfile.map(level => ({
      ...level,
      volume: level.volume + Math.round((Math.random() - 0.3) * 200)
    }));

    return {
      profile: existingData.profile,
      timeAndSales: newTimeAndSales,
      volumeProfile: updatedVolumeProfile,
      tpo: updatedTpo,
      valueArea: existingData.valueArea,
      session: existingData.session,
      _meta: { lastTimestamp: now, lastPrice: basePrice }
    };
  }

  // First call: generate initial data
  const profile = [];
  const timeAndSales = [];
  const volumeProfile = [];
  const tpo = [];

  const basePrice = 2800;
  const priceRange = 100; // $100 range
  const numberOfLevels = 50;
  const sessions = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M'];
  
  let totalVolume = 0;
  let volumeByPrice = {};
  let tpoByPrice = {};
  
  // Generate TPO and Volume data
  for (let i = 0; i < numberOfLevels; i++) {
    const price = basePrice - (priceRange / 2) + (i * priceRange / numberOfLevels);
    
    // Create realistic distribution - more activity near center
    const distanceFromCenter = Math.abs(price - basePrice) / (priceRange / 2);
    const baseActivity = Math.exp(-Math.pow(distanceFromCenter, 2) * 2);
    
    // Generate TPO letters based on session activity
    let tpoLetters = '';
    let sessionVolume = 0;
    let frequency = 0;
    
    sessions.forEach((session, sessionIdx) => {
      // Different sessions have different activity patterns
      let sessionActivity = baseActivity;
      
      // Asian session (A-D): Lower activity
      if (sessionIdx < 4) {
        sessionActivity *= 0.3 + Math.random() * 0.4;
      }
      // London session (E-H): Higher activity
      else if (sessionIdx < 8) {
        sessionActivity *= 0.7 + Math.random() * 0.5;
      }
      // NY session (I-M): Highest activity
      else {
        sessionActivity *= 0.8 + Math.random() * 0.6;
      }
      
      // Add session letter if there was activity
      if (Math.random() < sessionActivity) {
        tpoLetters += session;
        frequency++;
        sessionVolume += Math.round(sessionActivity * 1000 * (1 + Math.random()));
      }
    });
    
    totalVolume += sessionVolume;
    volumeByPrice[price] = sessionVolume;
    tpoByPrice[price] = { letters: tpoLetters, frequency };
    
    tpo.push({
      price: parseFloat(price.toFixed(2)),
      tpoLetters,
      frequency,
      volume: sessionVolume
    });
    
    volumeProfile.push({
      price: parseFloat(price.toFixed(2)),
      volume: sessionVolume
    });
  }
  
  // Calculate Value Area (70% of volume)
  const sortedByVolume = Object.entries(volumeByPrice)
    .sort(([,a], [,b]) => b - a);
  
  const poc = parseFloat(sortedByVolume[0][0]); // Point of Control
  const targetVolume = totalVolume * 0.7;
  
  let accumulatedVolume = 0;
  let valueAreaPrices = [];
  
  for (const [price, volume] of sortedByVolume) {
    if (accumulatedVolume < targetVolume) {
      valueAreaPrices.push(parseFloat(price));
      accumulatedVolume += volume;
    } else {
      break;
    }
  }
  
  valueAreaPrices.sort((a, b) => a - b);
  const valueAreaLow = valueAreaPrices[0];
  const valueAreaHigh = valueAreaPrices[valueAreaPrices.length - 1];
  
  // Generate Time & Sales data
  for (let i = 0; i < 200; i++) {
    const time = new Date(Date.now() - (200 - i) * 15000).toLocaleTimeString();
    const price = basePrice + (Math.random() - 0.5) * 50;
    const size = Math.round(100 + Math.random() * 5000);
    const side = Math.random() > 0.5 ? 'Buy' : 'Sell';
    
    timeAndSales.push({
      time,
      price: parseFloat(price.toFixed(2)),
      size,
      side
    });
  }
  
  // Analyze session characteristics
  const sessionAnalysis = analyzeSessionCharacteristics();
  
  // Determine profile type
  const profileType = determineProfileType(tpo, valueAreaHigh, valueAreaLow);
  
  return {
    profile,
    timeAndSales,
    volumeProfile: volumeProfile.sort((a, b) => b.price - a.price),
    tpo: tpo.sort((a, b) => a.price - b.price),
    valueArea: {
      poc,
      valueAreaLow,
      valueAreaHigh,
      volumePercentage: 70
    },
    session: {
      ...sessionAnalysis,
      profileType: profileType.type,
      rotationalFactor: profileType.rotational
    },
    _meta: { lastTimestamp: now, lastPrice: poc }
  };
};

const analyzeSessionCharacteristics = () => {
  const basePrice = 2800;
  
  // Asian Session Analysis
  const asianRange = 15; // Lower volatility
  const asianHigh = basePrice + Math.random() * asianRange;
  const asianLow = basePrice - Math.random() * asianRange;
  const asianCharacter = Math.random() > 0.7 ? 'Trending' : 'Consolidative';
  
  // London Session Analysis  
  const londonRange = 35; // Medium volatility
  const londonHigh = basePrice + Math.random() * londonRange;
  const londonLow = basePrice - Math.random() * londonRange;
  const londonCharacter = Math.random() > 0.5 ? 'Trending' : 'Volatile';
  
  // New York Session Analysis
  const nyRange = 50; // High volatility
  const nyHigh = basePrice + Math.random() * nyRange;
  const nyLow = basePrice - Math.random() * nyRange;
  const nyCharacter = Math.random() > 0.6 ? 'Volatile' : 'Trending';
  
  // Overall session data
  const sessionHigh = Math.max(asianHigh, londonHigh, nyHigh);
  const sessionLow = Math.min(asianLow, londonLow, nyLow);
  
  return {
    asianHigh,
    asianLow, 
    asianCharacter,
    londonHigh,
    londonLow,
    londonCharacter,
    nyHigh,
    nyLow,
    nyCharacter,
    sessionHigh,
    sessionLow
  };
};

const determineProfileType = (tpoData, vaHigh, vaLow) => {
  // Calculate rotational factor
  const totalTPOs = tpoData.reduce((sum, level) => sum + level.frequency, 0);
  const valueAreaTPOs = tpoData.filter(level => 
    level.price >= vaLow && level.price <= vaHigh
  ).reduce((sum, level) => sum + level.frequency, 0);
  
  const rotationalFactor = (valueAreaTPOs / totalTPOs) * 100;
  
  let profileType;
  if (rotationalFactor > 70) {
    profileType = 'Normal';
  } else if (rotationalFactor < 40) {
    profileType = 'Trend';
  } else {
    profileType = 'Neutral';
  }
  
  return {
    type: profileType,
    rotational: Math.round(rotationalFactor)
  };
};

export const calculateMarketProfileMetrics = (profileData) => {
  // Single Prints Detection
  const singlePrints = profileData.tpo.filter(level => level.frequency === 1);
  
  // Poor Highs/Lows Detection
  const sortedByPrice = [...profileData.tpo].sort((a, b) => a.price - b.price);
  const highest = sortedByPrice[sortedByPrice.length - 1];
  const lowest = sortedByPrice[0];
  
  const poorHigh = highest.frequency < 3;
  const poorLow = lowest.frequency < 3;
  
  // Initiative vs Responsive Activity
  const totalVolume = profileData.volumeProfile.reduce((sum, level) => sum + level.volume, 0);
  const valueAreaVolume = profileData.volumeProfile
    .filter(level => level.price >= profileData.valueArea.valueAreaLow && 
                    level.price <= profileData.valueArea.valueAreaHigh)
    .reduce((sum, level) => sum + level.volume, 0);
  
  const initiativeActivity = ((totalVolume - valueAreaVolume) / totalVolume) * 100;
  
  return {
    singlePrints,
    poorHigh,
    poorLow,
    initiativeActivity: Math.round(initiativeActivity),
    responsiveActivity: Math.round(100 - initiativeActivity)
  };
};

export const identifyKeyProfileLevels = (profileData) => {
  const { valueArea, tpo } = profileData;
  const keyLevels = [];
  
  // POC Level
  keyLevels.push({
    price: valueArea.poc,
    type: 'POC',
    significance: 'High',
    description: 'Point of Control - Highest volume price'
  });
  
  // Value Area boundaries
  keyLevels.push({
    price: valueArea.valueAreaHigh,
    type: 'VAH',
    significance: 'High',
    description: 'Value Area High - Upper boundary of fair value'
  });
  
  keyLevels.push({
    price: valueArea.valueAreaLow,
    type: 'VAL',
    significance: 'High',
    description: 'Value Area Low - Lower boundary of fair value'
  });
  
  // High frequency TPO levels
  const highFrequencyLevels = tpo
    .filter(level => level.frequency >= 6)
    .sort((a, b) => b.frequency - a.frequency)
    .slice(0, 5);
  
  highFrequencyLevels.forEach(level => {
    if (!keyLevels.find(kl => Math.abs(kl.price - level.price) < 2)) {
      keyLevels.push({
        price: level.price,
        type: 'High Activity',
        significance: 'Medium',
        description: `High TPO activity (${level.frequency} periods)`
      });
    }
  });
  
  return keyLevels.sort((a, b) => b.price - a.price);
};