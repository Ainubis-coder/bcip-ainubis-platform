/**
 * BCIP Ainubis Observation Card Component
 * Phase 2E — Prompt 002E-001: Ainubis CRM Intelligence Foundation & Governance
 */

import React from 'react';
import {
  AIObservationRecord,
  IntelligenceType,
  IntelligenceStatus,
} from '../crm/shared/crm-types';
import { AinubisConfidenceIndicator } from './AinubisConfidenceIndicator';
import { AinubisEvidenceList } from './AinubisEvidenceList';
import { formatDate } from '../crm/shared/crm-formatters';
import { Icon } from '@bcip/ui';

interface AinubisObservationCardProps {
  observation: AIObservationRecord;
  onViewDetail: (obs: AIObservationRecord) => void;
  onReview?: (obs: AIObservationRecord) => void;
  onDismiss?: (obs: AIObservationRecord) => void;
  allowReview?: boolean;
}

export function AinubisObservationCard({
  observation,
  onViewDetail,
  onReview,
  onDismiss,
  allowReview = false,
}: AinubisObservationCardProps) {
  const getTypeBadge = (type: string) => {
    switch (type) {
      case IntelligenceType.ALERT:
        return { label: 'Alert', color: 'text-rose-400 bg-rose-500/10 border-rose-500/30' };
      case IntelligenceType.RECOMMENDATION:
        return { label: 'Recommendation', color: 'text-amber-400 bg-amber-500/10 border-amber-500/30' };
      case IntelligenceType.INSIGHT:
        return { label: 'Insight', color: 'text-sky-400 bg-sky-500/10 border-sky-500/30' };
      case IntelligenceType.HUMAN_APPROVAL_REQUIRED:
        return { label: 'Approval Required', color: 'text-purple-400 bg-purple-500/10 border-purple-500/30' };
      case IntelligenceType.OBSERVATION:
      default:
        return { label: 'Observation', color: 'text-slate-300 bg-slate-500/10 border-slate-500/30' };
    }
  };

  const typeBadge = getTypeBadge(observation.intelligenceType);

  return (
    <div className="bg-slate-950 border border-slate-800 rounded-lg p-4 space-y-3 shadow-xs hover:border-slate-700 transition-colors">
      {/* Header Strip */}
      <div className="flex items-start justify-between gap-2">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${typeBadge.color}`}>
              {typeBadge.label}
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
            className="text-sm font-semibold text-slate-100 hover:text-sky-400 text-left line-clamp-1 transition-colors"
          >
            {observation.title}
          </button>
        </div>

        <span className="text-[10px] font-mono text-slate-500 shrink-0">
          {formatDate(observation.createdAt)}
        </span>
      </div>

      {/* Summary Explanation */}
      <p className="text-xs text-slate-300 leading-relaxed font-sans bg-slate-900/40 p-2.5 rounded border border-slate-800/60">
        {observation.summary}
      </p>

      {/* Evidence references */}
      {observation.evidence && observation.evidence.length > 0 && (
        <AinubisEvidenceList evidence={observation.evidence} />
      )}

      {/* Action Footer */}
      <div className="flex items-center justify-between border-t border-slate-800/80 pt-2 text-xs">
        <span className="text-[10px] font-mono text-slate-500">
          Status: <span className="text-slate-300 font-semibold">{observation.status}</span>
        </span>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onViewDetail(observation)}
            className="text-[11px] text-slate-300 hover:text-white px-2.5 py-1 rounded bg-slate-800/80 transition-colors"
          >
            Details
          </button>

          {allowReview && observation.status === IntelligenceStatus.GENERATED && onReview && (
            <button
              type="button"
              onClick={() => onReview(observation)}
              className="text-[11px] text-sky-400 hover:text-sky-300 px-2.5 py-1 rounded bg-sky-950/40 border border-sky-800/40 transition-colors"
            >
              Mark Reviewed
            </button>
          )}

          {onDismiss && observation.status !== IntelligenceStatus.DISMISSED && (
            <button
              type="button"
              onClick={() => onDismiss(observation)}
              className="text-slate-500 hover:text-slate-300 p-1"
              title="Dismiss Observation"
            >
              <Icon name="x" size="xs" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
