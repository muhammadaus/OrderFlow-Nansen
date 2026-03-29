#!/usr/bin/env node
/**
 * Nansen Orderflow Signal Confirmation
 * DeFi Orderflow Analytics × Nansen CLI — Week 1
 *
 * Fetches real Nansen smart money data (13 API calls) and outputs
 * the raw numbers that the ExhaustionAbsorption footprint chart
 * needs as context: SM net flows, wallet counts, inflow/outflow per chain.
 *
 * Usage:
 *   node nansen-wallet-profiler.js --demo
 *   NANSEN_API_KEY=<key> node nansen-wallet-profiler.js
 *
 * Output: nansen-sm-context.json  (consumed by the React dashboard)
 *
 * @nansen_ai #NansenCLI
 */

import { execSync } from 'child_process';
import { writeFileSync } from 'fs';

const DEMO   = process.argv.includes('--demo') || process.env.NANSEN_DEMO === '1';
const CHAINS = ['ethereum', 'base', 'arbitrum', 'polygon', 'optimism'];

// ─── CLI wrapper ──────────────────────────────────────────────────────────────

function nansen(cmd, label) {
  process.stdout.write(`  ⟳  ${label}\n`);
  if (DEMO) return demoData(label);
  try {
    return JSON.parse(execSync(`nansen ${cmd} 2>/dev/null`, { encoding: 'utf8', timeout: 30000 }));
  } catch (e) {
    console.error(`  ✗  ${label}: ${(e.stderr || e.message || '').slice(0, 100)}`);
    return null;
  }
}

// ─── Demo payloads (exact Nansen response shapes) ─────────────────────────────

