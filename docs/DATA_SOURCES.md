# Data Sources Documentation

This document explains where data comes from in the DeFi Orderflow Analytics dashboard, how to switch between sources, and the limitations of each.

---

## Overview

The application supports three data source modes:

| Source | Status | Real-Time | API Key Required |
|--------|--------|-----------|------------------|
| **Mock Data** | Active (Default) | Simulated | No |
| **DefiLlama** | Available | Yes | No (free tier) |
| **CoinGecko** | Available | Yes | Optional |

---

## Current Data Source: Mock Data

By default, the dashboard runs on **simulated mock data** that mimics real market behavior. This is ideal for:

- Development and testing
- Learning the interface
- Demos without API rate limits

### What Mock Data Provides

| Data Type | Description | Update Interval |
|-----------|-------------|-----------------|
| `orderflow` | Simulated buy/sell trades with time & size | 5s |
| `volumeProfile` | Price distribution with volume at each level | 5s |
| `delta` | Buy/sell delta calculations | 5s |
| `marketStructure` | Swing highs/lows, trend direction | 5s |
| `exhaustion` | Exhaustion and absorption signals | 5s |
| `deltaDivergence` | Price vs delta divergence detection | 5s |
| `liquiditySweeps` | Stop hunt / liquidity grab detection | 5s |
| `imbalances` | Order imbalance clusters | 5s |
| `cvdTrends` | Cumulative Volume Delta trends | 5s |
| `absorptionFlow` | Absorption pattern detection | 5s |
| `confluence` | Multi-signal confluence scoring | 5s |
| `wyckoff` | Wyckoff phase analysis | 5s |
| `smartMoney` | Smart money concept zones (FVG, OB, etc.) | 5s |
| `mevOpportunities` | MEV arbitrage opportunity scanner | 5s |
| `marketProfile` | TPO (Time-Price Opportunity) analysis | 5s |
| `liquidityHeatmap` | Liquidation level heatmap | 5s |
| `institutional` | Large trade / whale activity | 5s |
| `insights` | AI-generated trading insights | 5s |
| `fundingRate` | Perpetual funding rate data | 5s |
| `openInterest` | Open interest analysis | 5s |
| `fundingOI` | Combined funding + OI data | 5s |

### Mock Data Characteristics

- **Incremental updates**: Each update builds on the previous state
- **Realistic patterns**: Simulates trends, reversals, and consolidation
- **Random variation**: Adds realistic noise to prevent repetition
- **No rate limits**: Unlimited requests

---

## Real API Sources

### DefiLlama

