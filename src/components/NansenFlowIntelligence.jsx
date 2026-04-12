import React, { useEffect, useState } from 'react';
import { fetchFlowIntelligence, fmtCompactUsd } from '../services/nansenService';

const CHAIN = 'ethereum';
const TOKEN_ADDRESS = '0xA0b86991c6218b36c1d19d4a2e9eb0ce3606eb48';
const TIMEFRAME = '1d';

const segmentConfig = [
  ['whale', 'Whales'],
  ['smart_trader', 'Smart Traders'],
  ['exchange', 'Exchanges'],
  ['top_pnl', 'Top PnL'],
  ['public_figure', 'Public Figures'],
  ['fresh_wallets', 'Fresh Wallets']
];

const NansenFlowIntelligence = () => {
  const [response, setResponse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    fetchFlowIntelligence({
      chain: CHAIN,
      tokenAddress: TOKEN_ADDRESS,
      timeframe: TIMEFRAME
    })
      .then((payload) => {
        if (!cancelled) {
          setResponse(payload);
          setError(null);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err.message);
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

  const row = response?.data?.[0] || null;
  const meta = response?.meta || {};

  if (loading) {
    return <div className="rounded-2xl border border-border-default bg-bg-card p-6 text-sm text-text-secondary">Loading flow intelligence...</div>;
  }

  if (error) {
    return <div className="rounded-2xl border border-bear/40 bg-bear/10 p-6 text-sm text-text-secondary">{error}</div>;
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-border-default bg-bg-card p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-text-primary">Flow State</h2>
            <p className="mt-1 text-sm text-text-secondary">
              Chain: {CHAIN}. Timeframe: {TIMEFRAME}. Token: {TOKEN_ADDRESS}
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <StatusCard label="Source" value={meta.source || 'unknown'} />
            <StatusCard label="Mock" value={meta.is_mock ? 'yes' : 'no'} />
            <StatusCard label="Warnings" value={String(response?.warnings?.length || 0)} />
          </div>
        </div>
        {meta.reason && (
          <div className="mt-4 rounded-xl border border-border-subtle bg-bg-secondary p-4">
            <p className="text-xs uppercase tracking-wide text-text-muted">Fallback Reason</p>
            <p className="mt-2 font-mono text-sm text-text-primary">{meta.reason}</p>
          </div>
        )}
      </section>

      {row && (
        <section className="grid gap-4 md:grid-cols-3 xl:grid-cols-6">
          {segmentConfig.map(([key, label]) => (
            <MetricCard
              key={key}
              label={label}
              value={fmtCompactUsd(row[`${key}_net_flow_usd`])}
              detail={`${row[`${key}_wallet_count`] || 0} wallets`}
            />
          ))}
        </section>
      )}

      {row && (
        <section className="rounded-2xl border border-border-default bg-bg-card p-5">
          <h2 className="text-xl font-semibold text-text-primary">Exact Nansen-Compatible Fields</h2>
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="border-b border-border-subtle text-left text-text-muted">
                <tr>
                  <th className="px-3 py-2">Segment</th>
                  <th className="px-3 py-2">net_flow_usd</th>
                  <th className="px-3 py-2">avg_flow_usd</th>
                  <th className="px-3 py-2">wallet_count</th>
                </tr>
              </thead>
              <tbody>
                {segmentConfig.map(([key, label]) => (
                  <tr key={key} className="border-b border-border-subtle">
                    <td className="px-3 py-2 font-semibold">{label}</td>
                    <td className="px-3 py-2 font-mono">{fmtCompactUsd(row[`${key}_net_flow_usd`])}</td>
                    <td className="px-3 py-2 font-mono">{fmtCompactUsd(row[`${key}_avg_flow_usd`])}</td>
                    <td className="px-3 py-2 font-mono">{row[`${key}_wallet_count`]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <section className="rounded-2xl border border-border-default bg-bg-card p-5">
        <h2 className="text-xl font-semibold text-text-primary">Raw Response</h2>
        <pre className="mt-4 overflow-x-auto rounded-xl border border-border-subtle bg-bg-secondary p-4 text-xs leading-6 text-text-secondary">
          <code>{JSON.stringify(response, null, 2)}</code>
        </pre>
      </section>
    </div>
  );
};

const StatusCard = ({ label, value }) => (
  <div className="rounded-xl border border-border-default bg-bg-secondary p-4">
    <p className="text-xs uppercase tracking-wide text-text-muted">{label}</p>
    <p className="mt-2 font-mono text-xl font-semibold text-text-primary">{value}</p>
  </div>
);

const MetricCard = ({ label, value, detail }) => (
  <div className="rounded-2xl border border-border-default bg-bg-card p-5">
    <p className="text-xs uppercase tracking-wide text-text-muted">{label}</p>
    <p className="mt-2 font-mono text-3xl font-bold text-text-primary">{value}</p>
    <p className="mt-2 text-sm text-text-secondary">{detail}</p>
  </div>
);

export default NansenFlowIntelligence;
