/**
 * Binance Futures WebSocket Service
 *
 * This service provides real-time data from Binance Futures API:
 * - Aggregate trades (wss://fstream.binance.com/ws/<symbol>@aggTrade)
 * - Mark price / Funding rate (wss://fstream.binance.com/ws/<symbol>@markPrice)
 * - Orderbook depth (wss://fstream.binance.com/ws/<symbol>@depth)
 * - Open Interest (REST: /fapi/v1/openInterest)
 *
 * Usage:
 * import { BinanceService } from './services/binanceService';
 * const binance = new BinanceService('ETHUSDT');
 * binance.connect();
 * binance.onTrade((trade) => console.log(trade));
 */

const BINANCE_WS_BASE = 'wss://fstream.binance.com/ws';
const BINANCE_REST_BASE = 'https://fapi.binance.com';

class BinanceService {
  constructor(symbol = 'ETHUSDT') {
    this.symbol = symbol.toLowerCase();
    this.connections = new Map();
    this.listeners = {
      trade: [],
      markPrice: [],
      depth: [],
      openInterest: []
    };
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 1000;
  }

  /**
   * Connect to all WebSocket streams
   */
  connect() {
    this.connectAggTrade();
    this.connectMarkPrice();
    this.connectDepth();
    this.startOpenInterestPolling();
  }

  /**
   * Disconnect all WebSocket connections
   */
  disconnect() {
    for (const [name, ws] of this.connections) {
      ws.close();
      console.log(`Disconnected from ${name}`);
    }
    this.connections.clear();
  }

