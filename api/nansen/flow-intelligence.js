const NANSEN_URL = 'https://api.nansen.ai/api/v1/tgm/flow-intelligence';

const DEMO_RESPONSE = {
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

function buildBody(input = {}) {
  return {
    chain: input.chain || 'ethereum',
    token_address: input.token_address || '0xA0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
    timeframe: input.timeframe || '1d',
    filters: {}
  };
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.NANSEN_API_KEY;
  const demoMode = process.env.NANSEN_MOCK_FALLBACK === '1';
  const body = buildBody(req.body);

  if (!apiKey || demoMode) {
    return res.status(200).json({
      ...DEMO_RESPONSE,
      meta: {
        source: 'mock',
        is_mock: true,
        reason: apiKey ? 'forced_mock_fallback' : 'missing_api_key',
        request: body
      }
    });
  }

  try {
    const upstream = await fetch(NANSEN_URL, {
      method: 'POST',
      headers: {
        apiKey,
        'Content-Type': 'application/json',
        Accept: 'application/json'
      },
      body: JSON.stringify(body)
    });

    const payload = await upstream.json();

    if (!upstream.ok) {
      const errorMessage = payload?.error || payload?.message || 'Nansen request failed';
      const isCreditOrAccessIssue =
        upstream.status === 402 ||
        upstream.status === 403 ||
        /insufficient credits/i.test(errorMessage);

      if (isCreditOrAccessIssue) {
        return res.status(200).json({
          ...DEMO_RESPONSE,
          meta: {
            source: 'mock',
            is_mock: true,
            reason: 'nansen_insufficient_credits',
            request: body,
            live_error: payload
          }
        });
      }

      return res.status(upstream.status).json({
        error: errorMessage,
        details: payload,
        meta: {
          source: 'nansen',
          is_mock: false,
          request: body
        }
      });
    }

    return res.status(200).json({
      ...payload,
      meta: {
        source: 'nansen',
        is_mock: false,
        request: body
      }
    });
  } catch (error) {
    return res.status(200).json({
      ...DEMO_RESPONSE,
      meta: {
        source: 'mock',
        is_mock: true,
        reason: 'upstream_request_failed',
        request: body,
        error: error.message
      }
    });
  }
}
