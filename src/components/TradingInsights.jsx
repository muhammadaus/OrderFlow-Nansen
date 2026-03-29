import React from 'react';
import { useEnhancedStreamingData } from '../services/dataSourceContext';
import { useStreamingConfig } from '../hooks/useStreamingConfig';
import StreamingIndicator from './StreamingIndicator';
import LoadingPlaceholder from './LoadingPlaceholder';

const TradingInsights = () => {
  // Get streaming configuration
  const { interval, isPaused } = useStreamingConfig('insights');

  // Use enhanced streaming data
  const {
    data: analysis,
    loading,
    error,
    lastUpdate,
    latency,
    isStale,
    updateCount
  } = useEnhancedStreamingData('insights', interval, {
    enabled: !isPaused
  });

  // Derive state from streaming data
  const insights = analysis?.insights || [];
  const marketRegime = analysis?.marketRegime || {};
  const alertLevel = analysis?.alertLevel || 'low';
  const activeStrategies = analysis?.strategies || [];
  const riskMetrics = analysis?.risk || {};

  const getAlertColor = () => {
    switch(alertLevel) {
      case 'high': return 'text-red-400 bg-red-900/20 border-red-500';
      case 'medium': return 'text-yellow-400 bg-yellow-900/20 border-yellow-500';
      case 'low': return 'text-green-400 bg-green-900/20 border-green-500';
      default: return 'text-gray-400 bg-gray-900/20 border-gray-500';
    }
  };

  const getRegimeIcon = () => {
    switch(marketRegime.type) {
      case 'trending': return '📈';
      case 'ranging': return '↔️';
      case 'volatile': return '⚡';
      case 'quiet': return '😴';
      default: return '❓';
    }
  };

  const InsightCard = ({ insight, index }) => {
    const priorityColor = {
      'critical': 'border-red-500 bg-red-900/10',
      'high': 'border-yellow-500 bg-yellow-900/10',
      'medium': 'border-blue-500 bg-blue-900/10',
      'low': 'border-gray-500 bg-gray-900/10'
    }[insight.priority] || 'border-gray-500 bg-gray-900/10';

    return (
      <div className={`p-3 rounded border ${priorityColor}`}>
        <div className="flex justify-between items-start mb-2">
          <h4 className="text-sm font-semibold text-white">{insight.title}</h4>
          <span className="text-xs text-gray-400">{insight.timeframe}</span>
        </div>
        <p className="text-xs text-gray-300 mb-2">{insight.description}</p>
        <div className="flex justify-between items-center">
          <span className={`text-xs px-2 py-1 rounded ${
            insight.signal === 'bullish' ? 'bg-green-900/30 text-green-400' :
            insight.signal === 'bearish' ? 'bg-red-900/30 text-red-400' :
            'bg-gray-900/30 text-gray-400'
          }`}>
            {insight.signal?.toUpperCase() || 'NEUTRAL'}
          </span>
          <span className="text-xs text-gray-500">
            Confidence: {insight.confidence}%
          </span>
        </div>
        {insight.actionItems && (
          <div className="mt-2 pt-2 border-t border-gray-700">
            <p className="text-xs font-semibold text-purple-400 mb-1">Action Items:</p>
            <ul className="text-xs text-gray-300 space-y-1">
              {insight.actionItems.map((item, idx) => (
                <li key={idx}>• {item}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  };

  const StrategyCard = ({ strategy, index }) => {
    return (
      <div className="bg-gray-800 p-3 rounded border border-gray-700">
        <div className="flex justify-between items-center mb-2">
          <h4 className="text-sm font-semibold text-white">{strategy.name}</h4>
          <span className={`text-xs px-2 py-1 rounded ${
            strategy.status === 'active' ? 'bg-green-900/30 text-green-400' :
            strategy.status === 'setup' ? 'bg-yellow-900/30 text-yellow-400' :
            'bg-gray-900/30 text-gray-400'
          }`}>
            {strategy.status.toUpperCase()}
          </span>
        </div>
        <p className="text-xs text-gray-300 mb-2">{strategy.description}</p>
        
        {strategy.entry && (
          <div className="grid grid-cols-3 gap-2 text-xs mb-2">
            <div>
              <span className="text-gray-400">Entry:</span>
              <p className="text-green-400">${strategy.entry}</p>
            </div>
            <div>
              <span className="text-gray-400">Target:</span>
              <p className="text-blue-400">${strategy.target}</p>
            </div>
            <div>
              <span className="text-gray-400">Stop:</span>
              <p className="text-red-400">${strategy.stop}</p>
            </div>
          </div>
        )}
        
        <div className="flex justify-between items-center text-xs">
          <span className="text-gray-500">R:R {strategy.riskReward || 'N/A'}</span>
          <span className="text-gray-500">Win Rate: {strategy.winRate || 'N/A'}%</span>
        </div>
      </div>
    );
  };

  // Show loading placeholder on initial load
  if (loading && !analysis) {
    return <LoadingPlaceholder height={600} title="Market Insights & Trading Intelligence" />;
  }

  return (
    <div className="bg-gray-900 rounded-lg p-4">
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xl font-bold text-white">Market Insights & Trading Intelligence</h2>
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
            <p className="text-gray-400 text-xs">Market Regime</p>
            <p className="text-lg font-bold text-white flex items-center gap-1">
              {getRegimeIcon()} {marketRegime.type?.toUpperCase()}
            </p>
            <p className="text-xs text-gray-500">{marketRegime.description}</p>
          </div>
          
          <div className={`p-3 rounded border ${getAlertColor()}`}>
            <p className="text-xs opacity-75">Alert Level</p>
            <p className="text-lg font-bold">{alertLevel.toUpperCase()}</p>
          </div>
          
          <div className="bg-gray-800 p-3 rounded">
            <p className="text-gray-400 text-xs">Active Setups</p>
            <p className="text-lg font-bold text-white">{activeStrategies.length}</p>
            <p className="text-xs text-gray-500">
              {activeStrategies.filter(s => s.status === 'active').length} live
            </p>
          </div>
          
          <div className="bg-gray-800 p-3 rounded">
            <p className="text-gray-400 text-xs">Risk Score</p>
            <p className={`text-lg font-bold ${
              riskMetrics.score > 70 ? 'text-red-400' :
              riskMetrics.score > 40 ? 'text-yellow-400' : 'text-green-400'
            }`}>
              {riskMetrics.score || 0}/100
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Market Insights */}
        <div>
          <h3 className="text-lg font-semibold text-white mb-3">📊 Market Insights</h3>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {insights.map((insight, index) => (
              <InsightCard key={index} insight={insight} index={index} />
            ))}
          </div>
        </div>

        {/* Active Strategies */}
        <div>
          <h3 className="text-lg font-semibold text-white mb-3">🎯 Trading Strategies</h3>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {activeStrategies.map((strategy, index) => (
              <StrategyCard key={index} strategy={strategy} index={index} />
            ))}
          </div>
        </div>
      </div>

      {/* Quick Tips Section */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-blue-900/20 border border-blue-500 rounded p-3">
          <h4 className="text-sm font-semibold text-blue-300 mb-2">💡 Current Market Tips</h4>
          <ul className="text-xs text-blue-200 space-y-1">
            <li>• {marketRegime.type === 'trending' ? 'Follow the trend, avoid counter-trend trades' : 
                 marketRegime.type === 'ranging' ? 'Buy support, sell resistance, avoid breakouts' :
                 marketRegime.type === 'volatile' ? 'Use wider stops, smaller position sizes' :
                 'Wait for clear signals before entering'}</li>
            <li>• Watch for {alertLevel === 'high' ? 'immediate reversals and liquidations' :
                          alertLevel === 'medium' ? 'key level tests and breakouts' :
                          'trend continuation setups'}</li>
            <li>• Risk management is key in {marketRegime.type} markets</li>
          </ul>
        </div>
        
        <div className="bg-purple-900/20 border border-purple-500 rounded p-3">
          <h4 className="text-sm font-semibold text-purple-300 mb-2">🔮 DeFi Specific</h4>
          <ul className="text-xs text-purple-200 space-y-1">
            <li>• Monitor gas fees for entry/exit timing</li>
            <li>• Watch TVL changes in major protocols</li>
            <li>• Consider impermanent loss in LP strategies</li>
            <li>• DEX arbitrage opportunities during volatility</li>
          </ul>
        </div>
        
        <div className="bg-green-900/20 border border-green-500 rounded p-3">
          <h4 className="text-sm font-semibold text-green-300 mb-2">⚡ Quick Actions</h4>
          <ul className="text-xs text-green-200 space-y-1">
            <li>• Set alerts on key liquidity levels</li>
            <li>• Monitor funding rate changes</li>
            <li>• Check correlation with major crypto pairs</li>
            <li>• Review position sizing based on volatility</li>
          </ul>
        </div>
      </div>

      {/* Advanced Analytics */}
      <div className="mt-6 bg-gray-800 rounded p-4">
        <h4 className="text-sm font-semibold text-white mb-3">🧠 Advanced Market Analytics</h4>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          <div>
            <p className="text-gray-400 mb-1">Volatility Regime</p>
            <p className="text-white">{riskMetrics.volatilityRegime || 'Normal'}</p>
          </div>
          <div>
            <p className="text-gray-400 mb-1">Correlation Shift</p>
            <p className={`${riskMetrics.correlationShift > 0 ? 'text-red-400' : 'text-green-400'}`}>
              {riskMetrics.correlationShift > 0 ? 'Increasing' : 'Stable'}
            </p>
          </div>
          <div>
            <p className="text-gray-400 mb-1">Smart Money Flow</p>
            <p className="text-blue-400">{riskMetrics.smartMoney || 'Neutral'}</p>
          </div>
          <div>
            <p className="text-gray-400 mb-1">Momentum Score</p>
            <p className="text-purple-400">{riskMetrics.momentum || 50}/100</p>
          </div>
        </div>
        
        <div className="mt-3 pt-3 border-t border-gray-700">
          <p className="text-xs text-gray-400">
            <span className="text-cyan-400 font-semibold">🚀 Pro Strategy:</span> 
            Current market regime favors {
              marketRegime.type === 'trending' ? 'momentum strategies with trend following' :
              marketRegime.type === 'ranging' ? 'mean reversion and support/resistance trading' :
              marketRegime.type === 'volatile' ? 'volatility trading and options strategies' :
              'patient waiting for clear directional moves'
            }. 
            Risk level: {alertLevel}. Adjust position sizing and timeframes accordingly.
          </p>
        </div>
      </div>
    </div>
  );
};

export default TradingInsights;