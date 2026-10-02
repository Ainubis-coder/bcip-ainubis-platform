/**
 * BCIP Pipeline Summary Component
 * Phase 2D — Prompt 002D-001: CRM Frontend Foundation & Pipeline Kanban
 * Top-level metrics computed strictly from verified API opportunity figures.
 */

import React from 'react';
import { Opportunity, PipelineSummary as PipelineSummaryType } from '../shared/crm-types';
import { formatZAR } from '../shared/crm-formatters';
import { Icon } from '@bcip/ui';

interface PipelineSummaryProps {
  opportunities: Opportunity[];
  summary?: PipelineSummaryType | null;
}

export function PipelineSummary({ opportunities, summary }: PipelineSummaryProps) {
  // Compute active vs won deals
  const openOpportunities = opportunities.filter(
    (o) => o.stage !== 'WON' && o.stage !== 'LOST'
  );

  const wonOpportunities = opportunities.filter((o) => o.stage === 'WON');

  const openValue = openOpportunities.reduce(
    (sum, o) => sum + (Number(o.estimatedValue) || 0),
    0
  );

  const wonValue = wonOpportunities.reduce(
    (sum, o) => sum + (Number(o.estimatedValue) || 0),
    0
  );

  const weightedValue = summary?.totalWeightedValue ??
    openOpportunities.reduce(
      (sum, o) => sum + ((Number(o.estimatedValue) || 0) * (o.probability || 0)) / 100,
      0
    );

  const averageProbability =
    openOpportunities.length > 0
      ? Math.round(
          openOpportunities.reduce((sum, o) => sum + (o.probability || 0), 0) /
            openOpportunities.length
        )
      : 0;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {/* Metric 1: Open Opportunities */}
      <div className="bg-slate-900/60 border border-slate-800/80 rounded-lg p-3 flex flex-col justify-between">
        <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
          <span>Active Pipeline Deals</span>
          <Icon name="layers" size="xs" className="text-sky-400" />
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-2xl font-bold font-mono text-slate-100">
            {openOpportunities.length}
          </span>
          <span className="text-xs text-slate-500 font-mono">
            / {opportunities.length} total
          </span>
        </div>
        <span className="text-[11px] text-slate-400 mt-1">
          {wonOpportunities.length} closed won
        </span>
      </div>

      {/* Metric 2: Total Open Pipeline Value (ZAR) */}
      <div className="bg-slate-900/60 border border-slate-800/80 rounded-lg p-3 flex flex-col justify-between">
        <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
          <span>Active Pipeline Value</span>
          <Icon name="file-text" size="xs" className="text-emerald-400" />
        </div>
        <div className="mt-2">
          <span className="text-xl font-bold font-mono text-slate-100 tracking-tight">
            {formatZAR(openValue)}
          </span>
        </div>
        <span className="text-[11px] text-slate-400 mt-1">
          Weighted: {formatZAR(weightedValue)}
        </span>
      </div>

      {/* Metric 3: Won Revenue (ZAR) */}
      <div className="bg-slate-900/60 border border-slate-800/80 rounded-lg p-3 flex flex-col justify-between">
        <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
          <span>Closed Won Revenue</span>
          <Icon name="check" size="xs" className="text-emerald-400" />
        </div>
        <div className="mt-2">
          <span className="text-xl font-bold font-mono text-emerald-400 tracking-tight">
            {formatZAR(wonValue)}
          </span>
        </div>
        <span className="text-[11px] text-slate-400 mt-1">
          Active contract execution
        </span>
      </div>

      {/* Metric 4: Pipeline Health & Win Probability */}
      <div className="bg-slate-900/60 border border-slate-800/80 rounded-lg p-3 flex flex-col justify-between">
        <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
          <span>Avg Win Probability</span>
          <Icon name="cpu" size="xs" className="text-indigo-400" />
        </div>
        <div className="mt-2 flex items-baseline gap-1">
          <span className="text-2xl font-bold font-mono text-slate-100">
            {averageProbability}%
          </span>
          <span className="text-xs text-slate-500 font-mono">calibrated</span>
        </div>
        <span className="text-[11px] text-slate-400 mt-1">
          Across {openOpportunities.length} active stages
        </span>
      </div>
    </div>
  );
}
