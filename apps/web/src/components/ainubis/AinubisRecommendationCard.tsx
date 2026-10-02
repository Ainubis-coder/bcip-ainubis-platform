/**
 * BCIP Ainubis Recommendation & Approval Card Component
 * Phase 2E — Prompt 002E-001: Ainubis CRM Intelligence Foundation & Governance
 */

import React from 'react';
import {
  AIObservationRecord,
  IntelligenceStatus,
  ApprovalRequirement,
} from '../crm/shared/crm-types';
import { AinubisConfidenceIndicator } from './AinubisConfidenceIndicator';
import { AinubisEvidenceList } from './AinubisEvidenceList';
import { formatDate } from '../crm/shared/crm-formatters';
import { Icon, Button } from '@bcip/ui';

interface AinubisRecommendationCardProps {
  observation: AIObservationRecord;
  onViewDetail: (obs: AIObservationRecord) => void;
  onApprove?: (obs: AIObservationRecord) => void;
  onReject?: (obs: AIObservationRecord) => void;
  onDismiss?: (obs: AIObservationRecord) => void;
  canApprove?: boolean;
}

export function AinubisRecommendationCard({
  observation,
  onViewDetail,
  onApprove,
  onReject,
  onDismiss,
  canApprove = false,
}: AinubisRecommendationCardProps) {
  const requiresHumanApproval =
    observation.approvalRequirement === ApprovalRequirement.HUMAN_APPROVAL_REQUIRED ||
    observation.approvalRequirement === ApprovalRequirement.RECOMMENDATION;

  const isPending =
    observation.status === IntelligenceStatus.GENERATED ||
    observation.status === IntelligenceStatus.REVIEWED;

  return (
    <div className="bg-slate-950 border border-amber-900/40 rounded-lg p-4 space-y-3.5 shadow-xs hover:border-amber-700/60 transition-colors">
      {/* Header Strip */}
      <div className="flex items-start justify-between gap-2">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] font-mono px-2 py-0.5 rounded border text-amber-400 bg-amber-500/10 border-amber-500/30">
              Recommendation
            </span>
            <AinubisConfidenceIndicator
              score={observation.confidenceScore}
              level={observation.confidenceLevel}
            />
            <span className="text-[10px] font-mono text-slate-500">
              Capability: {observation.capability}
            </span>
          </div>

          <button
            type="button"
            onClick={() => onViewDetail(observation)}
            className="text-sm font-semibold text-slate-100 hover:text-amber-400 text-left line-clamp-1 transition-colors"
          >
            {observation.title}
          </button>
        </div>

        <span className="text-[10px] font-mono text-slate-500 shrink-0">
          {formatDate(observation.createdAt)}
        </span>
      </div>

      {/* Summary Explanation */}
      <p className="text-xs text-slate-200 leading-relaxed font-sans bg-slate-900/60 p-2.5 rounded border border-slate-800">
        {observation.summary}
      </p>

      {/* Suggested Action Box */}
      {observation.suggestedAction && (
        <div className="p-2.5 rounded bg-amber-950/20 border border-amber-900/40 text-xs space-y-1">
          <div className="flex items-center gap-1.5 text-amber-400 font-semibold font-mono text-[11px]">
            <Icon name="check" size="xs" />
            <span>Suggested Action: {observation.suggestedAction.actionType}</span>
          </div>
          <p className="text-slate-300 font-sans">
            {observation.suggestedAction.description}
          </p>
        </div>
      )}

      {/* Supporting Evidence References */}
      {observation.evidence && observation.evidence.length > 0 && (
        <AinubisEvidenceList evidence={observation.evidence} />
      )}

      {/* Status & Approval Actions Footer */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 border-t border-slate-800/80 pt-2.5 text-xs">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono text-slate-500">
            Status: <span className="text-slate-200 font-semibold">{observation.status}</span>
          </span>
          {observation.approvedBy && (
            <span className="text-[10px] font-mono text-emerald-400">
              Approved by {observation.approvedBy}
            </span>
          )}
          {observation.rejectedBy && (
            <span className="text-[10px] font-mono text-rose-400">
              Rejected by {observation.rejectedBy}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 justify-end">
          <button
            type="button"
            onClick={() => onViewDetail(observation)}
            className="text-[11px] text-slate-300 hover:text-white px-2.5 py-1 rounded bg-slate-800/80 transition-colors"
          >
            Inspect Evidence
          </button>

          {isPending && requiresHumanApproval && canApprove && (
            <>
              {onApprove && (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => onApprove(observation)}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs px-2.5 py-1"
                >
                  Approve
                </Button>
              )}

              {onReject && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => onReject(observation)}
                  className="text-rose-400 border-rose-900/60 hover:bg-rose-950/40 text-xs px-2.5 py-1"
                >
                  Reject
                </Button>
              )}
            </>
          )}

          {onDismiss && observation.status !== IntelligenceStatus.DISMISSED && (
            <button
              type="button"
              onClick={() => onDismiss(observation)}
              className="text-slate-500 hover:text-slate-300 p-1"
              title="Dismiss Recommendation"
            >
              <Icon name="x" size="xs" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
