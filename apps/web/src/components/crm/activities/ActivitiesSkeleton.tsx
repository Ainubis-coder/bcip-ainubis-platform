/**
 * BCIP Activities Shimmer Loading State
 * Phase 2D — Prompt 002D-005: Activities & Tasks
 */

import React from 'react';

export function ActivitiesSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      {/* KPI Cards skeleton */}
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

      {/* Table rows skeleton */}
      <div className="border border-slate-800 rounded-lg bg-slate-950 overflow-hidden divide-y divide-slate-800/60">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-14 px-4 py-3 flex items-center justify-between">
            <div className="space-y-1.5">
              <div className="h-3.5 w-48 bg-slate-800 rounded" />
              <div className="h-2.5 w-32 bg-slate-800/60 rounded" />
            </div>
            <div className="h-4 w-16 bg-slate-800 rounded" />
            <div className="h-4 w-24 bg-slate-800 rounded" />
            <div className="h-4 w-16 bg-slate-800 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}
