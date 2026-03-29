import React from 'react';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell, ScatterChart, Scatter } from 'recharts';
import { useEnhancedStreamingData } from '../services/dataSourceContext';
import { useStreamingConfig } from '../hooks/useStreamingConfig';
import StreamingIndicator from './StreamingIndicator';
import LoadingPlaceholder from './LoadingPlaceholder';

const InstitutionalFootprint = () => {
  // Get streaming configuration
  const { interval, isPaused } = useStreamingConfig('institutional');

  // Use enhanced streaming data
  const {
    data: analysis,
    loading,
    error,
    lastUpdate,
    latency,
    isStale,
    updateCount
  } = useEnhancedStreamingData('institutional', interval, {
    enabled: !isPaused
  });

  // Derive state from streaming data
  const footprintData = analysis?.footprint || [];
  const whaleTransactions = analysis?.whaleTransactions || [];
  const smartMoneyFlow = analysis?.smartMoneyFlow || [];
  const institutionalMetrics = analysis?.metrics || {};
  const darkPoolActivity = analysis?.darkPool || [];
  const algorithmicPatterns = analysis?.algorithmic || [];

  const getActivityColor = (activity) => {
    switch(activity) {
      case 'High': return '#ef4444'; // Red
      case 'Medium': return '#f59e0b'; // Amber
      case 'Low': return '#22c55e'; // Green
      default: return '#6b7280'; // Gray
    }
  };

  const getFlowDirection = (flow) => {
    if (flow > 0.5) return { color: '#22c55e', direction: 'Inflow', icon: '📈' };
    if (flow < -0.5) return { color: '#ef4444', direction: 'Outflow', icon: '📉' };
    return { color: '#6b7280', direction: 'Neutral', icon: '➡️' };
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-gray-800 p-3 rounded border border-gray-600">
          <p className="text-white text-sm font-semibold">{label}</p>
          {data.volume && <p className="text-blue-400 text-xs">Volume: ${data.volume.toLocaleString()}</p>}
          {data.transactions && <p className="text-green-400 text-xs">Transactions: {data.transactions}</p>}
          {data.activity && <p className="text-yellow-400 text-xs">Activity: {data.activity}</p>}
          {data.description && <p className="text-gray-300 text-xs">{data.description}</p>}
        </div>
      );
    }
    return null;
  };

  // Show loading placeholder on initial load
  if (loading && !analysis) {
    return <LoadingPlaceholder height={700} title="Institutional Footprint Analysis" />;
  }

  return (
    <div className="bg-gray-900 rounded-lg p-4">
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xl font-bold text-white">Institutional Footprint Analysis</h2>
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
            <p className="text-gray-400 text-xs">Smart Money Activity</p>
            <p className={`text-lg font-bold ${getActivityColor(institutionalMetrics.smartMoneyActivity)}`}>
              {institutionalMetrics.smartMoneyActivity || 'Medium'}
            </p>
            <p className="text-xs text-gray-500">{institutionalMetrics.activityChange || '+15'}% vs yesterday</p>
          </div>
          
          <div className="bg-gray-800 p-3 rounded">
            <p className="text-gray-400 text-xs">Whale Transactions</p>
            <p className="text-lg font-bold text-white">{institutionalMetrics.whaleCount || 23}</p>
            <p className="text-xs text-gray-500">Last 24h</p>
          </div>
          
          <div className="bg-gray-800 p-3 rounded">
            <p className="text-gray-400 text-xs">Net Flow Direction</p>
            <p className={`text-lg font-bold flex items-center gap-1`} style={{ 
              color: getFlowDirection(institutionalMetrics.netFlow || 0.3).color 
            }}>
              {getFlowDirection(institutionalMetrics.netFlow || 0.3).icon} 
              {getFlowDirection(institutionalMetrics.netFlow || 0.3).direction}
            </p>
            <p className="text-xs text-gray-500">
              ${Math.abs((institutionalMetrics.netFlow || 0.3) * 100).toFixed(0)}M net
            </p>
          </div>
          
          <div className="bg-gray-800 p-3 rounded">
            <p className="text-gray-400 text-xs">Institutional Score</p>
            <p className="text-lg font-bold text-purple-400">{institutionalMetrics.institutionalScore || 78}/100</p>
            <p className="text-xs text-gray-500">Confidence level</p>
          </div>
        </div>

        {/* Institutional Alerts */}
        {algorithmicPatterns.slice(0, 2).map((pattern, idx) => (
          <div key={idx} className={`mb-2 p-3 rounded border ${
            pattern.significance === 'High' ? 'bg-red-900/20 border-red-500' :
            pattern.significance === 'Medium' ? 'bg-yellow-900/20 border-yellow-500' :
            'bg-blue-900/20 border-blue-500'
          }`}>
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm font-semibold text-white">
                  🤖 {pattern.type} Pattern Detected
                </p>
                <p className="text-xs text-gray-300 mt-1">{pattern.description}</p>
              </div>
              <div className="text-right">
                <p className="text-purple-400 font-bold">{pattern.confidence}% confidence</p>
                <p className="text-xs text-gray-400">{pattern.timeframe}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Smart Money Flow */}
        <div>
          <h3 className="text-sm font-semibold text-gray-300 mb-3">💰 Smart Money Flow</h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={smartMoneyFlow}>
              <defs>
                <linearGradient id="inflowGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="outflowGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
              <XAxis dataKey="time" stroke="#6b7280" tick={{ fontSize: 10 }} />
              <YAxis stroke="#6b7280" tick={{ fontSize: 10 }} />
              <Tooltip content={<CustomTooltip />} />
              
              <Area 
                type="monotone" 
                dataKey="inflow" 
                stackId="1"
                stroke="#22c55e" 
                strokeWidth={2}
                fill="url(#inflowGradient)" 
              />
              <Area 
                type="monotone" 
                dataKey="outflow" 
                stackId="2"
                stroke="#ef4444" 
                strokeWidth={2}
                fill="url(#outflowGradient)" 
              />
            </AreaChart>
          </ResponsiveContainer>
          
          <div className="mt-2 grid grid-cols-2 gap-4 text-xs">
            <div className="bg-gray-800 p-2 rounded">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-green-400 font-semibold">Smart Money Inflow</span>
              </div>
              <p className="text-white text-sm">
                ${(smartMoneyFlow.reduce((sum, d) => sum + d.inflow, 0)).toLocaleString()}
              </p>
            </div>
            <div className="bg-gray-800 p-2 rounded">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <span className="text-red-400 font-semibold">Smart Money Outflow</span>
              </div>
              <p className="text-white text-sm">
                ${(smartMoneyFlow.reduce((sum, d) => sum + d.outflow, 0)).toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        {/* Institutional Footprint Heatmap */}
        <div>
          <h3 className="text-sm font-semibold text-gray-300 mb-3">👥 Institutional Activity Heatmap</h3>
          <ResponsiveContainer width="100%" height={300}>
            <ScatterChart data={footprintData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
              <XAxis 
                dataKey="time" 
                stroke="#6b7280" 
                tick={{ fontSize: 10 }}
                tickFormatter={(time) => time.split(':')[0] + ':' + time.split(':')[1]}
              />
              <YAxis 
                dataKey="price" 
                stroke="#6b7280" 
                tick={{ fontSize: 10 }}
                domain={['dataMin - 50', 'dataMax + 50']}
              />
              <Tooltip content={<CustomTooltip />} />
              
              <Scatter dataKey="price">
                {footprintData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={entry.volume > 1000000 ? '#dc2626' : 
                          entry.volume > 500000 ? '#f59e0b' : 
                          entry.volume > 100000 ? '#3b82f6' : '#6b7280'}
                    r={Math.min(12, 3 + (entry.volume / 100000))}
                  />
                ))}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
          
          <div className="mt-2 grid grid-cols-4 gap-1 text-xs">
            <div className="text-center">
              <div className="w-3 h-3 bg-gray-600 rounded-full mx-auto mb-1"></div>
              <span className="text-gray-400">Retail</span>
            </div>
            <div className="text-center">
              <div className="w-4 h-4 bg-blue-500 rounded-full mx-auto mb-1"></div>
              <span className="text-gray-400">Small Inst</span>
            </div>
            <div className="text-center">
              <div className="w-5 h-5 bg-yellow-500 rounded-full mx-auto mb-1"></div>
              <span className="text-gray-400">Large Inst</span>
            </div>
            <div className="text-center">
              <div className="w-6 h-6 bg-red-500 rounded-full mx-auto mb-1"></div>
              <span className="text-gray-400">Whale</span>
            </div>
          </div>
        </div>
      </div>

      {/* Whale Transaction Analysis */}
      <div className="mb-6">
        <h3 className="text-sm font-semibold text-gray-300 mb-3">🐋 Whale Transaction Analysis</h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-gray-800 rounded-lg p-3 max-h-80 overflow-y-auto">
            <h4 className="text-xs font-semibold text-gray-400 mb-2">Recent Whale Transactions</h4>
            <div className="space-y-2">
              {whaleTransactions.map((tx, idx) => (
                <div key={idx} className="flex justify-between items-center p-2 bg-gray-700 rounded text-xs">
                  <div>
                    <div className="text-white font-semibold">{tx.type}</div>
                    <div className="text-gray-400">{tx.asset} • {tx.protocol}</div>
                    <div className="text-gray-500 mt-1">{tx.time}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-yellow-400 font-bold">${tx.value.toLocaleString()}</div>
                    <div className={`text-xs ${tx.direction === 'Buy' ? 'text-green-400' : 'text-red-400'}`}>
                      {tx.direction === 'Buy' ? '🟢' : '🔴'} {tx.direction}
                    </div>
                    <div className="text-purple-400 text-xs">{tx.impact}% impact</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-gray-800 rounded-lg p-3">
            <h4 className="text-xs font-semibold text-gray-400 mb-2">Dark Pool Activity</h4>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={darkPoolActivity}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
                <XAxis dataKey="exchange" stroke="#6b7280" tick={{ fontSize: 10 }} />
                <YAxis stroke="#6b7280" tick={{ fontSize: 10 }} />
                <Tooltip content={<CustomTooltip />} />
                
                <Bar dataKey="volume">
                  {darkPoolActivity.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.activity === 'High' ? '#dc2626' : 
                            entry.activity === 'Medium' ? '#f59e0b' : '#22c55e'} 
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Algorithmic Pattern Analysis */}
      <div className="mb-6">
        <h3 className="text-sm font-semibold text-gray-300 mb-3">🤖 Algorithmic Trading Patterns</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {algorithmicPatterns.map((pattern, idx) => (
            <div key={idx} className="bg-gray-800 p-3 rounded">
              <div className="flex justify-between items-center mb-2">
                <h4 className="text-sm font-semibold text-white">{pattern.type}</h4>
                <span className={`text-xs px-2 py-1 rounded ${
                  pattern.significance === 'High' ? 'bg-red-900/30 text-red-400' :
                  pattern.significance === 'Medium' ? 'bg-yellow-900/30 text-yellow-400' :
                  'bg-blue-900/30 text-blue-400'
                }`}>
                  {pattern.significance}
                </span>
              </div>
              <p className="text-xs text-gray-300 mb-2">{pattern.description}</p>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-gray-400">Frequency:</span>
                  <div className="text-white">{pattern.frequency}</div>
                </div>
                <div>
                  <span className="text-gray-400">Confidence:</span>
                  <div className="text-purple-400">{pattern.confidence}%</div>
                </div>
                <div>
                  <span className="text-gray-400">Timeframe:</span>
                  <div className="text-white">{pattern.timeframe}</div>
                </div>
                <div>
                  <span className="text-gray-400">Impact:</span>
                  <div className="text-yellow-400">{pattern.impact}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Institutional Trading Strategies */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-green-900/20 border border-green-500 rounded p-3">
          <h4 className="text-sm font-semibold text-green-300 mb-2">💎 Following Smart Money</h4>
          <ul className="text-xs text-green-200 space-y-1">
            <li>• Monitor large wallet accumulation patterns</li>
            <li>• Track institutional DeFi protocol usage</li>
            <li>• Follow yield farming migrations</li>
            <li>• Watch for cross-protocol arbitrage</li>
            <li>• Copy successful institutional strategies</li>
          </ul>
        </div>
        
        <div className="bg-purple-900/20 border border-purple-500 rounded p-3">
          <h4 className="text-sm font-semibold text-purple-300 mb-2">🔍 Pattern Recognition</h4>
          <ul className="text-xs text-purple-200 space-y-1">
            <li>• TWAP execution identification</li>
            <li>• Iceberg order detection</li>
            <li>• Dark pool flow analysis</li>
            <li>• Algorithmic trading footprints</li>
            <li>• Market maker behavior patterns</li>
          </ul>
        </div>
        
        <div className="bg-orange-900/20 border border-orange-500 rounded p-3">
          <h4 className="text-sm font-semibold text-orange-300 mb-2">⚠️ Risk Considerations</h4>
          <ul className="text-xs text-orange-200 space-y-1">
            <li>• False signals from spoofing</li>
            <li>• Regulatory compliance requirements</li>
            <li>• Liquidity provider manipulation</li>
            <li>• Flash loan attack vectors</li>
            <li>• Market impact of following</li>
          </ul>
        </div>
      </div>

      {/* Advanced Institutional Analysis */}
      <div className="bg-gradient-to-r from-indigo-900/20 to-purple-900/20 border border-indigo-500/30 rounded p-4">
        <h3 className="text-sm font-semibold text-indigo-300 mb-3">🏛️ Advanced Institutional Intelligence</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div>
            <h4 className="font-semibold text-white mb-2">Market Structure Impact</h4>
            <p className="text-gray-300 mb-2">
              Current institutional activity represents {institutionalMetrics.institutionalScore || 78}% of total market volume. 
              Smart money flows showing {getFlowDirection(institutionalMetrics.netFlow || 0.3).direction.toLowerCase()} 
              bias with ${Math.abs((institutionalMetrics.netFlow || 0.3) * 100).toFixed(0)}M net positioning.
            </p>
            <p className="text-indigo-200">
              Algorithmic patterns detected: {algorithmicPatterns.filter(p => p.significance === 'High').length} high-confidence signals.
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-white mb-2">DeFi Institutional Trends</h4>
            <ul className="text-gray-300 space-y-1">
              <li>• Institutional TVL growth: +{institutionalMetrics.tvlGrowth || 23}% YoY</li>
              <li>• Average whale transaction: ${institutionalMetrics.avgWhaleSize || 2.3}M</li>
              <li>• Dark pool volume: {institutionalMetrics.darkPoolShare || 15}% of total</li>
              <li>• Algorithmic trading: {institutionalMetrics.algoShare || 67}% of volume</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InstitutionalFootprint;