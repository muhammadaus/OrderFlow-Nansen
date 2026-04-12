import React from 'react';
import NansenFlowIntelligence from './components/NansenFlowIntelligence';
import './index.css';

function App() {
  return (
    <div className="min-h-screen bg-bg-primary text-text-primary">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <section className="rounded-2xl border border-border-default bg-bg-card p-6">
          <p className="text-xs uppercase tracking-[0.3em] text-accent">Deployment Surface</p>
          <h1 className="mt-3 text-4xl font-bold tracking-tight text-text-primary">
            Flow Intelligence
          </h1>
          <p className="mt-4 max-w-3xl text-base leading-7 text-text-secondary">
            This deployment shows holder-segment net flows for a specific token using the documented Nansen
            `v1 tgm/flow-intelligence` contract. It represents live deployment behavior, with a schema-compatible
            fallback when live access is unavailable.
          </p>
        </section>

        <div className="mt-6">
          <NansenFlowIntelligence />
        </div>
      </div>
    </div>
  );
}

export default App;
