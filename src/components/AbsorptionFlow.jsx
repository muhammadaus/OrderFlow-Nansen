import React from 'react';
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip, ComposedChart, Bar, Line, Cell } from 'recharts';
import { useEnhancedStreamingData } from '../services/dataSourceContext';
import { useStreamingConfig } from '../hooks/useStreamingConfig';
import StreamingIndicator from './StreamingIndicator';
import LoadingPlaceholder from './LoadingPlaceholder';

const AbsorptionFlow = () => {
  // Get streaming configuration
  const { interval, isPaused } = useStreamingConfig('absorptionFlow');

  // Use enhanced streaming data
  const {
    data: analysis,
    loading,
    error,
    lastUpdate,
    latency,
    isStale,
    updateCount
  } = useEnhancedStreamingData('absorptionFlow', interval, {
    enabled: !isPaused
  });

  // Derive state from streaming data
  const flowData = analysis?.flowData || [];
  const currentRatio = analysis?.currentRatio || 0.5;
  const winningParticipant = analysis?.winningParticipant || 'neutral';
  const prediction = analysis?.prediction || null;
  const metrics = analysis?.metrics || {};
  const interpretation = analysis?.interpretation || {};

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-gray-800 p-2 rounded border border-gray-600 text-xs">
          <p className="text-white">{data.time}</p>
          <p className="text-green-400">Agg Buys: {data.aggressiveBuys?.toLocaleString()}</p>
          <p className="text-red-400">Agg Sells: {data.aggressiveSells?.toLocaleString()}</p>
          <p className="text-blue-400">Passive Bids: {data.passiveBids?.toLocaleString()}</p>
          <p className="text-amber-400">Passive Asks: {data.passiveAsks?.toLocaleString()}</p>
          <p className="text-purple-400 font-semibold">
            Absorption: {(data.absorptionRatio * 100).toFixed(0)}%
          </p>
          <p className={`font-semibold ${
            data.winner === 'passive' ? 'text-purple-400' :
            data.winner === 'initiative' ? 'text-yellow-400' : 'text-gray-400'
          }`}>
            Winner: {data.winner.toUpperCase()}
          </p>
        </div>
      );
    }
    return null;
  };

  // Calculate gauge position (0-180 degrees, where 90 is center)
  const gaugeAngle = (currentRatio - 0.5) * 180; // -90 to +90

  // Show loading placeholder on initial load
  if (loading && !analysis) {
    return <LoadingPlaceholder height={600} title="Absorption Flow Dashboard" />;
  }

  return (
    <div className="bg-gray-900 rounded-lg p-4">
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xl font-bold text-white">Absorption Flow Dashboard</h2>
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
          Real-time passive vs aggressive order comparison - who's winning the auction?
        </p>

        {/* Metrics Cards */}
        <div className="grid grid-cols-4 gap-3 text-sm">
          <div className="bg-gray-800 p-3 rounded">
            <p className="text-gray-400 text-xs">Absorption Ratio</p>
            <p className="text-purple-400 font-bold text-lg">{(currentRatio * 100).toFixed(0)}%</p>
          </div>
          <div className="bg-gray-800 p-3 rounded">
            <p className="text-gray-400 text-xs">Winning Side</p>
            <p className={`font-bold text-lg ${
              winningParticipant === 'passive' ? 'text-purple-400' :
              winningParticipant === 'initiative' ? 'text-yellow-400' : 'text-gray-400'
            }`}>
              {winningParticipant.toUpperCase()}
            </p>
          </div>
          <div className="bg-gray-800 p-3 rounded">
            <p className="text-gray-400 text-xs">Passive Win Rate</p>
            <p className="text-blue-400 font-bold text-lg">{metrics.passiveWinRate || 0}%</p>
          </div>
          <div className="bg-gray-800 p-3 rounded">
            <p className="text-gray-400 text-xs">Initiative Win Rate</p>
            <p className="text-yellow-400 font-bold text-lg">{metrics.initiativeWinRate || 0}%</p>
          </div>
        </div>
      </div>

      {/* Prediction Card */}
      {prediction && (
        <div className={`mb-4 p-3 rounded border ${
          prediction.direction === 'up' ? 'bg-green-900/20 border-green-500' :
          prediction.direction === 'down' ? 'bg-red-900/20 border-red-500' :
          'bg-gray-800 border-gray-600'
        }`}>
          <div className="flex items-center justify-between">
            <div>
              <span className={`font-bold ${
                prediction.direction === 'up' ? 'text-green-400' :
                prediction.direction === 'down' ? 'text-red-400' : 'text-gray-400'
              }`}>
                {prediction.direction === 'up' ? '📈' : prediction.direction === 'down' ? '📉' : '⏸️'}
                {' '}PREDICTION: {prediction.direction.toUpperCase()}
              </span>
              <p className="text-gray-300 text-sm mt-1">{prediction.reasoning}</p>
              <p className="text-gray-400 text-xs mt-1">Timeframe: {prediction.timeframe}</p>
            </div>
            <div className="text-right">
              <p className="text-gray-400 text-xs">Confidence</p>
              <p className="text-white font-bold text-xl">{prediction.confidence}%</p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 mb-4">
        {/* Absorption Gauge */}
        <div className="bg-gray-800 p-4 rounded">
          <h3 className="text-sm font-semibold text-gray-300 mb-4 text-center">Absorption Tug-of-War</h3>

          <div className="relative h-32 flex items-center justify-center">
            {/* Gauge background */}
            <div className="absolute w-48 h-24 border-t-4 border-l-4 border-r-4 border-gray-600 rounded-t-full"></div>

            {/* Initiative side label */}
            <div className="absolute left-4 top-0 text-yellow-400 text-xs">INITIATIVE</div>

            {/* Passive side label */}
            <div className="absolute right-4 top-0 text-purple-400 text-xs">PASSIVE</div>

            {/* Gauge needle */}
            <div
              className="absolute w-1 h-20 bg-white origin-bottom transition-transform duration-500"
              style={{
                transform: `rotate(${gaugeAngle}deg)`,
                bottom: '20px'
              }}
            ></div>

            {/* Center point */}
            <div className="absolute bottom-4 w-4 h-4 bg-white rounded-full"></div>

            {/* Current value */}
            <div className="absolute bottom-0 text-center">
              <span className={`text-2xl font-bold ${
                currentRatio > 0.55 ? 'text-purple-400' :
                currentRatio < 0.45 ? 'text-yellow-400' : 'text-gray-300'
              }`}>
                {(currentRatio * 100).toFixed(0)}%
              </span>
            </div>
          </div>

          <div className="mt-4 text-center">
            <p className={`text-sm font-semibold ${
              winningParticipant === 'passive' ? 'text-purple-400' :
              winningParticipant === 'initiative' ? 'text-yellow-400' : 'text-gray-400'
            }`}>
              {interpretation.description}
            </p>
            <p className="text-gray-400 text-xs mt-1">{interpretation.tradingTip}</p>
          </div>
        </div>

        {/* Flow Volume Bars */}
        <div>
          <h3 className="text-sm font-semibold text-gray-300 mb-2">Flow Breakdown</h3>
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-green-400">Aggressive Buys</span>
                <span className="text-gray-400">{metrics.aggressiveBuys?.toLocaleString()}</span>
              </div>
              <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-green-500"
                  style={{ width: `${Math.min(100, (metrics.aggressiveBuys / (metrics.aggressiveBuys + metrics.aggressiveSells + 1)) * 100)}%` }}
                ></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-red-400">Aggressive Sells</span>
                <span className="text-gray-400">{metrics.aggressiveSells?.toLocaleString()}</span>
              </div>
              <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-red-500"
                  style={{ width: `${Math.min(100, (metrics.aggressiveSells / (metrics.aggressiveBuys + metrics.aggressiveSells + 1)) * 100)}%` }}
                ></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-blue-400">Passive Bids</span>
                <span className="text-gray-400">{metrics.passiveBids?.toLocaleString()}</span>
              </div>
              <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500"
                  style={{ width: `${Math.min(100, (metrics.passiveBids / (metrics.passiveBids + metrics.passiveAsks + 1)) * 100)}%` }}
                ></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-amber-400">Passive Asks</span>
                <span className="text-gray-400">{metrics.passiveAsks?.toLocaleString()}</span>
              </div>
              <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-amber-500"
                  style={{ width: `${Math.min(100, (metrics.passiveAsks / (metrics.passiveBids + metrics.passiveAsks + 1)) * 100)}%` }}
                ></div>
              </div>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
            <div className="bg-gray-700 p-2 rounded">
              <p className="text-gray-400">Net Aggressive</p>
              <p className={metrics.netAggressive > 0 ? 'text-green-400' : 'text-red-400'}>
                {metrics.netAggressive > 0 ? '+' : ''}{metrics.netAggressive?.toLocaleString()}
              </p>
            </div>
            <div className="bg-gray-700 p-2 rounded">
              <p className="text-gray-400">Net Passive</p>
              <p className={metrics.netPassive > 0 ? 'text-green-400' : 'text-red-400'}>
                {metrics.netPassive > 0 ? '+' : ''}{metrics.netPassive?.toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Flow Chart */}
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-gray-300 mb-2">Absorption Ratio Over Time</h3>
        <ResponsiveContainer width="100%" height={200}>
          <ComposedChart data={flowData.slice(-30)}>
            <XAxis dataKey="time" stroke="#6b7280" tick={{ fontSize: 10 }} />
            <YAxis stroke="#6b7280" tick={{ fontSize: 10 }} domain={[0, 1]} />
            <Tooltip content={<CustomTooltip />} />

            <Area
              type="monotone"
              dataKey="absorptionRatio"
              stroke="#8b5cf6"
              fill="#8b5cf6"
              fillOpacity={0.3}
            />

            {/* Reference lines for thresholds */}
            <Line
              type="monotone"
              dataKey={() => 0.55}
              stroke="#22c55e"
              strokeDasharray="3 3"
              dot={false}
            />
            <Line
              type="monotone"
              dataKey={() => 0.45}
              stroke="#ef4444"
              strokeDasharray="3 3"
              dot={false}
            />
          </ComposedChart>
        </ResponsiveContainer>

        <div className="mt-2 flex gap-4 text-xs justify-center">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-purple-500 rounded"></div>
            <span className="text-gray-300">Absorption Ratio</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-0.5 bg-green-500"></div>
            <span className="text-gray-300">&gt;55% = Passive Winning</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-0.5 bg-red-500"></div>
            <span className="text-gray-300">&lt;45% = Initiative Winning</span>
          </div>
        </div>
      </div>

      {/* Pro Tips */}
      <div className="bg-indigo-900/20 border border-indigo-500 rounded p-3">
        <p className="text-xs text-indigo-300">
          <span className="font-semibold">Reliability Rank: #1 (with divergence)</span> - When passive liquidity absorbs aggressive orders without price movement,
          the aggressor is failing. Initiative (market order) traders move price; when they can't, passive traders are stronger.
          High absorption + no price movement = reversal conditions. Low absorption + price movement = trend continuation.
        </p>
      </div>
    </div>
  );
};

export default AbsorptionFlow;
