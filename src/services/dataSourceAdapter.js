/**
 * Data Source Adapter
 * Normalizes data from different sources into a unified format
 * that existing components and analysis utilities can consume
 */

/**
 * Standard candle format (matches lightweight-charts)
 */
export const normalizeCandle = (data, source) => {
  switch (source) {
    case 'defilama':
      return {
        time: Math.floor(data.timestamp / 1000), // Convert ms to seconds
        open: parseFloat(data.open || data.price),
        high: parseFloat(data.high || data.price),
        low: parseFloat(data.low || data.price),
        close: parseFloat(data.close || data.price),
        volume: parseFloat(data.volume || 0),
        source: 'defilama'
      };

    case 'coingecko':
      // CoinGecko OHLC format: [timestamp, open, high, low, close]
      if (Array.isArray(data)) {
        return {
          time: Math.floor(data[0] / 1000),
          open: data[1],
          high: data[2],
          low: data[3],
          close: data[4],
          volume: data[5] || 0,
          source: 'coingecko'
        };
      }
      return {
        time: Math.floor(data.timestamp / 1000),
        open: parseFloat(data.open),
        high: parseFloat(data.high),
        low: parseFloat(data.low),
        close: parseFloat(data.close),
        volume: parseFloat(data.volume || 0),
        source: 'coingecko'
      };

    case 'geckoterminal':
      return {
        time: Math.floor(new Date(data.dt).getTime() / 1000),
        open: parseFloat(data.o),
        high: parseFloat(data.h),
        low: parseFloat(data.l),
        close: parseFloat(data.c),
        volume: parseFloat(data.v || 0),
        source: 'geckoterminal'
      };

    default:
      // Already normalized (mock data)
      return {
        ...data,
        source: source || 'mock'
      };
  }
};

/**
 * Standard price format
 */
export const normalizePrice = (data, source) => {
  switch (source) {
    case 'defilama':
      // DefiLlama format: { coins: { "chain:address": { price, timestamp, ... } } }
      if (data.coins) {
        const entries = Object.entries(data.coins);
        return entries.map(([key, value]) => ({
          id: key,
          price: parseFloat(value.price),
          timestamp: value.timestamp,
          confidence: value.confidence || 1,
          decimals: value.decimals,
          symbol: value.symbol,
          source: 'defilama'
        }));
      }
      return {
        price: parseFloat(data.price),
        timestamp: data.timestamp,
        source: 'defilama'
      };

    case 'coingecko':
      // CoinGecko simple/price format
      if (typeof data === 'object' && !Array.isArray(data)) {
        return Object.entries(data).map(([id, prices]) => ({
          id,
          price: prices.usd || prices.USD,
          change24h: prices.usd_24h_change,
          volume24h: prices.usd_24h_vol,
          marketCap: prices.usd_market_cap,
          source: 'coingecko'
        }));
      }
      return data;

    default:
      return { ...data, source: source || 'mock' };
  }
};

/**
 * Standard volume format
 */
export const normalizeVolume = (data, source) => {
  switch (source) {
    case 'defilama':
      // DEX overview format
      if (data.protocols) {
        return data.protocols.map(protocol => ({
          protocol: protocol.name,
          slug: protocol.slug || protocol.name.toLowerCase(),
          chain: protocol.chains?.[0] || 'multi',
          volume24h: parseFloat(protocol.total24h || 0),
          volume7d: parseFloat(protocol.total7d || 0),
          volume30d: parseFloat(protocol.total30d || 0),
          change24h: parseFloat(protocol.change_1d || 0),
          change7d: parseFloat(protocol.change_7d || 0),
          dominance: parseFloat(protocol.dominance || 0),
          source: 'defilama'
        }));
      }
      return {
        volume24h: parseFloat(data.total24h || data.volume || 0),
        change24h: parseFloat(data.change_1d || 0),
        source: 'defilama'
      };

    case 'coingecko':
      return {
        volume24h: parseFloat(data.total_volume?.usd || data.volume || 0),
        source: 'coingecko'
      };

    default:
      return { ...data, source: source || 'mock' };
  }
};

/**
 * Standard TVL format
 */
