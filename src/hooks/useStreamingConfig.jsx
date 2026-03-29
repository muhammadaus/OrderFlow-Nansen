/**
 * Streaming Configuration Hook
 * Provides configurable update frequency with persistence
 * Supports global and per-component interval settings
 */

import React, { useState, useEffect, createContext, useContext, useCallback } from 'react';

// Constants
const DEFAULT_INTERVAL = 5000;  // 5 seconds
const MIN_INTERVAL = 1000;      // 1 second minimum
const MAX_INTERVAL = 60000;     // 60 seconds maximum
const DEFAULT_TIMEFRAME = '5m';

// Presets for quick selection
const PRESETS = {
  FAST: 1000,
  NORMAL: 5000,
  SLOW: 15000,
  RELAXED: 30000
};

// Trading timeframes
const TIMEFRAMES = {
  '1m': { label: '1 Min', seconds: 60 },
  '5m': { label: '5 Min', seconds: 300 },
  '15m': { label: '15 Min', seconds: 900 },
  '1h': { label: '1 Hour', seconds: 3600 },
  '4h': { label: '4 Hour', seconds: 14400 },
  '1d': { label: '1 Day', seconds: 86400 },
};

// Create context
const StreamingConfigContext = createContext(null);

/**
 * Streaming Configuration Provider
 * Wrap your app with this to enable streaming configuration
 */
export function StreamingConfigProvider({ children }) {
  // Global interval setting (persisted to localStorage)
  const [globalInterval, setGlobalIntervalState] = useState(() => {
    if (typeof window === 'undefined') return DEFAULT_INTERVAL;
    const saved = localStorage.getItem('streamingInterval');
    const parsed = saved ? parseInt(saved, 10) : DEFAULT_INTERVAL;
    return isNaN(parsed) ? DEFAULT_INTERVAL : parsed;
  });

  // Global timeframe setting (persisted to localStorage)
  const [timeframe, setTimeframeState] = useState(() => {
    if (typeof window === 'undefined') return DEFAULT_TIMEFRAME;
    const saved = localStorage.getItem('tradingTimeframe');
    return saved && TIMEFRAMES[saved] ? saved : DEFAULT_TIMEFRAME;
  });

  // Per-component interval overrides
  const [componentIntervals, setComponentIntervals] = useState({});

  // Global pause state
  const [isPaused, setIsPaused] = useState(false);

  // Per-component pause states
  const [componentPaused, setComponentPaused] = useState({});

  // Persist global interval to localStorage
  useEffect(() => {
    localStorage.setItem('streamingInterval', globalInterval.toString());
  }, [globalInterval]);

  // Persist timeframe to localStorage
  useEffect(() => {
    localStorage.setItem('tradingTimeframe', timeframe);
  }, [timeframe]);

  // Set timeframe with validation
  const setTimeframe = useCallback((tf) => {
    if (TIMEFRAMES[tf]) {
      setTimeframeState(tf);
    }
  }, []);

  // Get timeframe in seconds
  const getTimeframeSeconds = useCallback(() => {
    return TIMEFRAMES[timeframe]?.seconds || 300;
  }, [timeframe]);

  // Clamp value to valid range
  const clampInterval = useCallback((ms) => {
    return Math.max(MIN_INTERVAL, Math.min(MAX_INTERVAL, ms));
  }, []);

  // Set global interval with clamping
  const setGlobalInterval = useCallback((ms) => {
    setGlobalIntervalState(clampInterval(ms));
  }, [clampInterval]);

  // Get interval for a specific component (falls back to global)
  const getInterval = useCallback((componentId) => {
    if (componentId && componentIntervals[componentId] !== undefined) {
      return componentIntervals[componentId];
    }
    return globalInterval;
  }, [componentIntervals, globalInterval]);

  // Set interval for a specific component
  const setComponentInterval = useCallback((componentId, ms) => {
    if (!componentId) return;
    setComponentIntervals(prev => ({
      ...prev,
      [componentId]: clampInterval(ms)
    }));
  }, [clampInterval]);

  // Clear component-specific interval (revert to global)
  const clearComponentInterval = useCallback((componentId) => {
    if (!componentId) return;
    setComponentIntervals(prev => {
      const { [componentId]: _, ...rest } = prev;
      return rest;
    });
  }, []);

  // Toggle global pause
  const togglePause = useCallback(() => {
    setIsPaused(p => !p);
  }, []);

  // Check if a specific component is paused
  const isComponentPaused = useCallback((componentId) => {
    if (isPaused) return true; // Global pause overrides
    if (componentId && componentPaused[componentId] !== undefined) {
      return componentPaused[componentId];
    }
    return false;
  }, [isPaused, componentPaused]);

  // Toggle pause for a specific component
  const toggleComponentPause = useCallback((componentId) => {
    if (!componentId) return;
    setComponentPaused(prev => ({
      ...prev,
      [componentId]: !prev[componentId]
    }));
  }, []);

  // Get all active component intervals
  const getActiveComponents = useCallback(() => {
    return Object.entries(componentIntervals).map(([id, interval]) => ({
      id,
      interval,
      isPaused: isComponentPaused(id)
    }));
  }, [componentIntervals, isComponentPaused]);

  // Reset all settings to defaults
  const resetToDefaults = useCallback(() => {
    setGlobalIntervalState(DEFAULT_INTERVAL);
    setComponentIntervals({});
    setIsPaused(false);
    setComponentPaused({});
    localStorage.removeItem('streamingInterval');
  }, []);

  const value = {
    // Global settings
    globalInterval,
    setGlobalInterval,
    isPaused,
    togglePause,

    // Timeframe settings
    timeframe,
    setTimeframe,
    getTimeframeSeconds,
    TIMEFRAMES,

    // Per-component settings
    getInterval,
    setComponentInterval,
    clearComponentInterval,
    isComponentPaused,
    toggleComponentPause,

    // Utilities
    getActiveComponents,
    resetToDefaults,

    // Constants
    PRESETS,
    MIN_INTERVAL,
    MAX_INTERVAL,
    DEFAULT_INTERVAL
  };

  return (
    <StreamingConfigContext.Provider value={value}>
      {children}
    </StreamingConfigContext.Provider>
  );
}

/**
 * Hook to access streaming configuration
 * @param {string} componentId - Optional component identifier for per-component settings
 */
export function useStreamingConfig(componentId = null) {
  const context = useContext(StreamingConfigContext);

  if (!context) {
    throw new Error('useStreamingConfig must be used within a StreamingConfigProvider');
  }

  // Return component-specific interface if componentId provided
  if (componentId) {
    return {
      // Component-specific
      interval: context.getInterval(componentId),
      setInterval: (ms) => context.setComponentInterval(componentId, ms),
      clearInterval: () => context.clearComponentInterval(componentId),
      isPaused: context.isComponentPaused(componentId),
      togglePause: () => context.toggleComponentPause(componentId),

      // Global access
      globalInterval: context.globalInterval,
      setGlobalInterval: context.setGlobalInterval,
      isGloballyPaused: context.isPaused,
      toggleGlobalPause: context.togglePause,

      // Timeframe access
      timeframe: context.timeframe,
      setTimeframe: context.setTimeframe,
      getTimeframeSeconds: context.getTimeframeSeconds,
      TIMEFRAMES: context.TIMEFRAMES,

      // Constants
      PRESETS: context.PRESETS,
      MIN_INTERVAL: context.MIN_INTERVAL,
      MAX_INTERVAL: context.MAX_INTERVAL
    };
  }

  // Return full context for global use
  return context;
}

export default StreamingConfigProvider;
