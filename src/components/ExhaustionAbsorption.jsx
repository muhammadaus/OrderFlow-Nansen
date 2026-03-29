import React from 'react';
import { useEnhancedStreamingData } from '../services/dataSourceContext';
import { useStreamingConfig } from '../hooks/useStreamingConfig';
import StreamingIndicator from './StreamingIndicator';
import LoadingPlaceholder from './LoadingPlaceholder';
import { useNansenData } from '../hooks/useNansenData.js';

// ─── Nansen capital flow strip — does on-chain capital confirm this signal? ────
const NansenContextStrip = ({ signalType }) => {
  const {
    loading, error, isDemo,
    ethNetFlow, ethInflow, ethOutflow,
    onChainBias, capitalFlowStrength, flowConfirms,
    chainRotation,
  } = useNansenData();

  if (loading) return (
    <div className="animate-pulse h-10 bg-navy/40 rounded mb-3" />
  );
  if (error) return null;

  const fmtM = n => n == null ? '—' : `${n >= 0 ? '+' : ''}$${(Math.abs(n) / 1e6).toFixed(0)}M`;

  // Derive signal direction from signal type string
  const signalDir = signalType?.includes('bullish') ? 'bullish'
    : signalType?.includes('bearish') ? 'bearish'
    : null;

  const confirmed = flowConfirms(signalDir);

  // Confirmation badge
  const badge = confirmed === true
    ? { label: 'CONFIRMED', cls: 'text-bull bg-bull/10 border border-bull/30' }
    : confirmed === false
    ? { label: 'DIVERGENCE', cls: 'text-bear bg-bear/10 border border-bear/30' }
    : { label: 'NEUTRAL', cls: 'text-text-muted bg-navy/40 border border-border-subtle/30' };

  // L2 rotation — find any chain gaining capital (might explain where ETH flow is going)
  const l2Gaining = chainRotation.filter(c => c.chain !== 'ethereum' && c.direction === 'inflow');

  return (
    <div className="flex flex-wrap items-center gap-3 px-3 py-2 mb-3 bg-navy/40 border border-border-subtle/40 rounded text-xs font-mono">
      <span className="text-text-muted uppercase tracking-wider text-[10px]">On-chain Capital</span>
      {isDemo && <span className="text-[9px] text-yellow-500/70 bg-yellow-900/20 px-1 rounded">demo</span>}

      <span className="text-text-muted">·</span>
      <span className="text-text-muted">ETH Net Flow</span>
      <span className={ethNetFlow >= 0 ? 'text-bull font-semibold' : 'text-bear font-semibold'}>
        {fmtM(ethNetFlow)}
      </span>

      <span className="text-text-muted">·</span>
      <span className="text-text-muted">In</span>
      <span className="text-bull">{fmtM(ethInflow)}</span>
      <span className="text-text-muted">Out</span>
      <span className="text-bear">{fmtM(ethOutflow)}</span>

      <span className="text-text-muted">·</span>
      <span className="text-text-muted">Flow Strength</span>
      <span className="text-text-primary font-semibold">{capitalFlowStrength}%</span>

      {/* Signal confirmation badge — only shown when there is an active signal */}
      {signalDir && (
        <>
          <span className="text-text-muted">·</span>
          <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wide ${badge.cls}`}>
            {badge.label}
          </span>
        </>
      )}

      {/* L2 rotation hint */}
      {l2Gaining.length > 0 && (
        <>
          <span className="text-text-muted">·</span>
          <span className="text-text-muted">Capital rotating to</span>
          <span className="text-accent">{l2Gaining.map(c => c.chain).join(', ')}</span>
        </>
      )}
    </div>
  );
};

// FootprintRow - Single price level with bid/ask bars
const FootprintRow = ({ level, maxVolume, isCurrentPrice }) => {
  const bidWidth = maxVolume > 0 ? (level.bidVolume / maxVolume) * 100 : 0;
  const askWidth = maxVolume > 0 ? (level.askVolume / maxVolume) * 100 : 0;

  // Determine row styling based on special markers
  let rowBorder = 'border-border-subtle/30';
  let rowBg = 'bg-navy/30';

  if (level.isPOC) {
    rowBorder = 'border-yellow-500/50';
    rowBg = 'bg-yellow-900/20';
  } else if (level.isExhaustion) {
    rowBorder = 'border-orange-500/50';
    rowBg = 'bg-orange-900/20';
  } else if (level.isAbsorption) {
    rowBorder = 'border-purple-500/50';
    rowBg = 'bg-purple-900/20';
  } else if (isCurrentPrice) {
    rowBorder = 'border-accent/50';
    rowBg = 'bg-accent/10';
  }

  // Delta color
  const deltaColor = level.delta > 0 ? 'text-bull' : level.delta < 0 ? 'text-bear' : 'text-text-muted';

  return (
    <div className={`grid grid-cols-12 gap-2 items-center py-1.5 px-2 border-b ${rowBorder} ${rowBg} hover:bg-navy/50 transition-colors`}>
      {/* Price */}
      <div className="col-span-2 text-sm font-mono font-semibold text-text-primary">
        ${level.priceLevel.toFixed(0)}
      </div>

      {/* Bid Bar (right-aligned, grows left) */}
      <div className="col-span-3 flex justify-end items-center gap-2">
        <span className="text-xs text-bull tabular-nums">{level.bidVolume.toLocaleString()}</span>
        <div className="w-full h-4 bg-navy/50 rounded-sm overflow-hidden flex justify-end">
          <div
            className={`h-full transition-all ${level.hasImbalance && level.imbalanceType === 'bid' ? 'bg-bull' : 'bg-bull/60'}`}
            style={{ width: `${bidWidth}%` }}
          />
        </div>
      </div>

      {/* Ask Bar (left-aligned, grows right) */}
      <div className="col-span-3 flex items-center gap-2">
        <div className="w-full h-4 bg-navy/50 rounded-sm overflow-hidden">
          <div
            className={`h-full transition-all ${level.hasImbalance && level.imbalanceType === 'ask' ? 'bg-bear' : 'bg-bear/60'}`}
            style={{ width: `${askWidth}%` }}
          />
        </div>
        <span className="text-xs text-bear tabular-nums">{level.askVolume.toLocaleString()}</span>
      </div>

      {/* Delta */}
      <div className={`col-span-2 text-sm font-mono font-semibold tabular-nums text-center ${deltaColor}`}>
        {level.delta > 0 ? '+' : ''}{level.delta.toLocaleString()}
      </div>

      {/* Signal Markers */}
      <div className="col-span-2 flex items-center gap-1 justify-end">
        {level.isPOC && (
          <span className="text-xs bg-yellow-500/20 text-yellow-400 px-1.5 py-0.5 rounded font-semibold">
            POC
          </span>
        )}
        {level.isExhaustion && (
          <span className="text-xs bg-orange-500/20 text-orange-400 px-1.5 py-0.5 rounded font-semibold">
            EXHAUST
          </span>
        )}
        {level.isAbsorption && (
          <span className="text-xs bg-purple-500/20 text-purple-400 px-1.5 py-0.5 rounded font-semibold">
            ABSORB
          </span>
        )}
        {level.hasImbalance && !level.isPOC && !level.isExhaustion && !level.isAbsorption && (
          <span className={`text-xs px-1 py-0.5 rounded ${level.imbalanceType === 'bid' ? 'bg-bull/20 text-bull' : 'bg-bear/20 text-bear'}`}>
            3:1
          </span>
        )}
      </div>
    </div>
  );
};

// HeatmapCell - Single cell in the history heatmap
const HeatmapCell = ({ delta, volume, maxVolume }) => {
  const intensity = maxVolume > 0 ? Math.min(volume / maxVolume, 1) : 0;
  const bgColor = delta > 0
    ? `rgba(0, 217, 255, ${0.2 + intensity * 0.6})`  // Bull (cyan)
    : `rgba(239, 68, 68, ${0.2 + intensity * 0.6})`; // Bear (red)

  return (
    <div
      className="w-6 h-4 rounded-sm border border-border-subtle/20"
      style={{ backgroundColor: bgColor }}
      title={`Delta: ${delta > 0 ? '+' : ''}${delta}, Volume: ${volume}`}
    />
  );
};

const ExhaustionAbsorption = () => {
  // Get streaming configuration
  const { interval, isPaused } = useStreamingConfig('exhaustion');

  // Use enhanced streaming data
  const {
    data: analysis,
    loading,
    error,
    lastUpdate,
    latency,
    isStale,
    updateCount
  } = useEnhancedStreamingData('exhaustion', interval, {
    enabled: !isPaused
  });

  // Derive state from streaming data
  const footprint = analysis?.footprint || [];
  const history = analysis?.history || [];
  const poc = analysis?.poc || {};
  const metrics = analysis?.metrics || {};
  const currentSignal = analysis?.currentSignal || null;
  const strength = analysis?.strength || 50;
  const currentPrice = analysis?.currentPrice || 2840;

  // Calculate max volume for bar scaling
  const maxVolume = Math.max(...footprint.map(l => Math.max(l.bidVolume, l.askVolume)), 1);
  const maxHistoryVolume = Math.max(
    ...history.flatMap(h => h.levels?.map(l => l.volume) || []),
    1
  );

  // Show loading placeholder on initial load
  if (loading && !analysis) {
    return <LoadingPlaceholder height={600} title="Footprint Chart - Exhaustion & Absorption" />;
  }

  return (
    <div className="bg-gray-900 rounded-lg p-4">
      {/* Header */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xl font-bold text-white">Footprint Chart - Exhaustion & Absorption</h2>
          <StreamingIndicator
            lastUpdate={lastUpdate}
            latency={latency}
            isStale={isStale}
            loading={loading}
            error={error}
            updateCount={updateCount}
          />
        </div>

        {/* Current Signal Alert - Fixed height to prevent layout shift */}
        <div className="h-[140px] overflow-hidden">
          {currentSignal ? (
            <div className={`p-3 rounded border h-full ${
              currentSignal.type.includes('exhaustion')
                ? 'bg-orange-900/20 border-orange-500'
                : 'bg-purple-900/20 border-purple-500'
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white truncate">
                    {currentSignal.type.includes('exhaustion') ? 'EXHAUSTION' : 'ABSORPTION'} @ ${parseFloat(currentSignal.priceLevel).toFixed(2)}
                  </p>
                  <p className="text-sm text-gray-300 mt-1 line-clamp-2">{currentSignal.description}</p>
                </div>
                <div className="text-right ml-4 flex-shrink-0">
                  <p className="text-xs text-gray-400">Strength</p>
                  <p className={`text-2xl font-bold ${
                    currentSignal.type.includes('bullish') ? 'text-bull' : 'text-bear'
                  }`}>
                    {strength}%
                  </p>
                </div>
              </div>
              <div className="mt-2 pt-2 border-t border-gray-600">
                <p className="text-xs text-gray-400 line-clamp-1">{currentSignal.tip}</p>
              </div>
            </div>
          ) : (
            <div className="p-3 rounded border border-gray-700 bg-gray-800/30 flex items-center justify-center h-full">
              <p className="text-sm text-gray-500">Monitoring for signals...</p>
            </div>
          )}
        </div>
      </div>

      {/* Metrics Bar */}
      <div className="grid grid-cols-5 gap-2 mb-4">
        <div className="bg-navy px-3 py-2 rounded">
          <p className="text-xs text-text-muted uppercase">Total Bid</p>
          <p className="text-sm font-semibold text-bull tabular-nums">{metrics.totalBidVolume?.toLocaleString()}</p>
        </div>
        <div className="bg-navy px-3 py-2 rounded">
          <p className="text-xs text-text-muted uppercase">Total Ask</p>
          <p className="text-sm font-semibold text-bear tabular-nums">{metrics.totalAskVolume?.toLocaleString()}</p>
        </div>
        <div className="bg-navy px-3 py-2 rounded">
          <p className="text-xs text-text-muted uppercase">Net Delta</p>
          <p className={`text-sm font-semibold tabular-nums ${metrics.overallDelta > 0 ? 'text-bull' : 'text-bear'}`}>
            {metrics.overallDelta > 0 ? '+' : ''}{metrics.overallDelta?.toLocaleString()}
          </p>
        </div>
        <div className="bg-navy px-3 py-2 rounded">
          <p className="text-xs text-text-muted uppercase">Dominant</p>
          <p className={`text-sm font-semibold ${metrics.dominantSide === 'Buyers' ? 'text-bull' : 'text-bear'}`}>
            {metrics.dominantSide}
          </p>
        </div>
        <div className="bg-navy px-3 py-2 rounded">
          <p className="text-xs text-text-muted uppercase">POC</p>
          <p className="text-sm font-semibold text-yellow-400 tabular-nums">${poc.priceLevel}</p>
        </div>
      </div>

      {/* Nansen SM context — raw chain flow numbers alongside signal */}
      <NansenContextStrip signalType={currentSignal?.type} />

      {/* Main Content: Footprint Ladder + Heatmap */}
      <div className="grid grid-cols-12 gap-4">
        {/* Footprint Ladder */}
        <div className="col-span-9">
          {/* Column Headers */}
          <div className="grid grid-cols-12 gap-2 items-center py-2 px-2 bg-navy/50 border-b border-border-subtle text-xs text-text-muted uppercase tracking-wide">
            <div className="col-span-2">Price</div>
            <div className="col-span-3 text-right">Bid Volume</div>
            <div className="col-span-3 text-left">Ask Volume</div>
            <div className="col-span-2 text-center">Delta</div>
            <div className="col-span-2 text-right">Signal</div>
          </div>

          {/* Price Levels */}
          <div className="max-h-96 overflow-y-auto">
            {footprint.map((level, idx) => (
              <FootprintRow
                key={level.priceLevel}
                level={level}
                maxVolume={maxVolume}
                isCurrentPrice={Math.abs(level.priceLevel - currentPrice) < 2}
              />
            ))}
          </div>
        </div>

        {/* History Heatmap */}
        <div className="col-span-3">
          <div className="bg-navy/30 rounded p-3">
            <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wide mb-3">
              Recent History
            </h4>

            {/* Time Headers */}
            <div className="grid grid-cols-6 gap-1 mb-2">
              {history.map((h, idx) => (
                <div key={idx} className="text-center text-xxs text-text-muted">
                  {h.time}
                </div>
              ))}
            </div>

            {/* Heatmap Grid */}
            <div className="space-y-1">
              {footprint.map((level, levelIdx) => (
                <div key={level.priceLevel} className="grid grid-cols-6 gap-1 items-center">
                  {history.map((h, timeIdx) => {
                    const histLevel = h.levels?.[levelIdx];
                    return (
                      <HeatmapCell
                        key={`${level.priceLevel}-${timeIdx}`}
                        delta={histLevel?.delta || 0}
                        volume={histLevel?.volume || 0}
                        maxVolume={maxHistoryVolume}
                      />
                    );
                  })}
                </div>
              ))}
            </div>

            {/* Heatmap Legend */}
            <div className="mt-4 pt-3 border-t border-border-subtle/30">
              <div className="flex items-center justify-between text-xxs">
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded-sm bg-bull/60"></div>
                  <span className="text-text-muted">Bid</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded-sm bg-bear/60"></div>
                  <span className="text-text-muted">Ask</span>
                </div>
              </div>
              <p className="text-xxs text-text-muted mt-2">Darker = More Volume</p>
            </div>
          </div>
        </div>
      </div>

      {/* Educational Section */}
      <div className="mt-6 bg-navy/30 rounded-lg p-4 border border-border-subtle/30">
        <h3 className="text-base font-semibold text-text-primary mb-4">How to Read This Footprint Chart</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left Panel - Reading the Chart */}
          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-semibold text-bull mb-2">Bid Volume (Left Bars)</h4>
              <p className="text-sm text-text-primary leading-relaxed">
                Shows buy orders executed at each price level. Longer cyan bars indicate stronger buying interest.
                When bid volume significantly exceeds ask volume (3:1+), it's marked as an imbalance.
              </p>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-bear mb-2">Ask Volume (Right Bars)</h4>
              <p className="text-sm text-text-primary leading-relaxed">
                Shows sell orders executed at each price level. Longer red bars indicate stronger selling pressure.
                Stacked ask imbalances often indicate resistance zones.
              </p>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-yellow-400 mb-2">POC (Point of Control)</h4>
              <p className="text-sm text-text-primary leading-relaxed">
                The price level with the highest total volume. This represents fair value where most trading occurred.
                Price tends to gravitate toward POC during consolidation.
              </p>
            </div>
          </div>

          {/* Right Panel - Signals */}
          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-semibold text-orange-400 mb-2">Exhaustion Pattern</h4>
              <p className="text-sm text-text-primary leading-relaxed">
                High volume with extreme imbalance. The market is trying hard to move but meeting resistance.
                Often precedes reversals. Look for: volume spike + small price movement + extreme delta.
              </p>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-purple-400 mb-2">Absorption Pattern</h4>
              <p className="text-sm text-text-primary leading-relaxed">
                High volume with balanced bid/ask. A large player is absorbing opposing flow without moving price.
                Often precedes breakouts. Look for: high volume + near-zero delta + price stability.
              </p>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-accent mb-2">Imbalance (3:1)</h4>
              <p className="text-sm text-text-primary leading-relaxed">
                When one side has 3x+ the volume of the other. Stacked imbalances in one direction
                show strong institutional flow and often lead to continuation.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Reference */}
      <div className="mt-4 grid grid-cols-3 gap-4">
        <div className="bg-orange-900/20 border border-orange-500/30 rounded p-4">
          <h4 className="text-base font-semibold text-orange-400 mb-2">Exhaustion Signals</h4>
          <ul className="text-sm text-orange-200 space-y-2 leading-relaxed">
            <li>Volume spike with small price move</li>
            <li>Extreme delta at resistance/support</li>
            <li>Multiple rejections at level</li>
            <li>Setup for reversal trades</li>
          </ul>
        </div>

        <div className="bg-purple-900/20 border border-purple-500/30 rounded p-4">
          <h4 className="text-base font-semibold text-purple-400 mb-2">Absorption Signals</h4>
          <ul className="text-sm text-purple-200 space-y-2 leading-relaxed">
            <li>High volume, balanced flow</li>
            <li>Price holds despite pressure</li>
            <li>Large player accumulating</li>
            <li>Setup for breakout trades</li>
          </ul>
        </div>

        <div className="bg-blue-900/20 border border-blue-500/30 rounded p-4">
          <h4 className="text-base font-semibold text-blue-400 mb-2">Action Points</h4>
          <ul className="text-sm text-blue-200 space-y-2 leading-relaxed">
            <li>Exhaustion at highs = short setup</li>
            <li>Exhaustion at lows = long setup</li>
            <li>Absorption = wait for direction</li>
            <li>Imbalance stacks = trend continuation</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ExhaustionAbsorption;
