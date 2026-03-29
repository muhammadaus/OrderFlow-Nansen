import React from 'react';
import { useEnhancedStreamingData } from '../services/dataSourceContext';
import { useStreamingConfig } from '../hooks/useStreamingConfig';
import StreamingIndicator from './StreamingIndicator';
import LoadingPlaceholder from './LoadingPlaceholder';

const LiquidityHeatmap = () => {
  // Get streaming configuration
  const { interval, isPaused } = useStreamingConfig('liquidityHeatmap');

  // Use enhanced streaming data
  const {
    data: analysis,
    loading,
    error,
    lastUpdate,
    latency,
    isStale,
    updateCount
  } = useEnhancedStreamingData('liquidityHeatmap', interval, {
    enabled: !isPaused
  });

  // Derive state from streaming data
  const heatmapData = analysis?.heatmap || [];
  const liquidityLevels = analysis?.levels || [];
  const currentPrice = analysis?.currentPrice || 0;
  const riskMetrics = analysis?.risk || {};

  // Color scale with clear correlation - same colors used throughout
  const RISK_COLORS = {
    critical: { bg: '#dc2626', text: '#fca5a5', label: 'Critical' },  // Dark red
    high: { bg: '#ef4444', text: '#f87171', label: 'High' },          // Red
    medium: { bg: '#f59e0b', text: '#fcd34d', label: 'Medium' },      // Amber
    low: { bg: '#3b82f6', text: '#93c5fd', label: 'Low' },            // Blue
    minimal: { bg: '#1f2937', text: '#6b7280', label: 'Minimal' },    // Gray
  };

  const getIntensityLevel = (intensity) => {
    if (intensity > 0.8) return 'critical';
    if (intensity > 0.6) return 'high';
    if (intensity > 0.4) return 'medium';
    if (intensity > 0.2) return 'low';
    return 'minimal';
  };

  const getIntensityColor = (intensity) => {
    return RISK_COLORS[getIntensityLevel(intensity)].bg;
  };

  const getIntensityTextColor = (intensity) => {
    return RISK_COLORS[getIntensityLevel(intensity)].text;
  };

  const getLiquidityTypeLabel = (type) => {
    switch(type) {
      case 'long_liquidation': return { short: 'LONG LIQ', color: 'text-bear' };
      case 'short_liquidation': return { short: 'SHORT LIQ', color: 'text-bull' };
      case 'stop_cluster': return { short: 'STOPS', color: 'text-exhaustion' };
      case 'support': return { short: 'SUPPORT', color: 'text-bull' };
      case 'resistance': return { short: 'RESIST', color: 'text-bear' };
      default: return { short: 'LEVEL', color: 'text-text-muted' };
    }
  };

  const HeatmapCell = ({ data, index }) => {
    const intensity = data.intensity;
    const isNearPrice = Math.abs(data.price - currentPrice) < (currentPrice * 0.001);
    const riskLevel = getIntensityLevel(intensity);
    const typeLabel = getLiquidityTypeLabel(data.type);

    return (
      <div
        key={index}
        className={`relative h-10 border border-border-subtle transition-all hover:border-white ${
          isNearPrice ? 'ring-2 ring-exhaustion' : ''
        }`}
        style={{ backgroundColor: getIntensityColor(intensity) }}
        title={`Price: $${data.price.toFixed(2)} | Liquidity: ${(intensity * 100).toFixed(1)}% | Type: ${data.type}`}
      >
        <div className="absolute inset-0 flex items-center justify-between px-2">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-white font-mono">
              ${data.price.toFixed(2)}
            </span>
            <span className={`text-xxs font-semibold uppercase ${typeLabel.color}`}>
              {typeLabel.short}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span
              className="text-sm font-bold tabular-nums"
              style={{ color: getIntensityTextColor(intensity) }}
            >
              {(intensity * 100).toFixed(0)}%
            </span>
            <span
              className="text-xxs uppercase font-medium px-1.5 py-0.5 rounded"
              style={{
                backgroundColor: getIntensityColor(intensity),
                color: '#fff',
                border: '1px solid rgba(255,255,255,0.3)'
              }}
            >
              {RISK_COLORS[riskLevel].label}
            </span>
          </div>
        </div>
        {data.sweep && (
          <div className="absolute top-1 right-1 w-2 h-2 bg-accent rounded-full animate-pulse"></div>
        )}
      </div>
    );
  };

  // Show loading placeholder on initial load
  if (loading && !analysis) {
    return <LoadingPlaceholder height={500} title="Liquidity Heatmap" />;
  }

  return (
    <div className="terminal-card">
      <div className="terminal-card-header">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-text-primary uppercase tracking-wide">Liquidity Heatmap</h2>
          <StreamingIndicator
            lastUpdate={lastUpdate}
            latency={latency}
            isStale={isStale}
            loading={loading}
            error={error}
            updateCount={updateCount}
          />
        </div>
      </div>

      {/* Key Metrics with color correlation */}
      <div className="grid grid-cols-4 gap-px bg-border-subtle mx-4 mt-4">
        <div className="bg-navy px-3 py-2">
          <p className="text-xxs text-text-muted uppercase tracking-wide">Current Price</p>
          <p className="text-base font-semibold text-text-primary tabular-nums">${currentPrice.toFixed(2)}</p>
        </div>
        <div className="bg-navy px-3 py-2">
          <p className="text-xxs text-text-muted uppercase tracking-wide">Risk Level</p>
          <p
            className="text-base font-semibold tabular-nums"
            style={{
              color: riskMetrics.level === 'high' ? RISK_COLORS.high.text :
                     riskMetrics.level === 'medium' ? RISK_COLORS.medium.text :
                     RISK_COLORS.low.text
            }}
          >
            {riskMetrics.level?.toUpperCase() || 'LOW'}
          </p>
        </div>
        <div className="bg-navy px-3 py-2">
          <p className="text-xxs text-text-muted uppercase tracking-wide">Nearest Liq</p>
          <p className="text-base font-semibold text-text-primary tabular-nums">
            {liquidityLevels.length > 0 ? `$${liquidityLevels[0].price.toFixed(2)}` : 'N/A'}
          </p>
        </div>
        <div className="bg-navy px-3 py-2">
          <p className="text-xxs text-text-muted uppercase tracking-wide">Sweep Risk</p>
          <p
            className="text-base font-semibold tabular-nums"
            style={{
              color: riskMetrics.sweepRisk > 0.7 ? RISK_COLORS.high.text :
                     riskMetrics.sweepRisk > 0.4 ? RISK_COLORS.medium.text :
                     RISK_COLORS.low.text
            }}
          >
            {((riskMetrics.sweepRisk || 0) * 100).toFixed(0)}%
          </p>
        </div>
      </div>

      <div className="terminal-card-body">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Heatmap Visualization */}
        <div className="lg:col-span-2">
          {/* Legend with clear color correlation */}
          <div className="mb-3 p-2 bg-navy/50 rounded border border-border-subtle">
            <div className="flex items-center justify-between">
              <h3 className="text-xxs font-semibold text-text-muted uppercase tracking-wide">Risk Scale</h3>
              <div className="flex items-center gap-3">
                {Object.entries(RISK_COLORS).map(([key, val]) => (
                  <div key={key} className="flex items-center gap-1.5">
                    <div
                      className="w-4 h-4 rounded border border-white/20"
                      style={{ backgroundColor: val.bg }}
                    />
                    <span className="text-xxs font-medium" style={{ color: val.text }}>
                      {val.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="max-h-96 overflow-y-auto border border-border-subtle rounded">
            {heatmapData.map((data, index) => (
              <HeatmapCell key={index} data={data} index={index} />
            ))}
          </div>

          <div className="mt-2 text-xxs text-text-muted">
            Amber ring = Current price area | Purple dot = Recent sweep | Hover for details
          </div>
        </div>

        {/* Liquidity Levels & Insights */}
        <div className="space-y-3">
          <div className="bg-navy/50 p-3 rounded border border-border-subtle">
            <h3 className="text-xxs font-semibold text-text-muted uppercase tracking-wide mb-3">Key Liquidity Levels</h3>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {liquidityLevels.slice(0, 8).map((level, idx) => {
                const typeLabel = getLiquidityTypeLabel(level.type);
                const riskLevel = getIntensityLevel(level.strength);
                return (
                  <div key={idx} className="flex justify-between items-center py-1 border-b border-border-subtle/30 last:border-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-text-primary tabular-nums">
                        ${level.price.toFixed(2)}
                      </span>
                      <span className={`text-xxs font-semibold uppercase ${typeLabel.color}`}>
                        {typeLabel.short}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div
                        className="w-12 h-2 rounded"
                        style={{ backgroundColor: RISK_COLORS[riskLevel].bg }}
                      />
                      <span
                        className="text-xs font-bold tabular-nums w-10 text-right"
                        style={{ color: RISK_COLORS[riskLevel].text }}
                      >
                        {(level.distance * 100).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-navy/50 p-3 rounded border border-border-subtle">
            <h3 className="text-xxs font-semibold text-text-muted uppercase tracking-wide mb-2">Level Types</h3>
            <div className="grid grid-cols-2 gap-2 text-xxs">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-bear rounded-sm"></span>
                <span className="text-bear">Long Liq</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-bull rounded-sm"></span>
                <span className="text-bull">Short Liq</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-exhaustion rounded-sm"></span>
                <span className="text-exhaustion">Stops</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-corporate-blue rounded-sm"></span>
                <span className="text-corporate-blue">Support</span>
              </div>
            </div>
          </div>

          <div className="bg-navy/50 p-3 rounded border border-border-subtle">
            <h3 className="text-xxs font-semibold text-text-muted uppercase tracking-wide mb-2">Risk Assessment</h3>
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="text-text-muted">Sweep Risk</span>
                <span
                  className="font-bold tabular-nums"
                  style={{
                    color: riskMetrics.sweepRisk > 0.7 ? RISK_COLORS.high.text :
                           riskMetrics.sweepRisk > 0.4 ? RISK_COLORS.medium.text :
                           RISK_COLORS.low.text
                  }}
                >
                  {((riskMetrics.sweepRisk || 0) * 100).toFixed(0)}%
                </span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-text-muted">Volatility</span>
                <span className="font-semibold text-text-primary">{riskMetrics.volatility || 'Normal'}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-text-muted">Next Target</span>
                <span className="font-bold text-text-primary tabular-nums">
                  {liquidityLevels.length > 0 ? `$${liquidityLevels[0].price.toFixed(2)}` : 'None'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
      </div>

      <div className="mx-4 mb-4 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-navy/30 px-4 py-3 border-l-2 border-accent">
          <h4 className="text-sm font-semibold text-text-muted uppercase tracking-wide mb-2">Sweep Strategy</h4>
          <p className="text-sm text-text-primary leading-relaxed">
            Watch for price approaching high liquidity areas.
            Large players often "sweep" these levels (quick spike to trigger stops/liquidations) before reversing.
            Look for rejection after touching liquidity pools.
          </p>
        </div>

        <div className="bg-navy/30 px-4 py-3 border-l-2 border-exhaustion">
          <h4 className="text-sm font-semibold text-text-muted uppercase tracking-wide mb-2">DeFi Specific</h4>
          <p className="text-sm text-text-primary leading-relaxed">
            In DeFi, liquidations execute automatically via smart contracts.
            High TVL pools create liquidity zones. Watch funding rates and OI alongside heatmap.
            Cascading liquidations can create violent moves.
          </p>
        </div>
      </div>
    </div>
  );
};

export default LiquidityHeatmap;