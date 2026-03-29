/**
 * Data Source Context
 * Provides unified data access regardless of source (mock, DefiLlama, CoinGecko)
 * Runtime toggle allows switching between sources without restart
 */

import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';

// Import metrics service for tracking
import metricsService from './metricsService';

// Import streaming data store for incremental updates
import { streamingDataStore } from './streamingDataStore';

// Import mock generators
import { generateOrderflowData } from '../utils/dataGenerator';
import { generateVolumeProfile, analyzeDelta } from '../utils/volumeAnalysis';
import { analyzeMarketStructure, detectExhaustionAbsorption } from '../utils/marketAnalysis';
import { analyzeDeltaDivergence } from '../utils/deltaDivergenceAnalysis';
import { analyzeLiquiditySweeps } from '../utils/liquiditySweepAnalysis';
import { analyzeImbalances } from '../utils/imbalanceAnalysis';
import { analyzeCVDTrends } from '../utils/cvdAnalysis';
import { analyzeAbsorptionFlow } from '../utils/absorptionFlowAnalysis';
import { analyzeConfluence } from '../utils/confluenceEngine';
import { analyzeWyckoffPhases } from '../utils/wyckoffAnalysis';
import { analyzeSmartMoneyConcepts } from '../utils/smartMoneyAnalysis';
import { scanMEVOpportunities } from '../utils/mevAnalysis';
import { generateMarketProfile } from '../utils/marketProfileAnalysis';
import { generateLiquidityHeatmap } from '../utils/liquidityAnalysis';
import { analyzeInstitutionalFootprint } from '../utils/institutionalAnalysis';
import { generateTradingInsights } from '../utils/insightsEngine';
import { generateFundingRateData, analyzeOpenInterest, generateFundingOIData } from '../utils/derivativesAnalysis';

// Data source configurations
export const DATA_SOURCES = {
  mock: {
    id: 'mock',
    name: 'Mock Data',
    icon: '🔧',
    description: 'Simulated streaming data for development',
    requiresApiKey: false
  },
  defilama: {
    id: 'defilama',
    name: 'DefiLlama',
    icon: '🦙',
    description: 'Real-time DEX volumes, prices, TVL',
    requiresApiKey: false, // Most endpoints free
    baseUrl: 'https://api.llama.fi'
  },
  coingecko: {
    id: 'coingecko',
    name: 'CoinGecko',
    icon: '🦎',
    description: 'Prices, OHLCV, DEX pool data',
    requiresApiKey: false, // Demo tier available
    baseUrl: 'https://api.coingecko.com/api/v3'
  }
};

// Mock generator mapping
const mockGenerators = {
  orderflow: generateOrderflowData,
  volumeProfile: generateVolumeProfile,
  delta: analyzeDelta,
  marketStructure: analyzeMarketStructure,
  exhaustion: detectExhaustionAbsorption,
  deltaDivergence: analyzeDeltaDivergence,
  liquiditySweeps: analyzeLiquiditySweeps,
  imbalances: analyzeImbalances,
  cvdTrends: analyzeCVDTrends,
  absorptionFlow: analyzeAbsorptionFlow,
  confluence: analyzeConfluence,
  wyckoff: analyzeWyckoffPhases,
  smartMoney: analyzeSmartMoneyConcepts,
  mevOpportunities: scanMEVOpportunities,
  marketProfile: generateMarketProfile,
  liquidityHeatmap: generateLiquidityHeatmap,
  institutional: analyzeInstitutionalFootprint,
  insights: generateTradingInsights,
  fundingRate: generateFundingRateData,
  openInterest: analyzeOpenInterest,
  fundingOI: generateFundingOIData
};

// Create context
const DataSourceContext = createContext(null);

/**
 * Data Source Provider Component
 */
