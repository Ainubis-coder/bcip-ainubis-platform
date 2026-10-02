/**
 * BCIP Ainubis Action Review Modal
 * Phase 2E — Prompt 002E-004: Ainubis CRM Intelligence Actions & Human-Approved CRM Automation
 * Highly detailed inspection, evidence traceback, stale state checks, and explicit decision controls.
 */

import React, { useState, useEffect } from 'react';
import { Button, Icon, Modal } from '@bcip/ui';
import { getCrmApiClient } from '../crm/shared/crm-api.ts';
import type { TenantContext, UserAccount } from '../../types/tenant';
import { formatDate } from '../crm/shared/crm-formatters.ts';

interface ActionReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  action: any;
  activeTenant: TenantContext;
  user: UserAccount;
  onActionUpdated: () => void;
  allowApprove: boolean;
  allowExecute: boolean;
}

export function ActionReviewModal({
  isOpen,
  onClose,
  action,
  activeTenant,
  user,
  onActionUpdated,
  allowApprove,
  allowExecute,
}: ActionReviewModalProps) {
  const [evidence, setEvidence] = useState<any[]>([]);
  const [executions, setExecutions] = useState<any[]>([]);
  const [verifications, setVerifications] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const api = getCrmApiClient(activeTenant.id, user);

  useEffect(() => {
    if (!action || !isOpen) return;

    const loadDetails = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const [evData, execData, verData] = await Promise.all([
          api.getAiActionEvidence(action.id).catch(() => []),
          api.getAiActionExecution(action.id).catch(() => []),
          api.getAiActionVerification(action.id).catch(() => []),
        ]);
        setEvidence(evData);
        setExecutions(execData);
        setVerifications(verData);
      } catch (err: any) {
        setError('Failed to load related execution and audit traces.');
      } finally {
        setIsLoading(false);
      }
    };

    loadDetails();
    setShowRejectForm(false);
    setRejectReason('');
  }, [action, isOpen]);

  if (!action) return null;

  const handleApprove = async () => {
    setIsSubmitting(true);
    setError(null);
    try {
      await api.approveAiAction(action.id, 'Manually reviewed and authorized.');
      onActionUpdated();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Approval request failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      setError('Please provide a reason to reject this recommendation.');
      return;
    }
    setIsSubmitting(true);
    setError(null);
    try {
      await api.rejectAiAction(action.id, rejectReason.trim());
      onActionUpdated();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Rejection request failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = async () => {
    setIsSubmitting(true);
    setError(null);
    try {
      await api.cancelAiAction(action.id);
      onActionUpdated();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Cancellation request failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleExecute = async () => {
    setIsSubmitting(true);
    setError(null);
    try {
      await api.executeAiAction(action.id);
      onActionUpdated();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Execution failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'PROPOSED':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'REVIEW_REQUIRED':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'APPROVED':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'VERIFIED':
        return 'bg-teal-500/10 text-teal-400 border-teal-500/20';
      case 'FAILED':
        return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
      case 'EXPIRED':
        return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
      case 'REJECTED':
        return 'bg-orange-500/10 text-orange-400 border-orange-500/20';
      default:
        return 'bg-slate-800 text-slate-400 border-slate-700';
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth="lg" title="Review Intelligence Action">
      <div className="space-y-6 max-h-[80vh] overflow-y-auto px-1 py-2 text-slate-300">
        {/* Error State */}
        {error && (
          <div className="p-3 bg-rose-950/40 border border-rose-800/40 text-rose-400 text-xs rounded flex gap-2 items-start">
            <div className="mt-0.5 text-rose-400">
              <Icon name="alert-triangle" size="sm" />
            </div>
            <div>{error}</div>
          </div>
        )}

        {/* Action Header Banner */}
        <div className="flex justify-between items-start border-b border-slate-800 pb-4">
          <div>
            <span className={`text-[10px] font-mono border px-2 py-0.5 rounded ${getStatusStyle(action.status)}`}>
              {action.status}
            </span>
            <h3 className="text-base font-bold text-slate-100 mt-2">{action.title}</h3>
            <p className="text-xs text-slate-400 mt-1">{action.description}</p>
          </div>
          <div className="text-right">
            <span className="text-[10px] text-slate-400 font-mono">ID: {action.id}</span>
            <div className="text-xs text-slate-300 mt-1">Risk: <span className="font-semibold text-amber-400">{action.riskLevel}</span></div>
          </div>
        </div>

        {/* Recommendation Statement */}
        <div className="bg-slate-950/30 border border-slate-800/50 p-4 rounded-lg">
          <h4 className="text-xs font-semibold text-slate-200 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <span className="text-sky-400"><Icon name="cpu" size="xs" /></span>
            Ainubis Recommendation
          </h4>
          <p className="text-sm text-slate-200 italic leading-relaxed">"{action.rationale}"</p>
        </div>

        {/* Core Impact Detail Diff Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-slate-900/40 p-4 rounded-lg border border-slate-800/60">
            <h5 className="text-[10px] font-bold uppercase text-slate-400 tracking-wider mb-2">Expected Current State</h5>
            <div className="space-y-1">
              {Object.keys(action.currentValues || {}).length === 0 ? (
                <div className="text-xs italic text-slate-500">None (Newly Created Resource)</div>
              ) : (
                Object.entries(action.currentValues || {}).map(([key, val]) => (
                  <div key={key} className="text-xs flex justify-between border-b border-slate-800/40 py-1">
                    <span className="text-slate-400 font-mono">{key}:</span>
                    <span className="text-slate-300 font-semibold">{String(val)}</span>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="bg-emerald-950/10 p-4 rounded-lg border border-emerald-900/30">
            <h5 className="text-[10px] font-bold uppercase text-emerald-400 tracking-wider mb-2">Proposed State</h5>
            <div className="space-y-1">
              {Object.entries(action.proposedChanges || {}).map(([key, val]) => (
                <div key={key} className="text-xs flex justify-between border-b border-emerald-950/40 py-1">
                  <span className="text-slate-400 font-mono">{key}:</span>
                  <span className="text-emerald-400 font-semibold">{String(val)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Target Entity Reference */}
        <div className="p-3 bg-slate-900/20 border border-slate-800 rounded-lg text-xs space-y-1">
          <div className="text-slate-400">Target Entity: <span className="font-semibold text-slate-200">{action.targetEntityType} ({action.targetEntityId})</span></div>
          <div className="text-slate-400">Governance: <span className="font-mono text-amber-400">Human Approval Required</span></div>
          <div className="text-slate-400">Expires: <span className="font-mono text-slate-300">{formatDate(action.expiresAt)}</span></div>
        </div>

        {/* Evidence Logs Section */}
        {evidence.length > 0 && (
          <div className="border-t border-slate-800 pt-4">
            <h4 className="text-xs font-semibold text-slate-400 mb-2">Traceable Evidence Context</h4>
            <div className="space-y-2">
              {evidence.map((ev) => (
                <div key={ev.id} className="text-xs bg-slate-900/30 p-2.5 rounded border border-slate-800/40 flex justify-between">
                  <div>
                    <span className="font-semibold text-slate-300">{ev.entityType} ({ev.entityId})</span>
                    <p className="text-slate-400 text-[11px] mt-0.5">{ev.description}</p>
                  </div>
                  <span className="text-[10px] text-slate-500">{formatDate(ev.createdAt)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Verification Log if Present */}
        {verifications.length > 0 && (
          <div className="border-t border-slate-800 pt-4">
            <h4 className="text-xs font-semibold text-slate-400 mb-2">Verification & Results Log</h4>
            {verifications.map((v) => (
              <div key={v.id} className={`p-3 rounded border text-xs ${v.status === 'VERIFIED' ? 'bg-teal-950/20 border-teal-900/40 text-teal-300' : 'bg-rose-950/20 border-rose-900/40 text-rose-300'}`}>
                <div className="flex justify-between font-bold mb-1">
                  <span>Verification {v.status}</span>
                  <span className="font-mono font-normal">{formatDate(v.verifiedAt)}</span>
                </div>
                {v.failureReason && <p className="text-rose-400 mt-1">Error: {v.failureReason}</p>}
                <div className="mt-2 text-[11px] grid grid-cols-2 gap-2">
                  <div>Expected: <pre className="font-mono text-[10px] bg-black/20 p-1 rounded mt-0.5">{JSON.stringify(v.expectedState)}</pre></div>
                  <div>Actual Result: <pre className="font-mono text-[10px] bg-black/20 p-1 rounded mt-0.5">{JSON.stringify(v.actualState)}</pre></div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Reject Form Input */}
        {showRejectForm && (
          <div className="border border-orange-900/40 p-4 rounded bg-orange-950/10 space-y-3">
            <label className="block text-xs font-semibold text-orange-400">Rejection Reason</label>
            <textarea
              className="w-full text-xs bg-slate-950 border border-slate-800 rounded p-2 text-slate-300 focus:outline-none focus:border-orange-500"
              placeholder="Provide reason for rejecting this AI recommendation..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={2}
            />
            <div className="flex gap-2 justify-end">
              <Button size="sm" variant="secondary" onClick={() => setShowRejectForm(false)}>Cancel</Button>
              <Button size="sm" variant="danger" onClick={handleReject} disabled={isSubmitting}>Confirm Reject</Button>
            </div>
          </div>
        )}

        {/* Decision Controls Footers */}
        <div className="border-t border-slate-800 pt-4 flex gap-2 justify-end">
          {action.status === 'PROPOSED' && allowApprove && !showRejectForm && (
            <>
              <Button variant="danger" size="sm" onClick={() => setShowRejectForm(true)} disabled={isSubmitting}>
                Reject
              </Button>
              <Button variant="primary" size="sm" onClick={handleApprove} disabled={isSubmitting} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                Approve Recommendation
              </Button>
            </>
          )}

          {action.status === 'APPROVED' && allowExecute && (
            <>
              <Button variant="secondary" size="sm" onClick={handleCancel} disabled={isSubmitting}>
                Cancel Action
              </Button>
              <Button variant="primary" size="sm" onClick={handleExecute} disabled={isSubmitting}>
                Authorize Execution
              </Button>
            </>
          )}

          <Button variant="secondary" size="sm" onClick={onClose} disabled={isSubmitting}>
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
}
