/**
 * Metrics Service
 * Singleton for tracking API health, latency, errors, and uptime
 * Provides real-time metrics for the Information Aggregator panel
 */

class MetricsService {
  constructor() {
    // Metrics per source:dataType key
    this.metrics = new Map();

    // History of events (for charts/timeline)
    this.history = new Map();

    // Subscribers for real-time updates
    this.listeners = new Set();

    // Configuration
    this.maxHistoryLength = 100;
    this.maxLatencyHistory = 50;

    // Session start time
    this.sessionStart = Date.now();
  }

  /**
   * Generate a unique key for source:dataType combination
   */
  _getKey(sourceId, dataType) {
    return `${sourceId}:${dataType}`;
  }

  /**
   * Get or create metrics object for a key
   */
  _getOrCreateMetrics(key, sourceId, dataType) {
    if (!this.metrics.has(key)) {
      this.metrics.set(key, {
        sourceId,
        dataType,
        updates: 0,
        errors: 0,
        lastUpdate: null,
        lastError: null,
        latencyHistory: [],
        avgLatency: 0,
        minLatency: Infinity,
        maxLatency: 0,
        uptime: 100,
        consecutiveErrors: 0,
        firstSeen: Date.now()
      });
    }
    return this.metrics.get(key);
  }

  /**
   * Record a successful data update
   * @param {string} sourceId - Data source identifier (mock, defilama, coingecko)
   * @param {string} dataType - Type of data (orderflow, deltaDivergence, etc.)
   * @param {object} metadata - Optional metadata { latency, dataSize, etc. }
   */
  recordUpdate(sourceId, dataType, metadata = {}) {
    const key = this._getKey(sourceId, dataType);
    const now = Date.now();
    const metric = this._getOrCreateMetrics(key, sourceId, dataType);

    // Update counts
    metric.updates++;
    metric.lastUpdate = now;
    metric.consecutiveErrors = 0;

    // Track latency
    if (metadata.latency !== undefined && metadata.latency >= 0) {
      metric.latencyHistory.push(metadata.latency);

      // Keep history bounded
      if (metric.latencyHistory.length > this.maxLatencyHistory) {
        metric.latencyHistory.shift();
      }

      // Calculate stats
      metric.avgLatency = metric.latencyHistory.reduce((a, b) => a + b, 0) / metric.latencyHistory.length;
      metric.minLatency = Math.min(metric.minLatency, metadata.latency);
      metric.maxLatency = Math.max(metric.maxLatency, metadata.latency);
    }

    // Calculate uptime
    metric.uptime = (metric.updates / (metric.updates + metric.errors)) * 100;

    // Add to history
    this._addToHistory(key, {
      timestamp: now,
      type: 'update',
      latency: metadata.latency,
      dataSize: metadata.dataSize
    });

    // Notify listeners
    this._notifyListeners();

    return metric;
  }

  /**
   * Record an error
   * @param {string} sourceId - Data source identifier
   * @param {string} dataType - Type of data
   * @param {Error|string} error - Error object or message
   */
  recordError(sourceId, dataType, error) {
    const key = this._getKey(sourceId, dataType);
    const now = Date.now();
    const metric = this._getOrCreateMetrics(key, sourceId, dataType);

    // Update counts
    metric.errors++;
    metric.consecutiveErrors++;
    metric.lastError = {
      timestamp: now,
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    };

    // Recalculate uptime
    metric.uptime = (metric.updates / (metric.updates + metric.errors)) * 100;

    // Add to history
    this._addToHistory(key, {
      timestamp: now,
      type: 'error',
      error: metric.lastError.message
    });

    // Notify listeners
    this._notifyListeners();

    return metric;
  }

  /**
   * Add entry to history
   */
  _addToHistory(key, entry) {
    if (!this.history.has(key)) {
      this.history.set(key, []);
    }
    const hist = this.history.get(key);
    hist.push(entry);

    // Keep bounded
    if (hist.length > this.maxHistoryLength) {
      hist.shift();
    }
  }

  /**
   * Get metrics for a specific source/dataType
   */
  getMetrics(sourceId, dataType) {
    const key = this._getKey(sourceId, dataType);
    return this.metrics.get(key) || null;
  }