export function DataSourceProvider({ children }) {
  // Current active source
  const [source, setSource] = useState(() => {
    // Check localStorage for persisted preference
    const saved = localStorage.getItem('dataSource');
    return saved && DATA_SOURCES[saved] ? saved : 'mock';
  });

  // Connection/streaming state
  const [isConnected, setIsConnected] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);

  // Service instances (lazy loaded)
  const servicesRef = useRef({});

  // Streaming subscriptions
  const subscriptionsRef = useRef(new Map());

  // Persist source preference
  useEffect(() => {
    localStorage.setItem('dataSource', source);
  }, [source]);

  /**
   * Get or create service instance for current source
   */
  const getService = useCallback(async (sourceId) => {
    if (sourceId === 'mock') return null;

    if (!servicesRef.current[sourceId]) {
      try {
        if (sourceId === 'defilama') {
          const { DefiLlamaService } = await import('./defiLlamaService.js');
          servicesRef.current[sourceId] = new DefiLlamaService(
            import.meta.env.VITE_DEFILAMA_API_KEY
          );
        } else if (sourceId === 'coingecko') {
          const { CoinGeckoService } = await import('./coinGeckoService.js');
          servicesRef.current[sourceId] = new CoinGeckoService(
            import.meta.env.VITE_COINGECKO_API_KEY
          );
        }
      } catch (err) {
        console.warn(`Service ${sourceId} not available, using mock data:`, err.message);
        return null;
      }
    }

    return servicesRef.current[sourceId];
  }, []);

  /**
   * Fetch data from current source
   * @param {string} dataType - Type of data to fetch (orderflow, volumeProfile, etc.)
   * @param {object} params - Optional parameters for the request
   */
  const getData = useCallback(async (dataType, params = {}) => {
    setError(null);

    try {
      // Mock source - use generators with incremental updates
      if (source === 'mock') {
        const generator = mockGenerators[dataType];
        if (!generator) {
          throw new Error(`Unknown data type: ${dataType}`);
        }

        // Get existing data for incremental updates
        const existingData = streamingDataStore.get(dataType);

        // Pass existing data to generator for incremental update
        const data = generator(existingData, params);

        // Store the result for next update
        streamingDataStore.set(dataType, data);

        setLastUpdate(Date.now());
        return { data, source: 'mock' };
      }

      // Real API sources
      const service = await getService(source);
      if (!service) {
        // Fallback to mock if service unavailable
        console.warn(`Falling back to mock for ${dataType}`);
        const generator = mockGenerators[dataType];
        if (generator) {
          const existingData = streamingDataStore.get(dataType);
          const data = generator(existingData, params);
          streamingDataStore.set(dataType, data);
          return { data, source: 'mock', fallback: true };
        }
        throw new Error(`No fallback available for ${dataType}`);
      }

      // Call service method
      const methodName = `get${dataType.charAt(0).toUpperCase() + dataType.slice(1)}`;
      if (typeof service[methodName] !== 'function') {
        // Try generic getData method
        if (typeof service.getData === 'function') {
          const data = await service.getData(dataType, params);
          setLastUpdate(Date.now());
          return { data, source };
        }
        throw new Error(`Method ${methodName} not found on ${source} service`);
      }

      const data = await service[methodName](params);
      setLastUpdate(Date.now());
      return { data, source };

    } catch (err) {
      setError(err.message);
      console.error(`Error fetching ${dataType} from ${source}:`, err);

      // Attempt fallback to mock with incremental updates
      const generator = mockGenerators[dataType];
      if (generator) {
        console.warn(`Using mock fallback for ${dataType}`);
        const existingData = streamingDataStore.get(dataType);
        const data = generator(existingData, params);
        streamingDataStore.set(dataType, data);
        return { data, source: 'mock', fallback: true, error: err.message };
      }

      throw err;
    }
  }, [source, getService]);

  /**
   * Subscribe to streaming data updates
   * @param {string} dataType - Type of data to stream
   * @param {function} callback - Function to call with new data
   * @param {number} intervalMs - Update interval in milliseconds
   */
  const subscribe = useCallback((dataType, callback, intervalMs = 5000) => {
    const subscriptionKey = `${dataType}-${Date.now()}`;

    // Create streaming interval
    const tick = async () => {
      try {
        const result = await getData(dataType);
        callback(result);
      } catch (err) {
        console.error(`Stream error for ${dataType}:`, err);
      }
    };

    // Initial tick
    tick();

    // Set up interval
    const intervalId = setInterval(tick, intervalMs);
    subscriptionsRef.current.set(subscriptionKey, intervalId);
    setIsStreaming(true);

    // Return unsubscribe function
    return () => {
      clearInterval(intervalId);
      subscriptionsRef.current.delete(subscriptionKey);
      if (subscriptionsRef.current.size === 0) {
        setIsStreaming(false);
      }
    };
  }, [getData]);

  /**
   * Change data source
   */
  const changeSource = useCallback(async (newSource) => {
    if (!DATA_SOURCES[newSource]) {
      throw new Error(`Unknown source: ${newSource}`);
    }

    // Clear existing subscriptions
    for (const [key, intervalId] of subscriptionsRef.current) {
      clearInterval(intervalId);
    }
    subscriptionsRef.current.clear();
    setIsStreaming(false);

    // Clear stored data when switching sources (start fresh)
    streamingDataStore.clearAll();

    // Disconnect current service
    if (servicesRef.current[source] && typeof servicesRef.current[source].disconnect === 'function') {
      servicesRef.current[source].disconnect();
    }

    setSource(newSource);
    setIsConnected(false);
    setError(null);

    // Try to connect new service
    if (newSource !== 'mock') {
      try {
        const service = await getService(newSource);
        if (service && typeof service.connect === 'function') {
          await service.connect();
          setIsConnected(true);
        }
      } catch (err) {
        console.error(`Failed to connect to ${newSource}:`, err);
        setError(err.message);
      }
    } else {
      setIsConnected(true);
    }
  }, [source, getService]);

  /**
   * Get available data types for current source
   */
  const getAvailableDataTypes = useCallback(() => {
    if (source === 'mock') {
      return Object.keys(mockGenerators);
    }

    // Each service defines its available types
    const service = servicesRef.current[source];
    if (service && typeof service.getAvailableTypes === 'function') {
      return service.getAvailableTypes();
    }

    // Default types available from all services
    return ['prices', 'volumes', 'tvl'];
  }, [source]);

  // Context value
  const value = {
    // Current state
    source,
    sourceConfig: DATA_SOURCES[source],
    isConnected: source === 'mock' || isConnected,
    isStreaming,
    error,
    lastUpdate,

    // Available sources
    availableSources: DATA_SOURCES,

    // Methods
    getData,
    subscribe,
    changeSource,
    getAvailableDataTypes,

    // Direct access to mock generators (for backwards compatibility)
    mockGenerators
  };

  return (
    <DataSourceContext.Provider value={value}>
      {children}
    </DataSourceContext.Provider>
  );
}

