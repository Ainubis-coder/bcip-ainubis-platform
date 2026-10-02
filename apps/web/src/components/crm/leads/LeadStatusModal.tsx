/**
 * BCIP Lead Status Transition Modal Component
 * Phase 2D — Prompt 002D-002: CRM Leads Management Table
 * Status progression modal using the authoritative LeadStatus enum.
 */

import React, { useState } from 'react';
import {
  Lead,
  LeadStatus,
  ALL_LEAD_STATUSES,
  LEAD_STATUS_CONFIG,
} from '../shared/crm-types';
import { Modal, Button, Alert } from '@bcip/ui';

interface LeadStatusModalProps {
  isOpen: boolean;
  lead: Lead | null;
  onClose: () => void;
  onConfirmStatusChange: (leadId: string, newStatus: LeadStatus) => Promise<void>;
}

export function LeadStatusModal({
  isOpen,
  lead,
  onClose,
  onConfirmStatusChange,
}: LeadStatusModalProps) {
  if (!lead) return null;

  const currentCfg = LEAD_STATUS_CONFIG[lead.status] || LEAD_STATUS_CONFIG.NEW;
  const [selectedStatus, setSelectedStatus] = useState<LeadStatus>(lead.status);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleConfirm = async () => {
    if (selectedStatus === lead.status) {
      setErrorMessage('Please select a different status to update this lead.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      await onConfirmStatusChange(lead.id, selectedStatus);
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Status update failed';
      setErrorMessage(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Update Lead Lifecycle Status"
      description={`Update qualification stage for "${lead.title}"`}
      footer={
        <div className="flex items-center justify-between w-full">
          <span className="text-[11px] font-mono text-slate-500">ID: {lead.id}</span>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleConfirm}
              isLoading={isSubmitting}
              disabled={isSubmitting || selectedStatus === lead.status}
            >
              Update Status
            </Button>
          </div>
        </div>
      }
    >
      <div className="space-y-4">
        {/* Current status display */}
        <div className="bg-slate-950/80 border border-slate-800 rounded-md p-3 flex items-center justify-between">
          <span className="text-xs text-slate-400">Current Status:</span>
          <div className="flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full ${currentCfg.colorClasses.dot}`} />
            <span className={`text-xs font-bold ${currentCfg.colorClasses.text}`}>
              {currentCfg.label}
            </span>
          </div>
        </div>

        {errorMessage && (
          <Alert severity="error" title="Status Update Error">
            {errorMessage}
          </Alert>
        )}

        {/* Status choices */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
            Select New Status
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {ALL_LEAD_STATUSES.map((st) => {
              const cfg = LEAD_STATUS_CONFIG[st];
              const isCurrent = st === lead.status;
              const isSelected = st === selectedStatus;

              return (
                <button
                  key={st}
                  type="button"
                  onClick={() => {
                    setSelectedStatus(st);
                    setErrorMessage(null);
                  }}
                  className={`p-2.5 rounded-md text-left transition-all border flex flex-col gap-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 ${
                    isSelected
                      ? 'bg-sky-500/15 border-sky-400 text-sky-200'
                      : isCurrent
                      ? 'bg-slate-900 border-slate-700 text-slate-300'
                      : 'bg-slate-950 hover:bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="text-xs font-bold">{cfg.label}</span>
                    <span className={`w-2 h-2 rounded-full ${cfg.colorClasses.dot}`} />
                  </div>
                  <span className="text-[10px] text-slate-500 line-clamp-1">
                    {cfg.description}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </Modal>
  );
}
