/**
 * Data Source Toggle Component
 * Dropdown selector for switching between data sources at runtime
 */

import React from 'react';
import { useDataSource, DATA_SOURCES } from '../services/dataSourceContext';

const DataSourceToggle = () => {
  const {
    source,
    sourceConfig,
    changeSource,
    isConnected,
    isStreaming,
    error,
    lastUpdate
  } = useDataSource();

  const handleSourceChange = async (e) => {
    const newSource = e.target.value;
    try {
      await changeSource(newSource);
    } catch (err) {
      console.error('Failed to change source:', err);
    }
  };

  const formatLastUpdate = () => {
    if (!lastUpdate) return '';
    const seconds = Math.floor((Date.now() - lastUpdate) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    return `${Math.floor(seconds / 60)}m ago`;
  };

  return (
    <div className="flex items-center gap-3">
      {/* Source selector */}
      <div className="relative">
        <select
          value={source}
          onChange={handleSourceChange}
          className="appearance-none bg-gray-800 text-white text-sm rounded-lg px-3 py-2 pr-8 border border-gray-600 hover:border-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
        >
          {Object.values(DATA_SOURCES).map((src) => (
            <option key={src.id} value={src.id}>
              {src.icon} {src.name}
            </option>
          ))}
        </select>
        <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>

      {/* Connection status indicator */}
      <div className="flex items-center gap-2">
        {/* Connection dot */}
        <div
          className={`w-2 h-2 rounded-full ${
            error
              ? 'bg-red-500'
              : isConnected
              ? 'bg-green-500'
              : 'bg-yellow-500 animate-pulse'
          }`}
          title={
            error
              ? `Error: ${error}`
              : isConnected
              ? 'Connected'
              : 'Connecting...'
          }
        />

        {/* Streaming indicator */}
        {isStreaming && (
          <div className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse" />
            <span className="text-xs text-blue-400">Live</span>
          </div>
        )}

        {/* Last update time */}
        {lastUpdate && (
          <span className="text-xs text-gray-500 hidden sm:inline">
            {formatLastUpdate()}
          </span>
        )}
      </div>

      {/* Error tooltip */}
      {error && (
        <div className="relative group">
          <span className="text-red-400 text-xs cursor-help">!</span>
          <div className="absolute bottom-full right-0 mb-2 hidden group-hover:block">
            <div className="bg-gray-800 text-red-300 text-xs rounded px-2 py-1 whitespace-nowrap border border-red-500">
              {error}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * Extended toggle with source info
 */
export const DataSourceToggleExtended = () => {
  const {
    source,
    sourceConfig,
    changeSource,
    isConnected,
    isStreaming,
    error,
    getAvailableDataTypes
  } = useDataSource();

  const availableTypes = getAvailableDataTypes();

  return (
    <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-300">Data Source</h3>
        <DataSourceToggle />
      </div>

      {/* Source description */}
      <p className="text-xs text-gray-400 mb-3">
        {sourceConfig?.description}
      </p>

      {/* Available data types */}
      <div className="flex flex-wrap gap-1">
        {availableTypes.map((type) => (
          <span
            key={type}
            className="text-xs bg-gray-700 text-gray-300 px-2 py-0.5 rounded"
          >
            {type}
          </span>
        ))}
      </div>

      {/* API key status for sources that need it */}
      {sourceConfig?.requiresApiKey && (
        <div className="mt-3 text-xs">
          {import.meta.env[`VITE_${source.toUpperCase()}_API_KEY`] ? (
            <span className="text-green-400">API key configured</span>
          ) : (
            <span className="text-yellow-400">
              No API key (using free tier)
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default DataSourceToggle;
