import React, { useEffect, useState } from 'react';
import { fetchTokenScreener, fmtCompactUsd, fmtPercent } from '../services/nansenService';

const CHAINS = ['ethereum', 'base', 'solana'];
const TIMEFRAME = '24h';

const NansenTokenScreener = () => {
  const [response, setResponse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    fetchTokenScreener({
      chains: CHAINS,
      timeframe: TIMEFRAME,
      onlySmartMoney: true,
      page: 1,
      perPage: 10
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

  const rows = response?.data || [];
  const meta = response?.meta || {};
  const topToken = rows[0] || null;

  if (loading) {
    return (
      <div className="rounded-2xl border border-border-default bg-bg-card p-6">
        <p className="text-sm text-text-secondary">Loading token screener...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-bear/40 bg-bear/10 p-6">
        <h2 className="text-lg font-semibold text-bear">Token screener failed</h2>
        <p className="mt-2 text-sm text-text-secondary">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-border-default bg-bg-card p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-text-primary">Screen Status</h2>
            <p className="mt-1 text-sm text-text-secondary">
              Chains: {CHAINS.join(', ')}. Timeframe: {TIMEFRAME}. Only Smart Money: true.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <StatusCard label="Source" value={meta.source || 'unknown'} />
            <StatusCard label="Mock" value={meta.is_mock ? 'yes' : 'no'} />
            <StatusCard label="Rows" value={String(rows.length)} />
          </div>
        </div>
        {meta.reason && (
          <div className="mt-4 rounded-xl border border-border-subtle bg-bg-secondary p-4">
            <p className="text-xs uppercase tracking-wide text-text-muted">Fallback Reason</p>
            <p className="mt-2 font-mono text-sm text-text-primary">{meta.reason}</p>
          </div>
        )}
      </section>

      {topToken && (
        <section className="grid gap-4 md:grid-cols-4">
          <MetricCard label="Top Token" value={topToken.token_symbol} detail={topToken.chain} />
          <MetricCard label="Netflow" value={fmtCompactUsd(topToken.netflow)} detail="top row" />
          <MetricCard label="Buy Volume" value={fmtCompactUsd(topToken.buy_volume)} detail="24h" />
          <MetricCard label="Price Change" value={fmtPercent(topToken.price_change)} detail="24h" />
        </section>
      )}

      <section className="rounded-2xl border border-border-default bg-bg-card p-5">
        <h2 className="text-xl font-semibold text-text-primary">Exact Nansen-Compatible Fields</h2>
        <p className="mt-1 text-sm text-text-secondary">
          The table columns follow the documented `v1 token-screener` response keys.
        </p>
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="border-b border-border-subtle text-left text-text-muted">
              <tr>
                <th className="px-3 py-2">chain</th>
                <th className="px-3 py-2">token_symbol</th>
                <th className="px-3 py-2">token_age_days</th>
                <th className="px-3 py-2">price_usd</th>
                <th className="px-3 py-2">price_change</th>
                <th className="px-3 py-2">liquidity</th>
                <th className="px-3 py-2">volume</th>
                <th className="px-3 py-2">netflow</th>
                <th className="px-3 py-2">inflow_fdv_ratio</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={`${row.chain}-${row.token_address}`} className="border-b border-border-subtle">
                  <td className="px-3 py-2 font-mono">{row.chain}</td>
                  <td className="px-3 py-2 font-mono font-semibold">{row.token_symbol}</td>
                  <td className="px-3 py-2 font-mono">{row.token_age_days}</td>
                  <td className="px-3 py-2 font-mono">{fmtCompactUsd(row.price_usd)}</td>
                  <td className={`px-3 py-2 font-mono ${row.price_change >= 0 ? 'text-bull' : 'text-bear'}`}>{fmtPercent(row.price_change)}</td>
                  <td className="px-3 py-2 font-mono">{fmtCompactUsd(row.liquidity)}</td>
                  <td className="px-3 py-2 font-mono">{fmtCompactUsd(row.volume)}</td>
                  <td className={`px-3 py-2 font-mono ${row.netflow >= 0 ? 'text-bull' : 'text-bear'}`}>{fmtCompactUsd(row.netflow)}</td>
                  <td className="px-3 py-2 font-mono">{fmtPercent(row.inflow_fdv_ratio)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

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

export default NansenTokenScreener;
