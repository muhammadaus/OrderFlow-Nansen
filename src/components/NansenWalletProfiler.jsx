/**
 * Nansen Smart Money Panel
 *
 * Displays real Nansen data alongside orderflow:
 *   - Smart money net flows per chain (raw $)
 *   - Smart wallet inflow/outflow counts per token
 *   - Token screener with wallet counts and price change
 *   - Top inflow/outflow tokens per chain
 *
 * No speculation, no predictions — just Nansen numbers.
 */

import { useState, useEffect } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
  ComposedChart, Line, Legend,
} from 'recharts';
import {
  fetchNansenOrderflowIntel,
  SIGNAL_COLOR,
  CHAIN_COLOR,
  fmtM,
  fmtUSD,
} from '../services/nansenService.js';

// ─── Format helpers ────────────────────────────────────────────────────────────

const pct = n => `${(n * 100).toFixed(1)}%`;
const sign = n => n >= 0 ? '+' : '';
const fmtPct = n => `${sign(n)}${(n * 100).toFixed(1)}%`;

// ─── Tooltip ──────────────────────────────────────────────────────────────────

const DarkTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#0a0f1a] border border-[#1e293b] rounded-lg p-2 text-xs shadow-xl">
      <p className="text-slate-400 mb-1 capitalize">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color ?? p.fill }}>{p.name}: {p.value}</p>
      ))}
    </div>
  );
};

// ─── Net Flow Bar Chart ────────────────────────────────────────────────────────

function NetFlowBars({ netflows }) {
  const data = netflows.map(f => ({
    chain: f.chain.slice(0, 4),
    fullChain: f.chain,
    netM: parseFloat((f.net_flow_usd / 1e6).toFixed(1)),
    inM:  parseFloat((f.inflow_usd  / 1e6).toFixed(0)),
    outM: parseFloat((f.outflow_usd / 1e6).toFixed(0)),
  }));

  return (
    <ResponsiveContainer width="100%" height={130}>
      <BarChart data={data} margin={{ top: 4, right: 4, left: -8, bottom: 0 }}>
        <XAxis dataKey="chain" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fill: '#475569', fontSize: 9 }} axisLine={false} tickLine={false} tickFormatter={v => `$${v}M`} />
        <Tooltip content={<DarkTooltip />} formatter={(v, n, p) => [`${sign(v)}$${Math.abs(v)}M`, p.payload.fullChain]} />
        <Bar dataKey="netM" name="net flow" radius={[3, 3, 0, 0]}>
          {data.map((d, i) => <Cell key={i} fill={d.netM >= 0 ? '#4ade80' : '#f87171'} />)}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

// ─── Inflow vs Outflow bars ────────────────────────────────────────────────────

