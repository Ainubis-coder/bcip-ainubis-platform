/**
 * BCIP Ainubis Intelligence Observation Card Component
 * Phase 2E — Prompt 002E-002: Ainubis CRM Intelligence Dashboard & Contextual Intelligence
 * Multi-mode card (compact, expanded, detail) with evidence viewer and human-in-the-loop governance actions.
 */

import React, { useState } from 'react';
import type { AIObservationRecord } from '../crm/shared/crm-types';
import {
  IntelligenceType,
  IntelligenceStatus,
  ConfidenceLevel,
  ApprovalRequirement,
} from '../crm/shared/crm-types';
import { AinubisConfidenceIndicator } from './AinubisConfidenceIndicator';
import { AinubisEvidenceTree } from './AinubisEvidenceTree';
import { formatDate } from '../crm/shared/crm-formatters';
import { Button, Icon } from '@bcip/ui';

export interface IntelligenceObservationCardProps {
  observation: AIObservationRecord;
  mode?: 'compact' | 'expanded' | 'detail';
  onViewDetail?: (obs: AIObservationRecord) => void;
  onReview?: (obs: AIObservationRecord) => void;
  onApprove?: (obs: AIObservationRecord) => void;
  onReject?: (obs: AIObservationRecord) => void;
  onDismiss?: (obs: AIObservationRecord) => void;
  onProposeAction?: (obs: AIObservationRecord) => void;
  allowReview?: boolean;
  allowApprove?: boolean;
  allowDismiss?: boolean;
  allowPropose?: boolean;
  className?: string;
}

