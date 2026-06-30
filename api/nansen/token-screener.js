const NANSEN_URL = 'https://api.nansen.ai/api/v1/token-screener';

const DEMO_RESPONSE = {
  data: [
    {
      chain: 'ethereum',
      token_address: '0xA0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
      token_symbol: 'USDC',
      token_age_days: 2520,
      market_cap_usd: 61300000000,
      liquidity: 185000000,
      price_usd: 1,
      price_change: 0.0012,
      fdv: 61300000000,
      fdv_mc_ratio: 1,
      buy_volume: 28400000,
      inflow_fdv_ratio: 0.00046,
      outflow_fdv_ratio: 0.00019,
      sell_volume: 19800000,
      volume: 48200000,
      netflow: 16400000
    },
    {
      chain: 'base',
      token_address: '0x4200000000000000000000000000000000000006',
      token_symbol: 'WETH',
      token_age_days: 620,
      market_cap_usd: 319000000000,
      liquidity: 74200000,
      price_usd: 3028.44,
      price_change: 0.0341,
      fdv: 319000000000,
      fdv_mc_ratio: 1,
      buy_volume: 17300000,
      inflow_fdv_ratio: 0.00031,
      outflow_fdv_ratio: 0.00011,
      sell_volume: 9100000,
      volume: 26400000,
      netflow: 12100000
    }
  ],
  pagination: {
    page: 1,
    per_page: 10,
    is_last_page: true
  }
};

function buildBody(input = {}) {
  return {
    chains: input.chains || ['ethereum', 'base', 'solana'],
    timeframe: input.timeframe || '24h',
    pagination: {
      page: input.page || 1,
      per_page: input.per_page || 10
    },
    filters: {
      only_smart_money: input.only_smart_money ?? true
    },
    order_by: [
      {
        field: 'netflow',
        direction: 'DESC'
      }
    ]
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
