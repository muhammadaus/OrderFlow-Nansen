import React from 'react';
import { ScatterChart, Scatter, XAxis, YAxis, ZAxis, ResponsiveContainer, Tooltip, Cell, BarChart, Bar } from 'recharts';
import { useEnhancedStreamingData } from '../services/dataSourceContext';
import { useStreamingConfig } from '../hooks/useStreamingConfig';
import StreamingIndicator from './StreamingIndicator';
import LoadingPlaceholder from './LoadingPlaceholder';

const ImbalanceCluster = () => {
  // Get streaming configuration
  const { interval, isPaused } = useStreamingConfig('imbalances');

  // Use enhanced streaming data
  const {
    data: analysis,
    loading,
    error,
    lastUpdate,
    latency,
    isStale,
    updateCount
  } = useEnhancedStreamingData('imbalances', interval, {
    enabled: !isPaused
  });

  // Derive state from streaming data
  const footprintData = analysis?.footprintData || [];
  const imbalances = analysis?.imbalances || [];
  const unfinishedAuctions = analysis?.unfinishedAuctions || [];
  const metrics = analysis?.metrics || {};

  // Prepare heatmap data - group by time for visualization
  const heatmapData = [];
  const timeGroups = {};

  footprintData.forEach(fp => {
    if (!timeGroups[fp.time]) timeGroups[fp.time] = [];
    timeGroups[fp.time].push(fp);
  });

  Object.entries(timeGroups).forEach(([time, levels]) => {
    levels.forEach(level => {
      heatmapData.push({
        ...level,
        x: time,
        y: level.priceLevel,
        z: level.totalVolume,
        color: level.direction === 'bid' ? '#3b82f6' :
               level.direction === 'ask' ? '#ef4444' : '#6b7280'
      });
    });
  });

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-gray-800 p-2 rounded border border-gray-600 text-xs">
          <p className="text-white font-semibold">${data.priceLevel} @ {data.time}</p>
          <p className="text-blue-400">Bids: {data.bidVolume?.toLocaleString()}</p>
          <p className="text-red-400">Asks: {data.askVolume?.toLocaleString()}</p>
          <p className={`font-semibold ${
            data.direction === 'bid' ? 'text-blue-400' :
            data.direction === 'ask' ? 'text-red-400' : 'text-gray-400'
          }`}>
            Imbalance: {(data.imbalanceRatio * 100).toFixed(0)}% {data.direction.toUpperCase()}
          </p>
          {data.isSignificant && (
            <p className="text-yellow-400">Significant Imbalance!</p>
          )}
        </div>
      );
    }
    return null;
  };

  // Prepare imbalance summary for bar chart
  const imbalanceSummary = imbalances.slice(0, 10).map(imb => ({
    id: imb.id,
    priceRange: `$${imb.priceStart}-${imb.priceEnd}`,
    strength: imb.strength,
    direction: imb.direction,
    stackSize: imb.stackSize
  }));

  // Show loading placeholder on initial load
  if (loading && !analysis) {
    return <LoadingPlaceholder height={600} title="Imbalance Cluster Visualization" />;
  }

  return (
    <div className="bg-gray-900 rounded-lg p-4">
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xl font-bold text-white">Imbalance Cluster Visualization</h2>
          <StreamingIndicator
            lastUpdate={lastUpdate}
            latency={latency}
            isStale={isStale}
            loading={loading}
            error={error}
            updateCount={updateCount}
          />
        </div>
        <p className="text-gray-400 text-sm mb-4">
          Footprint-style bid/ask imbalance stacking to identify unfinished auctions
        </p>

        {/* Metrics Cards */}
        <div className="grid grid-cols-5 gap-3 text-sm">
          <div className="bg-gray-800 p-3 rounded">
            <p className="text-gray-400 text-xs">Bid Dominance</p>
            <p className="text-blue-400 font-bold text-lg">{metrics.bidDominance || 0}%</p>
          </div>
          <div className="bg-gray-800 p-3 rounded">
            <p className="text-gray-400 text-xs">Ask Dominance</p>
            <p className="text-red-400 font-bold text-lg">{metrics.askDominance || 0}%</p>
          </div>
          <div className="bg-gray-800 p-3 rounded">
            <p className="text-gray-400 text-xs">Neutral Zones</p>
            <p className="text-gray-400 font-bold text-lg">{metrics.neutralZones || 0}%</p>
          </div>
          <div className="bg-gray-800 p-3 rounded">
            <p className="text-gray-400 text-xs">Stacked Imbalances</p>
            <p className="text-yellow-400 font-bold text-lg">{metrics.stackedImbalanceCount || 0}</p>
          </div>
          <div className="bg-gray-800 p-3 rounded">
            <p className="text-gray-400 text-xs">Unfinished Auctions</p>
            <p className="text-purple-400 font-bold text-lg">{metrics.unfinishedAuctionCount || 0}</p>
          </div>
        </div>
      </div>

      {/* Dominant Side Alert */}
      {metrics.dominantSide && metrics.dominantSide !== 'neutral' && (
        <div className={`mb-4 p-3 rounded border ${
          metrics.dominantSide === 'bid'
            ? 'bg-blue-900/20 border-blue-500'
            : 'bg-red-900/20 border-red-500'
        }`}>
          <span className={`font-bold ${
            metrics.dominantSide === 'bid' ? 'text-blue-400' : 'text-red-400'
          }`}>
            {metrics.dominantSide === 'bid' ? '🔵' : '🔴'} {metrics.dominantSide.toUpperCase()} DOMINANT
          </span>
          <p className="text-gray-300 text-sm mt-1">
            {metrics.dominantSide === 'bid'
              ? 'Passive bids absorbing aggressive sells - buyers in control'
              : 'Passive asks absorbing aggressive buys - sellers in control'}
          </p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 mb-4">
        {/* Footprint Heatmap */}
        <div>
          <h3 className="text-sm font-semibold text-gray-300 mb-2">Imbalance Heatmap</h3>
          <ResponsiveContainer width="100%" height={350}>
            <ScatterChart margin={{ top: 10, right: 10, bottom: 10, left: 10 }}>
              <XAxis
                dataKey="time"
                type="category"
                stroke="#6b7280"
                tick={{ fontSize: 8 }}
                tickLine={false}
              />
              <YAxis
                dataKey="priceLevel"
                type="number"
                stroke="#6b7280"
                tick={{ fontSize: 10 }}
                domain={['auto', 'auto']}
                tickFormatter={(v) => `$${v}`}
              />
              <ZAxis dataKey="totalVolume" range={[20, 200]} />
              <Tooltip content={<CustomTooltip />} />
              <Scatter data={heatmapData.slice(-200)}>
                {heatmapData.slice(-200).map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.color}
                    opacity={entry.isSignificant ? 0.9 : 0.4}
                  />
                ))}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>

          <div className="mt-2 flex gap-4 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-500 rounded"></div>
              <span className="text-gray-300">Bid Imbalance</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-500 rounded"></div>
              <span className="text-gray-300">Ask Imbalance</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-gray-500 rounded"></div>
              <span className="text-gray-300">Neutral</span>
            </div>
          </div>
        </div>

        {/* Stacked Imbalances */}
        <div>
          <h3 className="text-sm font-semibold text-gray-300 mb-2">Stacked Imbalance Clusters</h3>
          {imbalanceSummary.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={imbalanceSummary} layout="vertical">
                <XAxis type="number" stroke="#6b7280" tick={{ fontSize: 10 }} />
                <YAxis
                  type="category"
                  dataKey="priceRange"
                  stroke="#6b7280"
                  tick={{ fontSize: 10 }}
                  width={100}
                />
                <Bar dataKey="strength">
                  {imbalanceSummary.map((entry, index) => (
                    <Cell
                      key={`bar-${index}`}
                      fill={entry.direction === 'bid' ? '#3b82f6' : '#ef4444'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[200px] flex items-center justify-center text-gray-500">
              No significant stacked imbalances detected
            </div>
          )}

          {/* Unfinished Auctions */}
          <h3 className="text-sm font-semibold text-gray-300 mt-4 mb-2">Unfinished Auctions</h3>
          <div className="space-y-2 max-h-[120px] overflow-y-auto">
            {unfinishedAuctions.slice(0, 5).map((ua, i) => (
              <div key={i} className={`p-2 rounded text-xs ${
                ua.dominantSide === 'bid' ? 'bg-blue-900/30' : 'bg-red-900/30'
              }`}>
                <div className="flex justify-between">
                  <span className="text-white">${ua.priceLevel}</span>
                  <span className={ua.dominantSide === 'bid' ? 'text-blue-400' : 'text-red-400'}>
                    {ua.dominantSide.toUpperCase()} DOM
                  </span>
                  <span className="text-yellow-400">{ua.likelihood}% likely return</span>
                </div>
                <p className="text-gray-400 mt-1">{ua.tradingTip}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Education Panel */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="bg-gray-800 p-3 rounded">
          <h3 className="text-sm font-semibold text-gray-300 mb-2">What Are Imbalance Clusters?</h3>
          <ul className="text-xs space-y-1 text-gray-400">
            <li>• <strong>Imbalance</strong>: When one side (bid/ask) &gt; 1.3x the other</li>
            <li>• <strong>Cluster</strong>: 3+ consecutive price levels with same-side imbalance</li>
            <li>• <strong>Stacked imbalances</strong> = "walls" of buying/selling pressure</li>
            <li>• Single imbalances are noise; clusters are structural</li>
          </ul>
        </div>

        <div className="bg-gray-800 p-3 rounded">
          <h3 className="text-sm font-semibold text-gray-300 mb-2">Trading Unfinished Auctions</h3>
          <ul className="text-xs space-y-1 text-gray-400">
            <li>• Price tends to return to areas of unfinished business</li>
            <li>• <span className="text-blue-400">Bid-dominant</span>: Price likely to return and test bids</li>
            <li>• <span className="text-red-400">Ask-dominant</span>: Price likely to return and test asks</li>
            <li>• Use as mean-reversion targets, not breakout entries</li>
          </ul>
        </div>
      </div>

      {/* Pro Tips */}
      <div className="bg-indigo-900/20 border border-indigo-500 rounded p-3">
        <p className="text-xs text-indigo-300">
          <span className="font-semibold">Reliability Rank: #5</span> - Imbalance clusters indicate auction mechanics and order flow structure.
          They're most useful when combined with price rejection at the cluster level. A cluster + rejection = failed auction attempt.
          Use for confluence, not as standalone signals.
        </p>
      </div>
    </div>
  );
};

export default ImbalanceCluster;
