import React from 'react';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { useEnhancedStreamingData } from '../services/dataSourceContext';
import { useStreamingConfig } from '../hooks/useStreamingConfig';
import StreamingIndicator from './StreamingIndicator';
import LoadingPlaceholder from './LoadingPlaceholder';

const MarketStructure = () => {
  // Get streaming configuration
  const { interval, isPaused } = useStreamingConfig('marketStructure');

  // Use enhanced streaming data
  const {
    data: analysis,
    loading,
    error,
    lastUpdate,
    latency,
    isStale,
    updateCount
  } = useEnhancedStreamingData('marketStructure', interval, {
    enabled: !isPaused
  });

  // Derive state from streaming data
  const structureData = analysis?.data || [];
  const keyLevels = analysis?.keyLevels || [];
  const marketPhase = analysis?.phase || '';

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-gray-800 p-3 rounded border border-gray-600">
          <p className="text-white text-sm">Price: ${payload[0].value?.toFixed(2)}</p>
          <p className="text-gray-300 text-xs">Support: ${payload[0].payload.support?.toFixed(2)}</p>
          <p className="text-gray-300 text-xs">Resistance: ${payload[0].payload.resistance?.toFixed(2)}</p>
          <p className="text-yellow-400 text-xs mt-1">{payload[0].payload.tip}</p>
        </div>
      );
    }
    return null;
  };

  const getPhaseColor = () => {
    switch(marketPhase) {
      case 'Accumulation': return 'text-blue-400';
      case 'Markup': return 'text-green-400';
      case 'Distribution': return 'text-yellow-400';
      case 'Markdown': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  // Show loading placeholder on initial load
  if (loading && !analysis) {
    return <LoadingPlaceholder height={500} title="Market Structure Analysis" />;
  }

  return (
    <div className="bg-gray-900 rounded-lg p-4">
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xl font-bold text-white">Market Structure Analysis</h2>
          <StreamingIndicator
            lastUpdate={lastUpdate}
            latency={latency}
            isStale={isStale}
            loading={loading}
            error={error}
            updateCount={updateCount}
          />
        </div>
        <div className="flex items-center gap-4">
          <span className={`font-semibold ${getPhaseColor()}`}>
            Phase: {marketPhase}
          </span>
          <span className="text-sm text-gray-400">
            {marketPhase === 'Accumulation' && '📊 Smart money accumulating - Look for breakout setups'}
            {marketPhase === 'Markup' && '🚀 Trending up - Buy dips to support'}
            {marketPhase === 'Distribution' && '⚠️ Top forming - Consider taking profits'}
            {marketPhase === 'Markdown' && '📉 Downtrend - Wait for accumulation'}
          </span>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={350}>
        <AreaChart data={structureData}>
          <defs>
            <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
          <XAxis 
            dataKey="time" 
            stroke="#6b7280"
            tick={{ fontSize: 12 }}
          />
          <YAxis 
            stroke="#6b7280"
            tick={{ fontSize: 12 }}
            domain={['dataMin - 50', 'dataMax + 50']}
          />
          <Tooltip content={<CustomTooltip />} />
          
          {keyLevels.map((level, idx) => (
            <ReferenceLine 
              key={idx}
              y={level.price} 
              stroke={level.type === 'resistance' ? '#ef4444' : '#22c55e'}
              strokeDasharray="5 5"
              strokeWidth={1.5}
              label={{
                value: `${level.type === 'resistance' ? 'R' : 'S'}: $${level.price}`,
                fill: level.type === 'resistance' ? '#ef4444' : '#22c55e',
                fontSize: 10,
                position: 'right'
              }}
            />
          ))}
          
          <Area 
            type="monotone" 
            dataKey="price" 
            stroke="#8b5cf6" 
            strokeWidth={2}
            fill="url(#colorPrice)" 
          />
          <Line 
            type="monotone" 
            dataKey="ema20" 
            stroke="#f59e0b" 
            strokeWidth={1}
            dot={false}
            strokeDasharray="3 3"
          />
          <Line 
            type="monotone" 
            dataKey="ema50" 
            stroke="#3b82f6" 
            strokeWidth={1}
            dot={false}
          />
        </AreaChart>
      </ResponsiveContainer>

      <div className="mt-4 grid grid-cols-2 gap-4">
        <div className="bg-gray-800 p-3 rounded">
          <h3 className="text-sm font-semibold text-gray-300 mb-2">Key Levels</h3>
          {keyLevels.map((level, idx) => (
            <div key={idx} className="flex justify-between text-xs mb-1">
              <span className={level.type === 'resistance' ? 'text-red-400' : 'text-green-400'}>
                {level.type === 'resistance' ? '🔴' : '🟢'} {level.label}
              </span>
              <span className="text-gray-400">${level.price}</span>
            </div>
          ))}
        </div>
        
        <div className="bg-gray-800 p-3 rounded">
          <h3 className="text-sm font-semibold text-gray-300 mb-2">Structure Tips</h3>
          <ul className="text-xs text-gray-400 space-y-1">
            <li>• Higher highs + higher lows = Uptrend intact</li>
            <li>• Break of structure = Potential reversal</li>
            <li>• Test of key level = Decision point</li>
            <li>• Volume confirms breakouts</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default MarketStructure;