  /**
   * Connect to aggregate trade stream
   * Provides: trade time, price, quantity, side (buyer maker)
   */
  connectAggTrade() {
    const endpoint = `${BINANCE_WS_BASE}/${this.symbol}@aggTrade`;
    const ws = this.createWebSocket('aggTrade', endpoint);

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      const trade = this.normalizeAggTrade(data);
      this.emit('trade', trade);
    };
  }

  /**
   * Connect to mark price stream (includes funding rate)
   * Provides: mark price, index price, funding rate, next funding time
   */
  connectMarkPrice() {
    const endpoint = `${BINANCE_WS_BASE}/${this.symbol}@markPrice@1s`;
    const ws = this.createWebSocket('markPrice', endpoint);

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      const markPrice = this.normalizeMarkPrice(data);
      this.emit('markPrice', markPrice);
    };
  }

  /**
   * Connect to orderbook depth stream
   * Provides: bids, asks, last update ID
   */
  connectDepth() {
    const endpoint = `${BINANCE_WS_BASE}/${this.symbol}@depth20@100ms`;
    const ws = this.createWebSocket('depth', endpoint);

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      const depth = this.normalizeDepth(data);
      this.emit('depth', depth);
    };
  }

  /**
   * Poll Open Interest (REST API)
   * Binance doesn't provide OI via WebSocket, need to poll
   */
  startOpenInterestPolling(intervalMs = 5000) {
    const poll = async () => {
      try {
        const response = await fetch(
          `${BINANCE_REST_BASE}/fapi/v1/openInterest?symbol=${this.symbol.toUpperCase()}`
        );
        const data = await response.json();
        const oi = this.normalizeOpenInterest(data);
        this.emit('openInterest', oi);
      } catch (error) {
        console.error('Failed to fetch open interest:', error);
      }
    };

    poll(); // Initial fetch
    this.oiInterval = setInterval(poll, intervalMs);
  }

  /**
   * Create WebSocket with reconnection logic
   */
  createWebSocket(name, endpoint) {
    const ws = new WebSocket(endpoint);

    ws.onopen = () => {
      console.log(`Connected to ${name} stream`);
      this.reconnectAttempts = 0;
    };

    ws.onerror = (error) => {
      console.error(`WebSocket error on ${name}:`, error);
    };

    ws.onclose = () => {
      console.log(`Disconnected from ${name} stream`);
      this.handleReconnect(name, endpoint);
    };

    this.connections.set(name, ws);
    return ws;
  }

  /**
   * Handle reconnection with exponential backoff
   */
  handleReconnect(name, endpoint) {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);

      console.log(`Reconnecting to ${name} in ${delay}ms (attempt ${this.reconnectAttempts})`);

      setTimeout(() => {
        if (name === 'aggTrade') this.connectAggTrade();
        else if (name === 'markPrice') this.connectMarkPrice();
        else if (name === 'depth') this.connectDepth();
      }, delay);
    } else {
      console.error(`Max reconnection attempts reached for ${name}`);
    }
  }

  /**
   * Normalize aggregate trade data to standard format
   */
  normalizeAggTrade(data) {
    return {
      time: data.T,
      price: parseFloat(data.p),
      quantity: parseFloat(data.q),
      side: data.m ? 'sell' : 'buy', // m = buyer is maker
      tradeId: data.a
    };
  }

  /**
   * Normalize mark price data to standard format
   */
  normalizeMarkPrice(data) {
    return {
      time: data.E,
      markPrice: parseFloat(data.p),
      indexPrice: parseFloat(data.i),
      fundingRate: parseFloat(data.r),
      nextFundingTime: data.T
    };
  }

  /**
   * Normalize depth data to standard format
   */
  normalizeDepth(data) {
    return {
      time: data.E,
      bids: data.b.map(([price, qty]) => ({
        price: parseFloat(price),
        quantity: parseFloat(qty)
      })),
      asks: data.a.map(([price, qty]) => ({
        price: parseFloat(price),
        quantity: parseFloat(qty)
      })),
      lastUpdateId: data.u
    };
  }

  /**
   * Normalize open interest data to standard format
   */
  normalizeOpenInterest(data) {
    return {
      time: data.time,
      openInterest: parseFloat(data.openInterest),
      symbol: data.symbol
    };
  }

  /**
   * Event emitter - notify listeners
   */
  emit(event, data) {
    if (this.listeners[event]) {
      this.listeners[event].forEach(callback => callback(data));
    }
  }

  /**
   * Subscribe to trade events
   */
  onTrade(callback) {
    this.listeners.trade.push(callback);
    return () => {
      this.listeners.trade = this.listeners.trade.filter(cb => cb !== callback);
    };
  }

  /**
   * Subscribe to mark price / funding rate events
   */
  onMarkPrice(callback) {
    this.listeners.markPrice.push(callback);
    return () => {
      this.listeners.markPrice = this.listeners.markPrice.filter(cb => cb !== callback);
    };
  }

  /**
   * Subscribe to orderbook depth events
   */
  onDepth(callback) {
    this.listeners.depth.push(callback);
    return () => {
      this.listeners.depth = this.listeners.depth.filter(cb => cb !== callback);
    };
  }

  /**
   * Subscribe to open interest events
   */
  onOpenInterest(callback) {
    this.listeners.openInterest.push(callback);
    return () => {
      this.listeners.openInterest = this.listeners.openInterest.filter(cb => cb !== callback);
    };
  }

  /**
   * Calculate delta from recent trades
   */
  calculateDelta(trades, windowMs = 60000) {
    const now = Date.now();
    const recentTrades = trades.filter(t => now - t.time < windowMs);

    let buyVolume = 0;
    let sellVolume = 0;

    recentTrades.forEach(trade => {
      if (trade.side === 'buy') {
        buyVolume += trade.price * trade.quantity;
      } else {
        sellVolume += trade.price * trade.quantity;
      }
    });

    return {
      buyVolume,
      sellVolume,
      delta: buyVolume - sellVolume,
      ratio: buyVolume / (buyVolume + sellVolume || 1)
    };
  }

  /**
   * Calculate liquidity from orderbook
   */
  calculateLiquidity(depth, priceRange = 0.01) {
    const midPrice = (depth.bids[0]?.price + depth.asks[0]?.price) / 2 || 0;
    const rangeHigh = midPrice * (1 + priceRange);
    const rangeLow = midPrice * (1 - priceRange);

    const bidLiquidity = depth.bids
      .filter(b => b.price >= rangeLow)
      .reduce((sum, b) => sum + b.price * b.quantity, 0);

    const askLiquidity = depth.asks
      .filter(a => a.price <= rangeHigh)
      .reduce((sum, a) => sum + a.price * a.quantity, 0);

    return {
      bidLiquidity,
      askLiquidity,
      totalLiquidity: bidLiquidity + askLiquidity,
      imbalance: (bidLiquidity - askLiquidity) / (bidLiquidity + askLiquidity || 1)
    };
  }
}

// React hook for using Binance service
export const useBinanceData = (symbol = 'ETHUSDT') => {
  // TODO: Implement React hook with useState and useEffect
  // This is a stub for future implementation
  return {
    trades: [],
    markPrice: null,
    fundingRate: null,
    depth: null,
    openInterest: null,
    delta: null,
    isConnected: false
  };
};

export { BinanceService };
export default BinanceService;
