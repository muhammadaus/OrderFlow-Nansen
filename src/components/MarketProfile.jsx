import React from 'react';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell, LineChart, Line, ComposedChart, Area } from 'recharts';
import { useEnhancedStreamingData } from '../services/dataSourceContext';
import { useStreamingConfig } from '../hooks/useStreamingConfig';
import StreamingIndicator from './StreamingIndicator';
import LoadingPlaceholder from './LoadingPlaceholder';

const MarketProfile = () => {
  // Get streaming configuration
  const { interval, isPaused } = useStreamingConfig('marketProfile');

  // Use enhanced streaming data
  const {
    data: analysis,
    loading,
    error,
    lastUpdate,
    latency,
    isStale,
    updateCount
  } = useEnhancedStreamingData('marketProfile', interval, {
    enabled: !isPaused
  });

  // Derive state from streaming data
  const profileData = analysis?.profile || [];
  const timeAndSales = analysis?.timeAndSales || [];
  const volumeProfile = analysis?.volumeProfile || [];
  const tpoData = analysis?.tpo || [];
  const valueAreaData = analysis?.valueArea || {};
  const sessionData = analysis?.session || {};

  const getTPOColor = (frequency) => {
    if (frequency > 8) return '#dc2626'; // Very high activity - red
    if (frequency > 6) return '#ea580c'; // High activity - orange
    if (frequency > 4) return '#ca8a04'; // Medium activity - yellow
    if (frequency > 2) return '#16a34a'; // Low activity - green
    return '#374151'; // Very low activity - gray
  };

  const getSessionColor = (session) => {
    switch(session) {
      case 'Asian': return '#3b82f6'; // Blue
      case 'London': return '#22c55e'; // Green
      case 'New York': return '#ef4444'; // Red
      case 'Overnight': return '#6b7280'; // Gray
      default: return '#8b5cf6'; // Purple
    }
  };

  // Enhanced TPO Chart with POC and Value Area indicators
  const TPOChart = ({ data, poc, valueArea }) => {
    const maxFrequency = Math.max(...data.map(d => d.frequency));

    return (
      <div className="bg-gray-800 p-3 rounded font-mono text-xs">
        {/* TPO Profile Header */}
        <div className="flex items-center justify-between mb-2 pb-2 border-b border-gray-700">
          <span className="text-gray-400 w-16">Price</span>
          <span className="text-gray-400 flex-1 text-center">TPO Letters (A-M = 30min periods)</span>
          <span className="text-gray-400 w-8 text-right">TPOs</span>
        </div>

        <div className="grid gap-0.5">
          {data.slice().reverse().map((level, idx) => {
            const isPOC = Math.abs(level.price - poc) < 1;
            const isValueArea = level.price >= valueArea.valueAreaLow && level.price <= valueArea.valueAreaHigh;
            const isVAH = Math.abs(level.price - valueArea.valueAreaHigh) < 1;
            const isVAL = Math.abs(level.price - valueArea.valueAreaLow) < 1;

            return (
              <div
                key={idx}
                className={`flex items-center justify-between py-0.5 px-1 rounded ${
                  isPOC ? 'bg-red-900/40 border-l-2 border-red-500' :
                  isVAH || isVAL ? 'bg-blue-900/20 border-l-2 border-blue-500' :
                  isValueArea ? 'bg-gray-700/30' : ''
                }`}
              >
                <span className={`w-16 ${isPOC ? 'text-red-400 font-bold' : isVAH || isVAL ? 'text-blue-400' : 'text-gray-400'}`}>
                  ${level.price.toFixed(2)}
                  {isPOC && ' ◀'}
                </span>
                <div className="flex-1 px-2">
                  <div className="flex gap-px">
                    {level.tpoLetters.split('').map((letter, letterIdx) => (
                      <span
                        key={letterIdx}
                        className="w-4 h-5 flex items-center justify-center text-xs font-bold rounded-sm"
                        style={{
                          backgroundColor: isPOC ? '#dc2626' : getTPOColor(level.frequency),
                          color: 'white'
                        }}
                      >
                        {letter}
                      </span>
                    ))}
                  </div>
                </div>
                <span className={`w-8 text-right ${isPOC ? 'text-red-400 font-bold' : 'text-gray-500'}`}>
                  {level.frequency}
                </span>
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex items-center justify-center gap-4 mt-3 pt-2 border-t border-gray-700 text-xs">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-red-600 rounded"></div>
            <span className="text-gray-400">POC</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-blue-600 rounded"></div>
            <span className="text-gray-400">Value Area</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-green-600 rounded"></div>
            <span className="text-gray-400">Low Activity</span>
          </div>
        </div>
      </div>
    );
  };

  // Show loading placeholder on initial load
  if (loading && !analysis) {
    return <LoadingPlaceholder height={700} title="Market Profile & Time-Price Analysis" />;
  }

  return (
    <div className="bg-gray-900 rounded-lg p-4">
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xl font-bold text-white">Market Profile & Time-Price Analysis</h2>
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
            <p className="text-gray-400 text-xs">Point of Control</p>
            <p className="text-lg font-bold text-white">${valueAreaData.poc?.toFixed(2) || '0.00'}</p>
            <p className="text-xs text-gray-500">Highest volume price</p>
          </div>
          
          <div className="bg-gray-800 p-3 rounded">
            <p className="text-gray-400 text-xs">Value Area</p>
            <p className="text-sm font-bold text-white">
              ${valueAreaData.valueAreaLow?.toFixed(2)} - ${valueAreaData.valueAreaHigh?.toFixed(2)}
            </p>
            <p className="text-xs text-gray-500">70% of volume</p>
          </div>
          
          <div className="bg-gray-800 p-3 rounded">
            <p className="text-gray-400 text-xs">Session Range</p>
            <p className="text-sm font-bold text-white">
              ${sessionData.sessionHigh?.toFixed(2)} / ${sessionData.sessionLow?.toFixed(2)}
            </p>
            <p className="text-xs text-gray-500">Today's range</p>
          </div>
          
          <div className="bg-gray-800 p-3 rounded">
            <p className="text-gray-400 text-xs">Profile Type</p>
            <p className="text-lg font-bold text-purple-400">{sessionData.profileType || 'Normal'}</p>
            <p className="text-xs text-gray-500">{sessionData.rotationalFactor}% rotational</p>
          </div>
        </div>

        {/* What is TPO - Educational Section */}
        <div className="mb-4 p-5 bg-gradient-to-r from-indigo-900/30 to-purple-900/30 border border-indigo-500/50 rounded-lg">
          <h3 className="text-lg font-bold text-indigo-300 mb-4">What is TPO (Time Price Opportunity)?</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-sm text-gray-300 mb-3 leading-relaxed">
                <strong className="text-white">TPO</strong> shows how long price traded at each level.
                Each <strong className="text-yellow-400">letter (A-M)</strong> represents a 30-minute period.
              </p>
              <ul className="text-sm text-gray-400 space-y-2 leading-relaxed">
                <li><span className="text-yellow-400">A</span> = 9:30-10:00 | <span className="text-yellow-400">B</span> = 10:00-10:30 | etc.</li>
                <li>More letters at a price = more time spent there</li>
                <li><span className="text-red-400">POC</span> = Point of Control (most traded price)</li>
                <li><span className="text-blue-400">Value Area</span> = 70% of trading activity</li>
              </ul>
            </div>
            <div>
              <p className="text-sm text-gray-300 mb-3 leading-relaxed">
                <strong className="text-white">Why it matters:</strong>
              </p>
              <ul className="text-sm text-gray-400 space-y-2 leading-relaxed">
                <li>Price tends to return to POC (fair value magnet)</li>
                <li>Single letters (gaps) = fast moves, potential fill zones</li>
                <li>Dense letter clusters = strong support/resistance</li>
                <li>Value Area breaks = directional moves likely</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Session Analysis */}
        <div className="mb-4 p-4 bg-gray-800 rounded">
          <h3 className="text-base font-semibold text-gray-300 mb-3">Session Analysis</h3>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <span className="text-sm text-blue-400 font-semibold">Asian Session:</span>
              <p className="text-sm text-gray-300">Range: ${sessionData.asianHigh?.toFixed(2)} - ${sessionData.asianLow?.toFixed(2)}</p>
              <p className="text-sm text-gray-400">Character: {sessionData.asianCharacter || 'Consolidative'}</p>
            </div>
            <div>
              <span className="text-sm text-green-400 font-semibold">London Session:</span>
              <p className="text-sm text-gray-300">Range: ${sessionData.londonHigh?.toFixed(2)} - ${sessionData.londonLow?.toFixed(2)}</p>
              <p className="text-sm text-gray-400">Character: {sessionData.londonCharacter || 'Trending'}</p>
            </div>
            <div>
              <span className="text-sm text-red-400 font-semibold">New York Session:</span>
              <p className="text-sm text-gray-300">Range: ${sessionData.nyHigh?.toFixed(2)} - ${sessionData.nyLow?.toFixed(2)}</p>
              <p className="text-sm text-gray-400">Character: {sessionData.nyCharacter || 'Volatile'}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* TPO Profile */}
        <div className="lg:col-span-1">
          <h3 className="text-sm font-semibold text-gray-300 mb-2">Time-Price Opportunities (TPO)</h3>
          <div className="max-h-96 overflow-y-auto">
            <TPOChart data={tpoData} poc={valueAreaData.poc} valueArea={valueAreaData} />
          </div>
        </div>

        {/* Volume Profile */}
        <div className="lg:col-span-1">
          <h3 className="text-sm font-semibold text-gray-300 mb-2">Volume Profile</h3>
          <ResponsiveContainer width="100%" height={350}>
            <BarChart
              data={volumeProfile}
              layout="vertical"
              margin={{ top: 5, right: 30, left: 50, bottom: 5 }}
            >
              <XAxis type="number" stroke="#6b7280" tick={{ fontSize: 10 }} />
              <YAxis
                type="category"
                dataKey="price"
                stroke="#6b7280"
                tick={{ fontSize: 10 }}
                tickFormatter={(value) => `$${value}`}
                width={45}
              />
              <Bar dataKey="volume">
                {volumeProfile.map((entry, index) => {
                  const isPOC = entry.price === valueAreaData.poc;
                  const isValueArea = entry.price >= valueAreaData.valueAreaLow && 
                                     entry.price <= valueAreaData.valueAreaHigh;
                  return (
                    <Cell 
                      key={`cell-${index}`}
                      fill={isPOC ? '#dc2626' : isValueArea ? '#3b82f6' : '#6b7280'}
                      opacity={isPOC ? 1 : isValueArea ? 0.8 : 0.5}
                    />
                  );
                })}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          
          <div className="mt-2 grid grid-cols-3 gap-2 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-600 rounded"></div>
              <span className="text-gray-300">POC</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-600 rounded"></div>
              <span className="text-gray-300">Value Area</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-gray-600 rounded"></div>
              <span className="text-gray-300">Low Volume</span>
            </div>
          </div>
        </div>

        {/* Time & Sales */}
        <div className="lg:col-span-1">
          <h3 className="text-sm font-semibold text-gray-300 mb-2">Time & Sales Analysis</h3>
          <div className="bg-gray-800 rounded p-2 max-h-80 overflow-y-auto">
            <div className="grid grid-cols-4 gap-1 text-xs font-semibold text-gray-400 mb-2 pb-1 border-b border-gray-700">
              <span>Time</span>
              <span>Price</span>
              <span>Size</span>
              <span>Side</span>
            </div>
            
            {timeAndSales.slice(-20).map((trade, idx) => (
              <div key={idx} className="grid grid-cols-4 gap-1 text-xs py-1 hover:bg-gray-700 rounded">
                <span className="text-gray-400">{trade.time}</span>
                <span className={`font-mono ${trade.side === 'Buy' ? 'text-green-400' : 'text-red-400'}`}>
                  ${trade.price.toFixed(2)}
                </span>
                <span className="text-gray-300">{trade.size.toLocaleString()}</span>
                <span className={`font-semibold ${trade.side === 'Buy' ? 'text-green-400' : 'text-red-400'}`}>
                  {trade.side === 'Buy' ? '🟢' : '🔴'}
                </span>
              </div>
            ))}
          </div>
          
          <div className="mt-4 bg-gray-800 p-2 rounded">
            <h4 className="text-xs font-semibold text-gray-400 mb-2">Order Flow Summary</h4>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-green-400">Buy Volume:</span>
                <span className="text-white ml-1">
                  {timeAndSales.filter(t => t.side === 'Buy').reduce((sum, t) => sum + t.size, 0).toLocaleString()}
                </span>
              </div>
              <div>
                <span className="text-red-400">Sell Volume:</span>
                <span className="text-white ml-1">
                  {timeAndSales.filter(t => t.side === 'Sell').reduce((sum, t) => sum + t.size, 0).toLocaleString()}
                </span>
              </div>
              <div>
                <span className="text-gray-400">Avg Trade Size:</span>
                <span className="text-white ml-1">
                  {Math.round(timeAndSales.reduce((sum, t) => sum + t.size, 0) / timeAndSales.length).toLocaleString()}
                </span>
              </div>
              <div>
                <span className="text-purple-400">Block Trades:</span>
                <span className="text-white ml-1">
                  {timeAndSales.filter(t => t.size > 10000).length}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Market Profile Trading Strategies */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-blue-900/20 border border-blue-500 rounded p-5">
          <h3 className="text-lg font-semibold text-blue-300 mb-4">Profile-Based Strategies</h3>
          <div className="space-y-4">
            <div>
              <h4 className="text-base font-semibold text-white mb-2">Value Area Trading</h4>
              <ul className="text-sm text-blue-200 space-y-2 leading-relaxed">
                <li>Buy at Value Area Low, sell at Value Area High</li>
                <li>POC acts as magnet - expect price to return</li>
                <li>Break of Value Area = directional move likely</li>
              </ul>
            </div>

            <div>
              <h4 className="text-base font-semibold text-white mb-2">TPO Insights</h4>
              <ul className="text-sm text-blue-200 space-y-2 leading-relaxed">
                <li>Single prints = areas of speed (gaps to fill)</li>
                <li>High TPO count = strong support/resistance</li>
                <li>Poor highs/lows = potential for extension</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="bg-green-900/20 border border-green-500 rounded p-5">
          <h3 className="text-lg font-semibold text-green-300 mb-4">Session-Based Trading</h3>
          <div className="space-y-4">
            <div>
              <h4 className="text-base font-semibold text-white mb-2">Session Characteristics</h4>
              <ul className="text-sm text-green-200 space-y-2 leading-relaxed">
                <li>Asian: Low volatility, range trading</li>
                <li>London: Trend initiation, higher volume</li>
                <li>New York: Maximum volume, volatility</li>
              </ul>
            </div>

            <div>
              <h4 className="text-base font-semibold text-white mb-2">Profile Types</h4>
              <ul className="text-sm text-green-200 space-y-2 leading-relaxed">
                <li>Normal: 70% rotational, trade mean reversion</li>
                <li>Trend: 30% rotational, trade breakouts</li>
                <li>Neutral: Balanced, wait for direction</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Advanced Market Profile Concepts */}
      <div className="mt-6 bg-gradient-to-r from-purple-900/20 to-pink-900/20 border border-purple-500/30 rounded p-5">
        <h3 className="text-lg font-semibold text-purple-300 mb-4">Advanced Market Profile Concepts</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <h4 className="text-base font-semibold text-white mb-2">Auction Theory</h4>
            <p className="text-sm text-gray-300 mb-3 leading-relaxed">
              Markets are continuous auctions seeking fair value. When price moves away from value area,
              it's either finding new value or will return to established value.
            </p>
            <p className="text-sm text-purple-200 leading-relaxed">
              Current POC at ${valueAreaData.poc?.toFixed(2)} represents accepted value.
            </p>
          </div>

          <div>
            <h4 className="text-base font-semibold text-white mb-2">Market Structure Context</h4>
            <ul className="text-sm text-gray-300 space-y-2 leading-relaxed">
              <li>Balance: Price contained within value area</li>
              <li>Excess: Price rejection at extremes (long tails)</li>
              <li>Initiative: Price breaking away from value</li>
              <li>Response: Price returning to value area</li>
            </ul>
          </div>

          <div>
            <h4 className="text-base font-semibold text-white mb-2">DeFi Applications</h4>
            <ul className="text-sm text-gray-300 space-y-2 leading-relaxed">
              <li>Use POC for limit order placement</li>
              <li>Value area breaks = rebalance triggers</li>
              <li>Session analysis for gas optimization</li>
              <li>TPO density for liquidity assessment</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MarketProfile;