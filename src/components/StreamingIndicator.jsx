/**
 * Streaming Indicator Component
 * Shows real-time streaming status for individual components
 * Displays: live status, last update time, latency, errors
 */

import React, { useState, useEffect } from 'react';

/**
 * Format timestamp to human-readable relative time
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
 * Get latency color class based on response time
 */
const getLatencyColor = (latency) => {
  if (latency < 100) return 'text-green-400';
  if (latency < 300) return 'text-yellow-400';
  if (latency < 500) return 'text-orange-400';
  return 'text-red-400';
};

/**
 * Get status color based on component state
 */
const getStatusColor = (error, isStale, loading) => {
  if (error) return 'bg-red-500';
  if (loading) return 'bg-blue-500 animate-pulse';
  if (isStale) return 'bg-yellow-500';
  return 'bg-green-500 animate-pulse';
};

/**
 * Get status text based on component state
 */
const getStatusText = (error, isStale, loading) => {
  if (error) return 'Error';
  if (loading) return 'Loading';
  if (isStale) return 'Stale';
  return 'Live';
};

/**
 * Streaming Indicator Component
 *
 * @param {number} lastUpdate - Timestamp of last successful update
 * @param {number} latency - Response latency in milliseconds
 * @param {boolean} isStale - Whether data is considered stale
 * @param {boolean} loading - Whether component is loading
 * @param {string} error - Error message if any
 * @param {string} source - Data source identifier
 * @param {number} updateCount - Number of updates received
 * @param {boolean} compact - Use compact display mode
 * @param {boolean} showLatency - Show latency indicator
 * @param {boolean} showSource - Show source indicator
 */
const StreamingIndicator = ({
  lastUpdate,
  latency,
  isStale = false,
  loading = false,
  error = null,
  source = 'mock',
  updateCount = 0,
  compact = false,
  showLatency = true,
  showSource = false
}) => {
  // Force re-render every second to update relative time
  const [, setTick] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setTick(t => t + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const statusColor = getStatusColor(error, isStale, loading);
  const statusText = getStatusText(error, isStale, loading);

  // Compact mode - just a dot and status text
  if (compact) {
    return (
      <div className="flex items-center gap-1.5" title={error || `Updated: ${formatRelativeTime(lastUpdate)}`}>
        <div className={`w-1.5 h-1.5 rounded-full ${statusColor}`} />
        <span className="text-xs text-gray-400">{statusText}</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 text-xs">
      {/* Live indicator with status */}
      <div className="flex items-center gap-1.5">
        <div className={`w-2 h-2 rounded-full ${statusColor}`} />
        <span className={`font-medium ${error ? 'text-red-400' : isStale ? 'text-yellow-400' : 'text-green-400'}`}>
          {statusText}
        </span>
      </div>

      {/* Last update time */}
      <div className="text-gray-400">
        <span className="text-gray-500">Updated: </span>
        <span className="text-gray-300">{formatRelativeTime(lastUpdate)}</span>
      </div>

      {/* Latency */}
      {showLatency && latency > 0 && (
        <span className={`${getLatencyColor(latency)} font-mono`}>
          {latency}ms
        </span>
      )}

      {/* Source indicator */}
      {showSource && (
        <span className="text-gray-500">
          via <span className="text-gray-400">{source}</span>
        </span>
      )}

      {/* Update count badge */}
      {updateCount > 0 && (
        <span className="text-gray-600 font-mono">
          #{updateCount}
        </span>
      )}

      {/* Error tooltip */}
      {error && (
        <div className="relative group">
          <span className="text-red-400 cursor-help">
            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </span>
          <div className="absolute bottom-full left-0 mb-2 hidden group-hover:block z-50">
            <div className="bg-gray-900 text-red-300 text-xs rounded px-2 py-1 whitespace-nowrap border border-red-500/50 shadow-lg max-w-xs">
              {error}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * Streaming Indicator Bar - Full width bar variant
 */
export const StreamingIndicatorBar = ({
  lastUpdate,
  latency,
  isStale,
  loading,
  error,
  source,
  updateCount,
  dataType
}) => {
  const [, setTick] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => setTick(t => t + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  const statusColor = getStatusColor(error, isStale, loading);

  return (
    <div className="flex items-center justify-between bg-gray-800/50 rounded px-3 py-1.5 text-xs">
      <div className="flex items-center gap-3">
        {/* Status dot */}
        <div className={`w-2 h-2 rounded-full ${statusColor}`} />

        {/* Data type label */}
        {dataType && (
          <span className="text-gray-400 font-medium">{dataType}</span>
        )}

        {/* Source */}
        <span className="text-gray-500">
          {source === 'mock' ? '🔧' : source === 'defilama' ? '🦙' : '🦎'}
          <span className="ml-1">{source}</span>
        </span>
      </div>

      <div className="flex items-center gap-4">
        {/* Latency */}
        <span className={getLatencyColor(latency)}>
          {latency > 0 ? `${latency}ms` : '--'}
        </span>

        {/* Last update */}
        <span className="text-gray-400">
          {formatRelativeTime(lastUpdate)}
        </span>

        {/* Update count */}
        <span className="text-gray-600 font-mono">
          {updateCount} updates
        </span>

        {/* Error indicator */}
        {error && (
          <span className="text-red-400" title={error}>
            Error
          </span>
        )}
      </div>
    </div>
  );
};

export default StreamingIndicator;
