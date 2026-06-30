import React, { useEffect, useState } from 'react';
import { useDataSource } from '../services/dataSourceContext';
import { fetchNansenOrderflowIntel, fmtM, fmtUSD } from '../services/nansenService';
import { deriveInstitutionalBreakdown } from '../services/agentIntelService';

const formatRuntime = (timestamp) => {
  if (!timestamp) return 'unknown';
  const seconds = Math.max(0, Math.floor((Date.now() - timestamp) / 1000));
  if (seconds < 5) return 'just now';
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  return `${Math.floor(minutes / 60)}h ago`;
};

const buildFrontendStatusPayload = (sourceId, institutionalBreakdown) => {
  const hasLiveWalletData = institutionalBreakdown.netflows_count > 0 || institutionalBreakdown.screener_count > 0;

  return {
    generated_at: new Date().toISOString(),
    source: sourceId,
    provider_status: hasLiveWalletData ? 'usable' : 'degraded',
    recommended_action: hasLiveWalletData
      ? 'allow wallet-flow-dependent analysis'
      : 'suppress wallet-flow-dependent decisions',
    reason_codes: institutionalBreakdown.reason_codes,
    nansen: {
      plan: institutionalBreakdown.nansen_plan,
      credits_remaining: institutionalBreakdown.nansen_credits_remaining,
      endpoint_errors: institutionalBreakdown.endpoint_errors
    },
    wallet_flow: {
      has_live_data: hasLiveWalletData,
      netflows_count: institutionalBreakdown.netflows_count,
      screener_count: institutionalBreakdown.screener_count,
      cross_chain_net_flow_usd_24h: institutionalBreakdown.cross_chain_net_flow_usd_24h,
      dominant_chain: institutionalBreakdown.dominant_chain,
      top_token_by_inflow: institutionalBreakdown.top_token_by_inflow
    }
  };
};

