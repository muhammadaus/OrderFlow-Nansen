import React from 'react';
import { ComposedChart, Bar, Line, XAxis, YAxis, ResponsiveContainer, Cell, ReferenceLine, Tooltip } from 'recharts';
import { useEnhancedStreamingData } from '../services/dataSourceContext';
import { useStreamingConfig } from '../hooks/useStreamingConfig';
import StreamingIndicator from './StreamingIndicator';
import LoadingPlaceholder from './LoadingPlaceholder';

const DeltaDivergence = () => {
  // Get streaming configuration for this component
  const { interval, isPaused } = useStreamingConfig('deltaDivergence');

  // Use enhanced streaming data hook
  const {
    data: analysis,
    loading,
    error,
    lastUpdate,
    latency,
    isStale,
    updateCount
  } = useEnhancedStreamingData('deltaDivergence', interval, {
    enabled: !isPaused
  });

  // Derive state from streaming data
  const priceData = analysis?.priceData || [];
  const divergences = analysis?.divergences || [];
  const currentDivergence = analysis?.currentDivergence || null;
  const metrics = analysis?.metrics || {};

  // Show loading placeholder on initial load
  if (loading && !analysis) {
    return <LoadingPlaceholder height={500} title="Delta Divergence Detector" />;
  }

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-gray-800 p-2 rounded border border-gray-600 text-xs">
          <p className="text-white">{data.time}</p>
          <p className="text-gray-300">Price: ${data.price}</p>
          <p className={data.delta > 0 ? 'text-green-400' : 'text-red-400'}>
            Delta: {data.delta > 0 ? '+' : ''}{data.delta}
          </p>
          <p className="text-purple-400">CVD: {data.cumulativeDelta}</p>
          {data.isDivergence && (
            <p className="text-yellow-400 font-semibold">Divergence Zone</p>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-gray-900 rounded-lg p-4">
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xl font-bold text-white">Delta Divergence Detector</h2>
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
          Detects when aggressive orders fail to move price - passive liquidity absorption
        </p>

        {/* Metrics Cards */}
        <div className="grid grid-cols-4 gap-4 text-sm">
          <div className="bg-gray-800 p-3 rounded">
            <p className="text-gray-400 text-xs">Bullish Divergences</p>
            <p className="text-green-400 font-bold text-lg">{metrics.bullishDivergences || 0}</p>
          </div>
          <div className="bg-gray-800 p-3 rounded">
            <p className="text-gray-400 text-xs">Bearish Divergences</p>
            <p className="text-red-400 font-bold text-lg">{metrics.bearishDivergences || 0}</p>
          </div>
          <div className="bg-gray-800 p-3 rounded">
            <p className="text-gray-400 text-xs">Active Signals</p>
            <p className="text-yellow-400 font-bold text-lg">{metrics.activeCount || 0}</p>
          </div>
          <div className="bg-gray-800 p-3 rounded">
            <p className="text-gray-400 text-xs">Aggression Failure</p>
            <p className="text-purple-400 font-bold text-lg">{(metrics.aggressionFailureRatio * 100 || 0).toFixed(0)}%</p>
          </div>
        </div>
      </div>

      {/* Current Divergence Alert */}
      {currentDivergence && (
        <div className={`mb-4 p-3 rounded border ${
          currentDivergence.type === 'bullish'
            ? 'bg-green-900/20 border-green-500'
            : 'bg-red-900/20 border-red-500'
        }`}>
          <div className="flex items-center justify-between">
            <div>
              <span className={`font-bold ${
                currentDivergence.type === 'bullish' ? 'text-green-400' : 'text-red-400'
              }`}>
                {currentDivergence.type === 'bullish' ? '🟢' : '🔴'} Active {currentDivergence.type.toUpperCase()} Divergence
              </span>
              <p className="text-gray-300 text-sm mt-1">{currentDivergence.description}</p>
            </div>
            <div className="text-right">
              <p className="text-gray-400 text-xs">Strength</p>
              <p className="text-white font-bold text-xl">{currentDivergence.strength}%</p>
            </div>
          </div>
        </div>
      )}

      {/* Main Chart */}
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-gray-300 mb-2">Price & Delta Divergence Chart</h3>
        <ResponsiveContainer width="100%" height={350}>
          <ComposedChart data={priceData.slice(-50)}>
            <XAxis dataKey="time" stroke="#6b7280" tick={{ fontSize: 10 }} />
            <YAxis yAxisId="price" orientation="right" stroke="#6b7280" tick={{ fontSize: 10 }} domain={['auto', 'auto']} />
            <YAxis yAxisId="delta" orientation="left" stroke="#8b5cf6" tick={{ fontSize: 10 }} />
            <Tooltip content={<CustomTooltip />} />

            {/* Delta bars */}
            <Bar yAxisId="delta" dataKey="delta" opacity={0.6}>
              {priceData.slice(-50).map((entry, index) => (
                <Cell
                  key={`delta-${index}`}
                  fill={entry.isDivergence ? '#eab308' : entry.delta > 0 ? '#22c55e' : '#ef4444'}
                />
              ))}
            </Bar>

            {/* Price line */}
            <Line
              yAxisId="price"
              type="monotone"
              dataKey="price"
              stroke="#3b82f6"
              strokeWidth={2}
              dot={false}
            />

            {/* CVD line */}
            <Line
              yAxisId="delta"
              type="monotone"
              dataKey="cumulativeDelta"
              stroke="#8b5cf6"
              strokeWidth={1.5}
              strokeDasharray="5 5"
              dot={false}
            />

            {/* Mark divergence zones */}
            {divergences.slice(-5).map((div, i) => (
              <ReferenceLine
                key={`div-${i}`}
                yAxisId="price"
                y={div.priceLevel}
                stroke={div.type === 'bullish' ? '#22c55e' : '#ef4444'}
                strokeDasharray="3 3"
                opacity={0.5}
              />
            ))}
          </ComposedChart>
        </ResponsiveContainer>

        <div className="mt-2 flex gap-4 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-500 rounded"></div>
            <span className="text-gray-300">Price</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-purple-500 rounded"></div>
            <span className="text-gray-300">CVD</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-yellow-500 rounded"></div>
            <span className="text-gray-300">Divergence Zone</span>
          </div>
        </div>
      </div>

      {/* Recent Divergences */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="bg-gray-800 p-3 rounded">
          <h3 className="text-sm font-semibold text-gray-300 mb-2">Recent Divergences</h3>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {divergences.slice(-6).reverse().map((div, i) => (
              <div key={i} className={`p-2 rounded text-xs ${
                div.type === 'bullish' ? 'bg-green-900/30' : 'bg-red-900/30'
              }`}>
                <div className="flex justify-between items-center">
                  <span className={div.type === 'bullish' ? 'text-green-400' : 'text-red-400'}>
                    {div.type === 'bullish' ? '🟢' : '🔴'} {div.type.toUpperCase()}
                  </span>
                  <span className="text-gray-400">{div.time}</span>
                </div>
                <p className="text-gray-300 mt-1">{div.description}</p>
                <div className="flex justify-between mt-1">
                  <span className="text-gray-400">Strength: {div.strength}%</span>
                  <span className={div.outcome === 'confirmed' ? 'text-green-400' : 'text-yellow-400'}>
                    {div.outcome === 'confirmed' ? 'Confirmed' : 'Pending'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-gray-800 p-3 rounded">
          <h3 className="text-sm font-semibold text-gray-300 mb-2">How Delta Divergence Works</h3>
          <ul className="text-xs space-y-2 text-gray-400">
            <li className="flex items-start gap-2">
              <span className="text-green-400">🟢</span>
              <span><strong>Bullish:</strong> Price falling but delta positive - aggressive selling absorbed by passive bids</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-red-400">🔴</span>
              <span><strong>Bearish:</strong> Price rising but delta negative - aggressive buying absorbed by passive asks</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-yellow-400">⚡</span>
              <span><strong>Key insight:</strong> When aggression fails to move price, the aggressor is wrong</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-purple-400">📊</span>
              <span><strong>Trade it:</strong> Fade the failed aggression direction after confirmation</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Trading Tips */}
      <div className="bg-indigo-900/20 border border-indigo-500 rounded p-3">
        <p className="text-xs text-indigo-300">
          <span className="font-semibold">Reliability Rank: #1</span> - Delta divergence is the highest reliability signal because it measures direct failure of initiative traders.
          When aggressive market orders cannot move price, passive liquidity is absorbing them. This is structural failure, not just a price level.
          Combine with volume spikes for confirmation.
        </p>
      </div>
    </div>
  );
};

export default DeltaDivergence;
