/**
 * Data Aggregator Component
 * Information panel showing data source status, latency, and health metrics
 * Compact bar in header + expandable full panel
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useDataSource, DATA_SOURCES } from '../services/dataSourceContext';
import { useStreamingConfig } from '../hooks/useStreamingConfig';
import metricsService from '../services/metricsService';

/**
 * Format milliseconds to human-readable duration
 */
const formatDuration = (ms) => {
  if (!ms) return '--';
  const seconds = Math.floor(ms / 1000);
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
  return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`;
};

/**
 * Format relative time
 */
const formatRelativeTime = (timestamp) => {
  if (!timestamp) return '--';
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 5) return 'Just now';
  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  return `${Math.floor(seconds / 3600)}h ago`;
};

/**
 * Get color class for latency value
 */
const getLatencyColor = (latency) => {
  if (!latency || latency === 0) return 'text-gray-400';
  if (latency < 100) return 'text-green-400';
  if (latency < 300) return 'text-yellow-400';
  if (latency < 500) return 'text-orange-400';
  return 'text-red-400';
};

/**
 * Get color class for uptime value
 */
const getUptimeColor = (uptime) => {
  if (uptime >= 99) return 'text-green-400';
  if (uptime >= 95) return 'text-yellow-400';
  if (uptime >= 90) return 'text-orange-400';
  return 'text-red-400';
};

/**
 * Metric Card Component
 */
const MetricCard = ({ label, value, subValue, color = 'gray', icon }) => (
  <div className="bg-gray-800 p-3 rounded-lg">
    <div className="flex items-center justify-between mb-1">
      <span className="text-xs text-gray-500">{label}</span>
      {icon && <span className="text-gray-500">{icon}</span>}
    </div>
    <p className={`font-bold text-lg text-${color}-400`}>{value}</p>
    {subValue && <p className="text-xs text-gray-500 mt-1">{subValue}</p>}
  </div>
);

/**
 * Compact Data Aggregator Bar (for header)
 */
export const DataAggregatorCompact = () => {
  const { source, sourceConfig, isConnected, isStreaming, error } = useDataSource();
  const streamingConfig = useStreamingConfig();
  const [metrics, setMetrics] = useState(null);
  const [expanded, setExpanded] = useState(false);
  const [, setTick] = useState(0);

  // Subscribe to metrics updates
  useEffect(() => {
    const unsubscribe = metricsService.subscribe(setMetrics);
    return unsubscribe;
  }, []);

  // Update relative times
  useEffect(() => {
    const interval = setInterval(() => setTick(t => t + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  const avgLatency = Math.round(metrics?.avgLatency || 0);
  const uptime = (metrics?.overallUptime || 100).toFixed(1);
  const globalInterval = streamingConfig?.globalInterval || 5000;
  const isPaused = streamingConfig?.isPaused || false;
  const timeframe = streamingConfig?.timeframe || '5m';
  const TIMEFRAMES = streamingConfig?.TIMEFRAMES || {};

  return (
    <div className="relative">
      {/* Compact Bar */}
      <div
        className="flex items-center gap-3 bg-gray-800/80 backdrop-blur rounded-lg px-3 py-2 cursor-pointer hover:bg-gray-700/80 transition-colors border border-gray-700"
        onClick={() => setExpanded(!expanded)}
      >
        {/* Source icon and name */}
        <div className="flex items-center gap-1.5">
          <span className="text-sm">{sourceConfig?.icon}</span>
          <span className="text-xs text-gray-300 hidden sm:inline">{sourceConfig?.name}</span>
        </div>

        {/* Connection status dot */}
        <div className="flex items-center gap-1.5">
          <div className={`w-2 h-2 rounded-full ${
            error ? 'bg-red-500' :
            isPaused ? 'bg-yellow-500' :
            isConnected ? 'bg-green-500 animate-pulse' :
            'bg-yellow-500 animate-pulse'
          }`} />
          {isStreaming && !isPaused && (
            <span className="text-xs text-blue-400 font-medium">LIVE</span>
          )}
          {isPaused && (
            <span className="text-xs text-yellow-400 font-medium">PAUSED</span>
          )}
        </div>

        {/* Latency */}
        <div className="text-xs hidden md:flex items-center gap-1">
          <span className="text-gray-500">Latency:</span>
          <span className={getLatencyColor(avgLatency)}>{avgLatency}ms</span>
        </div>

        {/* Timeframe */}
        <div className="text-xs hidden md:flex items-center gap-1">
          <span className="text-gray-500">TF:</span>
          <span className="text-purple-400 font-medium">{TIMEFRAMES[timeframe]?.label || timeframe}</span>
        </div>

        {/* Interval */}
        <div className="text-xs hidden lg:flex items-center gap-1">
          <span className="text-gray-500">Refresh:</span>
          <span className="text-gray-300">{globalInterval / 1000}s</span>
        </div>

        {/* Uptime */}
        <div className="text-xs hidden lg:flex items-center gap-1">
          <span className="text-gray-500">Uptime:</span>
          <span className={getUptimeColor(parseFloat(uptime))}>{uptime}%</span>
        </div>

        {/* Pause button */}
        {streamingConfig && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              streamingConfig.togglePause();
            }}
            className={`px-2 py-0.5 rounded text-xs transition-colors ${
              isPaused
                ? 'bg-yellow-600 text-white hover:bg-yellow-500'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            {isPaused ? '▶' : '⏸'}
          </button>
        )}

        {/* Expand indicator */}
        <svg
          className={`w-4 h-4 text-gray-400 transition-transform ${expanded ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>

      {/* Expanded Panel */}
      {expanded && (
        <DataAggregatorExpanded onClose={() => setExpanded(false)} />
      )}
    </div>
  );
};

/**
 * Expanded Panel with tabs
 */
const DataAggregatorExpanded = ({ onClose }) => {
  const { source, sourceConfig, changeSource, availableSources } = useDataSource();
  const streamingConfig = useStreamingConfig();
  const [metrics, setMetrics] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [, setTick] = useState(0);

  useEffect(() => {
    const unsubscribe = metricsService.subscribe(setMetrics);
    return unsubscribe;
  }, []);

  useEffect(() => {
    const interval = setInterval(() => setTick(t => t + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  const tabs = ['overview', 'sources', 'health', 'settings'];

  return (
    <div className="absolute top-full right-0 mt-2 bg-gray-900 border border-gray-700 rounded-lg p-4 z-50 shadow-xl min-w-[500px] max-w-[700px]">
      {/* Header with tabs */}
      <div className="flex items-center justify-between mb-4 border-b border-gray-700 pb-3">
        <div className="flex gap-1">
          {tabs.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-1.5 rounded text-sm capitalize transition-colors ${
                activeTab === tab
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-white p-1"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Tab Content */}
      <div className="min-h-[200px]">
        {activeTab === 'overview' && <OverviewTab metrics={metrics} />}
        {activeTab === 'sources' && (
          <SourcesTab
            currentSource={source}
            availableSources={availableSources}
            metrics={metrics}
            onChangeSource={changeSource}
          />
        )}
        {activeTab === 'health' && <HealthTab metrics={metrics} />}
        {activeTab === 'settings' && (
          <SettingsTab config={streamingConfig} />
        )}
      </div>
    </div>
  );
};

/**
 * Overview Tab
 */
const OverviewTab = ({ metrics }) => {
  const avgLatency = Math.round(metrics?.avgLatency || 0);
  const uptime = (metrics?.overallUptime || 100).toFixed(1);

  return (
    <div className="space-y-4">
      {/* Quick metrics */}
      <div className="grid grid-cols-4 gap-3">
        <MetricCard
          label="Total Updates"
          value={metrics?.totalUpdates || 0}
          color="blue"
        />
        <MetricCard
          label="Total Errors"
          value={metrics?.totalErrors || 0}
          color={metrics?.totalErrors > 0 ? 'red' : 'gray'}
        />
        <MetricCard
          label="Avg Latency"
          value={`${avgLatency}ms`}
          color={avgLatency < 100 ? 'green' : avgLatency < 500 ? 'yellow' : 'red'}
        />
        <MetricCard
          label="Uptime"
          value={`${uptime}%`}
          color={parseFloat(uptime) >= 99 ? 'green' : parseFloat(uptime) >= 95 ? 'yellow' : 'red'}
        />
      </div>

      {/* Session info */}
      <div className="bg-gray-800 rounded-lg p-3">
        <h4 className="text-xs text-gray-500 mb-2">Session Info</h4>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div>
            <span className="text-gray-500">Duration: </span>
            <span className="text-gray-300">{formatDuration(metrics?.sessionDuration)}</span>
          </div>
          <div>
            <span className="text-gray-500">Active Data Types: </span>
            <span className="text-gray-300">{metrics?.activeDataTypes || 0}</span>
          </div>
        </div>
      </div>

      {/* Source breakdown */}
      {metrics?.sources && Object.keys(metrics.sources).length > 0 && (
        <div className="bg-gray-800 rounded-lg p-3">
          <h4 className="text-xs text-gray-500 mb-2">Source Activity</h4>
          <div className="space-y-2">
            {Object.entries(metrics.sources).map(([id, data]) => (
              <div key={id} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <span>{DATA_SOURCES[id]?.icon || '📊'}</span>
                  <span className="text-gray-300">{DATA_SOURCES[id]?.name || id}</span>
                </div>
                <div className="flex items-center gap-4 text-xs">
                  <span className="text-gray-400">{data.totalUpdates} updates</span>
                  <span className={getLatencyColor(data.avgLatency)}>{Math.round(data.avgLatency)}ms</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * Sources Tab
 */
const SourcesTab = ({ currentSource, availableSources, metrics, onChangeSource }) => (
  <div className="space-y-3">
    {Object.entries(availableSources).map(([id, config]) => {
      const sourceMetrics = metrics?.sources?.[id];
      const isActive = currentSource === id;

      return (
        <div
          key={id}
          className={`p-3 rounded-lg border cursor-pointer transition-colors ${
            isActive
              ? 'bg-blue-900/30 border-blue-500'
              : 'bg-gray-800 border-gray-700 hover:border-gray-600'
          }`}
          onClick={() => !isActive && onChangeSource(id)}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="text-xl">{config.icon}</span>
              <div>
                <h4 className="text-sm font-medium text-white">{config.name}</h4>
                <p className="text-xs text-gray-500">{config.description}</p>
              </div>
            </div>
            {isActive && (
              <span className="text-xs bg-blue-600 text-white px-2 py-0.5 rounded">Active</span>
            )}
          </div>

          {sourceMetrics && (
            <div className="flex gap-4 text-xs text-gray-400 mt-2 pt-2 border-t border-gray-700">
              <span>Updates: {sourceMetrics.totalUpdates}</span>
              <span>Errors: {sourceMetrics.totalErrors}</span>
              <span className={getLatencyColor(sourceMetrics.avgLatency)}>
                Latency: {Math.round(sourceMetrics.avgLatency)}ms
              </span>
              <span className={getUptimeColor(sourceMetrics.uptime)}>
                Uptime: {sourceMetrics.uptime.toFixed(1)}%
              </span>
            </div>
          )}
        </div>
      );
    })}
  </div>
);

/**
 * Health Tab
 */
const HealthTab = ({ metrics }) => {
  const recentEvents = metricsService.getRecentEvents(20);

  return (
    <div className="space-y-4">
      {/* Health summary */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-gray-800 p-3 rounded-lg text-center">
          <div className={`text-2xl mb-1 ${metrics?.totalErrors === 0 ? 'text-green-400' : 'text-red-400'}`}>
            {metrics?.totalErrors === 0 ? '✓' : '✗'}
          </div>
          <p className="text-xs text-gray-500">Error Status</p>
        </div>
        <div className="bg-gray-800 p-3 rounded-lg text-center">
          <div className={`text-2xl mb-1 ${(metrics?.avgLatency || 0) < 500 ? 'text-green-400' : 'text-yellow-400'}`}>
            {(metrics?.avgLatency || 0) < 500 ? '⚡' : '🐢'}
          </div>
          <p className="text-xs text-gray-500">Latency</p>
        </div>
        <div className="bg-gray-800 p-3 rounded-lg text-center">
          <div className={`text-2xl mb-1 ${(metrics?.overallUptime || 100) >= 99 ? 'text-green-400' : 'text-yellow-400'}`}>
            {(metrics?.overallUptime || 100) >= 99 ? '🟢' : '🟡'}
          </div>
          <p className="text-xs text-gray-500">Uptime</p>
        </div>
      </div>

      {/* Recent events timeline */}
      <div className="bg-gray-800 rounded-lg p-3">
        <h4 className="text-xs text-gray-500 mb-3">Recent Events</h4>
        <div className="space-y-2 max-h-[200px] overflow-y-auto">
          {recentEvents.length === 0 ? (
            <p className="text-xs text-gray-500 text-center py-4">No events yet</p>
          ) : (
            recentEvents.map((event, i) => (
              <div key={i} className="flex items-center gap-3 text-xs">
                <span className={event.type === 'error' ? 'text-red-400' : 'text-green-400'}>
                  {event.type === 'error' ? '✗' : '✓'}
                </span>
                <span className="text-gray-500 font-mono w-16">{formatRelativeTime(event.timestamp)}</span>
                <span className="text-gray-400">{event.dataType}</span>
                {event.latency && (
                  <span className={getLatencyColor(event.latency)}>{event.latency}ms</span>
                )}
                {event.error && (
                  <span className="text-red-400 truncate max-w-[150px]" title={event.error}>
                    {event.error}
                  </span>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

/**
 * Settings Tab
 */
const SettingsTab = ({ config }) => {
  if (!config) {
    return <p className="text-gray-500 text-sm">Settings not available</p>;
  }

  const { globalInterval, setGlobalInterval, isPaused, togglePause, PRESETS, resetToDefaults, timeframe, setTimeframe, TIMEFRAMES } = config;

  return (
    <div className="space-y-4">
      {/* Timeframe selector */}
      <div className="bg-gray-800 rounded-lg p-4">
        <h4 className="text-sm font-medium text-gray-300 mb-3">Trading Timeframe</h4>
        <div className="flex flex-wrap gap-2">
          {TIMEFRAMES && Object.entries(TIMEFRAMES).map(([key, { label }]) => (
            <button
              key={key}
              onClick={() => setTimeframe(key)}
              className={`px-3 py-1.5 rounded text-xs transition-colors ${
                timeframe === key
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <p className="text-xs text-gray-500 mt-2">Affects candle period and analysis lookback across all charts</p>
      </div>

      {/* Update interval */}
      <div className="bg-gray-800 rounded-lg p-4">
        <h4 className="text-sm font-medium text-gray-300 mb-3">Refresh Interval</h4>

        {/* Presets */}
        <div className="flex gap-2 mb-4">
          {Object.entries(PRESETS).map(([name, value]) => (
            <button
              key={name}
              onClick={() => setGlobalInterval(value)}
              className={`px-3 py-1.5 rounded text-xs transition-colors ${
                globalInterval === value
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              {name} ({value / 1000}s)
            </button>
          ))}
        </div>

        {/* Custom slider */}
        <div className="space-y-2">
          <input
            type="range"
            min={1000}
            max={30000}
            step={1000}
            value={globalInterval}
            onChange={(e) => setGlobalInterval(parseInt(e.target.value, 10))}
            className="w-full accent-blue-500"
          />
          <div className="flex justify-between text-xs text-gray-500">
            <span>1s (Fast)</span>
            <span className="text-gray-300 font-medium">{globalInterval / 1000}s</span>
            <span>30s (Slow)</span>
          </div>
        </div>
      </div>

      {/* Streaming control */}
      <div className="bg-gray-800 rounded-lg p-4">
        <h4 className="text-sm font-medium text-gray-300 mb-3">Streaming Control</h4>
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-400">
            {isPaused ? 'Streaming is paused' : 'Streaming is active'}
          </span>
          <button
            onClick={togglePause}
            className={`px-4 py-2 rounded text-sm transition-colors ${
              isPaused
                ? 'bg-green-600 text-white hover:bg-green-500'
                : 'bg-yellow-600 text-white hover:bg-yellow-500'
            }`}
          >
            {isPaused ? 'Resume Streaming' : 'Pause Streaming'}
          </button>
        </div>
      </div>

      {/* Reset */}
      <div className="flex justify-end">
        <button
          onClick={resetToDefaults}
          className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
        >
          Reset to Defaults
        </button>
      </div>
    </div>
  );
};

export default DataAggregatorCompact;
