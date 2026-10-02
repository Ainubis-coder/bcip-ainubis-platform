/**
 * BCIP Create Opportunity Dialog Component
 * Phase 2D — Prompt 002D-001: CRM Frontend Foundation & Pipeline Kanban
 * Modal form for creating a new opportunity directly into the CRM pipeline.
 */

import React, { useState } from 'react';
import {
  OpportunityStage,
  ALL_PIPELINE_STAGES,
  STAGE_CONFIG,
  CreateOpportunityDto,
} from '../shared/crm-types';
import { Modal, Button, Alert } from '@bcip/ui';

interface CreateOpportunityDialogProps {
  isOpen: boolean;
  initialStage?: OpportunityStage;
  onClose: () => void;
  onCreateOpportunity: (dto: CreateOpportunityDto) => Promise<void>;
}

export function CreateOpportunityDialog({
  isOpen,
  initialStage = OpportunityStage.DISCOVERY,
  onClose,
  onCreateOpportunity,
}: CreateOpportunityDialogProps) {
  const [name, setName] = useState('');
  const [estimatedValue, setEstimatedValue] = useState<number>(50000);
  const [stage, setStage] = useState<OpportunityStage>(initialStage);
  const [probability, setProbability] = useState<number>(
    STAGE_CONFIG[initialStage]?.defaultProbability || 20
  );
  const [expectedCloseDate, setExpectedCloseDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 45);
    return d.toISOString().split('T')[0];
  });
  const [description, setDescription] = useState('');
  const [source, setSource] = useState('DIRECT_OUTREACH');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMessage('Opportunity name is required');
      return;
    }

    if (estimatedValue < 0) {
      setErrorMessage('Estimated value cannot be negative');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      await onCreateOpportunity({
        name: name.trim(),
        stage,
        estimatedValue: Number(estimatedValue) || 0,
        currency: 'ZAR',
        probability: Number(probability) || 20,
        expectedCloseDate: expectedCloseDate || undefined,
        description: description.trim() || undefined,
        source: source || 'DIRECT_OUTREACH',
      });
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to create opportunity';
      setErrorMessage(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create New Opportunity"
      description="Add a new sectional-title portfolio opportunity into the CRM pipeline."
      footer={
        <div className="flex items-center justify-end gap-2 w-full">
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
            onClick={handleSubmit}
            isLoading={isSubmitting}
          >
            Create Opportunity
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-3.5">
        {errorMessage && (
          <Alert severity="error" title="Creation Error">
            {errorMessage}
          </Alert>
        )}

        <div>
          <label htmlFor="opp-name" className="block text-xs font-semibold text-slate-300 mb-1">
            Opportunity Name <span className="text-rose-400">*</span>
          </label>
          <input
            id="opp-name"
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Cape Town Waterfront Portfolio — 1,200 Units"
            className="w-full bg-slate-950 border border-slate-800 rounded-md p-2 text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-sky-400"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label htmlFor="opp-value" className="block text-xs font-semibold text-slate-300 mb-1">
              Estimated Value (ZAR) <span className="text-rose-400">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-2.5 top-2 text-xs font-mono text-slate-500">R</span>
              <input
                id="opp-value"
                type="number"
                min="0"
                step="500"
                required
                value={estimatedValue}
                onChange={(e) => setEstimatedValue(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 rounded-md py-2 pl-7 pr-3 text-xs font-mono text-slate-100 focus:outline-none focus:ring-1 focus:ring-sky-400"
              />
            </div>
          </div>

          <div>
            <label htmlFor="opp-stage" className="block text-xs font-semibold text-slate-300 mb-1">
              Initial Stage
            </label>
            <select
              id="opp-stage"
              value={stage}
              onChange={(e) => {
                const newStage = e.target.value as OpportunityStage;
                setStage(newStage);
                setProbability(STAGE_CONFIG[newStage]?.defaultProbability || 20);
              }}
              className="w-full bg-slate-950 border border-slate-800 rounded-md p-2 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-sky-400"
            >
              {ALL_PIPELINE_STAGES.map((s) => (
                <option key={s} value={s}>
                  {STAGE_CONFIG[s].label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label htmlFor="opp-prob" className="block text-xs font-semibold text-slate-300 mb-1">
              Win Probability ({probability}%)
            </label>
            <input
              id="opp-prob"
              type="range"
              min="0"
              max="100"
              step="5"
              value={probability}
              onChange={(e) => setProbability(Number(e.target.value))}
              className="w-full h-2 bg-slate-900 rounded-lg appearance-none cursor-pointer accent-sky-400 mt-2"
            />
          </div>

          <div>
            <label htmlFor="opp-close-date" className="block text-xs font-semibold text-slate-300 mb-1">
              Target Close Date
            </label>
            <input
              id="opp-close-date"
              type="date"
              value={expectedCloseDate}
              onChange={(e) => setExpectedCloseDate(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-md p-2 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-sky-400"
            />
          </div>
        </div>

        <div>
          <label htmlFor="opp-desc" className="block text-xs font-semibold text-slate-300 mb-1">
            Description & Scope
          </label>
          <textarea
            id="opp-desc"
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Key client objectives, sectional schemes involved, and current software stack..."
            className="w-full bg-slate-950 border border-slate-800 rounded-md p-2 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-sky-400"
          />
        </div>
      </form>
    </Modal>
  );
}
