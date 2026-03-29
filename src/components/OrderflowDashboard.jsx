import React, { useState } from 'react';
import { useEnhancedStreamingData } from '../services/dataSourceContext';
import { useStreamingConfig } from '../hooks/useStreamingConfig';
import StreamingIndicator from './StreamingIndicator';
import LoadingPlaceholder from './LoadingPlaceholder';

// Import sub-components (will render inline for now to avoid import issues)
import ExhaustionAbsorption from './ExhaustionAbsorption';
import OrderflowChart from './OrderflowChart';
import ImbalanceCluster from './ImbalanceCluster';
import CVDTrendBreak from './CVDTrendBreak';

const OrderflowDashboard = () => {
  const [activeView, setActiveView] = useState('footprint');

  // Get streaming configuration
  const { interval, isPaused } = useStreamingConfig('orderflow');

  // Use enhanced streaming data for shared metrics
  const {
    data: orderflowData,
    loading,
    error,
    lastUpdate,
    latency,
    isStale,
    updateCount
  } = useEnhancedStreamingData('orderflow', interval, {
    enabled: !isPaused
  });

  // Also fetch exhaustion data for footprint metrics
  const { data: exhaustionData } = useEnhancedStreamingData('exhaustion', interval, {
    enabled: !isPaused && activeView === 'footprint'
  });

  // Sub-tabs configuration
  const subTabs = [
    { id: 'footprint', name: 'Footprint', description: 'Price ladder with bid/ask' },
    { id: 'candlestick', name: 'Candlestick', description: 'OHLC with delta' },
    { id: 'imbalance', name: 'Imbalance', description: 'Stacked imbalances' },
    { id: 'cvd', name: 'Delta/CVD', description: 'Cumulative delta' },
  ];

  // Shared metrics from exhaustion data (footprint)
  const metrics = exhaustionData?.metrics || {};
  const poc = exhaustionData?.poc || {};
  const currentSignal = exhaustionData?.currentSignal || null;

  // Show loading placeholder on initial load
  if (loading && !orderflowData && !exhaustionData) {
    return <LoadingPlaceholder height={700} title="Orderflow Analysis" />;
  }

  return (
    <div className="bg-bg-card border border-border-default rounded-lg">
      {/* Header */}
      <div className="p-4 border-b border-border-subtle">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold text-text-primary">Orderflow Analysis</h2>
            <p className="text-sm text-text-muted mt-1">
              Comprehensive orderflow tools: footprint, candlestick, imbalance, and delta analysis
            </p>
          </div>
          <StreamingIndicator
            lastUpdate={lastUpdate}
            latency={latency}
            isStale={isStale}
            loading={loading}
            error={error}
            updateCount={updateCount}
          />
        </div>

        {/* Sub-Tabs */}
        <div className="flex gap-2">
          {subTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveView(tab.id)}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                activeView === tab.id
                  ? 'bg-accent text-bg-primary'
                  : 'bg-bg-secondary text-text-muted hover:bg-bg-elevated hover:text-text-primary border border-border-subtle'
              }`}
              title={tab.description}
            >
              {tab.name}
            </button>
          ))}
        </div>
      </div>

      {/* Shared Metrics Bar */}
      <div className="px-4 py-3 border-b border-border-subtle bg-bg-secondary">
        <div className="grid grid-cols-6 gap-4">
          <div>
            <p className="text-xs text-text-muted uppercase font-medium">Total Bid</p>
            <p className="text-sm font-semibold text-bull font-mono tabular-nums">
              {metrics.totalBidVolume?.toLocaleString() || '—'}
            </p>
          </div>
          <div>
            <p className="text-xs text-text-muted uppercase font-medium">Total Ask</p>
            <p className="text-sm font-semibold text-bear font-mono tabular-nums">
              {metrics.totalAskVolume?.toLocaleString() || '—'}
            </p>
          </div>
          <div>
            <p className="text-xs text-text-muted uppercase font-medium">Net Delta</p>
            <p className={`text-sm font-semibold font-mono tabular-nums ${
              (metrics.overallDelta || 0) > 0 ? 'text-bull' : 'text-bear'
            }`}>
              {metrics.overallDelta > 0 ? '+' : ''}{metrics.overallDelta?.toLocaleString() || '—'}
            </p>
          </div>
          <div>
            <p className="text-xs text-text-muted uppercase font-medium">Dominant</p>
            <p className={`text-sm font-semibold ${
              metrics.dominantSide === 'Buyers' ? 'text-bull' : 'text-bear'
            }`}>
              {metrics.dominantSide || '—'}
            </p>
          </div>
          <div>
            <p className="text-xs text-text-muted uppercase font-medium">POC Level</p>
            <p className="text-sm font-semibold text-neutral font-mono tabular-nums">
              {poc.priceLevel ? `$${poc.priceLevel}` : '—'}
            </p>
          </div>
          <div>
            <p className="text-xs text-text-muted uppercase font-medium">Imbalances</p>
            <p className="text-sm font-semibold text-accent font-mono tabular-nums">
              {metrics.imbalanceCount || 0}
            </p>
          </div>
        </div>
      </div>

      {/* Signal Alert - Fixed height to prevent layout shift */}
      <div className="mx-4 mt-4 h-[80px] overflow-hidden">
        {currentSignal ? (
          <div className={`p-3 rounded-lg border h-full ${
            currentSignal.type?.includes('exhaustion')
              ? 'bg-exhaustion/10 border-exhaustion/50'
              : 'bg-absorption/10 border-absorption/50'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-text-primary truncate">
                  {currentSignal.type?.includes('exhaustion') ? 'EXHAUSTION' : 'ABSORPTION'} @ ${parseFloat(currentSignal.priceLevel).toFixed(2)}
                </p>
                <p className="text-xs text-text-secondary mt-1 line-clamp-1">{currentSignal.description}</p>
              </div>
              <div className="text-right ml-4 flex-shrink-0">
                <p className="text-xs text-text-muted">Signal</p>
                <p className={`text-lg font-bold font-mono ${
                  currentSignal.type?.includes('bullish') ? 'text-bull' : 'text-bear'
                }`}>
                  {exhaustionData?.strength || 50}%
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-3 rounded-lg border border-border-default bg-bg-secondary flex items-center justify-center h-full">
            <p className="text-sm text-text-muted">Monitoring for signals...</p>
          </div>
        )}
      </div>

      {/* Active View Content */}
      <div className="p-4">
        {activeView === 'footprint' && <FootprintView />}
        {activeView === 'candlestick' && <CandlestickView />}
        {activeView === 'imbalance' && <ImbalanceView />}
        {activeView === 'cvd' && <CVDView />}
      </div>

      {/* Educational Footer */}
      <div className="px-4 pb-4">
        <div className="bg-bg-secondary rounded-lg p-4 border border-border-subtle">
          <h3 className="text-base font-semibold text-text-primary mb-3">
            {activeView === 'footprint' && 'Understanding Footprint Charts'}
            {activeView === 'candlestick' && 'Reading Candlestick + Delta'}
            {activeView === 'imbalance' && 'Spotting Imbalance Patterns'}
            {activeView === 'cvd' && 'Using Cumulative Volume Delta'}
          </h3>
          <div className="text-sm text-text-secondary leading-relaxed">
            {activeView === 'footprint' && (
              <p>
                Footprint charts show bid/ask volume at each price level. The POC (Point of Control)
                marks fair value. Look for exhaustion (high volume, no follow-through) and absorption
                (large orders absorbed without price movement) patterns to identify potential reversals.
              </p>
            )}
            {activeView === 'candlestick' && (
              <p>
                Candlestick charts with delta overlay show price action alongside buying/selling pressure.
                When delta diverges from price (e.g., price up but delta down), it signals potential weakness.
                Volume spikes with small bodies indicate indecision or exhaustion.
              </p>
            )}
            {activeView === 'imbalance' && (
              <p>
                Imbalances occur when one side dominates (3:1+ ratio). Stacked imbalances in the same
                direction show strong institutional flow. Diagonal imbalances often mark the start of
                aggressive moves. Use these to identify high-probability continuation setups.
              </p>
            )}
            {activeView === 'cvd' && (
              <p>
                Cumulative Volume Delta tracks the running total of buy vs sell volume. Rising CVD with
                rising price confirms the trend. Divergence (price up, CVD down) signals weakness.
                CVD trend breaks often precede price reversals.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================
// SUB-VIEWS
// ============================================

// Footprint View - Uses ExhaustionAbsorption component
const FootprintView = () => {
  return <ExhaustionAbsorption />;
};

// Candlestick View - Uses OrderflowChart component
const CandlestickView = () => {
  return <OrderflowChart />;
};

// Imbalance View - Uses ImbalanceCluster component
const ImbalanceView = () => {
  return <ImbalanceCluster />;
};

// CVD View - Uses CVDTrendBreak component
const CVDView = () => {
  return <CVDTrendBreak />;
};

export default OrderflowDashboard;
