import React from 'react';
import { ComposedChart, Line, Area, XAxis, YAxis, ResponsiveContainer, Tooltip, ReferenceLine } from 'recharts';
import { useEnhancedStreamingData } from '../services/dataSourceContext';
import { useStreamingConfig } from '../hooks/useStreamingConfig';
import StreamingIndicator from './StreamingIndicator';
import LoadingPlaceholder from './LoadingPlaceholder';

const CVDTrendBreak = () => {
  // Get streaming configuration
  const { interval, isPaused } = useStreamingConfig('cvdTrends');

  // Use enhanced streaming data
  const {
    data: analysis,
    loading,
    error,
    lastUpdate,
    latency,
    isStale,
    updateCount
  } = useEnhancedStreamingData('cvdTrends', interval, {
    enabled: !isPaused
  });

  // Derive state from streaming data
  const cvdData = analysis?.cvdData || [];
  const trendLines = analysis?.trendLines || [];
  const breaks = analysis?.breaks || [];
  const divergence = analysis?.divergence || null;
  const cvdBias = analysis?.cvdBias || 'neutral';
  const metrics = analysis?.metrics || {};

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-gray-800 p-2 rounded border border-gray-600 text-xs">
          <p className="text-white">{data.time}</p>
          <p className="text-purple-400">CVD: {data.cvd?.toLocaleString()}</p>
          <p className="text-blue-400">Price: ${data.price}</p>
          <p className="text-gray-400">Trend: {data.trendLineValue?.toLocaleString()}</p>
          <p className={data.delta > 0 ? 'text-green-400' : 'text-red-400'}>
            Delta: {data.delta > 0 ? '+' : ''}{data.delta}
          </p>
        </div>
      );
    }
    return null;
  };

  // Show loading placeholder on initial load
  if (loading && !analysis) {
    return <LoadingPlaceholder height={600} title="CVD Trend Break Detector" />;
  }

  return (
    <div className="bg-gray-900 rounded-lg p-4">
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xl font-bold text-white">CVD Trend Break Detector</h2>
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
          Identifies structural CVD breaks vs micro pullbacks - participation regime shifts
        </p>

        {/* Metrics Cards */}
        <div className="grid grid-cols-5 gap-3 text-sm">
          <div className="bg-gray-800 p-3 rounded">
            <p className="text-gray-400 text-xs">CVD Bias</p>
            <p className={`font-bold text-lg ${
              cvdBias === 'bullish' ? 'text-green-400' :
              cvdBias === 'bearish' ? 'text-red-400' : 'text-gray-400'
            }`}>
              {cvdBias.toUpperCase()}
            </p>
          </div>
          <div className="bg-gray-800 p-3 rounded">
            <p className="text-gray-400 text-xs">Total Breaks</p>
            <p className="text-yellow-400 font-bold text-lg">{metrics.totalBreaks || 0}</p>
          </div>
          <div className="bg-gray-800 p-3 rounded">
            <p className="text-gray-400 text-xs">Macro Breaks</p>
            <p className="text-purple-400 font-bold text-lg">{metrics.macroBreaks || 0}</p>
          </div>
          <div className="bg-gray-800 p-3 rounded">
            <p className="text-gray-400 text-xs">Micro Breaks</p>
            <p className="text-blue-400 font-bold text-lg">{metrics.microBreaks || 0}</p>
          </div>
          <div className="bg-gray-800 p-3 rounded">
            <p className="text-gray-400 text-xs">Trend Slope</p>
            <p className={`font-bold text-lg ${
              metrics.currentTrendSlope > 0 ? 'text-green-400' :
              metrics.currentTrendSlope < 0 ? 'text-red-400' : 'text-gray-400'
            }`}>
              {metrics.currentTrendSlope > 0 ? '+' : ''}{metrics.currentTrendSlope?.toFixed(1) || 0}
            </p>
          </div>
        </div>
      </div>

      {/* Divergence Alert */}
      {divergence && divergence.active && (
        <div className={`mb-4 p-3 rounded border ${
          divergence.type === 'bullish'
            ? 'bg-green-900/20 border-green-500'
            : 'bg-red-900/20 border-red-500'
        }`}>
          <div className="flex items-center justify-between">
            <div>
              <span className={`font-bold ${
                divergence.type === 'bullish' ? 'text-green-400' : 'text-red-400'
              }`}>
                {divergence.type === 'bullish' ? '🟢' : '🔴'} CVD-PRICE DIVERGENCE ACTIVE
              </span>
              <p className="text-gray-300 text-sm mt-1">{divergence.description}</p>
              <p className="text-gray-400 text-xs mt-1">{divergence.tradingTip}</p>
            </div>
            <div className="text-right">
              <p className="text-gray-400 text-xs">Strength</p>
              <p className="text-white font-bold text-xl">{Math.round(divergence.strength)}%</p>
            </div>
          </div>
        </div>
      )}

      {/* Main CVD Chart */}
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-gray-300 mb-2">CVD with Trend Lines</h3>
        <ResponsiveContainer width="100%" height={350}>
          <ComposedChart data={cvdData.slice(-60)}>
            <defs>
              <linearGradient id="cvdGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
              </linearGradient>
            </defs>

            <XAxis dataKey="time" stroke="#6b7280" tick={{ fontSize: 10 }} />
            <YAxis yAxisId="cvd" orientation="left" stroke="#8b5cf6" tick={{ fontSize: 10 }} />
            <YAxis yAxisId="price" orientation="right" stroke="#3b82f6" tick={{ fontSize: 10 }} domain={['auto', 'auto']} />
            <Tooltip content={<CustomTooltip />} />

            {/* CVD Area */}
            <Area
              yAxisId="cvd"
              type="monotone"
              dataKey="cvd"
              stroke="#8b5cf6"
              strokeWidth={2}
              fill="url(#cvdGradient)"
            />

            {/* Trend Line */}
            <Line
              yAxisId="cvd"
              type="monotone"
              dataKey="trendLineValue"
              stroke="#f59e0b"
              strokeWidth={1.5}
              strokeDasharray="5 5"
              dot={false}
            />

            {/* Price Line */}
            <Line
              yAxisId="price"
              type="monotone"
              dataKey="price"
              stroke="#3b82f6"
              strokeWidth={1.5}
              dot={false}
            />

            {/* Break markers */}
            {breaks.slice(-5).map((brk, i) => (
              <ReferenceLine
                key={`break-${i}`}
                yAxisId="cvd"
                x={brk.time}
                stroke={brk.type === 'bullish' ? '#22c55e' : '#ef4444'}
                strokeWidth={2}
                strokeDasharray="3 3"
              />
            ))}
          </ComposedChart>
        </ResponsiveContainer>

        <div className="mt-2 flex gap-4 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-purple-500 rounded"></div>
            <span className="text-gray-300">CVD</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-amber-500 rounded"></div>
            <span className="text-gray-300">Trend Line</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-500 rounded"></div>
            <span className="text-gray-300">Price</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-1 bg-green-500"></div>
            <span className="text-gray-300">Bullish Break</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-1 bg-red-500"></div>
            <span className="text-gray-300">Bearish Break</span>
          </div>
        </div>
      </div>

      {/* Breaks List and Education */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="bg-gray-800 p-3 rounded">
          <h3 className="text-sm font-semibold text-gray-300 mb-2">Recent CVD Breaks</h3>
          <div className="space-y-2 max-h-[180px] overflow-y-auto">
            {breaks.slice(-6).reverse().map((brk, i) => (
              <div key={i} className={`p-2 rounded text-xs ${
                brk.type === 'bullish' ? 'bg-green-900/30' : 'bg-red-900/30'
              }`}>
                <div className="flex justify-between items-center">
                  <span className={`font-semibold ${
                    brk.type === 'bullish' ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {brk.type === 'bullish' ? '🟢' : '🔴'} {brk.type.toUpperCase()} BREAK
                  </span>
                  <span className={`px-2 py-0.5 rounded ${
                    brk.significance === 'macro' ? 'bg-purple-600' : 'bg-gray-600'
                  }`}>
                    {brk.significance.toUpperCase()}
                  </span>
                </div>
                <p className="text-gray-400 mt-1">{brk.time}</p>
                <p className="text-gray-300 text-xs mt-1">{brk.description}</p>
                <div className="flex justify-between mt-1">
                  <span className="text-gray-400">Price: ${brk.priceAtBreak}</span>
                  <span className="text-gray-400">Magnitude: {brk.magnitude}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-gray-800 p-3 rounded">
          <h3 className="text-sm font-semibold text-gray-300 mb-2">CVD Break Analysis</h3>
          <ul className="text-xs space-y-2 text-gray-400">
            <li className="flex items-start gap-2">
              <span className="text-purple-400">📈</span>
              <span><strong>Macro Break:</strong> Sustained CVD direction change - true participation shift. Trade with it.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-400">📊</span>
              <span><strong>Micro Break:</strong> Short-term CVD deviation - often a pullback, not reversal. Wait for confirmation.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-yellow-400">⚠️</span>
              <span><strong>CVD-Price Divergence:</strong> When CVD and price move opposite - trend exhaustion signal.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-400">✅</span>
              <span><strong>Confirmation:</strong> CVD + Price breaking together = strongest signal.</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Pro Tips */}
      <div className="bg-indigo-900/20 border border-indigo-500 rounded p-3">
        <p className="text-xs text-indigo-300">
          <span className="font-semibold">Reliability Rank: #4</span> - CVD trend breaks show macro participation changes, not just local exhaustion.
          Price trends without CVD confirmation are fragile. When both CVD and price break together, reversals tend to persist.
          Use macro breaks for entries, filter out micro breaks as noise.
        </p>
      </div>
    </div>
  );
};

export default CVDTrendBreak;
