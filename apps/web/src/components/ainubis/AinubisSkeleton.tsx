/**
 * BCIP Ainubis Intelligence Shimmer Skeleton
 * Phase 2E — Prompt 002E-001: Ainubis CRM Intelligence Foundation & Governance
 */

import React from 'react';

export function AinubisSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      {/* KPI Cards Skeleton */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-20 bg-slate-900/60 border border-slate-800 rounded-lg p-3">
            <div className="h-3 w-20 bg-slate-800 rounded mb-2" />
            <div className="h-6 w-12 bg-slate-800 rounded" />
          </div>
        ))}
      </div>

      {/* Filter toolbar skeleton */}
      <div className="h-14 bg-slate-900/40 border border-slate-800 rounded-lg" />

      {/* Observation Card Grid Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-44 bg-slate-900/60 border border-slate-800 rounded-lg p-4 space-y-3">
            <div className="flex justify-between items-center">
              <div className="h-4 w-32 bg-slate-800 rounded" />
              <div className="h-3 w-20 bg-slate-800/60 rounded" />
            </div>
            <div className="h-5 w-3/4 bg-slate-800 rounded" />
            <div className="h-12 bg-slate-950 rounded border border-slate-800/40" />
            <div className="h-4 w-1/2 bg-slate-800/60 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}