  /**
   * Get all metrics aggregated by source
   */
  getMetricsBySource() {
    const bySource = {};

    this.metrics.forEach((metric) => {
      const { sourceId } = metric;
      if (!bySource[sourceId]) {
        bySource[sourceId] = {
          sourceId,
          dataTypes: [],
          totalUpdates: 0,
          totalErrors: 0,
          avgLatency: 0,
          uptime: 100,
          lastUpdate: null
        };
      }

      const source = bySource[sourceId];
      source.dataTypes.push(metric.dataType);
      source.totalUpdates += metric.updates;
      source.totalErrors += metric.errors;

      if (metric.lastUpdate && (!source.lastUpdate || metric.lastUpdate > source.lastUpdate)) {
        source.lastUpdate = metric.lastUpdate;
      }
    });

    // Calculate aggregated stats
    Object.values(bySource).forEach(source => {
      const sourceMetrics = [...this.metrics.values()].filter(m => m.sourceId === source.sourceId);

      const latencies = sourceMetrics
        .filter(m => m.avgLatency > 0)
        .map(m => m.avgLatency);

      source.avgLatency = latencies.length > 0
        ? latencies.reduce((a, b) => a + b, 0) / latencies.length
        : 0;

      source.uptime = source.totalUpdates > 0
        ? (source.totalUpdates / (source.totalUpdates + source.totalErrors)) * 100
        : 100;
    });

    return bySource;
  }

  /**
   * Get overall summary metrics
   */
  getAllMetrics() {
    const bySource = this.getMetricsBySource();

    let totalUpdates = 0;
    let totalErrors = 0;
    let latencySum = 0;
    let latencyCount = 0;

    Object.values(bySource).forEach(source => {
      totalUpdates += source.totalUpdates;
      totalErrors += source.totalErrors;
      if (source.avgLatency > 0) {
        latencySum += source.avgLatency;
        latencyCount++;
      }
    });

    return {
      sources: bySource,
      totalUpdates,
      totalErrors,
      avgLatency: latencyCount > 0 ? latencySum / latencyCount : 0,
      overallUptime: totalUpdates > 0
        ? (totalUpdates / (totalUpdates + totalErrors)) * 100
        : 100,
      sessionDuration: Date.now() - this.sessionStart,
      activeDataTypes: this.metrics.size
    };
  }

  /**
   * Get history for a specific source/dataType
   */
  getHistory(sourceId, dataType, limit = 50) {
    const key = this._getKey(sourceId, dataType);
    const history = this.history.get(key) || [];
    return history.slice(-limit);
  }

  /**
   * Get recent events across all sources (for timeline)
   */
  getRecentEvents(limit = 50) {
    const allEvents = [];

    this.history.forEach((events, key) => {
      const [sourceId, dataType] = key.split(':');
      events.forEach(event => {
        allEvents.push({
          ...event,
          sourceId,
          dataType
        });
      });
    });

    return allEvents
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit);
  }

  /**
   * Get latency percentiles for a source
   */
  getLatencyPercentiles(sourceId, dataType) {
    const key = this._getKey(sourceId, dataType);
    const metric = this.metrics.get(key);

    if (!metric || metric.latencyHistory.length === 0) {
      return { p50: 0, p90: 0, p95: 0, p99: 0 };
    }

    const sorted = [...metric.latencyHistory].sort((a, b) => a - b);
    const len = sorted.length;

    return {
      p50: sorted[Math.floor(len * 0.5)] || 0,
      p90: sorted[Math.floor(len * 0.9)] || 0,
      p95: sorted[Math.floor(len * 0.95)] || 0,
      p99: sorted[Math.floor(len * 0.99)] || 0
    };
  }

  /**
   * Check if a source is healthy (no consecutive errors, recent updates)
   */
  isHealthy(sourceId, dataType, maxStaleMs = 30000) {
    const key = this._getKey(sourceId, dataType);
    const metric = this.metrics.get(key);

    if (!metric) return true; // No data yet, assume healthy

    const isStale = metric.lastUpdate && (Date.now() - metric.lastUpdate) > maxStaleMs;
    const hasConsecutiveErrors = metric.consecutiveErrors >= 3;

    return !isStale && !hasConsecutiveErrors;
  }

  /**
   * Subscribe to metric updates
   * @param {function} callback - Called with getAllMetrics() on each update
   * @returns {function} Unsubscribe function
   */
  subscribe(callback) {
    this.listeners.add(callback);

    // Immediately call with current state
    callback(this.getAllMetrics());

    return () => {
      this.listeners.delete(callback);
    };
  }

  /**
   * Notify all listeners of metric changes
   */
  _notifyListeners() {
    const summary = this.getAllMetrics();
    this.listeners.forEach(callback => {
      try {
        callback(summary);
      } catch (err) {
        console.error('Metrics listener error:', err);
      }
    });
  }

  /**
   * Reset all metrics (useful for testing or session reset)
   */
  reset() {
    this.metrics.clear();
    this.history.clear();
    this.sessionStart = Date.now();
    this._notifyListeners();
  }

  /**
   * Export metrics for debugging
   */
  exportMetrics() {
    return {
      metrics: Object.fromEntries(this.metrics),
      history: Object.fromEntries(this.history),
      summary: this.getAllMetrics()
    };
  }
}

// Singleton instance
export const metricsService = new MetricsService();

// Also export class for testing
export { MetricsService };

export default metricsService;
