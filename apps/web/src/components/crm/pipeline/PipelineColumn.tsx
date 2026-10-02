/**
 * BCIP Pipeline Column Component
 * Phase 2D — Prompt 002D-001: CRM Frontend Foundation & Pipeline Kanban
 * Single Kanban column representing a lifecycle stage with metrics and opportunities.
 */

import React from 'react';
import { Opportunity, OpportunityStage, STAGE_CONFIG } from '../shared/crm-types';
import { OpportunityCard } from './OpportunityCard';
import { formatZAR, formatCompactZAR } from '../shared/crm-formatters';
import { canCreateOpportunity } from '../shared/crm-permissions';
import { Icon } from '@bcip/ui';

interface PipelineColumnProps {
  stage: OpportunityStage;
  opportunities: Opportunity[];
  totalValue: number;
  userRole?: string;
  onMoveStage: (opportunity: Opportunity) => void;
  onViewDetails: (opportunity: Opportunity) => void;
  onDeleteOpportunity?: (opportunity: Opportunity) => void;
  onQuickAdd?: (stage: OpportunityStage) => void;
}

export function PipelineColumn({
  stage,
  opportunities,
  totalValue,
  userRole,
  onMoveStage,
  onViewDetails,
  onDeleteOpportunity,
  onQuickAdd,
}: PipelineColumnProps) {
  const config = STAGE_CONFIG[stage] || STAGE_CONFIG.DISCOVERY;
  const allowCreate = canCreateOpportunity(userRole);

  return (
    <div
      className={`flex flex-col min-w-[280px] max-w-[320px] flex-1 bg-slate-950/60 rounded-lg border border-slate-800/80 ${config.colorClasses.columnBorder} border-t-2 shadow-xs`}
    >
      {/* Column Header */}
      <div className={`p-3 border-b border-slate-800/80 ${config.colorClasses.headerBg} rounded-t-md`}>
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
              {config.label}
            </h3>
            <span className="text-[11px] font-mono px-1.5 py-0.2 rounded bg-slate-900 border border-slate-700/60 text-slate-300 font-semibold">
              {opportunities.length}
            </span>
          </div>

          {allowCreate && onQuickAdd && (
            <button
              type="button"
              onClick={() => onQuickAdd(stage)}
              className="text-slate-400 hover:text-slate-100 p-1 rounded hover:bg-slate-800/60 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-sky-400"
              title={`Add deal to ${config.label}`}
              aria-label={`Add deal to ${config.label}`}
            >
              <Icon name="plus" size="xs" />
            </button>
          )}
        </div>

        {/* Column Stage Value */}
        <div className="flex items-baseline justify-between mt-1 text-[11px] font-mono text-slate-400">
          <span className="text-slate-500">Stage Value</span>
          <span className="font-semibold text-slate-200">
            {formatZAR(totalValue)}
          </span>
        </div>
      </div>

      {/* Cards Container */}
      <div className="flex-1 p-2.5 space-y-2.5 overflow-y-auto max-h-[calc(100vh-280px)] min-h-[160px]">
        {opportunities.length > 0 ? (
          opportunities.map((opp) => (
            <OpportunityCard
              key={opp.id}
              opportunity={opp}
              userRole={userRole}
              onMoveStage={onMoveStage}
              onViewDetails={onViewDetails}
              onDelete={onDeleteOpportunity}
            />
          ))
        ) : (
          <div className="h-32 border border-dashed border-slate-800/80 rounded-md flex flex-col items-center justify-center p-4 text-center">
            <span className="text-xs text-slate-500">No deals in {config.label}</span>
            {allowCreate && onQuickAdd && (
              <button
                type="button"
                onClick={() => onQuickAdd(stage)}
                className="mt-2 text-[11px] text-sky-400 hover:text-sky-300 font-medium focus-visible:outline-none focus-visible:underline"
              >
                + Create deal
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