/**
 * Hook to access data source context
 */
export function useDataSource() {
  const context = useContext(DataSourceContext);
  if (!context) {
    throw new Error('useDataSource must be used within a DataSourceProvider');
  }
  return context;
}

/**
 * Hook for streaming data subscription
 * @param {string} dataType - Type of data to stream
 * @param {number} intervalMs - Update interval
 */
export function useStreamingData(dataType, intervalMs = 5000) {
  const { subscribe, source } = useDataSource();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    setError(null);

    const unsubscribe = subscribe(
      dataType,
      (result) => {
        setData(result.data);
        setLoading(false);
        if (result.error) {
          setError(result.error);
        }
      },
      intervalMs
    );

    return unsubscribe;
  }, [dataType, intervalMs, subscribe, source]);

  return { data, loading, error, source };
}

/**
 * Enhanced streaming hook with metrics integration
 * Provides latency tracking, staleness detection, and metrics recording
 *
 * @param {string} dataType - Type of data to stream
 * @param {number} intervalMs - Update interval in milliseconds
 * @param {object} options - Optional configuration
 * @param {boolean} options.enabled - Whether streaming is enabled (default: true)
 * @param {function} options.onUpdate - Callback on successful update
 * @param {function} options.onError - Callback on error
 */
export function useEnhancedStreamingData(dataType, intervalMs = 5000, options = {}) {
  const { getData, source } = useDataSource();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [latency, setLatency] = useState(0);
  const [updateCount, setUpdateCount] = useState(0);

  const { enabled = true, onUpdate, onError } = options;

  // Track if component is mounted
  const mountedRef = useRef(true);
  const intervalRef = useRef(null);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (!enabled) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    setLoading(true);
    setError(null);

    const fetchData = async () => {
      const startTime = Date.now();

      try {
        const result = await getData(dataType);
        const endTime = Date.now();
        const fetchLatency = endTime - startTime;

        if (!mountedRef.current) return;

        setData(result.data);
        setLoading(false);
        setLastUpdate(endTime);
        setLatency(fetchLatency);
        setUpdateCount(prev => prev + 1);

        // Record metrics
        metricsService.recordUpdate(result.source || source, dataType, {
          latency: fetchLatency,
          dataSize: JSON.stringify(result.data).length
        });

        // Handle errors in result
        if (result.error) {
          setError(result.error);
          metricsService.recordError(result.source || source, dataType, result.error);
          onError?.(result.error);
        } else {
          setError(null);
          onUpdate?.(result.data);
        }
      } catch (err) {
        if (!mountedRef.current) return;

        const endTime = Date.now();
        const fetchLatency = endTime - startTime;

        setLoading(false);
        setError(err.message);
        setLatency(fetchLatency);

        // Record error in metrics
        metricsService.recordError(source, dataType, err);
        onError?.(err);
      }
    };

    // Initial fetch
    fetchData();

    // Set up interval
    intervalRef.current = setInterval(fetchData, intervalMs);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [dataType, intervalMs, enabled, getData, source, onUpdate, onError]);

  // Calculate staleness
  const isStale = lastUpdate && (Date.now() - lastUpdate) > intervalMs * 2;

  return {
    data,
    loading,
    error,
    source,
    lastUpdate,
    latency,
    updateCount,
    isStale,
    isHealthy: !error && !isStale
  };
}

export default DataSourceContext;
