import React from 'react';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, ComposedChart, Bar } from 'recharts';
import { useEnhancedStreamingData } from '../services/dataSourceContext';
import { useStreamingConfig } from '../hooks/useStreamingConfig';
import StreamingIndicator from './StreamingIndicator';
import LoadingPlaceholder from './LoadingPlaceholder';
import { useNansenData } from '../hooks/useNansenData.js';
import { fmtM } from '../services/nansenService.js';

const FundingRateOI = () => {
  // Get streaming configuration
  const { interval, isPaused } = useStreamingConfig('fundingOI');

  // On-chain capital flow context
  const {
    loading: nansenLoading,
    onChainBias,
    capitalFlowStrength,
    ethNetFlow,
    chainRotation,
    isDemo: nansenIsDemo,
  } = useNansenData();

  // Use enhanced streaming data
  const {
    data: analysis,
    loading,
    error,
    lastUpdate,
    latency,
    isStale,
    updateCount
  } = useEnhancedStreamingData('fundingOI', interval, {
    enabled: !isPaused
  });

  // Derive state from streaming data
  const fundingData = analysis?.fundingData || [];
  const oiData = analysis?.oiData || [];
  const currentFunding = analysis?.currentFunding || 0;
  const oiTrend = analysis?.oiTrend || '';
  const marketSentiment = analysis?.marketSentiment || {};
  const alerts = analysis?.alerts || [];

  const getFundingColor = (rate) => {
    if (rate > 0.01) return '#ef4444'; // Very positive - red (expensive longs)
    if (rate > 0.001) return '#f59e0b'; // Positive - amber
    if (rate < -0.01) return '#22c55e'; // Very negative - green (cheap longs)
    if (rate < -0.001) return '#3b82f6'; // Negative - blue
    return '#6b7280'; // Neutral - gray
  };

  const getOITrendIcon = () => {
    switch(oiTrend) {
      case 'increasing': return '📈';
      case 'decreasing': return '📉';
      case 'stable': return '➡️';
      default: return '❓';
    }
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-gray-800 p-3 rounded border border-gray-600">
          <p className="text-white text-sm font-semibold">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} className="text-gray-300 text-xs">
              {entry.name}: {entry.name === 'fundingRate' ? 
                `${(entry.value * 100).toFixed(4)}%` : 
                entry.value.toLocaleString()
              }
            </p>
          ))}
          {payload[0]?.payload?.insight && (
            <p className="text-yellow-400 text-xs mt-1">💡 {payload[0].payload.insight}</p>
          )}
        </div>
      );
    }
    return null;
  };

  // Show loading placeholder on initial load
  if (loading && !analysis) {
    return <LoadingPlaceholder height={550} title="Funding Rates & Open Interest" />;
  }

  return (
    <div className="bg-gray-900 rounded-lg p-4">
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xl font-bold text-white">Funding Rates & Open Interest</h2>
          <StreamingIndicator
            lastUpdate={lastUpdate}
            latency={latency}
            isStale={isStale}
            loading={loading}
            error={error}
            updateCount={updateCount}
          />
        </div>
        
        <div className="grid grid-cols-4 gap-4 mb-4">
          <div className="bg-gray-800 p-3 rounded">
            <p className="text-gray-400 text-xs">Current Funding</p>
            <p className={`text-lg font-bold ${getFundingColor(currentFunding)}`}>
              {(currentFunding * 100).toFixed(4)}%
            </p>
            <p className="text-xs text-gray-500">
              {currentFunding > 0 ? 'Longs pay shorts' : 'Shorts pay longs'}
            </p>
          </div>
          
          <div className="bg-gray-800 p-3 rounded">
            <p className="text-gray-400 text-xs">OI Trend</p>
            <p className="text-lg font-bold text-white flex items-center gap-1">
              {getOITrendIcon()} {oiTrend.toUpperCase()}
            </p>
          </div>
          
          <div className="bg-gray-800 p-3 rounded">
            <p className="text-gray-400 text-xs">Market Sentiment</p>
            <p className={`text-lg font-bold ${
              marketSentiment.bias === 'bullish' ? 'text-green-400' : 
              marketSentiment.bias === 'bearish' ? 'text-red-400' : 'text-gray-400'
            }`}>
              {marketSentiment.bias?.toUpperCase() || 'NEUTRAL'}
            </p>
            <p className="text-xs text-gray-500">{marketSentiment.strength || 'Moderate'}</p>
          </div>
          
          <div className="bg-gray-800 p-3 rounded">
            <p className="text-gray-400 text-xs">Risk Level</p>
            <p className={`text-lg font-bold ${
              alerts.length > 2 ? 'text-red-400' : 
              alerts.length > 0 ? 'text-yellow-400' : 'text-green-400'
            }`}>
              {alerts.length > 2 ? 'HIGH' : alerts.length > 0 ? 'MEDIUM' : 'LOW'}
            </p>
          </div>
        </div>

        {alerts.length > 0 && (
          <div className="mb-4 space-y-2">
            {alerts.slice(0, 3).map((alert, idx) => (
              <div key={idx} className={`p-2 rounded border text-xs ${
                alert.severity === 'high' ? 'bg-red-900/30 border-red-500' :
                alert.severity === 'medium' ? 'bg-yellow-900/30 border-yellow-500' :
                'bg-blue-900/30 border-blue-500'
              }`}>
                <span className="font-semibold">
                  {alert.severity === 'high' ? '🚨' : alert.severity === 'medium' ? '⚠️' : 'ℹ️'}
                </span> {alert.message}
              </div>
            ))}
          </div>
        )}

        {/* ── On-chain vs Derivatives Divergence ─────────────────────────── */}
        {!nansenLoading && (() => {
          const derivBias = currentFunding > 0.001 ? 'bullish'
            : currentFunding < -0.001 ? 'bearish'
            : 'neutral';

          const isDivergence = onChainBias !== 'neutral'
            && derivBias !== 'neutral'
            && onChainBias !== derivBias;

          const isAligned = onChainBias !== 'neutral'
            && derivBias !== 'neutral'
            && onChainBias === derivBias;

          const l2Gaining = chainRotation.filter(c => c.chain !== 'ethereum' && c.direction === 'inflow');

          return (
            <div className={`mb-4 p-3 rounded border text-xs font-mono ${
              isDivergence ? 'bg-yellow-900/20 border-yellow-500/60'
              : 'bg-gray-800/60 border-gray-700'
            }`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-500 uppercase tracking-wider text-[10px]">On-chain vs Derivatives</span>
                {nansenIsDemo && <span className="text-[9px] text-yellow-500/70 bg-yellow-900/20 px-1 rounded">demo</span>}
                {isDivergence && (
                  <span className="text-[10px] font-semibold text-yellow-400 bg-yellow-900/30 px-2 py-0.5 rounded uppercase tracking-wide">
                    DIVERGENCE — positioning not backed by on-chain capital
                  </span>
                )}
                {isAligned && (
                  <span className="text-[10px] font-semibold text-green-400 bg-green-900/20 px-2 py-0.5 rounded uppercase tracking-wide">
                    ALIGNED — capital flow confirms positioning
                  </span>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-4 text-gray-300">
                <div>
                  <span className="text-gray-500">Derivatives</span>{' '}
                  <span className={`font-semibold ${derivBias === 'bullish' ? 'text-green-400' : derivBias === 'bearish' ? 'text-red-400' : 'text-gray-400'}`}>
                    {derivBias.toUpperCase()}
                  </span>
                  <span className="text-gray-500"> (funding {currentFunding > 0 ? '+' : ''}{(currentFunding * 100).toFixed(4)}%)</span>
                </div>
                <span className="text-gray-600">vs</span>
                <div>
                  <span className="text-gray-500">On-chain capital</span>{' '}
                  <span className={`font-semibold ${onChainBias === 'bullish' ? 'text-green-400' : onChainBias === 'bearish' ? 'text-red-400' : 'text-gray-400'}`}>
                    {onChainBias.toUpperCase()}
                  </span>
                  <span className="text-gray-500"> (ETH net flow {fmtM(ethNetFlow)}, strength {capitalFlowStrength}%)</span>
                </div>
                {l2Gaining.length > 0 && (
                  <div>
                    <span className="text-gray-500">Capital rotating to L2:</span>{' '}
                    <span className="text-blue-400">{l2Gaining.map(c => c.chain).join(', ')}</span>
                  </div>
                )}
              </div>
            </div>
          );
        })()}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        {/* Funding Rate Chart */}
        <div>
          <h3 className="text-sm font-semibold text-gray-300 mb-2">Funding Rate History</h3>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={fundingData}>
              <defs>
                <linearGradient id="fundingGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
              <XAxis dataKey="time" stroke="#6b7280" tick={{ fontSize: 10 }} />
              <YAxis 
                stroke="#6b7280" 
                tick={{ fontSize: 10 }}
                tickFormatter={(value) => `${(value * 100).toFixed(2)}%`}
              />
              <Tooltip content={<CustomTooltip />} />
              <ReferenceLine y={0} stroke="#6b7280" strokeDasharray="2 2" />
              <ReferenceLine y={0.01} stroke="#ef4444" strokeDasharray="2 2" strokeOpacity={0.5} />
              <ReferenceLine y={-0.01} stroke="#22c55e" strokeDasharray="2 2" strokeOpacity={0.5} />
              
              <Area 
                type="monotone" 
                dataKey="fundingRate" 
                stroke="#8b5cf6" 
                strokeWidth={2}
                fill="url(#fundingGradient)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Open Interest Chart */}
        <div>
          <h3 className="text-sm font-semibold text-gray-300 mb-2">Open Interest & Price</h3>
          <ResponsiveContainer width="100%" height={250}>
            <ComposedChart data={oiData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
              <XAxis dataKey="time" stroke="#6b7280" tick={{ fontSize: 10 }} />
              <YAxis yAxisId="oi" stroke="#6b7280" tick={{ fontSize: 10 }} />
              <YAxis yAxisId="price" orientation="right" stroke="#f59e0b" tick={{ fontSize: 10 }} />
              <Tooltip content={<CustomTooltip />} />
              
              <Bar yAxisId="oi" dataKey="openInterest" fill="#3b82f6" opacity={0.6} />
              <Line 
                yAxisId="price" 
                type="monotone" 
                dataKey="price" 
                stroke="#f59e0b" 
                strokeWidth={2}
                dot={false}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Analysis Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gray-800 p-3 rounded">
          <h3 className="text-sm font-semibold text-gray-300 mb-2">Funding Rate Signals</h3>
          <ul className="text-xs space-y-1 text-gray-400">
            <li className="text-red-400">🔴 &gt; +1%: Extreme long leverage - reversal risk</li>
            <li className="text-yellow-400">🟡 &gt; +0.1%: Long heavy - caution on longs</li>
            <li className="text-blue-400">🔵 &lt; -0.1%: Short heavy - long opportunity</li>
            <li className="text-green-400">🟢 &lt; -1%: Extreme short squeeze risk</li>
            <li className="text-purple-400 mt-2">
              💡 Current: {currentFunding > 0.01 ? 'Avoid longs' : 
                         currentFunding > 0.001 ? 'Neutral-bearish' :
                         currentFunding < -0.01 ? 'Strong long signal' : 'Neutral-bullish'}
            </li>
          </ul>
        </div>

        <div className="bg-gray-800 p-3 rounded">
          <h3 className="text-sm font-semibold text-gray-300 mb-2">Open Interest Analysis</h3>
          <ul className="text-xs space-y-1 text-gray-400">
            <li>📈 Rising OI + Rising Price = Strong uptrend</li>
            <li>📉 Rising OI + Falling Price = Strong downtrend</li>
            <li>📊 Falling OI + Rising Price = Short covering</li>
            <li>📉 Falling OI + Falling Price = Long liquidation</li>
            <li className="text-purple-400 mt-2">
              💡 Current setup: {oiTrend} OI suggests {
                oiTrend === 'increasing' ? 'trend continuation likely' :
                oiTrend === 'decreasing' ? 'potential reversal coming' : 'consolidation phase'
              }
            </li>
          </ul>
        </div>

        <div className="bg-gray-800 p-3 rounded">
          <h3 className="text-sm font-semibold text-gray-300 mb-2">Trading Strategy</h3>
          <ul className="text-xs space-y-1 text-gray-400">
            <li>🎯 Fade extreme funding rates (&gt;1% or &lt;-1%)</li>
            <li>📊 Use OI divergence for early reversal signals</li>
            <li>⏰ Funding resets every 8 hours - time entries</li>
            <li>🔄 Combine with liquidation levels for precision</li>
            <li className="text-green-400 mt-2">
              ✅ Best setup: {marketSentiment.bias === 'bullish' ? 
                'Long on funding reset with rising OI' :
                'Short on funding reset with falling OI'}
            </li>
          </ul>
        </div>
      </div>

      <div className="mt-4 bg-emerald-900/20 border border-emerald-500 rounded p-3">
        <p className="text-xs text-emerald-300">
          <span className="font-semibold">DeFi Pro Tip:</span> In DeFi perpetuals, funding rates often move more 
          aggressively than CEX due to smaller liquidity. Watch for funding rate arbitrage opportunities between 
          protocols. Combine funding analysis with TVL changes in lending protocols for complete picture.
          Current market showing {marketSentiment.strength || 'moderate'} {marketSentiment.bias || 'neutral'} sentiment.
        </p>
      </div>
    </div>
  );
};

export default FundingRateOI;