/**
 * Nansen Flow Intelligence Service
 *
 * Frontend contract aligned to the documented v1 tgm/flow-intelligence endpoint:
 * POST /api/v1/tgm/flow-intelligence
 *
 * The app calls a local Vercel API route which proxies Nansen using a server-side API key.
 * If live access fails or no key is configured, the route falls back to mock data using the
 * documented response fields.
 */

const DEMO = (import.meta.env?.VITE_NANSEN_DEMO ?? '0') === '1';

export const DEMO_FLOW_INTELLIGENCE_RESPONSE = {
  data: [
    {
      public_figure_net_flow_usd: 1200000.5,
      public_figure_avg_flow_usd: 60000.25,
      public_figure_wallet_count: 11,
      top_pnl_net_flow_usd: 2100000.75,
      top_pnl_avg_flow_usd: 105000.5,
      top_pnl_wallet_count: 14,
      whale_net_flow_usd: 5400000.25,
      whale_avg_flow_usd: 270000.75,
      whale_wallet_count: 22,
      smart_trader_net_flow_usd: 1800000.5,
      smart_trader_avg_flow_usd: 90000.25,
      smart_trader_wallet_count: 19,
      exchange_net_flow_usd: -3200000.75,
      exchange_avg_flow_usd: 160000.5,
      exchange_wallet_count: 6,
      fresh_wallets_net_flow_usd: 700000.25,
      fresh_wallets_avg_flow_usd: 35000.75,
      fresh_wallets_wallet_count: 104
    }
  ],
  warnings: []
};

export async function fetchFlowIntelligence({
  chain = 'ethereum',
  tokenAddress = '0xA0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
  timeframe = '1d'
} = {}) {
  if (DEMO) {
    await new Promise((resolve) => setTimeout(resolve, 180));
    return {
      ...DEMO_FLOW_INTELLIGENCE_RESPONSE,
      meta: {
        source: 'mock',
        is_mock: true,
        timeframe,
        chain,
        token_address: tokenAddress
      }
    };
  }

  const response = await fetch('/api/nansen/flow-intelligence', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      chain,
      token_address: tokenAddress,
      timeframe,
    })
  });

  const rawText = await response.text();
  let payload = null;

  try {
    payload = rawText ? JSON.parse(rawText) : null;
  } catch {
    payload = null;
  }

  if (!payload) {
    return {
      ...DEMO_FLOW_INTELLIGENCE_RESPONSE,
      meta: {
        source: 'mock',
        is_mock: true,
        reason: 'invalid_json_response',
        http_status: response.status,
        raw_preview: rawText.slice(0, 240),
        timeframe,
        chain,
        token_address: tokenAddress
      }
    };
  }

  if (!response.ok) {
    throw new Error(payload?.error || `Flow intelligence request failed with ${response.status}`);
  }

  return payload;
}

export const fmtCompactUsd = (value) => {
  if (value == null) return '—';
  if (Math.abs(value) >= 1e9) return `$${(value / 1e9).toFixed(2)}B`;
  if (Math.abs(value) >= 1e6) return `$${(value / 1e6).toFixed(2)}M`;
  if (Math.abs(value) >= 1e3) return `$${(value / 1e3).toFixed(1)}K`;
  return `$${Number(value).toFixed(2)}`;
};

export const fmtPercent = (value) => {
  if (value == null) return '—';
  const sign = value > 0 ? '+' : '';
  return `${sign}${(Number(value) * 100).toFixed(2)}%`;
};
