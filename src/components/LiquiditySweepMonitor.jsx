import React from 'react';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell, Tooltip, ScatterChart, Scatter, ZAxis } from 'recharts';
import { useEnhancedStreamingData } from '../services/dataSourceContext';
import { useStreamingConfig } from '../hooks/useStreamingConfig';
import StreamingIndicator from './StreamingIndicator';
import LoadingPlaceholder from './LoadingPlaceholder';

const LiquiditySweepMonitor = () => {
  // Get streaming configuration
  const { interval, isPaused } = useStreamingConfig('liquiditySweeps');

  // Use enhanced streaming data
  const {
    data: analysis,
    loading,
    error,
    lastUpdate,
    latency,
    isStale,
    updateCount
  } = useEnhancedStreamingData('liquiditySweeps', interval, {
    enabled: !isPaused
  });

  // Derive state from streaming data
  const sweepEvents = analysis?.sweepEvents || [];
  const priceLadder = analysis?.priceLadder || [];
  const currentSweep = analysis?.currentSweep || null;
  const stats = analysis?.stats || {};
  const nearbyLiquidity = analysis?.nearbyLiquidity || {};

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-gray-800 p-2 rounded border border-gray-600 text-xs">
          <p className="text-white font-semibold">${data.price}</p>
          <p className="text-blue-400">Bid Liquidity: {data.bidLiquidity?.toLocaleString()}</p>
          <p className="text-red-400">Ask Liquidity: {data.askLiquidity?.toLocaleString()}</p>
          <p className="text-yellow-400">Stops: {data.stopCluster}</p>
          {data.wasSwept && (
            <p className={data.sweepOutcome === 'absorbed' ? 'text-green-400' : 'text-red-400'}>
              Swept: {data.sweepOutcome}
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  // Show loading placeholder on initial load
  if (loading && !analysis) {
    return <LoadingPlaceholder height={600} title="Liquidity Sweep Monitor" />;
  }

  return (
    <div className="bg-gray-900 rounded-lg p-4">
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xl font-bold text-white">Liquidity Sweep Monitor</h2>
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
          Tracks stop hunts and whether swept liquidity was absorbed or drove continuation
        </p>

        {/* Stats Cards */}
        <div className="grid grid-cols-5 gap-3 text-sm">
          <div className="bg-gray-800 p-3 rounded">
            <p className="text-gray-400 text-xs">Total Sweeps</p>
            <p className="text-white font-bold text-lg">{stats.totalSweeps || 0}</p>
          </div>
          <div className="bg-gray-800 p-3 rounded">
            <p className="text-gray-400 text-xs">Absorbed</p>
            <p className="text-green-400 font-bold text-lg">{stats.absorbedSweeps || 0}</p>
          </div>
          <div className="bg-gray-800 p-3 rounded">
            <p className="text-gray-400 text-xs">Continuation</p>
            <p className="text-red-400 font-bold text-lg">{stats.continuationSweeps || 0}</p>
          </div>
          <div className="bg-gray-800 p-3 rounded">
            <p className="text-gray-400 text-xs">Absorption Rate</p>
            <p className="text-purple-400 font-bold text-lg">{stats.absorptionRate || 0}%</p>
          </div>
          <div className="bg-gray-800 p-3 rounded">
            <p className="text-gray-400 text-xs">Avg Volume Spike</p>
            <p className="text-yellow-400 font-bold text-lg">{stats.avgVolumeSpike || 0}x</p>
          </div>
        </div>
      </div>

      {/* Active Sweep Alert */}
      {currentSweep && (
        <div className={`mb-4 p-3 rounded border ${
          currentSweep.outcome === 'absorbed'
            ? 'bg-green-900/20 border-green-500'
            : 'bg-red-900/20 border-red-500'
        }`}>
          <div className="flex items-center justify-between">
            <div>
              <span className={`font-bold ${
                currentSweep.outcome === 'absorbed' ? 'text-green-400' : 'text-red-400'
              }`}>
                {currentSweep.outcome === 'absorbed' ? '🎯' : '💨'} Recent Sweep: {currentSweep.direction.toUpperCase()}
              </span>
              <p className="text-gray-300 text-sm mt-1">{currentSweep.description}</p>
            </div>
            <div className="text-right">
              <p className="text-gray-400 text-xs">Price Reaction</p>
              <p className={`font-bold text-xl ${currentSweep.priceReaction > 0 ? 'text-green-400' : 'text-red-400'}`}>
                {currentSweep.priceReaction > 0 ? '+' : ''}{currentSweep.priceReaction}%
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 mb-4">
        {/* Price Ladder with Liquidity */}
        <div>
          <h3 className="text-sm font-semibold text-gray-300 mb-2">Liquidity Ladder</h3>
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={priceLadder} layout="vertical">
              <XAxis type="number" stroke="#6b7280" tick={{ fontSize: 10 }} />
              <YAxis
                type="category"
                dataKey="price"
                stroke="#6b7280"
                tick={{ fontSize: 10 }}
                tickFormatter={(v) => `$${v}`}
              />
              <Tooltip content={<CustomTooltip />} />

              <Bar dataKey="bidLiquidity" stackId="a" name="Bids">
                {priceLadder.map((entry, index) => (
                  <Cell
                    key={`bid-${index}`}
                    fill={entry.wasSwept ? '#22c55e' : '#3b82f6'}
                    opacity={entry.isKeyLevel ? 1 : 0.6}
                  />
                ))}
              </Bar>
              <Bar dataKey="askLiquidity" stackId="a" name="Asks">
                {priceLadder.map((entry, index) => (
                  <Cell
                    key={`ask-${index}`}
                    fill={entry.wasSwept ? '#ef4444' : '#f59e0b'}
                    opacity={entry.isKeyLevel ? 1 : 0.6}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>

          <div className="mt-2 flex gap-4 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-500 rounded"></div>
              <span className="text-gray-300">Bid Liquidity</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-amber-500 rounded"></div>
              <span className="text-gray-300">Ask Liquidity</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded"></div>
              <span className="text-gray-300">Swept + Absorbed</span>
            </div>
          </div>
        </div>

        {/* Sweep Events Timeline */}
        <div>
          <h3 className="text-sm font-semibold text-gray-300 mb-2">Sweep Events (24h)</h3>
          <div className="space-y-2 max-h-[350px] overflow-y-auto">
            {sweepEvents.slice(0, 10).map((sweep, i) => (
              <div key={i} className={`p-2 rounded text-xs border ${
                sweep.outcome === 'absorbed'
                  ? 'bg-green-900/20 border-green-700'
                  : 'bg-red-900/20 border-red-700'
              }`}>
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-white">
                    {sweep.direction === 'buy-side' ? '📉 Buy-Side' : '📈 Sell-Side'} Sweep
                  </span>
                  <span className="text-gray-400">{sweep.time}</span>
                </div>
                <div className="grid grid-cols-3 gap-2 mt-2">
                  <div>
                    <p className="text-gray-500">Price</p>
                    <p className="text-white">${sweep.price}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Liq Cleared</p>
                    <p className="text-white">${sweep.liquidityCleared.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Outcome</p>
                    <p className={sweep.outcome === 'absorbed' ? 'text-green-400' : 'text-red-400'}>
                      {sweep.outcome.toUpperCase()}
                    </p>
                  </div>
                </div>
                <div className="mt-2 flex justify-between items-center">
                  <span className="text-gray-400">Stops: {sweep.stopsTriggered}</span>
                  <span className="text-gray-400">Vol: {sweep.volumeSpike}x</span>
                  <span className={`${
                    sweep.priceReaction > 0 ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {sweep.priceReaction > 0 ? '+' : ''}{sweep.priceReaction}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Nearby Liquidity Alert */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="bg-gray-800 p-3 rounded">
          <h3 className="text-sm font-semibold text-gray-300 mb-2">Nearby Liquidity Targets</h3>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between items-center p-2 bg-blue-900/30 rounded">
              <span className="text-blue-400">Buy-Side (Longs)</span>
              <span className="text-white">${nearbyLiquidity.buySide?.price || 'N/A'}</span>
              <span className="text-gray-400">{nearbyLiquidity.buySideDistance}</span>
            </div>
            <div className="flex justify-between items-center p-2 bg-red-900/30 rounded">
              <span className="text-red-400">Sell-Side (Shorts)</span>
              <span className="text-white">${nearbyLiquidity.sellSide?.price || 'N/A'}</span>
              <span className="text-gray-400">{nearbyLiquidity.sellSideDistance}</span>
            </div>
          </div>
        </div>

        <div className="bg-gray-800 p-3 rounded">
          <h3 className="text-sm font-semibold text-gray-300 mb-2">Sweep Trading Strategy</h3>
          <ul className="text-xs space-y-1 text-gray-400">
            <li>• <span className="text-green-400">Absorbed sweeps</span> = Reversal fuel (fade the sweep)</li>
            <li>• <span className="text-red-400">Continuation sweeps</span> = Trend strength (join the move)</li>
            <li>• High volume spike + quick rejection = Strong absorption</li>
            <li>• Wait for 1-3 rejection candles before entry</li>
            <li>• Stop behind the sweep level</li>
          </ul>
        </div>
      </div>

      {/* Pro Tips */}
      <div className="bg-indigo-900/20 border border-indigo-500 rounded p-3">
        <p className="text-xs text-indigo-300">
          <span className="font-semibold">Reliability Rank: #2</span> - Liquidity sweeps with absorption are engineered reversal setups.
          Smart money doesn't predict direction - they wait for stops to trigger, providing guaranteed liquidity.
          A sweep + immediate rejection means stops fired but no follow-through. This is institutional trap setup.
        </p>
      </div>
    </div>
  );
};

export default LiquiditySweepMonitor;