[DefiLlama](https://defillama.com) provides free, open data for DeFi protocols.

**Available Data:**
- DEX trading volumes
- Protocol TVL (Total Value Locked)
- Price feeds
- Yield farming rates

**Connection:**
```bash
# No API key required for most endpoints
# Optional: Set for higher rate limits
VITE_DEFILAMA_API_KEY=your_key_here
```

**Endpoints Used:**
- `https://api.llama.fi/protocol/{name}` - Protocol TVL
- `https://coins.llama.fi/prices` - Token prices
- `https://api.llama.fi/v2/dexs` - DEX volumes

### CoinGecko

[CoinGecko](https://coingecko.com) provides comprehensive crypto market data.

**Available Data:**
- Token prices (real-time)
- OHLCV candle data
- Market caps
- Exchange volumes

**Connection:**
```bash
# Free tier available (limited rate)
# Pro key for higher limits
VITE_COINGECKO_API_KEY=your_key_here
```

**Rate Limits:**
- Demo: 10-50 calls/minute
- Pro: 500+ calls/minute

---

## Switching Data Sources

### Via UI Toggle

The Data Aggregator panel in the header allows switching sources:

1. Click the Data Aggregator compact panel
2. Select source from dropdown
3. Data will refresh automatically

### Via Code

```javascript
import { useDataSource } from './services/dataSourceContext';

function MyComponent() {
  const { source, changeSource, availableSources } = useDataSource();

  // Switch to DefiLlama
  await changeSource('defilama');

  // Switch back to mock
  await changeSource('mock');
}
```

### Environment Variables

Create `.env.local` file:

```bash
# Default data source (mock | defilama | coingecko)
VITE_DEFAULT_DATA_SOURCE=mock

# API Keys (optional)
VITE_DEFILAMA_API_KEY=
VITE_COINGECKO_API_KEY=
```

---

## Data Flow Architecture

```
┌─────────────────────────────────────────────────────┐
│                   DataSourceContext                  │
│  ┌─────────────────────────────────────────────┐    │
│  │  source: 'mock' | 'defilama' | 'coingecko'  │    │
│  └─────────────────────────────────────────────┘    │
│                        │                             │
│         ┌──────────────┼──────────────┐             │
│         ▼              ▼              ▼             │
│    ┌─────────┐   ┌──────────┐   ┌──────────┐       │
│    │  Mock   │   │ DefiLlama│   │CoinGecko │       │
│    │Generator│   │ Service  │   │ Service  │       │
│    └─────────┘   └──────────┘   └──────────┘       │
│         │              │              │             │
│         └──────────────┼──────────────┘             │
│                        ▼                             │
│            ┌───────────────────┐                    │
│            │ streamingDataStore│                    │
│            │ (incremental state)│                    │
│            └───────────────────┘                    │
│                        │                             │
│                        ▼                             │
│            ┌───────────────────┐                    │
│            │   useStreamingData │                    │
│            │   (React Hook)     │                    │
│            └───────────────────┘                    │
└─────────────────────────────────────────────────────┘
```

---

## Streaming & Updates

### useStreamingData Hook

Basic streaming hook for component data:

```javascript
const { data, loading, error, source } = useStreamingData('volumeProfile', 5000);
```

### useEnhancedStreamingData Hook

Enhanced hook with metrics and latency tracking:

```javascript
const {
  data,
  loading,
  error,
  lastUpdate,  // Timestamp of last update
  latency,     // Fetch latency in ms
  isStale,     // True if data is stale
  updateCount, // Number of updates received
} = useEnhancedStreamingData('volumeProfile', 5000, {
  enabled: true,
  onUpdate: (data) => console.log('Updated:', data),
  onError: (err) => console.error('Error:', err),
});
```

---

## Limitations

### Mock Data
- Not real market data
- Patterns are simulated, not predictive
- Suitable for development/demos only

### DefiLlama
- Limited to DeFi protocols
- No orderbook data
- No CEX data

### CoinGecko
- Rate limits on free tier
- Delayed data on free tier (1-5 min)
- No orderflow data

### General
- Real orderflow data requires exchange APIs (Binance, dYdX, etc.)
- True institutional flow requires premium data sources
- MEV data requires archive node access

---

## Adding New Data Sources

1. Create service in `src/services/`:

```javascript
// src/services/myNewService.js
export class MyNewService {
  async getOrderflow(params) {
    // Fetch from API
    return transformedData;
  }

  getAvailableTypes() {
    return ['orderflow', 'prices'];
  }
}
```

2. Register in `dataSourceContext.jsx`:

```javascript
export const DATA_SOURCES = {
  // ... existing sources
  mynew: {
    id: 'mynew',
    name: 'My New Source',
    icon: '🆕',
    description: 'Description here',
    requiresApiKey: true,
    baseUrl: 'https://api.example.com'
  }
};
```

3. Add lazy loading:

```javascript
if (sourceId === 'mynew') {
  const { MyNewService } = await import('./myNewService.js');
  servicesRef.current[sourceId] = new MyNewService(apiKey);
}
```

---

## Recommended Real Data Sources

For production use, consider these APIs:

| Provider | Data Type | Free Tier |
|----------|-----------|-----------|
| [Binance API](https://binance.com/api) | Orderbook, trades | Yes |
| [dYdX API](https://docs.dydx.exchange) | Perp orderflow | Yes |
| [The Graph](https://thegraph.com) | On-chain DeFi | Yes |
| [Dune Analytics](https://dune.com) | Historical queries | Limited |
| [Coinalyze](https://coinalyze.net) | Derivatives data | Paid |
| [Glassnode](https://glassnode.com) | On-chain metrics | Paid |

---

*Last Updated: January 2025*
