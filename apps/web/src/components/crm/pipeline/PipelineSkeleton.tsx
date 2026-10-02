/**
 * BCIP Pipeline Skeleton Component
 * Phase 2D — Prompt 002D-001: CRM Frontend Foundation & Pipeline Kanban
 * Shimmer loading placeholder for the CRM Kanban board.
 */

import React from 'react';

export function PipelineSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      {/* Summary Metrics Skeleton */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="bg-slate-900/60 border border-slate-800/80 rounded-lg p-3 h-24 flex flex-col justify-between"
          >
            <div className="h-3 w-24 bg-slate-800 rounded" />
            <div className="h-6 w-32 bg-slate-800 rounded" />
            <div className="h-2.5 w-20 bg-slate-800/60 rounded" />
          </div>
        ))}
      </div>

      {/* Kanban Columns Skeleton */}
      <div className="flex gap-4 overflow-x-hidden pt-2">
        {[1, 2, 3, 4, 5, 6].map((col) => (
          <div
            key={col}
            className="min-w-[280px] max-w-[320px] flex-1 bg-slate-950/60 rounded-lg border border-slate-800/80 p-3 space-y-3"
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-800/60">
              <div className="h-4 w-24 bg-slate-800 rounded" />
              <div className="h-4 w-6 bg-slate-800 rounded" />
            </div>

            {/* Cards in column */}
            <div className="space-y-2.5">
              {[1, 2].map((card) => (
                <div
                  key={card}
                  className="bg-slate-900/80 border border-slate-800/80 rounded-md p-3 space-y-2.5"
                >
                  <div className="h-3.5 w-3/4 bg-slate-800 rounded" />
                  <div className="flex items-center justify-between">
                    <div className="h-4 w-20 bg-slate-800 rounded" />
                    <div className="h-3 w-8 bg-slate-800 rounded" />
                  </div>
                  <div className="h-1.5 w-full bg-slate-800 rounded" />
                  <div className="h-3 w-1/2 bg-slate-800/60 rounded" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