function FlowBreakdown({ netflows }) {
  const data = netflows.map(f => ({
    chain: f.chain.slice(0, 4),
    in:  parseFloat((f.inflow_usd  / 1e6).toFixed(0)),
    out: parseFloat((f.outflow_usd / 1e6).toFixed(0)),
  }));

  return (
    <ResponsiveContainer width="100%" height={130}>
      <BarChart data={data} margin={{ top: 4, right: 4, left: -8, bottom: 0 }} barCategoryGap="25%">
        <XAxis dataKey="chain" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fill: '#475569', fontSize: 9 }} axisLine={false} tickLine={false} tickFormatter={v => `${v}M`} />
        <Tooltip content={<DarkTooltip />} formatter={(v) => [`$${v}M`]} />
        <Legend iconSize={8} wrapperStyle={{ fontSize: 10, color: '#64748b' }} />
        <Bar dataKey="in"  name="inflow"  fill="#4ade80" radius={[2, 2, 0, 0]} />
        <Bar dataKey="out" name="outflow" fill="#f87171" radius={[2, 2, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

// ─── Screener table ────────────────────────────────────────────────────────────

function ScreenerTable({ tokens }) {
  return (
    <table className="w-full text-xs">
      <thead>
        <tr className="text-[#475569] border-b border-[#1e293b]">
          <th className="text-left pb-1.5 font-medium">Token</th>
          <th className="text-right pb-1.5 font-medium">Chain</th>
          <th className="text-right pb-1.5 font-medium">SM Inflow</th>
          <th className="text-right pb-1.5 font-medium">In Wallets</th>
          <th className="text-right pb-1.5 font-medium">Out Wallets</th>
          <th className="text-right pb-1.5 font-medium">24h</th>
          <th className="text-right pb-1.5 font-medium">Signal</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-[#0f172a]">
        {tokens.map((t, i) => (
          <tr key={i} className="hover:bg-[#0f172a] transition-colors">
            <td className="py-1.5 font-mono font-bold text-white">{t.symbol}</td>
            <td className="py-1.5 text-right font-mono text-[10px]" style={{ color: CHAIN_COLOR[t.chain] ?? '#94a3b8' }}>
              {t.chain.slice(0, 4)}
            </td>
            <td className="py-1.5 text-right font-mono text-green-400">{fmtUSD(t.smart_money_inflow_usd)}</td>
            <td className="py-1.5 text-right font-mono text-green-300">{t.smart_wallets}</td>
            <td className="py-1.5 text-right font-mono text-red-400">{t.outflow_wallets}</td>
            <td className={`py-1.5 text-right font-mono ${t.price_change_24h >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {fmtPct(t.price_change_24h)}
            </td>
            <td className="py-1.5 text-right">
              <span
                className="px-1 py-0.5 rounded text-[9px] font-medium"
                style={{ background: `${SIGNAL_COLOR[t.signal]}18`, color: SIGNAL_COLOR[t.signal] }}
              >
                {t.signal.replace('_', ' ')}
              </span>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

// ─── Chain detail card ─────────────────────────────────────────────────────────

function ChainCard({ flow }) {
  const netColor = flow.net_flow_usd >= 0 ? '#4ade80' : '#f87171';
  return (
    <div className="bg-[#080d14] border border-[#1e293b] rounded-lg p-3 space-y-2">
      <div className="flex justify-between items-center">
        <span className="text-xs font-semibold capitalize" style={{ color: CHAIN_COLOR[flow.chain] ?? '#94a3b8' }}>
          {flow.chain}
        </span>
        <span className="text-sm font-mono font-bold" style={{ color: netColor }}>
          {fmtM(flow.net_flow_usd)}
        </span>
      </div>
      <div className="flex gap-3 text-[10px] text-[#475569]">
        <span className="text-green-400/80">↑ {fmtUSD(flow.inflow_usd)}</span>
        <span className="text-red-400/80">↓ {fmtUSD(flow.outflow_usd)}</span>
      </div>
      {flow.top_inflows?.length > 0 && (
        <div className="flex flex-wrap gap-1 pt-1 border-t border-[#1e293b]">
          {flow.top_inflows.slice(0, 2).map(ti => (
            <span key={ti.token} className="text-[9px] bg-green-900/20 text-green-400 border border-green-900/30 px-1 py-0.5 rounded">
              ↑ {ti.token} {fmtUSD(ti.amount_usd)} · {ti.wallets} wallets
            </span>
          ))}
        </div>
      )}
      {flow.top_outflows?.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {flow.top_outflows.slice(0, 1).map(to => (
            <span key={to.token} className="text-[9px] bg-red-900/20 text-red-400 border border-red-900/30 px-1 py-0.5 rounded">
              ↓ {to.token} {fmtUSD(to.amount_usd)} · {to.wallets} wallets
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main component ────────────────────────────────────────────────────────────

export default function NansenSmartMoneyPanel() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [view, setView] = useState('flows'); // flows | screener | chains

  useEffect(() => {
    fetchNansenOrderflowIntel()
      .then(setData)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="animate-pulse space-y-3 p-4">
        {[1,2,3].map(i => <div key={i} className="h-20 bg-[#0f172a] rounded-lg" />)}
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-xs text-red-400 bg-red-900/10 border border-red-900/30 rounded-lg">
        Nansen error: {error}
      </div>
    );
  }

  const { netflows, screener, isDemo } = data;
  const totalNetFlow = netflows.reduce((s, f) => s + f.net_flow_usd, 0);
  const totalInflow  = netflows.reduce((s, f) => s + f.inflow_usd,   0);
  const totalOutflow = netflows.reduce((s, f) => s + f.outflow_usd,  0);
  const totalSmWallets = screener.reduce((s, t) => s + t.smart_wallets, 0);

  return (
    <div className="space-y-4">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-[#94a3b8] uppercase tracking-wider">Nansen Smart Money · 24h</span>
          {isDemo && (
            <span className="text-[9px] bg-yellow-900/30 text-yellow-500 border border-yellow-800/40 px-1.5 py-0.5 rounded">
              DEMO
            </span>
          )}
        </div>
        <div className="flex gap-1">
          {['flows', 'screener', 'chains'].map(v => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`px-2 py-1 text-[10px] rounded capitalize transition-colors ${
                view === v ? 'bg-[#1e293b] text-white' : 'text-[#475569] hover:text-[#94a3b8]'
              }`}
            >
              {v}
            </button>
          ))}
        </div>
      </div>

      {/* Summary numbers — always visible */}
      <div className="grid grid-cols-4 gap-2">
        {[
          { label: 'Net Flow',    val: fmtM(totalNetFlow),          color: totalNetFlow >= 0 ? '#4ade80' : '#f87171' },
          { label: 'Total In',    val: fmtUSD(totalInflow),         color: '#4ade80' },
          { label: 'Total Out',   val: fmtUSD(totalOutflow),        color: '#f87171' },
          { label: 'SM Wallets',  val: totalSmWallets.toLocaleString(), color: '#60a5fa' },
        ].map(({ label, val, color }) => (
          <div key={label} className="bg-[#080d14] border border-[#1e293b] rounded-lg p-2.5">
            <p className="text-[9px] text-[#475569] uppercase mb-1">{label}</p>
            <p className="text-sm font-mono font-bold" style={{ color }}>{val}</p>
          </div>
        ))}
      </div>

      {/* View: Flows */}
      {view === 'flows' && (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-[10px] text-[#475569] mb-2 uppercase">Net Flow by Chain</p>
            <NetFlowBars netflows={netflows} />
          </div>
          <div>
            <p className="text-[10px] text-[#475569] mb-2 uppercase">Inflow vs Outflow</p>
            <FlowBreakdown netflows={netflows} />
          </div>
        </div>
      )}

      {/* View: Screener */}
      {view === 'screener' && (
        <div className="overflow-x-auto">
          <ScreenerTable tokens={screener} />
        </div>
      )}

      {/* View: Chains */}
      {view === 'chains' && (
        <div className="grid grid-cols-2 gap-2">
          {netflows.map(f => <ChainCard key={f.chain} flow={f} />)}
        </div>
      )}

      <p className="text-[9px] text-[#334155] text-right">
        @nansen_ai · #NansenCLI · data via nansen-cli
      </p>
    </div>
  );
}
