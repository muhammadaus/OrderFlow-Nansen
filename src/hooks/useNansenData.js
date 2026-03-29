/**
 * useNansenData
 * Exposes Nansen on-chain capital flow data as fundamental signals.
 * Refreshes every 5 minutes. No interpretation beyond what the numbers say.
 *
 * Fundamental signals surfaced:
 *   onChainBias          — 'bullish' | 'bearish' | 'neutral'  (ETH net flow direction)
 *   capitalFlowStrength  — 0–100  (net flow magnitude as % of total throughput)
 *   flowConfirms(dir)    — true / false / null  (does capital flow agree with a given signal direction?)
 *   chainRotation        — per-chain inflow/outflow for cross-chain capital rotation context
 */

import { useState, useEffect, useRef } from 'react';
import { fetchNansenOrderflowIntel } from '../services/nansenService.js';

const REFRESH_MS = 5 * 60 * 1000;

// Threshold below which net flow is treated as noise (< $50M on ETH = neutral)
const FLOW_BIAS_THRESHOLD = 50_000_000;

export function useNansenData() {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);
  const timerRef = useRef(null);

  const load = async () => {
    try {
      const result = await fetchNansenOrderflowIntel();
      setData(result);
      setError(null);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    timerRef.current = setInterval(load, REFRESH_MS);
    return () => clearInterval(timerRef.current);
  }, []);

  // ── Per-chain lookup ────────────────────────────────────────────────────────
  const chainFlow = (chain) =>
    data?.netflows?.find(f => f.chain === chain) ?? null;

  const ethFlow = chainFlow('ethereum');

  // ── On-chain capital bias ───────────────────────────────────────────────────
  // Derived purely from ETH net flow USD (inflow minus outflow).
  // This is real capital movement, not wallet speculation.
  const onChainBias = (() => {
    if (!ethFlow) return 'neutral';
    if (ethFlow.net_flow_usd >  FLOW_BIAS_THRESHOLD) return 'bullish';
    if (ethFlow.net_flow_usd < -FLOW_BIAS_THRESHOLD) return 'bearish';
    return 'neutral';
  })();

  // 0–100: how strong is the net flow relative to total throughput on Ethereum
  const capitalFlowStrength = (() => {
    if (!ethFlow || !ethFlow.inflow_usd) return 50;
    const total = ethFlow.inflow_usd + ethFlow.outflow_usd;
    if (total === 0) return 50;
    return Math.round(Math.min(Math.abs(ethFlow.net_flow_usd) / total * 200, 100));
  })();

  // Does on-chain capital flow confirm a given signal direction?
  // Returns: true = confirms, false = diverges, null = neutral / no data
  const flowConfirms = (signalDirection) => {
    if (onChainBias === 'neutral' || !signalDirection) return null;
    return onChainBias === signalDirection;
  };

  // Per-chain rotation: where capital is moving between L1/L2s
  const chainRotation = (data?.netflows ?? []).map(f => ({
    chain:     f.chain,
    direction: f.net_flow_usd > 0 ? 'inflow' : 'outflow',
    netFlow:   f.net_flow_usd,
    inflow:    f.inflow_usd,
    outflow:   f.outflow_usd,
  }));

  return {
    data,
    loading,
    error,
    isDemo: data?.isDemo ?? true,
    chainFlow,

    // Fundamental capital flow signals
    onChainBias,
    capitalFlowStrength,
    flowConfirms,
    chainRotation,

    // Raw ETH numbers for display
    ethNetFlow:  ethFlow?.net_flow_usd ?? null,
    ethInflow:   ethFlow?.inflow_usd   ?? null,
    ethOutflow:  ethFlow?.outflow_usd  ?? null,

    // Token-level data (capital rotation by asset)
    screener: data?.screener ?? [],
    netflows: data?.netflows ?? [],
  };
}
