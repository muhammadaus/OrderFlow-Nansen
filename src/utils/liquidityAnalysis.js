/**
 * Generate liquidity heatmap with incremental update support
 * @param {object|null} existingData - Previous data for incremental update
 * @returns {object} Liquidity heatmap data
 */
export const generateLiquidityHeatmap = (existingData = null) => {
  const now = Date.now();
  const UPDATE_INTERVAL = 15000; // 15 seconds

  // Incremental update
  if (existingData && existingData._meta) {
    const timeSinceLast = now - existingData._meta.lastTimestamp;

    if (timeSinceLast < UPDATE_INTERVAL) {
      return existingData;
    }

    // Update intensities slightly
    const updatedHeatmap = existingData.heatmap.map(level => ({
      ...level,
      intensity: Math.max(0.05, Math.min(0.95, level.intensity + (Math.random() - 0.5) * 0.1)),
      sweep: level.sweep || Math.random() > 0.95 // Small chance of new sweep
    }));

    // Recalculate levels with high intensity
    const liquidityLevels = updatedHeatmap
      .filter(l => l.intensity > 0.6)
      .map(l => ({
        price: l.price,
        type: l.type,
        strength: l.intensity,
        distance: Math.abs(l.price - existingData.currentPrice) / existingData.currentPrice
      }))
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 10);

    const nearbyLevels = liquidityLevels.filter(l => l.distance < 0.01);

    return {
      heatmap: updatedHeatmap,
      levels: liquidityLevels,
      currentPrice: existingData.currentPrice,
      risk: {
        level: nearbyLevels.length > 3 ? 'high' : nearbyLevels.length > 1 ? 'medium' : 'low',
        sweepRisk: nearbyLevels.length > 3 ? 0.8 : nearbyLevels.length > 1 ? 0.5 : 0.2,
        volatility: nearbyLevels.length > 3 ? 'High' : 'Normal'
      },
      _meta: { lastTimestamp: now }
    };
  }

  // First call: generate initial heatmap
  const currentPrice = 2800;
  const range = 150; // $150 range above and below
  const levels = 60;
  const heatmap = [];
  const liquidityLevels = [];
  
  for (let i = 0; i < levels; i++) {
    const price = currentPrice - (range / 2) + (i * range / levels);
    const distanceRatio = Math.abs(price - currentPrice) / currentPrice;
    
    // Different liquidity patterns based on distance from current price
    let intensity = 0;
    let type = 'normal';
    let sweep = false;
    
    if (distanceRatio < 0.005) {
      // Very close to current price - low liquidity 
      intensity = 0.1 + Math.random() * 0.2;
      type = 'current_price';
    } else if (distanceRatio < 0.01) {
      // Close levels - moderate liquidity
      intensity = 0.3 + Math.random() * 0.3;
      type = Math.random() > 0.5 ? 'support' : 'resistance';
    } else if (distanceRatio < 0.02) {
      // Medium distance - higher liquidity (stop clusters)
      intensity = 0.4 + Math.random() * 0.4;
      type = 'stop_cluster';
      if (Math.random() > 0.8) sweep = true; // 20% chance of recent sweep
    } else {
      // Far levels - liquidation zones
      intensity = 0.2 + Math.random() * 0.6;
      type = price > currentPrice ? 'short_liquidation' : 'long_liquidation';
      if (Math.random() > 0.85) sweep = true; // 15% chance of recent sweep
    }
    
    // Add some key psychological levels
    const roundNumber = Math.round(price / 50) * 50;
    if (Math.abs(price - roundNumber) < 5) {
      intensity = Math.min(0.95, intensity + 0.3);
      type = 'psychological';
    }
    
    heatmap.push({
      price: parseFloat(price.toFixed(2)),
      intensity: parseFloat(intensity.toFixed(3)),
      type,
      sweep
    });
    
    // Add to key levels if significant
    if (intensity > 0.6) {
      liquidityLevels.push({
        price: parseFloat(price.toFixed(2)),
        type,
        strength: intensity,
        distance: distanceRatio
      });
    }
  }
  
  // Sort liquidity levels by distance from current price
  liquidityLevels.sort((a, b) => a.distance - b.distance);
  
  // Calculate risk metrics
  const nearbyLevels = liquidityLevels.filter(l => l.distance < 0.01);
  const highStrengthLevels = liquidityLevels.filter(l => l.strength > 0.8);
  
  const sweepRisk = nearbyLevels.length > 3 ? 0.8 : nearbyLevels.length > 1 ? 0.5 : 0.2;
  const riskLevel = highStrengthLevels.length > 5 ? 'high' : 
                   highStrengthLevels.length > 2 ? 'medium' : 'low';
  
  return {
    heatmap,
    levels: liquidityLevels.slice(0, 10), // Top 10 nearest levels
    currentPrice,
    risk: {
      level: riskLevel,
      sweepRisk,
      volatility: nearbyLevels.length > 3 ? 'High' : 'Normal'
    },
    _meta: { lastTimestamp: now }
  };
};