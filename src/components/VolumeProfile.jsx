import React from 'react';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell, ComposedChart, Line, Area } from 'recharts';
import { useEnhancedStreamingData } from '../services/dataSourceContext';
import { useStreamingConfig } from '../hooks/useStreamingConfig';
import StreamingIndicator from './StreamingIndicator';
import LoadingPlaceholder from './LoadingPlaceholder';

const VolumeProfile = () => {
  // Get streaming configuration
  const { interval, isPaused } = useStreamingConfig('volumeProfile');

  // Use enhanced streaming data
  const {
    data: analysis,
    loading,
    error,
    lastUpdate,
    latency,
    isStale,
    updateCount
  } = useEnhancedStreamingData('volumeProfile', interval, {
    enabled: !isPaused
  });

  // Derive state from streaming data
  const profileData = analysis?.profile || [];
  const deltaData = analysis?.deltaData || [];
  const pocLevel = analysis?.poc || 0;
  const valueArea = analysis?.valueArea || { high: 0, low: 0 };
  const deltaInsights = analysis?.deltaInsights || {};

  const getVolumeColor = (volume, maxVolume) => {
    const intensity = volume / maxVolume;
    if (intensity > 0.8) return '#d63031'; // High volume - bear red
    if (intensity > 0.6) return '#f59e0b'; // Medium-high - amber
    if (intensity > 0.4) return '#0f4c75'; // Medium - corporate blue
    return '#2d3748'; // Low volume - border subtle
  };

  // Show loading placeholder on initial load
  if (loading && !analysis) {
    return <LoadingPlaceholder height={500} title="Volume Profile & Delta Analysis" />;
  }

  return (
    <div className="terminal-card">
      <div className="terminal-card-header">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-text-primary uppercase tracking-wide">Volume Profile & Delta Analysis</h2>
          <StreamingIndicator
            lastUpdate={lastUpdate}
            latency={latency}
            isStale={isStale}
            loading={loading}
            error={error}
            updateCount={updateCount}
          />
        </div>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-3 gap-px bg-border-subtle mx-4 mt-4">
        <div className="bg-navy px-3 py-2">
          <p className="text-xxs text-text-muted uppercase tracking-wide">POC Level</p>
          <p className="text-sm font-semibold text-text-primary tabular-nums">${pocLevel.toFixed(2)}</p>
        </div>
        <div className="bg-navy px-3 py-2">
          <p className="text-xxs text-text-muted uppercase tracking-wide">Value Area</p>
          <p className="text-sm font-semibold text-text-primary tabular-nums">${valueArea.low.toFixed(2)} - ${valueArea.high.toFixed(2)}</p>
        </div>
        <div className="bg-navy px-3 py-2">
          <p className="text-xxs text-text-muted uppercase tracking-wide">Delta Bias</p>
          <p className={`text-sm font-semibold tabular-nums ${deltaInsights.bias === 'bullish' ? 'text-bull' : 'text-bear'}`}>
            {deltaInsights.bias?.toUpperCase()}
          </p>
        </div>
      </div>

      <div className="terminal-card-body">
        <div className="grid grid-cols-2 gap-4">
          {/* Volume Profile */}
          <div>
            <h3 className="text-xxs font-semibold text-text-muted uppercase tracking-wide mb-2">Volume Profile</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              data={profileData}
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
                {profileData.map((entry, index) => {
                  const maxVol = Math.max(...profileData.map(d => d.volume));
                  return (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={getVolumeColor(entry.volume, maxVol)}
                      opacity={entry.price === pocLevel ? 1 : 0.7}
                    />
                  );
                })}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          
          <div className="mt-2 text-xxs space-y-1">
            <div className="compact-row">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-bear rounded-sm"></div>
                <span className="text-text-muted">High Volume Nodes</span>
              </div>
            </div>
            <div className="compact-row">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-corporate-blue rounded-sm"></div>
                <span className="text-text-muted">Medium Volume</span>
              </div>
            </div>
            <div className="compact-row">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-border-subtle rounded-sm"></div>
                <span className="text-text-muted">Low Volume Nodes</span>
              </div>
            </div>
          </div>
        </div>

        {/* Delta Analysis */}
        <div>
          <h3 className="text-xxs font-semibold text-text-muted uppercase tracking-wide mb-2">Cumulative Delta</h3>
          <ResponsiveContainer width="100%" height={300}>
            <ComposedChart data={deltaData}>
              <XAxis dataKey="time" stroke="#6b7280" tick={{ fontSize: 10 }} />
              <YAxis stroke="#6b7280" tick={{ fontSize: 10 }} />
              <defs>
                <linearGradient id="deltaGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              
              <Area 
                type="monotone" 
                dataKey="cumulativeDelta" 
                stroke="#8b5cf6" 
                strokeWidth={2}
                fill="url(#deltaGradient)"
              />
              
              <Bar dataKey="delta" fill="#0f4c75" opacity={0.6}>
                {deltaData.map((entry, index) => (
                  <Cell
                    key={`delta-${index}`}
                    fill={entry.delta > 0 ? '#00b894' : '#d63031'}
                  />
                ))}
              </Bar>
            </ComposedChart>
          </ResponsiveContainer>

          <div className="mt-2 text-xxs space-y-1">
            <div className="compact-row">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-bull rounded-sm"></div>
                <span className="text-text-muted">Positive Delta</span>
              </div>
            </div>
            <div className="compact-row">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-bear rounded-sm"></div>
                <span className="text-text-muted">Negative Delta</span>
              </div>
            </div>
            <div className="compact-row">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-absorption rounded-sm"></div>
                <span className="text-text-muted">Cumulative Trend</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Trading Insights */}
      <div className="grid grid-cols-2 gap-4 mt-4">
        <div className="bg-navy/30 px-3 py-2 border-l-2 border-corporate-blue">
          <h3 className="text-xxs font-semibold text-text-muted uppercase tracking-wide mb-2">Volume Profile Insights</h3>
          <ul className="text-xxs space-y-1 text-text-primary leading-relaxed">
            <li>POC acts as magnet for price action</li>
            <li>Value Area contains 70% of volume</li>
            <li>High volume = potential support/resistance</li>
            <li>Low volume = areas price moves through quickly</li>
          </ul>
          <div className="mt-2 pt-2 border-t border-border-subtle">
            <p className="text-xxs text-text-primary">
              Price {profileData.length > 0 && profileData[0].price > pocLevel ? 'above' : 'below'} POC -
              {profileData.length > 0 && profileData[0].price > pocLevel ? ' test POC support' : ' POC resistance'}
            </p>
          </div>
        </div>

        <div className="bg-navy/30 px-3 py-2 border-l-2 border-bull">
          <h3 className="text-xxs font-semibold text-text-muted uppercase tracking-wide mb-2">Delta Analysis</h3>
          <ul className="text-xxs space-y-1 text-text-primary leading-relaxed">
            <li>Rising delta + rising price = strong trend</li>
            <li>Falling delta + rising price = weakness</li>
            <li>Large delta spikes = institutional activity</li>
            <li>Delta direction = immediate bias</li>
          </ul>
          <div className="mt-2 pt-2 border-t border-border-subtle">
            <p className={`text-xxs font-semibold ${deltaInsights.bias === 'bullish' ? 'text-bull' : 'text-bear'}`}>
              {deltaInsights.strength || 'Neutral'}
              {deltaInsights.divergence && ' - Divergence'}
            </p>
          </div>
        </div>
      </div>
      </div>

      <div className="mx-4 mb-4 px-3 py-2 bg-corporate-blue/20 border-l-2 border-corporate-blue">
        <p className="text-xxs text-text-primary leading-relaxed">
          <span className="font-semibold uppercase tracking-wide">Strategy:</span> Use Volume Profile to identify institutional zones.
          POC levels act as pivot points. Delta shows real-time pressure.
          Combine both: Enter on delta confirmation at volume levels.
        </p>
      </div>
    </div>
  );
};

export default VolumeProfile;