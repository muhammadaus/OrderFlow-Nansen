const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

export function deriveInstitutionalBreakdown(walletIntel, institutionalData) {
  const summary = walletIntel?.summary || {};
  const account = walletIntel?.account || {};
  const netflows = walletIntel?.netflows || [];
  const screener = walletIntel?.screener || [];
  const whaleTransactions = institutionalData?.whaleTransactions || [];

  const ethereumFlow = netflows.find((flow) => flow.chain === 'ethereum') || null;
  const dominantChain = netflows.slice().sort((a, b) => Math.abs(b.net_flow_usd || 0) - Math.abs(a.net_flow_usd || 0))[0] || null;
  const topToken = screener.slice().sort((a, b) => (b.smart_money_inflow_usd || 0) - (a.smart_money_inflow_usd || 0))[0] || null;
  const largestWhaleTx = whaleTransactions.slice().sort((a, b) => (b.value || 0) - (a.value || 0))[0] || null;

  const totalSmWalletsIn = summary.totalSmWalletsIn ?? screener.reduce((sum, token) => sum + (token.smart_wallets || 0), 0);
  const totalSmWalletsOut = summary.totalSmWalletsOut ?? screener.reduce((sum, token) => sum + (token.outflow_wallets || 0), 0);
  const totalThroughput = (summary.totalInflow || 0) + (summary.totalOutflow || 0);
  const flowParticipationPct = totalThroughput > 0
    ? Number((((Math.abs(summary.totalNetFlow || 0)) / totalThroughput) * 100).toFixed(2))
    : null;

  const reasonCodes = [];
  if (walletIntel?.isDemo) reasonCodes.push('demo_mode');
  if (walletIntel?.endpointErrors?.length) reasonCodes.push('partial_nansen_coverage');
  if (!netflows.length) reasonCodes.push('no_netflow_data');
  if (!screener.length) reasonCodes.push('no_token_screener_data');
  if (largestWhaleTx?.value) reasonCodes.push('whale_activity_available');

  const confidence = (() => {
    let score = 35;
    if (netflows.length > 0) score += 25;
    if (screener.length > 0) score += 20;
    if (largestWhaleTx?.value) score += 10;
    if (walletIntel?.endpointErrors?.length) score -= Math.min(walletIntel.endpointErrors.length * 5, 20);
    if (walletIntel?.isDemo) score -= 20;
    return clamp(score, 0, 100);
  })();

  return {
    data_status: walletIntel?.isDemo ? 'demo' : walletIntel ? (netflows.length || screener.length ? 'live_or_cached' : 'degraded') : 'unavailable',
    generated_at: walletIntel?.generatedAt || null,
    nansen_plan: account.plan || null,
    nansen_credits_remaining: account.credits_remaining ?? null,
    endpoint_errors: walletIntel?.endpointErrors || [],
    netflows_count: netflows.length,
    screener_count: screener.length,
    ethereum_net_flow_usd_24h: ethereumFlow?.net_flow_usd ?? null,
    ethereum_inflow_usd_24h: ethereumFlow?.inflow_usd ?? null,
    ethereum_outflow_usd_24h: ethereumFlow?.outflow_usd ?? null,
    cross_chain_net_flow_usd_24h: summary.totalNetFlow ?? null,
    cross_chain_inflow_usd_24h: summary.totalInflow ?? null,
    cross_chain_outflow_usd_24h: summary.totalOutflow ?? null,
    net_flow_participation_pct: flowParticipationPct,
    total_smart_wallets_in_24h: totalSmWalletsIn,
    total_smart_wallets_out_24h: totalSmWalletsOut,
    wallet_outflow_ratio: totalSmWalletsIn > 0 ? Number((totalSmWalletsOut / totalSmWalletsIn).toFixed(2)) : null,
    dominant_chain: dominantChain?.chain ?? null,
    dominant_chain_net_flow_usd_24h: dominantChain?.net_flow_usd ?? null,
    top_token_by_inflow: topToken
      ? {
          symbol: topToken.symbol,
          chain: topToken.chain,
          smart_money_inflow_usd: topToken.smart_money_inflow_usd,
          smart_wallets: topToken.smart_wallets,
          outflow_wallets: topToken.outflow_wallets
        }
      : null,
    whale_transaction_count_24h: whaleTransactions.length,
    largest_whale_transaction: largestWhaleTx
      ? {
          asset: largestWhaleTx.asset,
          protocol: largestWhaleTx.protocol,
          direction: largestWhaleTx.direction,
          value_usd: largestWhaleTx.value
        }
      : null,
    confidence,
    reason_codes: reasonCodes
  };
}

export function buildAgentPayload({
  sourceId,
  isPaused,
  institutionalBreakdown,
  sweepsData,
  mevData
}) {
  const sweepStats = sweepsData?.stats || {};
  const currentSweep = sweepsData?.currentSweep || null;
  const mevMetrics = mevData?.metrics || {};
  const topOpportunity = mevData?.opportunities?.[0] || null;

  return {
    generated_at: new Date().toISOString(),
    source: sourceId,
    mode: isPaused ? 'paused' : 'streaming',
    institutional: institutionalBreakdown,
    liquidity: {
      recent_sweeps: sweepStats.recentSweepCount ?? null,
      absorption_rate_pct: sweepStats.absorptionRate ?? null,
      current_sweep: currentSweep
        ? {
            direction: currentSweep.direction,
            outcome: currentSweep.outcome,
            confidence: Number(currentSweep.confidence?.toFixed?.(1) || currentSweep.confidence)
          }
        : null
    },
    mev: {
      active_opportunities: mevMetrics.activeOpportunities ?? null,
      gas_gwei: mevMetrics.currentGas ?? null,
      competition_level: mevMetrics.competitionLevel ?? null,
      top_opportunity: topOpportunity
        ? {
            type: topOpportunity.type,
            protocol: topOpportunity.protocol,
            estimated_profit_usd: Math.round(topOpportunity.estimatedProfit),
            success_probability_pct: topOpportunity.successProbability
          }
        : null
    }
  };
}
