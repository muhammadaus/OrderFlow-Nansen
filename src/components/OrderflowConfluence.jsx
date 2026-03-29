import React from 'react';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell, Tooltip } from 'recharts';
import { SIGNAL_WEIGHTS } from '../utils/confluenceEngine';
import { useEnhancedStreamingData } from '../services/dataSourceContext';
import { useStreamingConfig } from '../hooks/useStreamingConfig';
import StreamingIndicator from './StreamingIndicator';
import LoadingPlaceholder from './LoadingPlaceholder';
import { useNansenData } from '../hooks/useNansenData.js';
import { fmtM } from '../services/nansenService.js';

const OrderflowConfluence = () => {
  // Get streaming configuration
  const { interval, isPaused } = useStreamingConfig('confluence');

  // On-chain capital flow — fundamental layer in confluence scoring
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
    data: confluenceData,
    loading,
    error,
    lastUpdate,
    latency,
    isStale,
    updateCount
  } = useEnhancedStreamingData('confluence', interval, {
    enabled: !isPaused
  });

  // Derive state from streaming data
  const signals = confluenceData?.signals || [];
  const matrix = confluenceData?.matrix || [];
  const tradeThesis = confluenceData?.tradeThesis || null;

  const getSignalColor = (type, direction) => {
    if (direction === 'bullish') return '#22c55e';
    if (direction === 'bearish') return '#ef4444';
    return '#6b7280';
  };

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-gray-800 p-2 rounded border border-gray-600 text-xs">
          <p className="text-white font-semibold">{data.type.replace(/_/g, ' ').toUpperCase()}</p>
          <p className="text-purple-400">Weight: {data.weight}</p>
          <p className={data.active ? (
            data.direction === 'bullish' ? 'text-green-400' :
            data.direction === 'bearish' ? 'text-red-400' : 'text-gray-400'
          ) : 'text-gray-500'}>
            {data.active ? `${data.direction.toUpperCase()} (${data.strength}%)` : 'Not Active'}
          </p>
          {data.description && <p className="text-gray-300 mt-1">{data.description}</p>}
        </div>
      );
    }
    return null;
  };

  // Show loading placeholder on initial load
  if (loading && !confluenceData) {
    return <LoadingPlaceholder height={600} title="Orderflow Confluence Engine" />;
  }

  if (!confluenceData) return null;

  return (
    <div className="bg-gray-900 rounded-lg p-4">
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xl font-bold text-white">Orderflow Confluence Engine</h2>
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
          Synthesizes all orderflow signals with reliability-weighted scoring
        </p>

        {/* Main Score Cards */}
        <div className="grid grid-cols-4 gap-3 text-sm">
          <div className="bg-gray-800 p-3 rounded">
            <p className="text-gray-400 text-xs">Confluence Score</p>
            <p className={`font-bold text-2xl ${
              confluenceData.confluenceScore > 60 ? 'text-green-400' :
              confluenceData.confluenceScore > 40 ? 'text-yellow-400' : 'text-gray-400'
            }`}>
              {confluenceData.confluenceScore}%
            </p>
          </div>
          <div className="bg-gray-800 p-3 rounded">
            <p className="text-gray-400 text-xs">Direction</p>
            <p className={`font-bold text-xl ${
              confluenceData.direction === 'bullish' ? 'text-green-400' :
              confluenceData.direction === 'bearish' ? 'text-red-400' : 'text-gray-400'
            }`}>
              {confluenceData.direction === 'bullish' ? '🟢' : confluenceData.direction === 'bearish' ? '🔴' : '⚪'}
              {' '}{confluenceData.direction.toUpperCase()}
            </p>
          </div>
          <div className="bg-gray-800 p-3 rounded">
            <p className="text-gray-400 text-xs">Confidence</p>
            <p className="text-purple-400 font-bold text-xl">{confluenceData.confidence}%</p>
          </div>
          <div className="bg-gray-800 p-3 rounded">
            <p className="text-gray-400 text-xs">Active Signals</p>
            <p className="text-yellow-400 font-bold text-xl">{confluenceData.metrics?.totalSignals || 0}</p>
          </div>
        </div>
      </div>

      {/* Trade Thesis */}
      {tradeThesis && (
        <div className={`mb-4 p-4 rounded border ${
          tradeThesis.direction === 'bullish'
            ? 'bg-green-900/20 border-green-500'
            : 'bg-red-900/20 border-red-500'
        }`}>
          <h3 className="font-bold text-white mb-2">
            {tradeThesis.direction === 'bullish' ? '🟢' : '🔴'} TRADE THESIS
          </h3>
          <div className="grid grid-cols-4 gap-4 mb-3">
            <div>
              <p className="text-gray-400 text-xs">Entry</p>
              <p className="text-white font-semibold">${tradeThesis.entry?.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-gray-400 text-xs">Stop Loss</p>
              <p className="text-red-400 font-semibold">${tradeThesis.stop?.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-gray-400 text-xs">Target</p>
              <p className="text-green-400 font-semibold">${tradeThesis.target?.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-gray-400 text-xs">R:R</p>
              <p className="text-purple-400 font-semibold">{tradeThesis.riskReward}</p>
            </div>
          </div>

          <div className="mb-2">
            <p className="text-gray-400 text-xs mb-1">Reasoning:</p>
            <ul className="text-sm text-gray-300">
              {tradeThesis.reasoning?.map((reason, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-green-400">✓</span> {reason}
                </li>
              ))}
            </ul>
          </div>

          {tradeThesis.warnings?.length > 0 && (
            <div className="mt-2 p-2 bg-yellow-900/30 rounded">
              {tradeThesis.warnings.map((warning, i) => (
                <p key={i} className="text-yellow-400 text-xs">⚠️ {warning}</p>
              ))}
            </div>
          )}

          <div className="mt-2 flex justify-between text-xs text-gray-400">
            <span>Confidence: {tradeThesis.confidence}%</span>
            <span>Timeframe: {tradeThesis.timeframe}</span>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 mb-4">
        {/* Signal Matrix */}
        <div>
          <h3 className="text-sm font-semibold text-gray-300 mb-2">Signal Reliability Matrix</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={matrix} layout="vertical">
              <XAxis type="number" stroke="#6b7280" tick={{ fontSize: 10 }} domain={[0, 100]} />
              <YAxis
                type="category"
                dataKey="type"
                stroke="#6b7280"
                tick={{ fontSize: 9 }}
                width={120}
                tickFormatter={(v) => v.replace(/_/g, ' ')}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="weight" opacity={0.3}>
                {matrix.map((entry, index) => (
                  <Cell key={`bg-${index}`} fill="#6b7280" />
                ))}
              </Bar>
              <Bar dataKey="strength">
                {matrix.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.active ? getSignalColor(entry.type, entry.direction) : '#374151'}
                    opacity={entry.active ? 0.9 : 0.3}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>

          <div className="mt-2 flex gap-3 text-xs justify-center">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded"></div>
              <span className="text-gray-300">Bullish</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-500 rounded"></div>
              <span className="text-gray-300">Bearish</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-gray-600 rounded"></div>
              <span className="text-gray-300">Inactive</span>
            </div>
          </div>
        </div>

        {/* Active Signals List */}
        <div>
          <h3 className="text-sm font-semibold text-gray-300 mb-2">Active Signals (by reliability)</h3>
          <div className="space-y-2 max-h-[300px] overflow-y-auto">

            {/* On-chain capital flow — fundamental signal, always rendered when data is available */}
            {!nansenLoading && onChainBias !== 'neutral' && (
              <div className={`p-2 rounded text-xs border ${
                onChainBias === 'bullish' ? 'bg-green-900/20 border-green-700' : 'bg-red-900/20 border-red-700'
              }`}>
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-white">ON-CHAIN CAPITAL FLOW</span>
                  <span className="text-purple-400">
                    Weight: 65{nansenIsDemo && <span className="text-yellow-500/70 ml-1">demo</span>}
                  </span>
                </div>
                <div className="flex justify-between items-center mt-1">
                  <span className={onChainBias === 'bullish' ? 'text-green-400' : 'text-red-400'}>
                    {onChainBias === 'bullish' ? '🟢' : '🔴'} {onChainBias.toUpperCase()}
                  </span>
                  <span className="text-gray-400">Strength: {capitalFlowStrength}%</span>
                </div>
                <p className="text-gray-400 mt-1">
                  ETH net flow {fmtM(ethNetFlow)} — real capital {onChainBias === 'bullish' ? 'entering' : 'leaving'} Ethereum ecosystem
                </p>
                {chainRotation.filter(c => c.chain !== 'ethereum').length > 0 && (
                  <p className="text-gray-500 mt-1">
                    L2 rotation: {chainRotation.filter(c => c.chain !== 'ethereum').map(c =>
                      `${c.chain} ${fmtM(c.netFlow)}`
                    ).join(' · ')}
                  </p>
                )}
                <p className="text-gray-500 text-xs mt-1">Source: Nansen on-chain</p>
              </div>
            )}

            {signals
              .sort((a, b) => (SIGNAL_WEIGHTS[b.type] || 30) - (SIGNAL_WEIGHTS[a.type] || 30))
              .map((signal, i) => (
                <div key={i} className={`p-2 rounded text-xs border ${
                  signal.direction === 'bullish' ? 'bg-green-900/20 border-green-700' :
                  signal.direction === 'bearish' ? 'bg-red-900/20 border-red-700' :
                  'bg-gray-800 border-gray-700'
                }`}>
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-white">
                      {signal.type.replace(/_/g, ' ').toUpperCase()}
                    </span>
                    <span className="text-purple-400">Weight: {SIGNAL_WEIGHTS[signal.type] || 30}</span>
                  </div>
                  <div className="flex justify-between items-center mt-1">
                    <span className={
                      signal.direction === 'bullish' ? 'text-green-400' :
                      signal.direction === 'bearish' ? 'text-red-400' : 'text-gray-400'
                    }>
                      {signal.direction === 'bullish' ? '🟢' : '🔴'} {signal.direction.toUpperCase()}
                    </span>
                    <span className="text-gray-400">Strength: {Math.round(signal.strength)}%</span>
                  </div>
                  <p className="text-gray-400 mt-1">{signal.description}</p>
                  <p className="text-gray-500 text-xs mt-1">Source: {signal.source}</p>
                </div>
              ))}
          </div>
        </div>
      </div>

      {/* Reliability Ranking Reference */}
      <div className="bg-gray-800 p-3 rounded mb-4">
        <h3 className="text-sm font-semibold text-gray-300 mb-2">Signal Reliability Ranking</h3>
        <div className="grid grid-cols-3 gap-2 text-xs">
          <div className="space-y-1">
            <p className="text-green-400 font-semibold">Highest (100)</p>
            <p className="text-gray-400">Absorption + Divergence</p>
            <p className="text-gray-400">Direct failure of initiative</p>
          </div>
          <div className="space-y-1">
            <p className="text-blue-400 font-semibold">High (85-70)</p>
            <p className="text-gray-400">Sweep Rejection (85)</p>
            <p className="text-gray-400">Volume Acceptance (70)</p>
          </div>
          <div className="space-y-1">
            <p className="text-yellow-400 font-semibold">Medium (55-40)</p>
            <p className="text-gray-400">CVD Breaks (55)</p>
            <p className="text-gray-400">Imbalance Clusters (40)</p>
          </div>
        </div>
        <div className="mt-2 p-2 bg-gray-700 rounded">
          <p className="text-gray-400 text-xs">
            <span className="text-red-400">Lowest (25):</span> Pure S/R levels - They describe where price reacted, not why.
            Use for confluence only, never as primary signal.
          </p>
        </div>
      </div>

      {/* Conflict Detection */}
      {confluenceData.metrics?.conflictingSignals > 0 && (
        <div className="bg-yellow-900/20 border border-yellow-500 rounded p-3 mb-4">
          <p className="text-yellow-400 text-sm font-semibold">
            ⚠️ {confluenceData.metrics.conflictingSignals} Conflicting Signal(s) Detected
          </p>
          <p className="text-gray-300 text-xs mt-1">
            Some signals disagree on direction. Consider reducing position size or waiting for resolution.
          </p>
        </div>
      )}

      {/* Pro Tips */}
      <div className="bg-indigo-900/20 border border-indigo-500 rounded p-3">
        <p className="text-xs text-indigo-300">
          <span className="font-semibold">Confluence Strategy:</span> Wait for 3+ signals aligned in direction with at least one high-reliability (weight &gt;70) signal.
          Don't trade on S/R alone - require orderflow confirmation. When highest-reliability signals conflict, stay flat.
          The trade thesis is a starting point - always validate with your own analysis.
        </p>
      </div>
    </div>
  );
};

export default OrderflowConfluence;
