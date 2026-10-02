/**
 * BCIP Opportunity Card Component
 * Phase 2D — Prompt 002D-001: CRM Frontend Foundation & Pipeline Kanban
 * High-density commercial card adhering to Phase 2A Design Tokens and Zero-Pill discipline.
 */

import React from 'react';
import { Opportunity, STAGE_CONFIG } from '../shared/crm-types';
import { formatZAR, formatDate, formatTargetDays, formatProbability } from '../shared/crm-formatters';
import { canTransitionStage, canDeleteOpportunity } from '../shared/crm-permissions';
import { Icon } from '@bcip/ui';

interface OpportunityCardProps {
  opportunity: Opportunity;
  userRole?: string;
  onMoveStage: (opportunity: Opportunity) => void;
  onViewDetails: (opportunity: Opportunity) => void;
  onDelete?: (opportunity: Opportunity) => void;
}

export function OpportunityCard({
  opportunity,
  userRole,
  onMoveStage,
  onViewDetails,
  onDelete,
}: OpportunityCardProps) {
  const stageConfig = STAGE_CONFIG[opportunity.stage] || STAGE_CONFIG.DISCOVERY;
  const targetDays = formatTargetDays(opportunity.expectedCloseDate);
  const allowStageMove = canTransitionStage(userRole);
  const allowDelete = canDeleteOpportunity(userRole);

  return (
    <div
      tabIndex={0}
      role="article"
      aria-label={`Opportunity: ${opportunity.name}`}
      className="group relative bg-slate-900/80 hover:bg-slate-900 border border-slate-800/90 hover:border-slate-700/90 rounded-md p-3.5 transition-all duration-150 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 flex flex-col gap-2.5"
    >
      {/* Top Header: Deal Name and Action Trigger */}
      <div className="flex items-start justify-between gap-2">
        <h4
          onClick={() => onViewDetails(opportunity)}
          className="text-xs font-semibold text-slate-100 hover:text-sky-400 cursor-pointer line-clamp-2 transition-colors leading-snug"
          title={opportunity.name}
        >
          {opportunity.name}
        </h4>
        <span
          className={`shrink-0 w-2 h-2 rounded-full mt-1 ${stageConfig.colorClasses.dot}`}
          title={`Stage: ${stageConfig.label}`}
        />
      </div>

      {/* Commercial Value (ZAR) & Probability */}
      <div className="flex items-baseline justify-between pt-0.5">
        <div>
          <span className="text-sm font-bold text-slate-100 font-mono tracking-tight">
            {formatZAR(opportunity.estimatedValue)}
          </span>
          <span className="text-[10px] text-slate-500 font-mono ml-1">ZAR</span>
        </div>
        <div className="text-right">
          <span className="text-[11px] font-mono font-medium text-slate-300">
            {formatProbability(opportunity.probability)}
          </span>
          <span className="text-[10px] text-slate-500 ml-1">prob</span>
        </div>
      </div>

      {/* Probability Progress Track */}
      <div className="w-full bg-slate-950 rounded-full h-1 overflow-hidden border border-slate-800/60">
        <div
          className={`h-full transition-all duration-300 ${
            opportunity.stage === 'WON'
              ? 'bg-emerald-500'
              : opportunity.stage === 'LOST'
              ? 'bg-rose-500'
              : 'bg-sky-500'
          }`}
          style={{ width: `${Math.min(100, Math.max(5, opportunity.probability || 10))}%` }}
        />
      </div>

      {/* Unboxed Metadata (Zero-Pill discipline) */}
      <div className="text-[11px] text-slate-400 flex items-center justify-between gap-2 border-t border-slate-800/60 pt-2 font-mono">
        <div className="flex items-center gap-1.5 truncate">
          <Icon name="building" size="xs" className="text-slate-500 shrink-0" />
          <span className="truncate text-slate-300">
            {opportunity.organisationId ? 'Managing Portfolio' : 'Direct Scheme'}
          </span>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <span className={targetDays.isPast ? 'text-amber-400 font-medium' : 'text-slate-400'}>
            {targetDays.text}
          </span>
        </div>
      </div>

      {/* Next Action Snippet if defined */}
      {opportunity.nextAction && (
        <div className="bg-slate-950/70 border border-slate-800/60 rounded px-2 py-1 text-[11px] text-slate-300 flex items-center gap-1.5">
          <Icon name="check" size="xs" className="text-sky-400 shrink-0" />
          <span className="truncate" title={opportunity.nextAction}>
            {opportunity.nextAction}
          </span>
        </div>
      )}

      {/* Footer Controls */}
      <div className="flex items-center justify-between pt-1 gap-2 border-t border-slate-800/40">
        <button
          type="button"
          onClick={() => onViewDetails(opportunity)}
          className="text-[11px] text-slate-400 hover:text-slate-200 transition-colors py-1 px-1.5 rounded focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-sky-400"
        >
          View details
        </button>

        <div className="flex items-center gap-1.5">
          {allowDelete && onDelete && (
            <button
              type="button"
              onClick={() => onDelete(opportunity)}
              className="text-[11px] text-slate-500 hover:text-rose-400 transition-colors p-1 rounded focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-rose-400"
              title="Delete opportunity"
              aria-label="Delete opportunity"
            >
              <Icon name="x" size="xs" />
            </button>
          )}

          {allowStageMove && (
            <button
              type="button"
              onClick={() => onMoveStage(opportunity)}
              className="text-[11px] font-medium text-sky-400 hover:text-sky-300 bg-sky-950/40 hover:bg-sky-900/50 border border-sky-800/60 rounded px-2.5 py-1 flex items-center gap-1 transition-all focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-sky-400"
            >
              <span>Move Stage</span>
              <Icon name="chevron-right" size="xs" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
