import React, { useState } from 'react';
// Core Components
import MarketStructure from './components/MarketStructure';
import VolumeProfile from './components/VolumeProfile';
import LiquidityHeatmap from './components/LiquidityHeatmap';
import FundingRateOI from './components/FundingRateOI';
import TradingInsights from './components/TradingInsights';
import WyckoffAnalysis from './components/WyckoffAnalysis';
import SmartMoneyConcepts from './components/SmartMoneyConcepts';
import MarketProfile from './components/MarketProfile';
import MEVArbitrageScanner from './components/MEVArbitrageScanner';
import InstitutionalFootprint from './components/InstitutionalFootprint';
import MarketStructureEducation from './components/MarketStructureEducation';
// Nansen CLI Integration — Week 1: Smart Money Wallet Profiler
import NansenWalletProfiler from './components/NansenWalletProfiler';
// Unified Orderflow Dashboard (consolidates footprint, candlestick, imbalance, CVD)
import OrderflowDashboard from './components/OrderflowDashboard';
// Other Components
import LiquiditySweepMonitor from './components/LiquiditySweepMonitor';
import OrderflowConfluence from './components/OrderflowConfluence';
// Data Source Context
import { DataSourceProvider } from './services/dataSourceContext';
import { StreamingConfigProvider } from './hooks/useStreamingConfig';
import { DataAggregatorCompact } from './components/DataAggregator';