const AgentIntelligenceHub = () => {
  const { sourceConfig } = useDataSource();
  const [walletIntel, setWalletIntel] = useState(null);
  const [walletError, setWalletError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    fetchNansenOrderflowIntel()
      .then((result) => {
        if (!cancelled) {
          setWalletIntel(result);
          setWalletError(null);
        }
      })
      .catch((error) => {
        if (!cancelled) {
          setWalletError(error.message);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const institutionalBreakdown = deriveInstitutionalBreakdown(walletIntel, null);
  const generatedAt = walletIntel?.generatedAt ? Date.parse(walletIntel.generatedAt) : null;
  const statusPayload = buildFrontendStatusPayload(sourceConfig?.id, institutionalBreakdown);
  const hasLiveWalletData = institutionalBreakdown.netflows_count > 0 || institutionalBreakdown.screener_count > 0;

  return (
    <div className="min-h-screen bg-bg-primary text-text-primary">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <section className="rounded-2xl border border-border-default bg-bg-card p-6">
          <p className="text-xs uppercase tracking-[0.3em] text-accent">Nansen Provider Status</p>
          <h1 className="mt-3 text-4xl font-bold tracking-tight text-text-primary">
            Frontend now shows only what the provider actually returned.
          </h1>
          <p className="mt-4 max-w-3xl text-base leading-7 text-text-secondary">
            The active view is no longer mixing Nansen with mock liquidity, MEV, or fake institutional scoring.
            It reports provider health, exact artifact contents, and whether wallet-flow-dependent agent behavior
            should be enabled at all.
          </p>
        </section>

        <section className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatusCard
            label="Provider"
            value={loading ? 'loading' : hasLiveWalletData ? 'usable' : 'degraded'}
            detail={walletError || `${sourceConfig?.name || 'unknown source'} / artifact updated ${formatRuntime(generatedAt)}`}
          />
          <StatusCard
            label="Plan"
            value={institutionalBreakdown.nansen_plan || 'unknown'}
            detail={
              institutionalBreakdown.nansen_credits_remaining != null
                ? `${institutionalBreakdown.nansen_credits_remaining} credits remaining`
                : 'credit information unavailable'
            }
          />
          <StatusCard
            label="Netflow Rows"
            value={String(institutionalBreakdown.netflows_count)}
            detail={institutionalBreakdown.netflows_count > 0 ? 'wallet flow data present' : 'no live netflow rows'}
          />
          <StatusCard
            label="Screener Rows"
            value={String(institutionalBreakdown.screener_count)}
            detail={institutionalBreakdown.screener_count > 0 ? 'token screener data present' : 'no live screener rows'}
          />
        </section>

        {!hasLiveWalletData && (
          <section className="mt-6 rounded-2xl border border-bear/40 bg-bear/10 p-5">
            <h2 className="text-xl font-semibold text-bear">No usable live wallet intelligence</h2>
            <p className="mt-2 text-sm leading-6 text-text-secondary">
              The frontend is intentionally refusing to invent interpretation. Wallet-flow-dependent decisions should be
              suppressed until Nansen returns actual `netflows` or `screener` rows.
            </p>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <TruthItem label="Reason Codes" value={institutionalBreakdown.reason_codes.join(', ') || 'none'} />
              <TruthItem label="Failed Endpoints" value={institutionalBreakdown.endpoint_errors.join(', ') || 'none'} />
            </div>
          </section>
        )}

        <section className="mt-6 grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="rounded-2xl border border-border-default bg-bg-card p-5">
            <h2 className="text-xl font-semibold">Exact Provider Facts</h2>
            <div className="mt-4 space-y-3">
              <TruthItem
                label="Cross-Chain Net Flow"
                value={institutionalBreakdown.cross_chain_net_flow_usd_24h != null ? fmtM(institutionalBreakdown.cross_chain_net_flow_usd_24h) : 'unavailable'}
              />
              <TruthItem
                label="Dominant Chain"
                value={institutionalBreakdown.dominant_chain || 'unavailable'}
              />
              <TruthItem
                label="Top Token By Inflow"
                value={
                  institutionalBreakdown.top_token_by_inflow
                    ? `${institutionalBreakdown.top_token_by_inflow.symbol} on ${institutionalBreakdown.top_token_by_inflow.chain} (${fmtUSD(institutionalBreakdown.top_token_by_inflow.smart_money_inflow_usd)})`
                    : 'unavailable'
                }
              />
              <TruthItem
                label="Inbound Smart Wallets"
                value={institutionalBreakdown.total_smart_wallets_in_24h != null ? institutionalBreakdown.total_smart_wallets_in_24h.toLocaleString() : 'unavailable'}
              />
              <TruthItem
                label="Outbound Smart Wallets"
                value={institutionalBreakdown.total_smart_wallets_out_24h != null ? institutionalBreakdown.total_smart_wallets_out_24h.toLocaleString() : 'unavailable'}
              />
              <TruthItem
                label="Artifact Generated"
                value={walletIntel?.generatedAt || 'unavailable'}
              />
            </div>
          </div>

          <div className="rounded-2xl border border-border-default bg-bg-card p-5">
            <h2 className="text-xl font-semibold">Agent Payload</h2>
            <p className="mt-1 text-sm text-text-secondary">
              This is the only machine-facing output the page should imply right now.
            </p>
            <pre className="mt-4 overflow-x-auto rounded-xl border border-border-subtle bg-bg-secondary p-4 text-xs leading-6 text-text-secondary">
              <code>{JSON.stringify(statusPayload, null, 2)}</code>
            </pre>
          </div>
        </section>

        <section className="mt-6 rounded-2xl border border-border-default bg-bg-card p-5">
          <h2 className="text-xl font-semibold">Raw Artifact</h2>
          <p className="mt-1 text-sm text-text-secondary">
            The UI should match this payload. If it says more than this, the UI is lying.
          </p>
          <pre className="mt-4 overflow-x-auto rounded-xl border border-border-subtle bg-bg-secondary p-4 text-xs leading-6 text-text-secondary">
            <code>{JSON.stringify(walletIntel || { error: walletError || 'loading' }, null, 2)}</code>
          </pre>
        </section>
      </div>
    </div>
  );
};

const StatusCard = ({ label, value, detail }) => (
  <div className="rounded-2xl border border-border-default bg-bg-card p-5">
    <p className="stat-label">{label}</p>
    <p className="mt-2 font-mono text-3xl font-bold text-text-primary">{value}</p>
    <p className="mt-2 text-sm text-text-secondary">{detail}</p>
  </div>
);

const TruthItem = ({ label, value }) => (
  <div className="rounded-xl border border-border-subtle bg-bg-secondary px-4 py-3">
    <p className="text-xs uppercase tracking-wide text-text-muted">{label}</p>
    <p className="mt-2 break-words font-mono text-sm text-text-primary">{value}</p>
  </div>
);

export default AgentIntelligenceHub;
