import React from 'react';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Rectangle } from 'recharts';
import { useEnhancedStreamingData } from '../services/dataSourceContext';
import { useStreamingConfig } from '../hooks/useStreamingConfig';
import StreamingIndicator from './StreamingIndicator';
import LoadingPlaceholder from './LoadingPlaceholder';

const SmartMoneyConcepts = () => {
  // Get streaming configuration
  const { interval, isPaused } = useStreamingConfig('smartMoney');

  // Use enhanced streaming data
  const {
    data: analysis,
    loading,
    error,
    lastUpdate,
    latency,
    isStale,
    updateCount
  } = useEnhancedStreamingData('smartMoney', interval, {
    enabled: !isPaused
  });

  // Derive state from streaming data
  const smcData = analysis?.priceData || [];
  const orderBlocks = analysis?.orderBlocks || [];
  const fairValueGaps = analysis?.fairValueGaps || [];
  const liquidityGrabs = analysis?.liquidityGrabs || [];
  const structureShifts = analysis?.structureShifts || [];
  const currentBias = analysis?.bias || '';
  const inducements = analysis?.inducements || [];

  const getBiasColor = () => {
    switch(currentBias) {
      case 'Bullish': return 'text-green-400';
      case 'Bearish': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  const getBiasIcon = () => {
    switch(currentBias) {
      case 'Bullish': return '🐂';
      case 'Bearish': return '🐻';
      default: return '⚖️';
    }
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-gray-800 p-3 rounded border border-gray-600">
          <p className="text-white text-sm font-semibold">{label}</p>
          <p className="text-gray-300 text-xs">Price: ${data.high?.toFixed(2)} / ${data.low?.toFixed(2)}</p>
          {data.orderBlock && (
            <p className="text-blue-400 text-xs">📦 Order Block: {data.orderBlock.type}</p>
          )}
          {data.fvg && (
            <p className="text-purple-400 text-xs">📊 FVG: {data.fvg.type}</p>
          )}
          {data.liquidityGrab && (
            <p className="text-yellow-400 text-xs">💧 Liquidity Grab Detected</p>
          )}
          {data.structureShift && (
            <p className="text-orange-400 text-xs">🔄 Structure Shift: {data.structureShift}</p>
          )}
        </div>
      );
    }
    return null;
  };

  const OrderBlockComponent = ({ block, index }) => {
    return (
      <div key={index} className={`absolute opacity-30 border-2 ${
        block.type === 'Bullish' ? 'bg-green-500 border-green-400' : 'bg-red-500 border-red-400'
      }`} 
      style={{
        left: `${block.x}%`,
        top: `${block.y}%`, 
        width: `${block.width}%`,
        height: `${block.height}%`
      }}>
        <div className="text-xs p-1 text-white font-semibold">
          {block.type === 'Bullish' ? '📦🟢' : '📦🔴'} OB
        </div>
      </div>
    );
  };

  // Show loading placeholder on initial load
  if (loading && !analysis) {
    return <LoadingPlaceholder height={700} title="Smart Money Concepts (SMC) Analysis" />;
  }

  return (
    <div className="bg-gray-900 rounded-lg p-4">
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xl font-bold text-white">Smart Money Concepts (SMC) Analysis</h2>
          <StreamingIndicator
            lastUpdate={lastUpdate}
            latency={latency}
            isStale={isStale}
            loading={loading}
            error={error}
            updateCount={updateCount}
          />
        </div>
        
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          <div className="bg-gray-800 p-3 rounded">
            <p className="text-gray-400 text-xs">Market Structure Bias</p>
            <p className={`text-lg font-bold flex items-center gap-1 ${getBiasColor()}`}>
              {getBiasIcon()} {currentBias}
            </p>
            <p className="text-xs text-gray-500">
              {currentBias === 'Bullish' ? 'Targeting liquidity above' : 
               currentBias === 'Bearish' ? 'Targeting liquidity below' : 'Neutral range'}
            </p>
          </div>
          
          <div className="bg-gray-800 p-3 rounded">
            <p className="text-gray-400 text-xs">Active Order Blocks</p>
            <p className="text-lg font-bold text-white">{orderBlocks.filter(ob => ob.active).length}</p>
            <p className="text-xs text-gray-500">
              {orderBlocks.filter(ob => ob.type === 'Bullish').length} Bull / {orderBlocks.filter(ob => ob.type === 'Bearish').length} Bear
            </p>
          </div>
          
          <div className="bg-gray-800 p-3 rounded">
            <p className="text-gray-400 text-xs">Fair Value Gaps</p>
            <p className="text-lg font-bold text-white">{fairValueGaps.filter(fvg => !fvg.filled).length}</p>
            <p className="text-xs text-gray-500">
              {fairValueGaps.filter(fvg => !fvg.filled && fvg.type === 'Bullish').length} Up / {fairValueGaps.filter(fvg => !fvg.filled && fvg.type === 'Bearish').length} Down
            </p>
          </div>
          
          <div className="bg-gray-800 p-3 rounded">
            <p className="text-gray-400 text-xs">Recent Liquidity Grabs</p>
            <p className="text-lg font-bold text-white">{liquidityGrabs.filter(lg => lg.recent).length}</p>
            <p className="text-xs text-gray-500">Last 24h</p>
          </div>
        </div>

        {/* SMC Alerts */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          {structureShifts.slice(-2).map((shift, idx) => (
            <div key={idx} className={`p-3 rounded border ${
              shift.type === 'Break of Structure' ? 'bg-orange-900/20 border-orange-500' : 'bg-purple-900/20 border-purple-500'
            }`}>
              <p className="text-sm font-semibold text-white flex items-center gap-2">
                🔄 {shift.type} - {shift.direction}
              </p>
              <p className="text-xs text-gray-300 mt-1">{shift.description}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main SMC Chart */}
        <div className="lg:col-span-2">
          <h3 className="text-sm font-semibold text-gray-300 mb-2">Price Action with SMC Levels</h3>
          <div className="relative">
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={smcData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
                <XAxis dataKey="time" stroke="#6b7280" tick={{ fontSize: 10 }} />
                <YAxis stroke="#6b7280" tick={{ fontSize: 10 }} />
                <Tooltip content={<CustomTooltip />} />
                
                {/* Fair Value Gaps */}
                {fairValueGaps.filter(fvg => !fvg.filled).map((fvg, idx) => (
                  <ReferenceLine 
                    key={`fvg-${idx}`}
                    y={fvg.price}
                    stroke={fvg.type === 'Bullish' ? '#22c55e' : '#ef4444'}
                    strokeDasharray="8 4"
                    strokeWidth={2}
                    label={{
                      value: `FVG ${fvg.type}`,
                      fill: fvg.type === 'Bullish' ? '#22c55e' : '#ef4444',
                      fontSize: 10
                    }}
                  />
                ))}
                
                {/* Order Block Levels */}
                {orderBlocks.filter(ob => ob.active).map((ob, idx) => (
                  <ReferenceLine 
                    key={`ob-${idx}`}
                    y={ob.price}
                    stroke={ob.type === 'Bullish' ? '#3b82f6' : '#f59e0b'}
                    strokeDasharray="3 3"
                    strokeWidth={1.5}
                    label={{
                      value: `OB`,
                      fill: ob.type === 'Bullish' ? '#3b82f6' : '#f59e0b',
                      fontSize: 8
                    }}
                  />
                ))}

                <Line 
                  type="monotone" 
                  dataKey="high" 
                  stroke="#8b5cf6" 
                  strokeWidth={1}
                  dot={false}
                />
                <Line 
                  type="monotone" 
                  dataKey="low" 
                  stroke="#8b5cf6" 
                  strokeWidth={1}
                  dot={false}
                />
                <Line 
                  type="monotone" 
                  dataKey="close" 
                  stroke="#f59e0b" 
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Recent SMC Events */}
          <div className="mt-4">
            <h4 className="text-xs font-semibold text-gray-400 mb-2">Recent SMC Events</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {liquidityGrabs.slice(-4).map((grab, idx) => (
                <div key={idx} className="bg-gray-800 p-2 rounded text-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-yellow-400 font-semibold">💧 {grab.type} Grab</span>
                    <span className="text-gray-500">{grab.time}</span>
                  </div>
                  <p className="text-gray-300 mt-1">${grab.price} - {grab.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* SMC Analysis Panel */}
        <div className="space-y-4">
          {/* Order Blocks */}
          <div className="bg-gray-800 p-3 rounded">
            <h3 className="text-sm font-semibold text-gray-300 mb-2">📦 Order Blocks</h3>
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {orderBlocks.filter(ob => ob.active).slice(0, 5).map((ob, idx) => (
                <div key={idx} className="flex justify-between items-center text-xs">
                  <div className="flex items-center gap-2">
                    <span className={ob.type === 'Bullish' ? 'text-green-400' : 'text-red-400'}>
                      {ob.type === 'Bullish' ? '🟢' : '🔴'}
                    </span>
                    <span className="text-gray-300">${ob.price.toFixed(2)}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-gray-500">{ob.strength}%</span>
                    <div className={`text-xs ${ob.tested ? 'text-yellow-400' : 'text-gray-400'}`}>
                      {ob.tested ? 'Tested' : 'Untested'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Fair Value Gaps */}
          <div className="bg-gray-800 p-3 rounded">
            <h3 className="text-sm font-semibold text-gray-300 mb-2">📊 Fair Value Gaps</h3>
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {fairValueGaps.filter(fvg => !fvg.filled).slice(0, 5).map((fvg, idx) => (
                <div key={idx} className="flex justify-between items-center text-xs">
                  <div className="flex items-center gap-2">
                    <span className={fvg.type === 'Bullish' ? 'text-green-400' : 'text-red-400'}>
                      {fvg.type === 'Bullish' ? '📈' : '📉'}
                    </span>
                    <span className="text-gray-300">${fvg.price.toFixed(2)}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-purple-400">{fvg.size.toFixed(1)}%</span>
                    <div className="text-xs text-gray-400">{fvg.timeframe}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Inducements */}
          <div className="bg-gray-800 p-3 rounded">
            <h3 className="text-sm font-semibold text-gray-300 mb-2">🎣 Inducements</h3>
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {inducements.slice(0, 4).map((inducement, idx) => (
                <div key={idx} className="text-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-cyan-400">{inducement.type}</span>
                    <span className="text-gray-400">${inducement.level.toFixed(2)}</span>
                  </div>
                  <p className="text-gray-500 mt-1">{inducement.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Market Structure Status */}
          <div className="bg-gray-800 p-3 rounded">
            <h3 className="text-sm font-semibold text-gray-300 mb-2">🏗️ Structure Status</h3>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-400">Higher Highs:</span>
                <span className="text-green-400">✓ Intact</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Higher Lows:</span>
                <span className="text-green-400">✓ Intact</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Last BOS:</span>
                <span className="text-orange-400">2 hours ago</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Next Target:</span>
                <span className="text-white">${(smcData.length > 0 ? Math.max(...smcData.map(d => d.high)) * 1.02 : 2900).toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* SMC Strategy Grid */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-green-900/20 border border-green-500 rounded p-4">
          <h4 className="text-base font-semibold text-green-300 mb-3">Bullish Bias Strategy</h4>
          <ul className="text-sm text-green-200 space-y-2 leading-relaxed">
            <li>• Buy Order Block retests</li>
            <li>• Target liquidity above previous highs</li>
            <li>• Use FVG as entry zones</li>
            <li>• Stop below structure lows</li>
            <li>• Look for inducement then reversal</li>
          </ul>
        </div>

        <div className="bg-red-900/20 border border-red-500 rounded p-4">
          <h4 className="text-base font-semibold text-red-300 mb-3">Bearish Bias Strategy</h4>
          <ul className="text-sm text-red-200 space-y-2 leading-relaxed">
            <li>• Sell Order Block retests</li>
            <li>• Target liquidity below previous lows</li>
            <li>• Use FVG as entry zones</li>
            <li>• Stop above structure highs</li>
            <li>• Look for inducement then reversal</li>
          </ul>
        </div>

        <div className="bg-purple-900/20 border border-purple-500 rounded p-4">
          <h4 className="text-base font-semibold text-purple-300 mb-3">SMC Rules</h4>
          <ul className="text-sm text-purple-200 space-y-2 leading-relaxed">
            <li>• Always trade with market structure</li>
            <li>• Wait for liquidity grab confirmation</li>
            <li>• Order blocks are decision points</li>
            <li>• FVGs often get filled</li>
            <li>• Structure shifts change bias</li>
          </ul>
        </div>
      </div>

      {/* Advanced SMC Concepts */}
      <div className="mt-6 bg-gradient-to-r from-cyan-900/20 to-blue-900/20 border border-cyan-500/30 rounded p-5">
        <h3 className="text-lg font-semibold text-cyan-300 mb-4">Advanced SMC Concepts</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="text-base font-semibold text-white mb-3">Market Maker Model</h4>
            <p className="text-sm text-gray-300 mb-2 leading-relaxed">
              Smart Money creates liquidity imbalances, induces retail traders, then moves price to their intended target.
              Current market showing {currentBias.toLowerCase()} bias with {orderBlocks.filter(ob => ob.active).length} active order blocks.
            </p>
          </div>
          <div>
            <h4 className="text-base font-semibold text-white mb-3">ICT Concepts Integration</h4>
            <ul className="text-sm text-gray-300 space-y-2 leading-relaxed">
              <li>• Optimal Trade Entry (OTE) at 61.8% - 78.6%</li>
              <li>• Institutional Order Flow patterns</li>
              <li>• New York session manipulation</li>
              <li>• Algorithmic price delivery</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SmartMoneyConcepts;