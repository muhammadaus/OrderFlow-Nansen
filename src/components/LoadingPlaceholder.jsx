/**
 * Loading Placeholder Component
 * Skeleton loading animations for components during initial data fetch
 */

import React from 'react';

/**
 * Basic skeleton block
 */
const SkeletonBlock = ({ className = '', animate = true }) => (
  <div
    className={`bg-gray-800 rounded ${animate ? 'animate-pulse' : ''} ${className}`}
  />
);

/**
 * Skeleton text line
 */
const SkeletonLine = ({ width = 'w-full', height = 'h-4', className = '' }) => (
  <SkeletonBlock className={`${width} ${height} ${className}`} />
);

/**
 * Main Loading Placeholder Component
 *
 * @param {number} height - Minimum height in pixels
 * @param {string} variant - Type of placeholder (chart, table, stats, grid)
 * @param {string} title - Optional title to show
 */
const LoadingPlaceholder = ({
  height = 400,
  variant = 'chart',
  title = null,
  className = ''
}) => {
  const renderContent = () => {
    switch (variant) {
      case 'table':
        return (
          <>
            {/* Table header */}
            <div className="flex gap-4 mb-4 pb-2 border-b border-gray-700">
              {[1, 2, 3, 4].map(i => (
                <SkeletonLine key={i} width="w-1/4" height="h-4" />
              ))}
            </div>
            {/* Table rows */}
            {[1, 2, 3, 4, 5].map(row => (
              <div key={row} className="flex gap-4 mb-3">
                {[1, 2, 3, 4].map(col => (
                  <SkeletonLine key={col} width="w-1/4" height="h-6" />
                ))}
              </div>
            ))}
          </>
        );

      case 'stats':
        return (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="space-y-2">
                <SkeletonLine width="w-1/2" height="h-3" />
                <SkeletonLine width="w-3/4" height="h-8" />
              </div>
            ))}
          </div>
        );

      case 'grid':
        return (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <SkeletonBlock key={i} className="h-32" />
            ))}
          </div>
        );

      case 'list':
        return (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="flex items-center gap-3">
                <SkeletonBlock className="w-10 h-10 rounded-full" />
                <div className="flex-1 space-y-2">
                  <SkeletonLine width="w-1/3" height="h-4" />
                  <SkeletonLine width="w-2/3" height="h-3" />
                </div>
              </div>
            ))}
          </div>
        );

      case 'chart':
      default:
        return (
          <>
            {/* Quick stats row */}
            <div className="grid grid-cols-4 gap-4 mb-6">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="space-y-2">
                  <SkeletonLine width="w-1/2" height="h-3" />
                  <SkeletonLine width="w-3/4" height="h-6" />
                </div>
              ))}
            </div>

            {/* Chart area */}
            <SkeletonBlock className="flex-1 min-h-[200px]" />

            {/* Legend/controls */}
            <div className="flex justify-between items-center mt-4">
              <div className="flex gap-4">
                {[1, 2, 3].map(i => (
                  <SkeletonLine key={i} width="w-16" height="h-4" />
                ))}
              </div>
              <SkeletonLine width="w-24" height="h-6" />
            </div>
          </>
        );
    }
  };

  return (
    <div
      className={`bg-gray-900 rounded-lg p-4 ${className}`}
      style={{ minHeight: height }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="space-y-2">
          {title ? (
            <h3 className="text-lg font-semibold text-gray-300">{title}</h3>
          ) : (
            <SkeletonLine width="w-48" height="h-6" />
          )}
          <SkeletonLine width="w-32" height="h-3" />
        </div>

        {/* Loading spinner */}
        <div className="flex items-center gap-2 text-gray-500">
          <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          <span className="text-xs">Loading...</span>
        </div>
      </div>

      {/* Content based on variant */}
      <div className="flex flex-col" style={{ minHeight: height - 100 }}>
        {renderContent()}
      </div>
    </div>
  );
};

/**
 * Inline loading indicator for smaller elements
 */
export const InlineLoader = ({ text = 'Loading...', size = 'sm' }) => {
  const sizeClasses = {
    xs: 'h-3 w-3',
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6'
  };

  return (
    <div className="flex items-center gap-2 text-gray-400">
      <svg className={`animate-spin ${sizeClasses[size]}`} fill="none" viewBox="0 0 24 24">
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
      </svg>
      <span className="text-xs">{text}</span>
    </div>
  );
};

/**
 * Error state placeholder
 */
export const ErrorPlaceholder = ({
  error,
  onRetry,
  height = 200,
  className = ''
}) => (
  <div
    className={`bg-gray-900 rounded-lg p-4 flex flex-col items-center justify-center ${className}`}
    style={{ minHeight: height }}
  >
    <div className="text-red-400 mb-3">
      <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
        />
      </svg>
    </div>
    <p className="text-gray-400 text-sm mb-3 text-center max-w-xs">
      {error || 'Something went wrong while loading data.'}
    </p>
    {onRetry && (
      <button
        onClick={onRetry}
        className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded text-sm transition-colors"
      >
        Try Again
      </button>
    )}
  </div>
);

/**
 * No data placeholder
 */
export const NoDataPlaceholder = ({
  message = 'No data available',
  height = 200,
  className = ''
}) => (
  <div
    className={`bg-gray-900 rounded-lg p-4 flex flex-col items-center justify-center ${className}`}
    style={{ minHeight: height }}
  >
    <div className="text-gray-600 mb-3">
      <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
        />
      </svg>
    </div>
    <p className="text-gray-500 text-sm">{message}</p>
  </div>
);

export default LoadingPlaceholder;
