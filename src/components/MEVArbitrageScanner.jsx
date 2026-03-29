import React from 'react';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts';
import { useEnhancedStreamingData } from '../services/dataSourceContext';
import { useStreamingConfig } from '../hooks/useStreamingConfig';
import StreamingIndicator from './StreamingIndicator';
import LoadingPlaceholder from './LoadingPlaceholder';

const MEVArbitrageScanner = () => {
  // Get streaming configuration
  const { interval, isPaused } = useStreamingConfig('mevOpportunities');

  // Use enhanced streaming data
  const {
    data: mevData,
    loading,
    error,
    lastUpdate,
    latency,
    isStale,
    updateCount
  } = useEnhancedStreamingData('mevOpportunities', interval, {
    enabled: !isPaused
  });

  // Derive state from streaming data
  const mevOpportunities = mevData?.opportunities || [];
  const arbitrageData = mevData?.arbitrage || [];
  const flashLoanOps = mevData?.flashLoans || [];
  const mevMetrics = mevData?.metrics || {};
  const gasTracker = mevData?.gasData || [];
  const sandwichAttacks = mevData?.sandwichAttacks || [];

  const getProfitabilityColor = (profit) => {
    if (profit > 1000) return '#22c55e'; // High profit - green
    if (profit > 500) return '#f59e0b'; // Medium profit - amber
    if (profit > 100) return '#3b82f6'; // Low profit - blue
    return '#6b7280'; // Minimal profit - gray
  };

  const getRiskColor = (risk) => {
    switch(risk) {
      case 'Low': return 'text-green-400';
      case 'Medium': return 'text-yellow-400';
      case 'High': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-gray-800 p-3 rounded border border-gray-600">
          <p className="text-white text-sm font-semibold">{label}</p>
          {data.profit && <p className="text-green-400 text-xs">Profit: ${data.profit.toFixed(2)}</p>}
          {data.gasPrice && <p className="text-yellow-400 text-xs">Gas: {data.gasPrice} gwei</p>}
          {data.volume && <p className="text-blue-400 text-xs">Volume: ${data.volume.toLocaleString()}</p>}
          {data.description && <p className="text-gray-300 text-xs">{data.description}</p>}
        </div>
      );
    }
    return null;
  };

  // Show loading placeholder on initial load
  if (loading && !mevData) {
    return <LoadingPlaceholder height={700} title="MEV & Arbitrage Scanner" />;
  }

  return (
    <div className="bg-gray-900 rounded-lg p-4">
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xl font-bold text-white">MEV & Arbitrage Scanner</h2>
          <StreamingIndicator
            lastUpdate={lastUpdate}
            latency={latency}
            isStale={isStale}
            loading={loading}
            error={error}
            updateCount={updateCount}
          />
        </div>
        
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-4">
          <div className="bg-gray-800 p-3 rounded">
            <p className="text-gray-400 text-xs">Active Opportunities</p>
            <p className="text-lg font-bold text-green-400">{mevOpportunities.filter(op => op.status === 'active').length}</p>
            <p className="text-xs text-gray-500">Ready to execute</p>
          </div>
          
          <div className="bg-gray-800 p-3 rounded">
            <p className="text-gray-400 text-xs">Potential Profit</p>
            <p className="text-lg font-bold text-white">
              ${mevOpportunities.reduce((sum, op) => sum + op.estimatedProfit, 0).toFixed(0)}
            </p>
            <p className="text-xs text-gray-500">Next 10 minutes</p>
          </div>
          
          <div className="bg-gray-800 p-3 rounded">
            <p className="text-gray-400 text-xs">Gas Price</p>
            <p className="text-lg font-bold text-yellow-400">{mevMetrics.currentGas || 45} gwei</p>
            <p className="text-xs text-gray-500">{mevMetrics.gasChange > 0 ? '↑' : '↓'} {Math.abs(mevMetrics.gasChange || 5)}%</p>
          </div>
          
          <div className="bg-gray-800 p-3 rounded">
            <p className="text-gray-400 text-xs">Success Rate</p>
            <p className="text-lg font-bold text-blue-400">{mevMetrics.successRate || 73}%</p>
            <p className="text-xs text-gray-500">Last 24h</p>
          </div>
          
          <div className="bg-gray-800 p-3 rounded">
            <p className="text-gray-400 text-xs">Competition</p>
            <p className="text-lg font-bold text-red-400">{mevMetrics.competitionLevel || 'High'}</p>
            <p className="text-xs text-gray-500">{mevMetrics.activeBots || 247} bots active</p>
          </div>
        </div>

        {/* MEV Alerts */}
        {mevOpportunities.slice(0, 2).map((op, idx) => (
          <div key={idx} className={`mb-2 p-3 rounded border ${
            op.estimatedProfit > 1000 ? 'bg-green-900/20 border-green-500' :
            op.estimatedProfit > 500 ? 'bg-yellow-900/20 border-yellow-500' :
            'bg-blue-900/20 border-blue-500'
          }`}>
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm font-semibold text-white">
                  {op.type === 'arbitrage' ? '⚡' : op.type === 'sandwich' ? '🥪' : '💰'} 
                  {op.type.toUpperCase()} Opportunity - {op.protocol}
                </p>
                <p className="text-xs text-gray-300 mt-1">{op.description}</p>
              </div>
              <div className="text-right">
                <p className="text-green-400 font-bold">${op.estimatedProfit.toFixed(0)}</p>
                <p className={`text-xs ${getRiskColor(op.risk)}`}>Risk: {op.risk}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Arbitrage Opportunities */}
        <div>
          <h3 className="text-sm font-semibold text-gray-300 mb-3">🔄 Arbitrage Opportunities</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={arbitrageData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
              <XAxis dataKey="pair" stroke="#6b7280" tick={{ fontSize: 10 }} />
              <YAxis stroke="#6b7280" tick={{ fontSize: 10 }} />
              <Tooltip content={<CustomTooltip />} />
              
              <Bar dataKey="profit">
                {arbitrageData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={getProfitabilityColor(entry.profit)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          
          <div className="mt-2 space-y-1">
            {arbitrageData.slice(0, 4).map((arb, idx) => (
              <div key={idx} className="flex justify-between items-center text-xs bg-gray-800 p-2 rounded">
                <div>
                  <span className="text-white font-semibold">{arb.pair}</span>
                  <span className="text-gray-400 ml-2">{arb.exchange1} → {arb.exchange2}</span>
                </div>
                <div className="text-right">
                  <div className="text-green-400 font-semibold">${arb.profit.toFixed(0)}</div>
                  <div className="text-gray-500">{arb.spread.toFixed(2)}%</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Gas Price Tracking */}
        <div>
          <h3 className="text-sm font-semibold text-gray-300 mb-3">⛽ Gas Price Analysis</h3>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={gasTracker}>
              <defs>
                <linearGradient id="gasGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
              <XAxis dataKey="time" stroke="#6b7280" tick={{ fontSize: 10 }} />
              <YAxis stroke="#6b7280" tick={{ fontSize: 10 }} />
              <Tooltip content={<CustomTooltip />} />
              
              <Area 
                type="monotone" 
                dataKey="gasPrice" 
                stroke="#f59e0b" 
                strokeWidth={2}
                fill="url(#gasGradient)" 
              />
            </AreaChart>
          </ResponsiveContainer>
          
          <div className="mt-2 grid grid-cols-3 gap-2 text-xs">
            <div className="bg-gray-800 p-2 rounded text-center">
              <div className="text-green-400 font-semibold">Low</div>
              <div className="text-gray-300">{mevMetrics.gasLow || 35} gwei</div>
            </div>
            <div className="bg-gray-800 p-2 rounded text-center">
              <div className="text-yellow-400 font-semibold">Current</div>
              <div className="text-gray-300">{mevMetrics.currentGas || 45} gwei</div>
            </div>
            <div className="bg-gray-800 p-2 rounded text-center">
              <div className="text-red-400 font-semibold">High</div>
              <div className="text-gray-300">{mevMetrics.gasHigh || 120} gwei</div>
            </div>
          </div>
        </div>
      </div>

      {/* MEV Strategy Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Flash Loan Opportunities */}
        <div className="bg-gray-800 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-gray-300 mb-3">⚡ Flash Loan Strategies</h3>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {flashLoanOps.map((op, idx) => (
              <div key={idx} className="flex justify-between items-center p-2 bg-gray-700 rounded text-xs">
                <div>
                  <div className="text-white font-semibold">{op.strategy}</div>
                  <div className="text-gray-400">{op.protocol} • {op.asset}</div>
                  <div className="text-gray-500 mt-1">{op.description}</div>
                </div>
                <div className="text-right">
                  <div className="text-green-400 font-bold">${op.potential.toFixed(0)}</div>
                  <div className={`${getRiskColor(op.risk)} text-xs`}>{op.risk}</div>
                  <div className="text-gray-500 text-xs">{op.timeWindow}min</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Sandwich Attack Detection */}
        <div className="bg-gray-800 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-gray-300 mb-3">🥪 Sandwich Attack Monitor</h3>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {sandwichAttacks.map((attack, idx) => (
              <div key={idx} className="p-2 bg-gray-700 rounded text-xs">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-yellow-400 font-semibold">Target Detected</span>
                  <span className="text-green-400">${attack.profit.toFixed(0)} profit</span>
                </div>
                <div className="text-gray-300 mb-1">
                  {attack.targetTx} • ${attack.volume.toLocaleString()}
                </div>
                <div className="text-gray-500">
                  Slippage: {attack.slippage}% • Gas needed: {attack.gasNeeded} gwei
                </div>
                <div className="mt-1 flex justify-between">
                  <span className={getRiskColor(attack.risk)}>Risk: {attack.risk}</span>
                  <span className="text-blue-400">Success: {attack.successRate}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* MEV Strategy Analysis */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-blue-900/20 border border-blue-500 rounded p-4">
          <h4 className="text-base font-semibold text-blue-300 mb-3">Arbitrage Strategies</h4>
          <ul className="text-sm text-blue-200 space-y-2 leading-relaxed">
            <li>Cross-DEX price differences</li>
            <li>Stable coin de-pegging events</li>
            <li>Flash loan capital efficiency</li>
            <li>Gas optimization critical</li>
            <li>Monitor mempool for large trades</li>
          </ul>
        </div>

        <div className="bg-yellow-900/20 border border-yellow-500 rounded p-4">
          <h4 className="text-base font-semibold text-yellow-300 mb-3">Sandwich Protection</h4>
          <ul className="text-sm text-yellow-200 space-y-2 leading-relaxed">
            <li>Use private mempools when possible</li>
            <li>Set tight slippage tolerances</li>
            <li>Split large orders into smaller ones</li>
            <li>Monitor for frontrunning patterns</li>
            <li>Consider MEV-protection services</li>
          </ul>
        </div>

        <div className="bg-red-900/20 border border-red-500 rounded p-4">
          <h4 className="text-base font-semibold text-red-300 mb-3">Risk Management</h4>
          <ul className="text-sm text-red-200 space-y-2 leading-relaxed">
            <li>Gas price volatility risk</li>
            <li>Smart contract execution risk</li>
            <li>Liquidity availability risk</li>
            <li>Competition from other bots</li>
            <li>Regulatory compliance risk</li>
          </ul>
        </div>
      </div>

      {/* What This Means For Regular Traders */}
      <div className="bg-gradient-to-r from-green-900/20 to-emerald-900/20 border border-green-500/30 rounded p-5 mb-6">
        <h3 className="text-lg font-semibold text-green-300 mb-4">What This Means For You (Non-Bot Traders)</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-gray-800/50 p-4 rounded">
            <h4 className="text-base font-semibold text-white mb-2">Time Your Trades</h4>
            <p className="text-sm text-gray-300 leading-relaxed">
              High gas = high MEV activity. Wait for gas dips to save money. Trade during low-activity hours (weekends, early AM UTC).
            </p>
            <div className="mt-3 text-base text-green-400 font-semibold">
              Current: {(mevMetrics.currentGas || 45) < 40 ? 'Good Time' : (mevMetrics.currentGas || 45) > 80 ? 'Wait' : 'Moderate'}
            </div>
          </div>

          <div className="bg-gray-800/50 p-4 rounded">
            <h4 className="text-base font-semibold text-white mb-2">Protect Your Trades</h4>
            <p className="text-sm text-gray-300 leading-relaxed">
              Sandwich attack monitors show how bots target large trades. Use MEV protection (Flashbots Protect, CoW Swap) for swaps over $1,000.
            </p>
            <div className="mt-3 text-base text-yellow-400 font-semibold">
              Risk: {sandwichAttacks.length > 3 ? 'High Activity' : 'Normal'}
            </div>
          </div>

          <div className="bg-gray-800/50 p-4 rounded">
            <h4 className="text-base font-semibold text-white mb-2">Understand Slippage</h4>
            <p className="text-sm text-gray-300 leading-relaxed">
              Arbitrage opportunities reveal price inefficiencies. If you see high arb profits between DEXs, markets are volatile - use tighter slippage.
            </p>
            <div className="mt-3 text-base text-blue-400 font-semibold">
              Suggested: {arbitrageData.reduce((sum, a) => sum + a.profit, 0) > 2000 ? '0.5-1%' : '1-2%'}
            </div>
          </div>

          <div className="bg-gray-800/50 p-4 rounded">
            <h4 className="text-base font-semibold text-white mb-2">Spot Market Moves</h4>
            <p className="text-sm text-gray-300 leading-relaxed">
              Large flash loan activity often precedes price movements. When you see high flash loan volume, expect volatility in those assets.
            </p>
            <div className="mt-3 text-base text-purple-400 font-semibold">
              Flash Activity: {flashLoanOps.length > 5 ? 'Elevated' : 'Normal'}
            </div>
          </div>
        </div>

        <div className="mt-5 p-4 bg-gray-800/50 rounded">
          <h4 className="text-base font-semibold text-white mb-3">Quick Actions You Can Take</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-300">
            <div className="leading-relaxed">
              <span className="text-green-400 font-semibold">For Swaps:</span> Use Flashbots Protect RPC, set slippage based on arb activity, avoid round numbers.
            </div>
            <div className="leading-relaxed">
              <span className="text-green-400 font-semibold">For Large Trades:</span> Split into smaller orders, use limit orders, consider CoW Swap or 1inch Fusion.
            </div>
            <div className="leading-relaxed">
              <span className="text-green-400 font-semibold">For NFT Mints:</span> Watch gas tracker, use private mempools if available, time your transaction carefully.
            </div>
          </div>
        </div>
      </div>

      {/* Advanced MEV Analytics */}
      <div className="bg-gradient-to-r from-cyan-900/20 to-teal-900/20 border border-cyan-500/30 rounded p-5">
        <h3 className="text-lg font-semibold text-cyan-300 mb-4">Advanced MEV Intelligence</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="text-base font-semibold text-white mb-2">Market Microstructure Impact</h4>
            <p className="text-sm text-gray-300 leading-relaxed">
              MEV extraction represents {((mevOpportunities.reduce((sum, op) => sum + op.estimatedProfit, 0) / 1000000) * 100).toFixed(2)}%
              of daily trading volume. Current competitive landscape shows {mevMetrics.activeBots || 247} active bots
              consuming approximately {mevMetrics.blockspaceUsage || 40}% of available blockspace.
            </p>
          </div>
          <div>
            <h4 className="text-base font-semibold text-white mb-2">Institutional Considerations</h4>
            <ul className="text-sm text-gray-300 space-y-2 leading-relaxed">
              <li>Flash loan capacity: $2B+ across protocols</li>
              <li>Average MEV extraction: $1.9M per successful block</li>
              <li>Gas optimization critical for profitability</li>
              <li>Regulatory frameworks emerging globally</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MEVArbitrageScanner;