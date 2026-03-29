/**
 * Nansen Orderflow Intelligence Service
 *
 * Fetches real Nansen data to display alongside orderflow.
 * No speculation — just numbers: net flows, wallet counts, inflows, outflows.
 *
 * Live:  nansen-cli installed + NANSEN_API_KEY
 * Demo:  VITE_NANSEN_DEMO !== '0' (default in dev)
 */

const DEMO = import.meta.env.VITE_NANSEN_DEMO !== '0';

// ─── Demo data (mirrors exact Nansen response shapes) ─────────────────────────

export const DEMO_NETFLOWS = [
  {
    chain: 'ethereum',
    net_flow_usd:  284_500_000,
    inflow_usd:  1_842_000_000,
    outflow_usd: 1_557_500_000,
    top_inflows:  [{ token: 'ETH',  amount_usd: 142_000_000, wallets: 1284 }, { token: 'USDC', amount_usd: 89_000_000, wallets: 842 }],
    top_outflows: [{ token: 'SHIB', amount_usd:  23_000_000, wallets: 2103 }],
  },
  {
    chain: 'base',
    net_flow_usd:   52_300_000,
    inflow_usd:    312_000_000,
    outflow_usd:   259_700_000,
    top_inflows:  [{ token: 'ETH',  amount_usd: 48_000_000, wallets: 392 }],
    top_outflows: [],
  },
  {
    chain: 'arbitrum',
    net_flow_usd:  -18_200_000,
    inflow_usd:    284_000_000,
    outflow_usd:   302_200_000,
    top_inflows:  [{ token: 'ARB', amount_usd: 28_000_000, wallets: 503 }],
    top_outflows: [],
  },
  {
    chain: 'optimism',
    net_flow_usd:   12_800_000,
    inflow_usd:    124_000_000,
    outflow_usd:   111_200_000,
    top_inflows:  [{ token: 'OP', amount_usd: 9_100_000, wallets: 187 }],
    top_outflows: [],
  },
];

export const DEMO_SCREENER = [
  { symbol: 'ETH',    chain: 'ethereum', smart_money_inflow_usd: 142_000_000, smart_wallets: 1284, outflow_wallets: 312,  price_change_24h:  0.043, signal: 'STRONG_BUY'  },
  { symbol: 'EIGEN',  chain: 'ethereum', smart_money_inflow_usd:   8_200_000, smart_wallets:  284, outflow_wallets:  41,  price_change_24h:  0.142, signal: 'STRONG_BUY'  },
  { symbol: 'ENA',    chain: 'ethereum', smart_money_inflow_usd:   5_100_000, smart_wallets:  192, outflow_wallets:  58,  price_change_24h:  0.087, signal: 'BUY'          },
  { symbol: 'LDO',    chain: 'ethereum', smart_money_inflow_usd:   3_800_000, smart_wallets:  147, outflow_wallets:  89,  price_change_24h: -0.023, signal: 'ACCUMULATE'   },
  { symbol: 'PENDLE', chain: 'ethereum', smart_money_inflow_usd:   2_400_000, smart_wallets:   98, outflow_wallets:  31,  price_change_24h:  0.054, signal: 'BUY'          },
  { symbol: 'AERO',   chain: 'base',     smart_money_inflow_usd:   2_100_000, smart_wallets:   87, outflow_wallets:  12,  price_change_24h:  0.198, signal: 'STRONG_BUY'  },
  { symbol: 'BRETT',  chain: 'base',     smart_money_inflow_usd:     890_000, smart_wallets:   43, outflow_wallets:  18,  price_change_24h:  0.341, signal: 'BUY'          },
  { symbol: 'ARB',    chain: 'arbitrum', smart_money_inflow_usd:  28_000_000, smart_wallets:  503, outflow_wallets: 421,  price_change_24h: -0.018, signal: 'ACCUMULATE'   },
];

// ─── Data fetching ─────────────────────────────────────────────────────────────

let _cache = { netflows: null, screener: null, ts: 0 };
const CACHE_TTL = 5 * 60 * 1000;

export async function fetchNansenOrderflowIntel() {
  if (DEMO) {
    await new Promise(r => setTimeout(r, 280));
    return { netflows: DEMO_NETFLOWS, screener: DEMO_SCREENER, isDemo: true };
  }
  if (Date.now() - _cache.ts < CACHE_TTL && _cache.netflows) return _cache;
  const [nf, sc] = await Promise.all([
    fetch('/api/nansen/netflows').then(r => r.json()),
    fetch('/api/nansen/screener').then(r => r.json()),
  ]);
  _cache = { netflows: nf, screener: sc.combined ?? sc, ts: Date.now(), isDemo: false };
  return _cache;
}

// ─── Constants ─────────────────────────────────────────────────────────────────

export const SIGNAL_COLOR = {
  STRONG_BUY: '#00ff88', BUY: '#4ade80', ACCUMULATE: '#facc15',
  HOLD: '#94a3b8', SELL: '#f87171', STRONG_SELL: '#ef4444',
};

export const CHAIN_COLOR = {
  ethereum: '#627eea', base: '#0052ff', arbitrum: '#12aaff',
  polygon: '#8247e5', optimism: '#ff0420',
};

export const fmtM = n =>
  n == null ? '—' : `${n >= 0 ? '+' : ''}$${(Math.abs(n) / 1e6).toFixed(1)}M`;

export const fmtUSD = n =>
  n == null ? '—' : `$${(Math.abs(n) / 1e6).toFixed(0)}M`;
