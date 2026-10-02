/**
 * BCIP Leads Skeleton Component
 * Phase 2D — Prompt 002D-002: CRM Leads Management Table
 * Shimmer placeholder during leads query loading.
 */

import React from 'react';

export function LeadsSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      {/* Summary KPI Strip Skeleton */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="bg-slate-900/60 border border-slate-800/80 rounded-lg p-3 h-20 flex flex-col justify-between"
          >
            <div className="h-3 w-20 bg-slate-800 rounded" />
            <div className="h-5 w-16 bg-slate-800 rounded" />
          </div>
        ))}
      </div>

      {/* Filter Toolbar Skeleton */}
      <div className="h-12 bg-slate-900/40 border border-slate-800/60 rounded-lg" />

      {/* Table Skeleton */}
      <div className="bg-slate-950 border border-slate-800 rounded-lg overflow-hidden">
        <div className="h-10 bg-slate-900/80 border-b border-slate-800 flex items-center px-4 gap-4">
          <div className="h-3.5 w-1/4 bg-slate-800 rounded" />
          <div className="h-3.5 w-1/6 bg-slate-800 rounded" />
          <div className="h-3.5 w-1/6 bg-slate-800 rounded" />
          <div className="h-3.5 w-1/6 bg-slate-800 rounded" />
          <div className="h-3.5 w-1/6 bg-slate-800 rounded" />
        </div>
        <div className="divide-y divide-slate-800/60">
          {[1, 2, 3, 4, 5, 6].map((row) => (
            <div key={row} className="h-14 flex items-center px-4 gap-4">
              <div className="h-4 w-1/4 bg-slate-800/70 rounded" />
              <div className="h-4 w-1/6 bg-slate-800/70 rounded" />
              <div className="h-4 w-1/6 bg-slate-800/70 rounded" />
              <div className="h-4 w-1/6 bg-slate-800/70 rounded" />
              <div className="h-4 w-1/6 bg-slate-800/70 rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