export function IntelligenceObservationCard({
  observation,
  mode = 'expanded',
  onViewDetail,
  onReview,
  onApprove,
  onReject,
  onDismiss,
  onProposeAction,
  allowReview = false,
  allowApprove = false,
  allowDismiss = false,
  allowPropose = false,
  className = '',
}: IntelligenceObservationCardProps) {
  const [isEvidenceExpanded, setIsEvidenceExpanded] = useState(mode === 'detail');
  const [isRejecting, setIsRejecting] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  // 1. Intelligence Type Badge Styling
  const getTypeBadge = (type: string) => {
    switch (type) {
      case IntelligenceType.ALERT:
        return {
          label: 'Alert',
          icon: 'alert-triangle',
          color: 'text-rose-400 bg-rose-500/10 border-rose-500/30',
        };
      case IntelligenceType.RECOMMENDATION:
        return {
          label: 'Recommendation',
          icon: 'zap',
          color: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
        };
      case IntelligenceType.INSIGHT:
        return {
          label: 'Insight',
          icon: 'cpu',
          color: 'text-sky-400 bg-sky-500/10 border-sky-500/30',
        };
      case IntelligenceType.HUMAN_APPROVAL_REQUIRED:
        return {
          label: 'Approval Required',
          icon: 'shield',
          color: 'text-purple-400 bg-purple-500/10 border-purple-500/30',
        };
      case IntelligenceType.OBSERVATION:
      default:
        return {
          label: 'Observation',
          icon: 'activity',
          color: 'text-slate-300 bg-slate-500/10 border-slate-500/30',
        };
    }
  };

  // 2. Status Badge Styling
  const getStatusBadge = (status: string) => {
    switch (status) {
      case IntelligenceStatus.APPROVED:
        return { label: 'Approved', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30' };
      case IntelligenceStatus.REVIEWED:
        return { label: 'Reviewed', color: 'text-blue-400 bg-blue-500/10 border-blue-500/30' };
      case IntelligenceStatus.REJECTED:
        return { label: 'Rejected', color: 'text-rose-400 bg-rose-500/10 border-rose-500/30' };
      case IntelligenceStatus.DISMISSED:
        return { label: 'Dismissed', color: 'text-slate-500 bg-slate-800 border-slate-700' };
      case IntelligenceStatus.EXECUTED:
        return { label: 'Executed', color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30' };
      case IntelligenceStatus.GENERATED:
      default:
        return { label: 'Generated', color: 'text-amber-400/90 bg-amber-500/10 border-amber-500/20' };
    }
  };

  // 3. Priority Calculation
  const isHighPriority =
    observation.confidenceLevel === ConfidenceLevel.VERY_HIGH ||
    observation.confidenceLevel === ConfidenceLevel.HIGH ||
    observation.intelligenceType === IntelligenceType.ALERT;

  const typeBadge = getTypeBadge(observation.intelligenceType);
  const statusBadge = getStatusBadge(observation.status);

  // --------------------------------------------------------------------------
  // COMPACT MODE (for contextual panels in CRM pages)
  // --------------------------------------------------------------------------
  if (mode === 'compact') {
    return (
      <div
        className={`bg-slate-950/90 border border-slate-800 rounded-md p-2.5 space-y-2 hover:border-slate-700 transition-colors text-xs ${className}`}
      >
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded border ${typeBadge.color}`}>
              {typeBadge.label}
            </span>
            {isHighPriority && (
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-rose-500/10 text-rose-400 border border-rose-500/30">
                High Priority
              </span>
            )}
            <span className="text-[10px] font-mono text-slate-500">
              {observation.confidenceScore}% conf
            </span>
          </div>

          <span className="text-[10px] font-mono text-slate-500 shrink-0">
            {formatDate(observation.createdAt)}
          </span>
        </div>

        <div>
          <button
            type="button"
            onClick={() => onViewDetail?.(observation)}
            className="text-xs font-semibold text-slate-100 hover:text-sky-400 text-left line-clamp-1 transition-colors"
          >
            {observation.title}
          </button>
          <p className="text-[11px] text-slate-400 line-clamp-2 mt-0.5 leading-snug">
            {observation.summary}
          </p>
        </div>

        <div className="flex items-center justify-between pt-1 border-t border-slate-900 text-[10px] text-slate-500 font-mono">
          <span>{observation.evidence?.length || 0} evidence records</span>
          <button
            type="button"
            onClick={() => onViewDetail?.(observation)}
            className="text-sky-400 hover:text-sky-300 font-sans font-medium"
          >
            Inspect Details →
          </button>
        </div>
      </div>
    );
  }

  // --------------------------------------------------------------------------
  // EXPANDED & DETAIL MODES (for Ainubis Dashboard & Detail Views)
  // --------------------------------------------------------------------------
  return (
    <div
      className={`bg-slate-950 border border-slate-800 rounded-lg p-4 space-y-3.5 shadow-xs hover:border-slate-700 transition-colors ${className}`}
    >
      {/* Header Strip */}
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${typeBadge.color}`}>
              {typeBadge.label}
            </span>
            <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${statusBadge.color}`}>
              {statusBadge.label}
            </span>
            {isHighPriority && (
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/30">
                High Priority
              </span>
            )}
            <AinubisConfidenceIndicator
              score={observation.confidenceScore}
              level={observation.confidenceLevel}
            />
          </div>

          <div className="flex items-baseline gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => onViewDetail?.(observation)}
              className="text-sm font-semibold text-slate-100 hover:text-sky-400 text-left transition-colors"
            >
              {observation.title}
            </button>

            {observation.targetEntityType && (
              <span className="text-[11px] font-mono text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                {observation.targetEntityType.replace('_', ' ')}: {observation.targetEntityId}
              </span>
            )}
          </div>
        </div>

        <div className="text-right shrink-0 text-[10px] font-mono text-slate-500">
          <div>Created: {formatDate(observation.createdAt)}</div>
          {observation.updatedAt !== observation.createdAt && (
            <div className="text-slate-600">Updated: {formatDate(observation.updatedAt)}</div>
          )}
        </div>
      </div>

      {/* Summary Explanation */}
      <div className="bg-slate-900/40 p-3 rounded border border-slate-800/60 space-y-1.5">
        <p className="text-xs text-slate-200 leading-relaxed font-sans">
          {observation.summary}
        </p>
        {mode === 'detail' && observation.observation && (
          <p className="text-xs text-slate-400 leading-relaxed pt-1 border-t border-slate-800/80">
            {observation.observation}
          </p>
        )}
      </div>

      {/* Suggested Action / Recommendation Prompt */}
      {observation.suggestedAction && (
        <div className="bg-amber-950/20 border border-amber-800/30 rounded p-2.5 text-xs text-amber-200 space-y-1">
          <div className="flex items-center gap-1.5 font-semibold text-[11px] uppercase tracking-wider text-amber-300 font-mono">
            <Icon name="zap" size="xs" />
            <span>Recommendation — Human Decision Required</span>
          </div>
          <p className="text-amber-100/90 text-xs">
            {observation.suggestedAction.description}
          </p>
        </div>
      )}

      {/* Evidence Tree / Viewer */}
      <div className="pt-1">
        <AinubisEvidenceTree
          observation={observation}
          defaultExpanded={mode === 'detail' || isEvidenceExpanded}
        />
      </div>

      {/* Rejection Input Mode */}
      {isRejecting && (
        <div className="bg-rose-950/20 border border-rose-800/40 rounded p-3 space-y-2">
          <label className="block text-xs font-semibold text-rose-300">
            Reason for Rejection (Audit Requirement):
          </label>
          <input
            type="text"
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="e.g. Verified by management agent, contact details already updated offline"
            className="w-full text-xs px-2.5 py-1.5 rounded bg-slate-950 border border-slate-800 text-slate-100 focus:outline-none focus:ring-1 focus:ring-rose-400"
          />
          <div className="flex items-center justify-end gap-2 pt-1">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                setIsRejecting(false);
                setRejectReason('');
              }}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              size="sm"
              disabled={!rejectReason.trim()}
              onClick={() => {
                onReject?.(observation);
                setIsRejecting(false);
              }}
            >
              Confirm Rejection
            </Button>
          </div>
        </div>
      )}

      {/* Governance & Human-in-the-Loop Footer */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-800/80 text-xs">
        <div className="flex items-center gap-2 text-[10px] font-mono text-slate-500 flex-wrap">
          <span>Requirement: <strong className="text-slate-400">{observation.approvalRequirement}</strong></span>
          {observation.reviewedBy && (
            <span>• Reviewed by: <strong className="text-slate-400">{observation.reviewedBy}</strong></span>
          )}
          {observation.approvedBy && (
            <span>• Approved by: <strong className="text-emerald-400">{observation.approvedBy}</strong></span>
          )}
          {observation.rejectedReason && (
            <span>• Rejection: <strong className="text-rose-400">{observation.rejectedReason}</strong></span>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 shrink-0">
          {onViewDetail && mode !== 'detail' && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => onViewDetail(observation)}
            >
              Inspect
            </Button>
          )}

          {allowReview && observation.status === IntelligenceStatus.GENERATED && onReview && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => onReview(observation)}
              className="text-blue-400 hover:text-blue-300"
            >
              Mark Reviewed
            </Button>
          )}

          {allowApprove &&
            (observation.status === IntelligenceStatus.GENERATED ||
              observation.status === IntelligenceStatus.REVIEWED) &&
            onApprove && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => onApprove(observation)}
              >
                Approve
              </Button>
            )}

          {allowApprove &&
            (observation.status === IntelligenceStatus.GENERATED ||
              observation.status === IntelligenceStatus.REVIEWED) &&
            onReject &&
            !isRejecting && (
              <Button
                variant="danger"
                size="sm"
                onClick={() => setIsRejecting(true)}
              >
                Reject
              </Button>
            )}

          {allowDismiss && observation.status !== IntelligenceStatus.DISMISSED && onDismiss && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => onDismiss(observation)}
              className="text-slate-400 hover:text-slate-200"
            >
              Dismiss
            </Button>
          )}

          {allowPropose && observation.status === IntelligenceStatus.APPROVED && onProposeAction && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => onProposeAction(observation)}
              className="bg-sky-600 hover:bg-sky-700 text-white flex items-center gap-1.5"
            >
              <Icon name="zap" size="xs" />
              <span>Propose CRM Action</span>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
