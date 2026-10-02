/**
 * BCIP Ainubis Intelligence Detail Modal Component
 * Phase 2E — Prompt 002E-001: Ainubis CRM Intelligence Foundation & Governance
 */

import React, { useState } from 'react';
import type {
  AIObservationRecord,
} from '../crm/shared/crm-types';
import {
  IntelligenceStatus,
  ApprovalRequirement,
} from '../crm/shared/crm-types';
import { formatDate } from '../crm/shared/crm-formatters';
import { AinubisConfidenceIndicator } from './AinubisConfidenceIndicator';
import { AinubisEvidenceTree } from './AinubisEvidenceTree';
import { Modal, Button, Icon } from '@bcip/ui';

interface AinubisDetailModalProps {
  isOpen: boolean;
  observation: AIObservationRecord | null;
  onClose: () => void;
  onReview?: (obs: AIObservationRecord) => void;
  onApprove?: (obs: AIObservationRecord) => void;
  onReject?: (obs: AIObservationRecord) => void;
  onDismiss?: (obs: AIObservationRecord) => void;
  onProposeAction?: (obs: AIObservationRecord) => void;
  allowReview?: boolean;
  allowApprove?: boolean;
  allowDismiss?: boolean;
  allowPropose?: boolean;
  onNavigateToTargetEntity?: (entityType: string, entityId: string) => void;
}

