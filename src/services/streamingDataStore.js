/**
 * Streaming Data Store
 * Singleton that persists data between streaming updates
 * Enables incremental updates instead of full regeneration
 */

class StreamingDataStore {
  constructor() {
    this.store = new Map();
    this.metadata = new Map();
  }

  /**
   * Get existing data for a data type
   * @param {string} dataType - The data type key
   * @returns {object|null} The stored data or null if not found
   */
  get(dataType) {
    return this.store.get(dataType) || null;
  }

  /**
   * Store data for a data type
   * @param {string} dataType - The data type key
   * @param {object} data - The data to store
   */
  set(dataType, data) {
    this.store.set(dataType, data);
    this.metadata.set(dataType, {
      lastUpdate: Date.now(),
      updateCount: (this.metadata.get(dataType)?.updateCount || 0) + 1
    });
  }

  /**
   * Get the last known price for a data type (useful for price continuity)
   * @param {string} dataType - The data type key
   * @returns {number|null} The last price or null
   */
  getLastPrice(dataType) {
    const data = this.store.get(dataType);
    if (!data) return null;

    // Try to extract last price from various data structures
    if (data.candles?.length > 0) {
      return data.candles[data.candles.length - 1].close;
    }
    if (data.priceData?.length > 0) {
      return data.priceData[data.priceData.length - 1].price;
    }
    if (data.currentPrice) {
      return data.currentPrice;
    }
    if (typeof data.price === 'number') {
      return data.price;
    }
    return null;
  }

  /**
   * Get metadata for a data type
   * @param {string} dataType - The data type key
   * @returns {object|null} Metadata or null
   */
  getMetadata(dataType) {
    return this.metadata.get(dataType) || null;
  }

  /**
   * Clear data for a specific type
   * @param {string} dataType - The data type key
   */
  clear(dataType) {
    this.store.delete(dataType);
    this.metadata.delete(dataType);
  }

  /**
   * Clear all stored data
   */
  clearAll() {
    this.store.clear();
    this.metadata.clear();
  }

  /**
   * Check if data exists for a type
   * @param {string} dataType - The data type key
   * @returns {boolean}
   */
  has(dataType) {
    return this.store.has(dataType);
  }

  /**
   * Get all stored data types
   * @returns {string[]}
   */
  getStoredTypes() {
    return Array.from(this.store.keys());
  }
}

// Export singleton instance
export const streamingDataStore = new StreamingDataStore();

export default streamingDataStore;