export const normalizeTVL = (data, source) => {
  switch (source) {
    case 'defilama':
      // Protocol TVL format
      if (data.tvl !== undefined) {
        return {
          tvl: parseFloat(data.tvl),
          change24h: parseFloat(data.change_1d || 0),
          change7d: parseFloat(data.change_7d || 0),
          chains: data.chains || [],
          chainTvls: data.chainTvls || {},
          source: 'defilama'
        };
      }
      // Historical TVL format
      if (Array.isArray(data)) {
        return data.map(item => ({
          time: item.date,
          tvl: parseFloat(item.tvl || item.totalLiquidityUSD || 0),
          source: 'defilama'
        }));
      }
      return { ...data, source: 'defilama' };

    default:
      return { ...data, source: source || 'mock' };
  }
};

/**
 * Standard trade format
 */
export const normalizeTrade = (data, source) => {
  switch (source) {
    case 'geckoterminal':
      return {
        time: Math.floor(new Date(data.block_timestamp).getTime() / 1000),
        price: parseFloat(data.price_in_usd),
        amount: parseFloat(data.volume_in_usd),
        side: data.kind === 'buy' ? 'buy' : 'sell',
        txHash: data.tx_hash,
        maker: data.tx_from_address,
        source: 'geckoterminal'
      };

    case 'defilama':
      return {
        time: Math.floor(data.timestamp / 1000),
        price: parseFloat(data.price),
        amount: parseFloat(data.amount || data.volume),
        side: data.side || (data.amount > 0 ? 'buy' : 'sell'),
        source: 'defilama'
      };

    default:
      return { ...data, source: source || 'mock' };
  }
};

/**
 * Standard funding rate format
 */
export const normalizeFundingRate = (data, source) => {
  switch (source) {
    case 'defilama':
      // From yields/perps endpoint
      return {
        protocol: data.project,
        symbol: data.symbol,
        fundingRate: parseFloat(data.fundingRate || 0),
        fundingRate7dAvg: parseFloat(data.fundingRate7dAverage || 0),
        openInterest: parseFloat(data.openInterest || 0),
        volume24h: parseFloat(data.volumeUsd24h || 0),
        source: 'defilama'
      };

    default:
      return { ...data, source: source || 'mock' };
  }
};

/**
 * Standard pool/liquidity format
 */
export const normalizePool = (data, source) => {
  switch (source) {
    case 'defilama':
      // From yields/pools endpoint
      return {
        id: data.pool,
        protocol: data.project,
        chain: data.chain,
        symbol: data.symbol,
        tvl: parseFloat(data.tvlUsd || 0),
        apy: parseFloat(data.apy || 0),
        apyBase: parseFloat(data.apyBase || 0),
        apyReward: parseFloat(data.apyReward || 0),
        rewardTokens: data.rewardTokens || [],
        source: 'defilama'
      };

    case 'geckoterminal':
      return {
        id: data.id,
        address: data.attributes?.address,
        name: data.attributes?.name,
        chain: data.relationships?.network?.data?.id,
        tvl: parseFloat(data.attributes?.reserve_in_usd || 0),
        volume24h: parseFloat(data.attributes?.volume_usd?.h24 || 0),
        priceChange24h: parseFloat(data.attributes?.price_change_percentage?.h24 || 0),
        source: 'geckoterminal'
      };

    default:
      return { ...data, source: source || 'mock' };
  }
};

/**
 * Normalize array of items with given normalizer
 */
export const normalizeArray = (dataArray, normalizer, source) => {
  if (!Array.isArray(dataArray)) return [];
  return dataArray.map(item => normalizer(item, source));
};

/**
 * Convert timestamp formats
 */
export const normalizeTimestamp = (timestamp) => {
  if (!timestamp) return Math.floor(Date.now() / 1000);

  // Already in seconds
  if (timestamp < 10000000000) return timestamp;

  // In milliseconds
  return Math.floor(timestamp / 1000);
};

/**
 * Adapter class for service-specific transformations
 */
export class DataSourceAdapter {
  constructor(source) {
    this.source = source;
  }

  candles(data) {
    return normalizeArray(data, normalizeCandle, this.source);
  }

  prices(data) {
    return normalizePrice(data, this.source);
  }

  volumes(data) {
    return normalizeVolume(data, this.source);
  }

  tvl(data) {
    return normalizeTVL(data, this.source);
  }

  trades(data) {
    return normalizeArray(data, normalizeTrade, this.source);
  }

  fundingRates(data) {
    return normalizeArray(data, normalizeFundingRate, this.source);
  }

  pools(data) {
    return normalizeArray(data, normalizePool, this.source);
  }
}

export default DataSourceAdapter;