function App() {
  const [activeTab, setActiveTab] = useState('orderflow');

  const tabs = [
    { id: 'orderflow', name: 'Orderflow', component: OrderflowDashboard },
    { id: 'confluence', name: 'Confluence', component: OrderflowConfluence },
    { id: 'sweeps', name: 'Sweeps', component: LiquiditySweepMonitor },
    { id: 'structure', name: 'Structure', component: MarketStructure },
    { id: 'wyckoff', name: 'Wyckoff', component: WyckoffAnalysis },
    { id: 'smc', name: 'Smart Money', component: SmartMoneyConcepts },
    { id: 'profile', name: 'Profile', component: MarketProfile },
    { id: 'volume', name: 'Volume', component: VolumeProfile },
    { id: 'liquidity', name: 'Heatmap', component: LiquidityHeatmap },
    { id: 'mev', name: 'MEV', component: MEVArbitrageScanner },
    { id: 'institutional', name: 'Institutional', component: InstitutionalFootprint },
    { id: 'funding', name: 'Funding', component: FundingRateOI },
    { id: 'insights', name: 'Insights', component: TradingInsights },
    { id: 'education', name: 'Education', component: MarketStructureEducation },
    { id: 'nansen', name: '⬡ Nansen', component: NansenWalletProfiler },
  ];

  const ActiveComponent = tabs.find(tab => tab.id === activeTab)?.component || OrderflowDashboard;

  return (
    <StreamingConfigProvider>
    <DataSourceProvider>
    <div className="min-h-screen bg-bg-primary text-text-primary">
      {/* Header */}
      <header className="border-b border-border-default bg-bg-secondary px-4 py-3">
        <div className="max-w-full mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div>
                <h1 className="text-lg font-bold text-text-primary font-mono tracking-tight">
                  DEFI ORDERFLOW
                </h1>
                <p className="text-xxs text-text-muted uppercase tracking-wider">
                  Professional Analytics
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-6">
              {/* Data Aggregator Panel */}
              <DataAggregatorCompact />
              <div className="text-right">
                <p className="text-xxs text-text-muted uppercase tracking-wide">ETH/USD</p>
                <p className="text-lg font-semibold text-text-primary font-mono tabular-nums">$2,847.32</p>
                <p className="text-xxs text-bull font-mono tabular-nums">+2.34%</p>
              </div>
              <div className="flex items-center space-x-2">
                <span className="w-2 h-2 bg-accent rounded-full animate-pulse-slow"></span>
                <span className="text-xxs text-accent font-medium uppercase">LIVE</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav className="bg-bg-card border-b border-border-default">
        <div className="max-w-full mx-auto px-2">
          <div className="flex flex-wrap gap-1 py-2 justify-center">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3 py-1.5 text-xs font-medium transition-all whitespace-nowrap rounded ${
                  activeTab === tab.id
                    ? 'bg-accent text-bg-primary'
                    : 'bg-bg-secondary text-text-secondary hover:bg-bg-elevated hover:text-text-primary border border-border-subtle'
                }`}
              >
                {tab.name}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-full mx-auto px-4 py-4">
        {/* Stats Grid */}
        <div className="grid grid-cols-4 gap-3 mb-4">
          <div className="bg-bg-card border border-border-default rounded-lg px-4 py-3">
            <p className="text-xxs text-text-muted uppercase tracking-wide font-medium">24h Volume</p>
            <p className="text-lg font-semibold text-text-primary font-mono tabular-nums mt-1">$2.8B</p>
          </div>

          <div className="bg-bg-card border border-border-default rounded-lg px-4 py-3">
            <p className="text-xxs text-text-muted uppercase tracking-wide font-medium">Open Interest</p>
            <p className="text-lg font-semibold text-text-primary font-mono tabular-nums mt-1">$450M</p>
          </div>

          <div className="bg-bg-card border border-border-default rounded-lg px-4 py-3">
            <p className="text-xxs text-text-muted uppercase tracking-wide font-medium">Funding Rate</p>
            <p className="text-lg font-semibold text-bear font-mono tabular-nums mt-1">+0.0287%</p>
          </div>

          <div className="bg-bg-card border border-border-default rounded-lg px-4 py-3">
            <p className="text-xxs text-text-muted uppercase tracking-wide font-medium">Market Status</p>
            <div className="flex items-center gap-2 mt-1">
              <span className="w-2 h-2 bg-accent rounded-full"></span>
              <p className="text-lg font-semibold text-accent">ACTIVE</p>
            </div>
          </div>
        </div>

        {/* Active Component */}
        <ActiveComponent />

        {/* Footer Knowledge Base */}
        <div className="mt-4 grid grid-cols-3 gap-4">
          <div className="bg-bg-card border border-border-default rounded-lg px-5 py-4 border-l-4 border-l-accent">
            <h4 className="text-sm font-semibold text-accent uppercase tracking-wide mb-3">Market Structure</h4>
            <ul className="text-sm text-text-secondary space-y-2 leading-relaxed">
              <li>Markets are continuous auctions seeking fair value</li>
              <li>Trade when information asymmetry is lowest</li>
              <li>Follow institutional flow, don't fight it</li>
              <li>Understand WHY levels hold, not just that they do</li>
            </ul>
          </div>
          <div className="bg-bg-card border border-border-default rounded-lg px-5 py-4 border-l-4 border-l-bull">
            <h4 className="text-sm font-semibold text-bull uppercase tracking-wide mb-3">Evidence-Based</h4>
            <ul className="text-sm text-text-secondary space-y-2 leading-relaxed">
              <li>Order flow shows current supply/demand reality</li>
              <li>Volume profile reveals institutional acceptance</li>
              <li>Liquidity analysis shows where price wants to go</li>
              <li>Market regime determines which strategies work</li>
            </ul>
          </div>
          <div className="bg-bg-card border border-border-default rounded-lg px-5 py-4 border-l-4 border-l-bear">
            <h4 className="text-sm font-semibold text-bear uppercase tracking-wide mb-3">Risk Management</h4>
            <ul className="text-sm text-text-secondary space-y-2 leading-relaxed">
              <li>Higher information asymmetry = higher risk</li>
              <li>Position size based on signal quality</li>
              <li>Avoid directional bets during news/events</li>
              <li>Use technical levels when fundamental edge is low</li>
            </ul>
          </div>
        </div>
      </main>
    </div>
    </DataSourceProvider>
    </StreamingConfigProvider>
  );
}

export default App;