export function AinubisDetailModal({
  isOpen,
  observation,
  onClose,
  onReview,
  onApprove,
  onReject,
  onDismiss,
  onProposeAction,
  allowReview = false,
  allowApprove = false,
  allowDismiss = false,
  allowPropose = false,
  onNavigateToTargetEntity,
}: AinubisDetailModalProps) {
  const [isRejecting, setIsRejecting] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  if (!observation) return null;

  const isPending =
    observation.status === IntelligenceStatus.GENERATED ||
    observation.status === IntelligenceStatus.REVIEWED;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={observation.title}
      description={`Ainubis CRM Intelligence · ${observation.capability}`}
      maxWidth="md"
      footer={
        <div className="flex items-center justify-between w-full">
          <span className="text-[11px] font-mono text-slate-500">
            ID: {observation.id}
          </span>
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" onClick={onClose}>
              Close
            </Button>

            {allowReview && observation.status === IntelligenceStatus.GENERATED && onReview && (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  onReview(observation);
                  onClose();
                }}
                className="text-blue-400 border-blue-800 hover:bg-blue-950/40"
              >
                Mark Reviewed
              </Button>
            )}

            {isPending && allowApprove && (
              <>
                {onApprove && (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => {
                      onApprove(observation);
                      onClose();
                    }}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    Approve Recommendation
                  </Button>
                )}

                {onReject && !isRejecting && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsRejecting(true)}
                    className="text-rose-400 border-rose-900/60 hover:bg-rose-950/40"
                  >
                    Reject
                  </Button>
                )}
              </>
            )}

            {allowDismiss && onDismiss && observation.status !== IntelligenceStatus.DISMISSED && (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  onDismiss(observation);
                  onClose();
                }}
              >
                Dismiss
              </Button>
            )}

            {allowPropose && observation.status === IntelligenceStatus.APPROVED && onProposeAction && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  onProposeAction(observation);
                  onClose();
                }}
                className="bg-sky-600 hover:bg-sky-700 text-white flex items-center gap-1.5"
              >
                <Icon name="zap" size="xs" />
                <span>Propose CRM Action</span>
              </Button>
            )}
          </div>
        </div>
      }
    >
      <div className="space-y-4">
        {/* Intelligence Taxonomy Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 bg-slate-950 p-3 rounded-lg border border-slate-800 text-xs">
          <div>
            <span className="text-[10px] uppercase font-mono text-slate-500">Intelligence Type</span>
            <div className="text-slate-200 font-semibold mt-0.5">{observation.intelligenceType}</div>
          </div>

          <div>
            <span className="text-[10px] uppercase font-mono text-slate-500">Confidence</span>
            <div className="mt-0.5">
              <AinubisConfidenceIndicator
                score={observation.confidenceScore}
                level={observation.confidenceLevel}
              />
            </div>
          </div>

          <div>
            <span className="text-[10px] uppercase font-mono text-slate-500">Approval Requirement</span>
            <div className="text-amber-400 font-mono text-[11px] mt-0.5">{observation.approvalRequirement}</div>
          </div>

          <div>
            <span className="text-[10px] uppercase font-mono text-slate-500">Lifecycle Status</span>
            <div className="text-slate-200 font-mono mt-0.5">{observation.status}</div>
          </div>
        </div>

        {/* Section 1: What was detected? */}
        <div className="space-y-1.5">
          <h5 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider font-mono">
            What was detected?
          </h5>
          <p className="text-xs text-slate-200 bg-slate-950 p-3 rounded-lg border border-slate-800 leading-relaxed font-sans">
            {observation.summary}
          </p>
        </div>

        {/* Section 2: Why it matters */}
        <div className="space-y-1.5">
          <h5 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider font-mono">
            Why it matters
          </h5>
          <p className="text-xs text-slate-300 bg-slate-900/60 p-3 rounded-lg border border-slate-800/80 leading-relaxed font-sans">
            {observation.observation ||
              `Evaluated against ${observation.capability} rules. Unaddressed hygiene gaps directly impact customer engagement SLAs, revenue predictability, and compliance tracking.`}
          </p>
        </div>

        {/* Suggested Action */}
        {observation.suggestedAction && (
          <div className="p-3 rounded-lg bg-amber-950/20 border border-amber-900/40 text-xs space-y-1.5">
            <h5 className="text-[11px] font-bold text-amber-300 uppercase tracking-wider font-mono flex items-center gap-1.5">
              <Icon name="zap" size="xs" />
              <span>Recommendation — Human Decision Required</span>
            </h5>
            <p className="text-amber-100 leading-relaxed font-sans">
              {observation.suggestedAction.description}
            </p>
            <div className="text-[10px] font-mono text-amber-400/80">
              Action Hook: {observation.suggestedAction.actionType}
            </div>
          </div>
        )}

        {/* Rejection Prompt Form */}
        {isRejecting && (
          <div className="bg-rose-950/20 border border-rose-800/50 rounded-lg p-3 space-y-2">
            <label className="block text-xs font-semibold text-rose-300">
              Reason for Rejection (Audit Mandate):
            </label>
            <input
              type="text"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="e.g. Verified by managing agent, offline follow-up completed"
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
                  onClose();
                }}
              >
                Confirm Rejection
              </Button>
            </div>
          </div>
        )}

        {/* Affected Entity Context */}
        {observation.targetEntityType && observation.targetEntityId && (
          <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800 flex items-center justify-between text-xs">
            <div className="space-y-0.5">
              <span className="text-[10px] font-mono text-slate-500 uppercase">Target Entity</span>
              <div className="font-mono text-slate-200">
                {observation.targetEntityType}: <span className="text-sky-400">{observation.targetEntityId}</span>
              </div>
            </div>

            {onNavigateToTargetEntity && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onNavigateToTargetEntity(observation.targetEntityType!, observation.targetEntityId!);
                }}
                className="text-sky-400 hover:text-sky-300 font-mono underline"
              >
                Inspect Entity →
              </button>
            )}
          </div>
        )}

        {/* Full Expandable Evidence Tree */}
        <div className="space-y-1.5 pt-1">
          <h5 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider font-mono">
            Evidence Lineage & Grounding
          </h5>
          <AinubisEvidenceTree observation={observation} defaultExpanded={true} />
        </div>

        {/* Model Audit Metadata */}
        <div className="border-t border-slate-800 pt-3 text-[11px] font-mono text-slate-500 space-y-1">
          <div className="flex items-center justify-between">
            <span>Provider: {observation.modelProvider || 'Ainubis Gateway'}</span>
            <span>Model: {observation.modelIdentifier || 'rule-engine-v1'}</span>
          </div>
          <div className="flex items-center justify-between text-[10px]">
            <span>Generated: {formatDate(observation.createdAt)}</span>
            {observation.reviewedBy && <span>Reviewed by: {observation.reviewedBy}</span>}
            {observation.approvedBy && (
              <span className="text-emerald-400">Approved by: {observation.approvedBy}</span>
            )}
            {observation.rejectedReason && (
              <span className="text-rose-400">Reason: {observation.rejectedReason}</span>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
}

