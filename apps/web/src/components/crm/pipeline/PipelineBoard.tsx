/**
 * BCIP Pipeline Board Component
 * Phase 2D — Prompt 002D-001: CRM Frontend Foundation & Pipeline Kanban
 * Responsive Kanban board organizing opportunities by lifecycle stage.
 */

import React, { useState } from 'react';
import {
  Opportunity,
  OpportunityStage,
  ALL_PIPELINE_STAGES,
  STAGE_CONFIG,
  PipelineSummary,
} from '../shared/crm-types';
import { PipelineColumn } from './PipelineColumn';

interface PipelineBoardProps {
  opportunities: Opportunity[];
  summary?: PipelineSummary | null;
  userRole?: string;
  onMoveStage: (opportunity: Opportunity) => void;
  onViewDetails: (opportunity: Opportunity) => void;
  onDeleteOpportunity?: (opportunity: Opportunity) => void;
  onQuickAdd?: (stage: OpportunityStage) => void;
}

export function PipelineBoard({
  opportunities,
  summary,
  userRole,
  onMoveStage,
  onViewDetails,
  onDeleteOpportunity,
  onQuickAdd,
}: PipelineBoardProps) {
  // Mobile responsive stage selector filter
  const [mobileStageFilter, setMobileStageFilter] = useState<OpportunityStage | 'ALL'>('ALL');

  // Group opportunities by stage
  const opportunitiesByStage: Record<OpportunityStage, Opportunity[]> = {
    [OpportunityStage.DISCOVERY]: [],
    [OpportunityStage.SOLUTION_DESIGN]: [],
    [OpportunityStage.PROPOSAL]: [],
    [OpportunityStage.CONTRACT]: [],
    [OpportunityStage.WON]: [],
    [OpportunityStage.LOST]: [],
  };

  for (const opp of opportunities) {
    if (opportunitiesByStage[opp.stage]) {
      opportunitiesByStage[opp.stage].push(opp);
    } else {
      opportunitiesByStage[OpportunityStage.DISCOVERY].push(opp);
    }
  }

  // Calculate stage values from summary or opportunities
  const getStageTotalValue = (stage: OpportunityStage): number => {
    if (summary?.stages?.[stage]) {
      return summary.stages[stage].totalValue;
    }
    return opportunitiesByStage[stage].reduce(
      (sum, o) => sum + (Number(o.estimatedValue) || 0),
      0
    );
  };

  const visibleStages =
    mobileStageFilter === 'ALL'
      ? ALL_PIPELINE_STAGES
      : [mobileStageFilter];

  return (
    <div className="flex flex-col gap-3">
      {/* Mobile/Small Tablet Quick Stage Selector */}
      <div className="lg:hidden flex items-center gap-1.5 overflow-x-auto pb-2 border-b border-slate-800/80">
        <button
          type="button"
          onClick={() => setMobileStageFilter('ALL')}
          className={`shrink-0 px-2.5 py-1 rounded text-xs font-medium transition-all ${
            mobileStageFilter === 'ALL'
              ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40'
              : 'text-slate-400 hover:text-slate-200 bg-slate-900 border border-slate-800'
          }`}
        >
          All Stages ({opportunities.length})
        </button>
        {ALL_PIPELINE_STAGES.map((stg) => {
          const cfg = STAGE_CONFIG[stg];
          const count = opportunitiesByStage[stg].length;
          return (
            <button
              key={stg}
              type="button"
              onClick={() => setMobileStageFilter(stg)}
              className={`shrink-0 px-2.5 py-1 rounded text-xs font-medium transition-all flex items-center gap-1.5 ${
                mobileStageFilter === stg
                  ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40'
                  : 'text-slate-400 hover:text-slate-200 bg-slate-900 border border-slate-800'
              }`}
            >
              <span>{cfg.label}</span>
              <span className="text-[10px] font-mono opacity-80">({count})</span>
            </button>
          );
        })}
      </div>

      {/* Main Kanban Board: Horizontally Scrollable on Large Screens */}
      <div className="flex gap-4 overflow-x-auto pb-4 pt-1 snap-x scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
        {visibleStages.map((stage) => (
          <div key={stage} className="snap-start">
            <PipelineColumn
              stage={stage}
              opportunities={opportunitiesByStage[stage]}
              totalValue={getStageTotalValue(stage)}
              userRole={userRole}
              onMoveStage={onMoveStage}
              onViewDetails={onViewDetails}
              onDeleteOpportunity={onDeleteOpportunity}
              onQuickAdd={onQuickAdd}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