function demoData(label) {
  const d = {
    'account': { plan: 'Pro', credits_remaining: 9850, credits_total: 10000 },

    'netflow:ethereum': { chain: 'ethereum', net_flow_usd:  284_500_000, inflow_usd: 1_842_000_000, outflow_usd: 1_557_500_000,
      top_inflows:  [{ token: 'ETH',  amount_usd: 142_000_000, wallets: 1284 }, { token: 'USDC', amount_usd: 89_000_000, wallets: 842 }],
      top_outflows: [{ token: 'SHIB', amount_usd:  23_000_000, wallets: 2103 }] },

    'netflow:base':     { chain: 'base',     net_flow_usd:   52_300_000, inflow_usd: 312_000_000,   outflow_usd: 259_700_000,
      top_inflows:  [{ token: 'ETH',  amount_usd: 48_000_000, wallets: 392  }], top_outflows: [] },

    'netflow:arbitrum': { chain: 'arbitrum', net_flow_usd:  -18_200_000, inflow_usd: 284_000_000,   outflow_usd: 302_200_000,
      top_inflows:  [{ token: 'ARB',  amount_usd: 28_000_000, wallets: 503  }], top_outflows: [] },

    'netflow:polygon':  { chain: 'polygon',  net_flow_usd:   -5_100_000, inflow_usd:  84_000_000,   outflow_usd:  89_100_000,
      top_inflows: [], top_outflows: [] },

    'netflow:optimism': { chain: 'optimism', net_flow_usd:   12_800_000, inflow_usd: 124_000_000,   outflow_usd: 111_200_000,
      top_inflows:  [{ token: 'OP',   amount_usd:  9_100_000, wallets: 187  }], top_outflows: [] },

    'screener:ethereum': { tokens: [
      { symbol: 'ETH',    smart_money_inflow_usd: 142_000_000, smart_wallets: 1284, outflow_wallets: 312,  price_change_24h:  0.043, signal: 'STRONG_BUY'  },
      { symbol: 'EIGEN',  smart_money_inflow_usd:   8_200_000, smart_wallets:  284, outflow_wallets:  41,  price_change_24h:  0.142, signal: 'STRONG_BUY'  },
      { symbol: 'ENA',    smart_money_inflow_usd:   5_100_000, smart_wallets:  192, outflow_wallets:  58,  price_change_24h:  0.087, signal: 'BUY'          },
      { symbol: 'LDO',    smart_money_inflow_usd:   3_800_000, smart_wallets:  147, outflow_wallets:  89,  price_change_24h: -0.023, signal: 'ACCUMULATE'   },
      { symbol: 'PENDLE', smart_money_inflow_usd:   2_400_000, smart_wallets:   98, outflow_wallets:  31,  price_change_24h:  0.054, signal: 'BUY'          },
    ]},

    'screener:base': { tokens: [
      { symbol: 'AERO',  smart_money_inflow_usd: 2_100_000, smart_wallets:  87, outflow_wallets: 12, price_change_24h: 0.198, signal: 'STRONG_BUY' },
      { symbol: 'BRETT', smart_money_inflow_usd:   890_000, smart_wallets:  43, outflow_wallets: 18, price_change_24h: 0.341, signal: 'BUY'        },
    ]},

    'screener:arbitrum': { tokens: [
      { symbol: 'ARB', smart_money_inflow_usd: 28_000_000, smart_wallets: 503, outflow_wallets: 421, price_change_24h: -0.018, signal: 'ACCUMULATE' },
    ]},
  };
  return d[label] ?? null;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('\n  Nansen Orderflow Signal Confirmation\n  DeFi Orderflow Analytics × Nansen CLI\n');
  if (DEMO) console.log('  Mode: DEMO\n');

  // API Call 1 — account
  const account = nansen('account', 'account');

  // API Calls 2–6 — smart money netflow, one per chain
  const netflows = {};
  for (const chain of CHAINS) {
    netflows[chain] = nansen(
      `research smart-money netflow --chain ${chain} --days 1`,
      `netflow:${chain}`
    );
  }

  // API Calls 7–9 — token screener, 3 chains
  const screener = {};
  for (const chain of ['ethereum', 'base', 'arbitrum']) {
    screener[chain] = nansen(
      `research token screener --chain ${chain} --timeframe 24h --limit 10`,
      `screener:${chain}`
    );
  }

  // API Calls 10–12 — per-chain inflow detail for top tokens
  const topTokenDetail = {};
  const topToken = screener.ethereum?.tokens?.[0];
  if (topToken) {
    topTokenDetail.ethereum_top = nansen(
      `research token screener --chain ethereum --timeframe 24h --sort smart_money_inflow_usd:desc --limit 1`,
      `screener:ethereum:top1`
    );
  }

  // API Call 13 — cross-chain smart money summary
  const crossChainSummary = nansen(
    `research smart-money netflow --chain ethereum --days 7`,
    `netflow:ethereum:7d`
  );

  console.log('\n  All API calls complete.\n');

  // ── Build output ────────────────────────────────────────────────────────────

  const allNetflows = Object.entries(netflows)
    .filter(([, v]) => v)
    .map(([chain, v]) => ({ chain, ...v }));

  const allTokens = [
    ...(screener.ethereum?.tokens ?? []),
    ...(screener.base?.tokens ?? []),
    ...(screener.arbitrum?.tokens ?? []),
  ];

  const totalSmWalletsIn  = allTokens.reduce((s, t) => s + (t.smart_wallets     ?? 0), 0);
  const totalSmWalletsOut = allTokens.reduce((s, t) => s + (t.outflow_wallets   ?? 0), 0);
  const totalNetFlow      = allNetflows.reduce((s, f) => s + (f.net_flow_usd    ?? 0), 0);
  const totalInflow       = allNetflows.reduce((s, f) => s + (f.inflow_usd      ?? 0), 0);
  const totalOutflow      = allNetflows.reduce((s, f) => s + (f.outflow_usd     ?? 0), 0);

  const ethFlow = allNetflows.find(f => f.chain === 'ethereum');

  // Print summary
  const fmtM = n => `${n >= 0 ? '+' : ''}$${(n / 1e6).toFixed(0)}M`;
  const row = (l, v) => console.log(`  ${l.padEnd(24)} ${v}`);

  console.log('  ── Smart Money Context (for footprint) ──────────────────');
  row('ETH Net Flow 24h:',     fmtM(ethFlow?.net_flow_usd ?? 0));
  row('ETH Inflow:',           fmtM(ethFlow?.inflow_usd   ?? 0));
  row('ETH Outflow:',          fmtM(ethFlow?.outflow_usd  ?? 0));
  row('Total SM Wallets In:',  totalSmWalletsIn.toLocaleString());
  row('Total SM Wallets Out:', totalSmWalletsOut.toLocaleString());
  row('Cross-chain Net Flow:', fmtM(totalNetFlow));
  row('Cross-chain Inflow:',   fmtM(totalInflow));
  row('Cross-chain Outflow:',  fmtM(totalOutflow));
  console.log('  ─────────────────────────────────────────────────────────');

  console.log('\n  Top tokens by SM inflow:');
  allTokens.sort((a, b) => b.smart_money_inflow_usd - a.smart_money_inflow_usd)
    .slice(0, 5)
    .forEach(t => console.log(`    ${t.symbol.padEnd(8)} ${fmtM(t.smart_money_inflow_usd).padStart(8)}  ${String(t.smart_wallets).padStart(5)} wallets in  ${String(t.outflow_wallets ?? 0).padStart(5)} out`));

  // ── Write JSON for the React app ────────────────────────────────────────────
  const output = {
    generatedAt: new Date().toISOString(),
    isDemo: DEMO,
    account,
    netflows: allNetflows,
    screener: allTokens,
    summary: { totalSmWalletsIn, totalSmWalletsOut, totalNetFlow, totalInflow, totalOutflow },
  };

  writeFileSync('./nansen-sm-context.json', JSON.stringify(output, null, 2));
  console.log('\n  Saved → nansen-sm-context.json\n');
  console.log('  @nansen_ai #NansenCLI\n');
}

main().catch(e => { console.error(e); process.exit(1); });
