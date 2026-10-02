/**
 * BCIP Opportunity Stage Transition Dialog
 * Phase 2D — Prompt 002D-001: CRM Frontend Foundation & Pipeline Kanban
 * Modal dialog for progressing deals through the lifecycle stages.
 */

import React, { useState } from 'react';
import {
  Opportunity,
  OpportunityStage,
  ALL_PIPELINE_STAGES,
  STAGE_CONFIG,
} from '../shared/crm-types';
import { formatZAR } from '../shared/crm-formatters';
import { Modal, Button, Alert, Icon } from '@bcip/ui';

interface OpportunityStageTransitionDialogProps {
  isOpen: boolean;
  opportunity: Opportunity | null;
  onClose: () => void;
  onConfirmTransition: (opportunityId: string, newStage: OpportunityStage, reason?: string) => Promise<void>;
}

export function OpportunityStageTransitionDialog({
  isOpen,
  opportunity,
  onClose,
  onConfirmTransition,
}: OpportunityStageTransitionDialogProps) {
  if (!opportunity) return null;

  const currentStageConfig = STAGE_CONFIG[opportunity.stage] || STAGE_CONFIG.DISCOVERY;
  const [selectedStage, setSelectedStage] = useState<OpportunityStage>(() => {
    // Default to next natural stage if not at end
    const currentIndex = ALL_PIPELINE_STAGES.indexOf(opportunity.stage);
    if (currentIndex >= 0 && currentIndex < ALL_PIPELINE_STAGES.length - 2) {
      return ALL_PIPELINE_STAGES[currentIndex + 1];
    }
    return opportunity.stage;
  });

  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleStageSelect = (stage: OpportunityStage) => {
    setSelectedStage(stage);
    setErrorMessage(null);
  };

  const handleConfirm = async () => {
    if (selectedStage === opportunity.stage) {
      setErrorMessage('Please select a different stage to progress this opportunity.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      await onConfirmTransition(opportunity.id, selectedStage, reason.trim() || undefined);
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Stage transition failed';
      setErrorMessage(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Move Opportunity Stage"
      description={`Progress "${opportunity.name}" through the sales governance pipeline.`}
      footer={
        <div className="flex items-center justify-between w-full">
          <span className="text-xs text-slate-500 font-mono">
            ID: {opportunity.id}
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleConfirm}
              isLoading={isSubmitting}
              disabled={isSubmitting || selectedStage === opportunity.stage}
            >
              Confirm Stage Transition
            </Button>
          </div>
        </div>
      }
    >
      <div className="space-y-4">
        {/* Deal Summary Strip */}
        <div className="bg-slate-950/80 border border-slate-800 rounded-md p-3 flex items-center justify-between gap-4">
          <div>
            <div className="text-xs text-slate-400 font-mono">Deal Value</div>
            <div className="text-sm font-bold font-mono text-slate-100">
              {formatZAR(opportunity.estimatedValue)}
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-400">Current Stage:</span>
            <span className="px-2 py-0.5 rounded font-medium bg-slate-900 border border-slate-700 text-slate-200">
              {currentStageConfig.label}
            </span>
          </div>
        </div>

        {/* Error Alert if transition was rejected */}
        {errorMessage && (
          <Alert severity="error" title="Stage Transition Failed">
            {errorMessage}
          </Alert>
        )}

        {/* Stage Selection Grid */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
            Select Target Stage
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {ALL_PIPELINE_STAGES.map((stg) => {
              const cfg = STAGE_CONFIG[stg];
              const isCurrent = stg === opportunity.stage;
              const isSelected = stg === selectedStage;

              return (
                <button
                  key={stg}
                  type="button"
                  onClick={() => handleStageSelect(stg)}
                  className={`p-2.5 rounded-md text-left transition-all border flex flex-col gap-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 ${
                    isSelected
                      ? 'bg-sky-500/15 border-sky-400 text-sky-200'
                      : isCurrent
                      ? 'bg-slate-900 border-slate-700 text-slate-300'
                      : 'bg-slate-950 hover:bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="text-xs font-bold leading-tight">{cfg.label}</span>
                    <span
                      className={`w-2 h-2 rounded-full ${cfg.colorClasses.dot}`}
                    />
                  </div>
                  <span className="text-[10px] text-slate-400 line-clamp-1">
                    {isCurrent ? '(Current)' : `${cfg.defaultProbability}% default`}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Transition Reason (Optional / Controlled) */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label
              htmlFor="transition-reason"
              className="text-xs font-medium text-slate-300"
            >
              Transition Reason / Audit Note
            </label>
            <span className="text-[10px] text-slate-500 font-mono">
              {reason.length}/500
            </span>
          </div>
          <textarea
            id="transition-reason"
            rows={3}
            maxLength={500}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. Technical proposal approved by trustee committee; proceeding to legal contract review."
            className="w-full bg-slate-950 border border-slate-800 rounded-md p-2.5 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-sky-400"
          />
          <p className="text-[11px] text-slate-500 mt-1">
            Logged into the immutable OpportunityStageHistory velocity audit log.
          </p>
        </div>
      </div>
    </Modal>
  );
}
