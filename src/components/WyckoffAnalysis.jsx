import React from 'react';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, ScatterChart, Scatter } from 'recharts';
import { useEnhancedStreamingData } from '../services/dataSourceContext';
import { useStreamingConfig } from '../hooks/useStreamingConfig';
import StreamingIndicator from './StreamingIndicator';
import LoadingPlaceholder from './LoadingPlaceholder';
import { useNansenData } from '../hooks/useNansenData.js';
import { fmtM } from '../services/nansenService.js';

const WyckoffAnalysis = () => {
  // Get streaming configuration
  const { interval, isPaused } = useStreamingConfig('wyckoff');

  // On-chain capital flow — confirms or challenges the Wyckoff phase
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
  } = useEnhancedStreamingData('wyckoff', interval, {
    enabled: !isPaused
  });

  // Derive state from streaming data
  const wyckoffData = analysis?.priceData || [];
  const currentPhase = analysis?.phase || {};
  const compositeMan = analysis?.compositeMan || {};
  const effortVsResult = analysis?.effortVsResult || [];
  const wyckoffEvents = analysis?.events || [];

  const getPhaseColor = (phase) => {
    switch(phase) {
      case 'Accumulation': return '#3b82f6'; // Blue
      case 'Markup': return '#22c55e'; // Green  
      case 'Distribution': return '#f59e0b'; // Amber
      case 'Markdown': return '#ef4444'; // Red
      case 'Re-accumulation': return '#8b5cf6'; // Purple
      case 'Re-distribution': return '#ec4899'; // Pink
      default: return '#6b7280'; // Gray
    }
  };

  const getPhaseIcon = (phase) => {
    switch(phase) {
      case 'Accumulation': return '🔵';
      case 'Markup': return '🟢'; 
      case 'Distribution': return '🟡';
      case 'Markdown': return '🔴';
      case 'Re-accumulation': return '🟣';
      case 'Re-distribution': return '🔷';
      default: return '⚫';
    }
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-gray-800 p-3 rounded border border-gray-600">
          <p className="text-white text-sm font-semibold">{label}</p>
          <p className="text-gray-300 text-xs">Price: ${data.price?.toFixed(2)}</p>
          <p className="text-gray-300 text-xs">Volume: {data.volume?.toLocaleString()}</p>
          <p className="text-gray-300 text-xs">Phase: {data.phase}</p>
          {data.wyckoffPoint && (
            <p className="text-yellow-400 text-xs font-semibold">📍 {data.wyckoffPoint}</p>
          )}
          {data.signal && (
            <p className="text-green-400 text-xs">💡 {data.signal}</p>
          )}
        </div>
      );
    }
    return null;
  };

  const EffortResultTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-gray-800 p-3 rounded border border-gray-600">
          <p className="text-white text-sm">Effort vs Result Analysis</p>
          <p className="text-gray-300 text-xs">Volume (Effort): {data.volume?.toLocaleString()}</p>
          <p className="text-gray-300 text-xs">Price Change (Result): {data.priceChange?.toFixed(2)}%</p>
          <p className="text-yellow-400 text-xs">{data.analysis}</p>
        </div>
      );
    }
    return null;
  };

  // Show loading placeholder on initial load
  if (loading && !analysis) {
    return <LoadingPlaceholder height={700} title="Wyckoff Market Structure Analysis" />;
  }

  return (
    <div className="bg-gray-900 rounded-lg p-4">
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xl font-bold text-white">Wyckoff Market Structure Analysis</h2>
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
            <p className="text-gray-400 text-xs">Current Phase</p>
            <p className="text-lg font-bold text-white flex items-center gap-1">
              {getPhaseIcon(currentPhase.name)} {currentPhase.name}
            </p>
            <p className="text-xs text-gray-500">{currentPhase.subPhase}</p>
          </div>
          
          <div className="bg-gray-800 p-3 rounded">
            <p className="text-gray-400 text-xs">Composite Man Intent</p>
            <p className={`text-lg font-bold ${
              compositeMan.intent === 'Accumulating' ? 'text-blue-400' :
              compositeMan.intent === 'Distributing' ? 'text-red-400' :
              compositeMan.intent === 'Marking Up' ? 'text-green-400' :
              compositeMan.intent === 'Marking Down' ? 'text-orange-400' : 'text-gray-400'
            }`}>
              {compositeMan.intent}
            </p>
            <p className="text-xs text-gray-500">Strength: {compositeMan.strength}%</p>
          </div>
          
          <div className="bg-gray-800 p-3 rounded">
            <p className="text-gray-400 text-xs">Phase Progress</p>
            <div className="w-full bg-gray-700 rounded-full h-2 mt-1">
              <div 
                className="h-2 rounded-full transition-all duration-300"
                style={{ 
                  width: `${currentPhase.progress}%`,
                  backgroundColor: getPhaseColor(currentPhase.name)
                }}
              ></div>
            </div>
            <p className="text-xs text-gray-500 mt-1">{currentPhase.progress}% Complete</p>
          </div>
          
          <div className="bg-gray-800 p-3 rounded">
            <p className="text-gray-400 text-xs">Next Expected</p>
            <p className="text-lg font-bold text-white">
              {currentPhase.nextPhase}
            </p>
            <p className="text-xs text-gray-500">{currentPhase.timeframe}</p>
          </div>
        </div>

        {/* Phase Alerts */}
        {currentPhase.alert && (
          <div className={`p-3 rounded border mb-4 ${
            currentPhase.alert.type === 'critical' ? 'bg-red-900/20 border-red-500' :
            currentPhase.alert.type === 'warning' ? 'bg-yellow-900/20 border-yellow-500' :
            'bg-blue-900/20 border-blue-500'
          }`}>
            <p className="text-sm font-semibold text-white">
              {currentPhase.alert.type === 'critical' ? '🚨' :
               currentPhase.alert.type === 'warning' ? '⚠️' : 'ℹ️'}
              {currentPhase.alert.title}
            </p>
            <p className="text-xs text-gray-300 mt-1">{currentPhase.alert.message}</p>
          </div>
        )}

        {/* ── On-chain Capital Flow Phase Confirmation ─────────────────────── */}
        {!nansenLoading && (() => {
          // Map Wyckoff phases to their expected capital flow direction
          const phaseExpectsFlow = {
            Accumulation:    'bullish',   // Capital should be flowing IN during accumulation
            Markup:          'bullish',   // Continued inflow confirms markup
            Distribution:    'bearish',   // Capital flowing OUT confirms distribution
            Markdown:        'bearish',   // Continued outflow confirms markdown
            'Re-accumulation': 'bullish',
            'Re-distribution': 'bearish',
          };

          const expectedBias = phaseExpectsFlow[currentPhase.name];
          const isDivergence = expectedBias && onChainBias !== 'neutral' && onChainBias !== expectedBias;
          const isConfirmed  = expectedBias && onChainBias !== 'neutral' && onChainBias === expectedBias;

          const l2Gaining = chainRotation.filter(c => c.chain !== 'ethereum' && c.direction === 'inflow');

          return (
            <div className={`p-3 rounded border mb-4 text-xs font-mono ${
              isDivergence ? 'bg-yellow-900/20 border-yellow-500/60'
              : isConfirmed ? 'bg-gray-800/60 border-gray-700'
              : 'bg-gray-800/40 border-gray-700/50'
            }`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-500 uppercase tracking-wider text-[10px]">On-chain Capital — Phase Confirmation</span>
                {nansenIsDemo && <span className="text-[9px] text-yellow-500/70 bg-yellow-900/20 px-1 rounded">demo</span>}
                {isDivergence && (
                  <span className="text-[10px] font-semibold text-yellow-400 bg-yellow-900/30 px-2 py-0.5 rounded uppercase tracking-wide">
                    DIVERGENCE — on-chain flow contradicts {currentPhase.name}
                  </span>
                )}
                {isConfirmed && (
                  <span className="text-[10px] font-semibold text-green-400 bg-green-900/20 px-2 py-0.5 rounded uppercase tracking-wide">
                    CONFIRMED — capital flow consistent with {currentPhase.name}
                  </span>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-4 text-gray-300">
                <div>
                  <span className="text-gray-500">ETH net flow</span>{' '}
                  <span className={`font-semibold ${onChainBias === 'bullish' ? 'text-green-400' : onChainBias === 'bearish' ? 'text-red-400' : 'text-gray-400'}`}>
                    {fmtM(ethNetFlow)}
                  </span>
                  <span className="text-gray-500"> ({capitalFlowStrength}% strength)</span>
                </div>
                <div>
                  <span className="text-gray-500">{currentPhase.name} expects</span>{' '}
                  <span className={`font-semibold ${expectedBias === 'bullish' ? 'text-green-400' : 'text-red-400'}`}>
                    {expectedBias ? expectedBias.toUpperCase() + ' flow' : '—'}
                  </span>
                </div>
                {l2Gaining.length > 0 && (
                  <div>
                    <span className="text-gray-500">Capital also moving to:</span>{' '}
                    <span className="text-blue-400">{l2Gaining.map(c => c.chain).join(', ')}</span>
                  </div>
                )}
              </div>
            </div>
          );
        })()}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Wyckoff Chart */}
        <div className="lg:col-span-2">
          <h3 className="text-sm font-semibold text-gray-300 mb-2">Price Action with Wyckoff Events</h3>
          <ResponsiveContainer width="100%" height={350}>
            <AreaChart data={wyckoffData}>
              <defs>
                <linearGradient id="wyckoffGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={getPhaseColor(currentPhase.name)} stopOpacity={0.3}/>
                  <stop offset="95%" stopColor={getPhaseColor(currentPhase.name)} stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
              <XAxis dataKey="time" stroke="#6b7280" tick={{ fontSize: 10 }} />
              <YAxis stroke="#6b7280" tick={{ fontSize: 10 }} />
              <Tooltip content={<CustomTooltip />} />
              
              {/* Phase transition lines */}
              {wyckoffData.filter(d => d.phaseTransition).map((point, idx) => (
                <ReferenceLine 
                  key={idx}
                  x={point.time}
                  stroke="#8b5cf6"
                  strokeDasharray="3 3"
                  strokeWidth={1}
                />
              ))}
              
              <Area 
                type="monotone" 
                dataKey="price" 
                stroke={getPhaseColor(currentPhase.name)}
                strokeWidth={2}
                fill="url(#wyckoffGradient)" 
              />
            </AreaChart>
          </ResponsiveContainer>
          
          {/* Wyckoff Events Timeline */}
          <div className="mt-4">
            <h4 className="text-xs font-semibold text-gray-400 mb-2">Recent Wyckoff Events</h4>
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {wyckoffEvents.slice(-5).map((event, idx) => (
                <div key={idx} className="flex items-center justify-between text-xs bg-gray-800 p-2 rounded">
                  <div className="flex items-center gap-2">
                    <span>{event.icon}</span>
                    <span className="text-white font-semibold">{event.name}</span>
                    <span className="text-gray-400">${event.price}</span>
                  </div>
                  <span className="text-gray-500">{event.time}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Effort vs Result Analysis */}
        <div>
          <h3 className="text-sm font-semibold text-gray-300 mb-2">Effort vs Result (Volume vs Price)</h3>
          <ResponsiveContainer width="100%" height={250}>
            <ScatterChart data={effortVsResult}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
              <XAxis 
                dataKey="volume" 
                stroke="#6b7280" 
                tick={{ fontSize: 10 }}
                label={{ value: 'Volume (Effort)', position: 'insideBottom', offset: -5, fill: '#6b7280' }}
              />
              <YAxis 
                dataKey="priceChange" 
                stroke="#6b7280" 
                tick={{ fontSize: 10 }}
                label={{ value: 'Price Change % (Result)', angle: -90, position: 'insideLeft', fill: '#6b7280' }}
              />
              <Tooltip content={<EffortResultTooltip />} />
              <ReferenceLine y={0} stroke="#6b7280" strokeDasharray="2 2" />
              
              <Scatter 
                dataKey="priceChange" 
                fill="#8b5cf6"
                fillOpacity={0.6}
              />
            </ScatterChart>
          </ResponsiveContainer>
          
          {/* Effort vs Result Insights */}
          <div className="mt-4 bg-gray-800 p-4 rounded">
            <h4 className="text-base font-semibold text-gray-300 mb-3">Analysis Insights</h4>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 bg-green-500 rounded-full"></div>
                <span className="text-sm text-gray-300">High effort, high result = Natural move</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 bg-red-500 rounded-full"></div>
                <span className="text-sm text-gray-300">High effort, low result = Potential reversal</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
                <span className="text-sm text-gray-300">Low effort, high result = Professional interest</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 bg-gray-500 rounded-full"></div>
                <span className="text-sm text-gray-300">Low effort, low result = Consolidation</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Wyckoff Schematics */}
      <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-gray-800 p-5 rounded">
          <h3 className="text-base font-semibold text-gray-300 mb-4">Accumulation Schematic</h3>
          <div className="grid grid-cols-6 gap-2 text-sm text-center">
            <div className="bg-blue-900/30 p-2 rounded border border-blue-600">
              <div className="font-semibold text-blue-400">PS</div>
              <div className="text-gray-400">Prelim Support</div>
            </div>
            <div className="bg-red-900/30 p-2 rounded border border-red-600">
              <div className="font-semibold text-red-400">SC</div>
              <div className="text-gray-400">Selling Climax</div>
            </div>
            <div className="bg-green-900/30 p-2 rounded border border-green-600">
              <div className="font-semibold text-green-400">AR</div>
              <div className="text-gray-400">Auto Rally</div>
            </div>
            <div className="bg-yellow-900/30 p-2 rounded border border-yellow-600">
              <div className="font-semibold text-yellow-400">ST</div>
              <div className="text-gray-400">Secondary Test</div>
            </div>
            <div className="bg-purple-900/30 p-2 rounded border border-purple-600">
              <div className="font-semibold text-purple-400">SOS</div>
              <div className="text-gray-400">Sign of Strength</div>
            </div>
            <div className="bg-cyan-900/30 p-2 rounded border border-cyan-600">
              <div className="font-semibold text-cyan-400">LPS</div>
              <div className="text-gray-400">Last Point Support</div>
            </div>
          </div>
        </div>
        
        <div className="bg-gray-800 p-5 rounded">
          <h3 className="text-base font-semibold text-gray-300 mb-4">Distribution Schematic</h3>
          <div className="grid grid-cols-6 gap-2 text-sm text-center">
            <div className="bg-blue-900/30 p-2 rounded border border-blue-600">
              <div className="font-semibold text-blue-400">PSY</div>
              <div className="text-gray-400">Prelim Supply</div>
            </div>
            <div className="bg-green-900/30 p-2 rounded border border-green-600">
              <div className="font-semibold text-green-400">BC</div>
              <div className="text-gray-400">Buying Climax</div>
            </div>
            <div className="bg-red-900/30 p-2 rounded border border-red-600">
              <div className="font-semibold text-red-400">AD</div>
              <div className="text-gray-400">Auto Decline</div>
            </div>
            <div className="bg-yellow-900/30 p-2 rounded border border-yellow-600">
              <div className="font-semibold text-yellow-400">ST</div>
              <div className="text-gray-400">Secondary Test</div>
            </div>
            <div className="bg-purple-900/30 p-2 rounded border border-purple-600">
              <div className="font-semibold text-purple-400">SOW</div>
              <div className="text-gray-400">Sign of Weakness</div>
            </div>
            <div className="bg-orange-900/30 p-2 rounded border border-orange-600">
              <div className="font-semibold text-orange-400">LPSY</div>
              <div className="text-gray-400">Last Point Supply</div>
            </div>
          </div>
        </div>
      </div>

      {/* Trading Strategy Based on Wyckoff */}
      <div className="mt-6 bg-gradient-to-r from-blue-900/20 to-purple-900/20 border border-blue-500/30 rounded p-5">
        <h3 className="text-lg font-semibold text-blue-300 mb-4">Wyckoff-Based Trading Strategy</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <h4 className="text-base font-semibold text-white mb-3">Current Phase Strategy</h4>
            <p className="text-sm text-gray-300 mb-2 leading-relaxed">
              {currentPhase.name === 'Accumulation' && 'Look for longs on weakness. Smart money is accumulating. Target markup phase.'}
              {currentPhase.name === 'Markup' && 'Hold longs, add on pullbacks. Trend is your friend. Prepare for distribution.'}
              {currentPhase.name === 'Distribution' && 'Take profits on longs. Prepare for shorts. Smart money is exiting.'}
              {currentPhase.name === 'Markdown' && 'Look for shorts on strength. Downtrend active. Wait for re-accumulation.'}
            </p>
          </div>
          <div>
            <h4 className="text-base font-semibold text-white mb-3">Key Levels to Watch</h4>
            <ul className="text-sm text-gray-300 space-y-2 leading-relaxed">
              <li>• Support: {wyckoffData.length > 0 ? `$${(Math.min(...wyckoffData.map(d => d.price)) * 1.01).toFixed(2)}` : 'N/A'}</li>
              <li>• Resistance: {wyckoffData.length > 0 ? `$${(Math.max(...wyckoffData.map(d => d.price)) * 0.99).toFixed(2)}` : 'N/A'}</li>
              <li>• Volume Confirmation: Required</li>
              <li>• Phase Progress: {currentPhase.progress}%</li>
            </ul>
          </div>
          <div>
            <h4 className="text-base font-semibold text-white mb-3">Risk Management</h4>
            <ul className="text-sm text-gray-300 space-y-2 leading-relaxed">
              <li>• Stop: Below/Above key Wyckoff points</li>
              <li>• Size: Reduce in late phase stages</li>
              <li>• Timeframe: Align with phase duration</li>
              <li>• Confirmation: Volume + Price action</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WyckoffAnalysis;