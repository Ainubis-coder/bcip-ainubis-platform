/**
 * BCIP Opportunity Detail Modal
 * Phase 2D — Prompt 002D-001: CRM Frontend Foundation & Pipeline Kanban
 * Detailed view with immutable stage transition audit history.
 */

import React, { useState, useEffect } from 'react';
import { Opportunity, OpportunityStageHistory, STAGE_CONFIG } from '../shared/crm-types';
import { formatZAR, formatDate, formatProbability } from '../shared/crm-formatters';
import { canTransitionStage } from '../shared/crm-permissions';
import { Modal, Button, Icon, Spinner } from '@bcip/ui';

interface OpportunityDetailModalProps {
  isOpen: boolean;
  opportunity: Opportunity | null;
  userRole?: string;
  onClose: () => void;
  onMoveStage: (opportunity: Opportunity) => void;
  fetchHistory: (opportunityId: string) => Promise<OpportunityStageHistory[]>;
  onNavigateToOrganisation?: (organisationId: string) => void;
  onNavigateToLead?: (leadId: string) => void;
  onNavigateToSchemeProspect?: (schemeProspectId: string) => void;
}

export function OpportunityDetailModal({
  isOpen,
  opportunity,
  userRole,
  onClose,
  onMoveStage,
  fetchHistory,
  onNavigateToOrganisation,
  onNavigateToLead,
  onNavigateToSchemeProspect,
}: OpportunityDetailModalProps) {
  const [history, setHistory] = useState<OpportunityStageHistory[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const oppId = opportunity?.id;

  useEffect(() => {
    if (isOpen && oppId) {
      setLoadingHistory(true);
      fetchHistory(oppId)
        .then((data) => setHistory(data || []))
        .catch(() => setHistory([]))
        .finally(() => setLoadingHistory(false));
    }
  }, [isOpen, oppId]);

  if (!opportunity) return null;

  const stageConfig = STAGE_CONFIG[opportunity.stage] || STAGE_CONFIG.DISCOVERY;
  const allowMove = canTransitionStage(userRole);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={opportunity.name}
      description={`CRM Opportunity details for tenant partition ${opportunity.tenantId}`}
      footer={
        <div className="flex items-center justify-between w-full">
          <span className="text-[11px] font-mono text-slate-500">
            Created: {formatDate(opportunity.createdAt)}
          </span>
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" onClick={onClose}>
              Close
            </Button>
            {allowMove && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  onClose();
                  onMoveStage(opportunity);
                }}
              >
                Progress Stage
              </Button>
            )}
          </div>
        </div>
      }
    >
      <div className="space-y-4">
        {/* Commercial Highlights */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-950/70 border border-slate-800 rounded-lg p-3">
          <div>
            <span className="text-[10px] uppercase font-mono text-slate-500">Estimated Value</span>
            <div className="text-sm font-bold font-mono text-slate-100">
              {formatZAR(opportunity.estimatedValue)}
            </div>
          </div>
          <div>
            <span className="text-[10px] uppercase font-mono text-slate-500">Stage</span>
            <div className="text-xs font-semibold text-sky-400 mt-0.5">
              {stageConfig.label}
            </div>
          </div>
          <div>
            <span className="text-[10px] uppercase font-mono text-slate-500">Win Probability</span>
            <div className="text-sm font-mono text-slate-200">
              {formatProbability(opportunity.probability)}
            </div>
          </div>
          <div>
            <span className="text-[10px] uppercase font-mono text-slate-500">Target Close</span>
            <div className="text-xs font-mono text-slate-200 mt-0.5">
              {formatDate(opportunity.expectedCloseDate)}
            </div>
          </div>
        </div>

        {/* Description / Scope */}
        {opportunity.description && (
          <div>
            <h5 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
              Description & Scope
            </h5>
            <p className="text-xs text-slate-200 bg-slate-950 p-2.5 rounded border border-slate-800/80 leading-relaxed">
              {opportunity.description}
            </p>
          </div>
        )}

        {/* Next Action */}
        {opportunity.nextAction && (
          <div>
            <h5 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
              Next Scheduled Action
            </h5>
            <div className="text-xs text-slate-200 bg-slate-950 p-2.5 rounded border border-slate-800/80 flex items-center gap-2">
              <Icon name="check" size="xs" className="text-sky-400 shrink-0" />
              <span>{opportunity.nextAction}</span>
              {opportunity.nextActionAt && (
                <span className="text-slate-500 text-[11px] ml-auto font-mono">
                  {formatDate(opportunity.nextActionAt)}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Linked CRM Relationships */}
        {(opportunity.organisationId || opportunity.leadId || opportunity.schemeProspectId) && (
          <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800 space-y-2">
            <h5 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Linked CRM Relationships
            </h5>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono">
              {opportunity.organisationId && (
                <div className="flex items-center justify-between p-2 rounded bg-slate-900 border border-slate-800">
                  <span className="text-slate-400 font-sans">Organisation:</span>
                  {onNavigateToOrganisation ? (
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onNavigateToOrganisation(opportunity.organisationId!);
                      }}
                      className="text-sky-400 hover:text-sky-300 underline"
                    >
                      View Org →
                    </button>
                  ) : (
                    <span className="text-slate-200">{opportunity.organisationId}</span>
                  )}
                </div>
              )}

              {opportunity.leadId && (
                <div className="flex items-center justify-between p-2 rounded bg-slate-900 border border-slate-800">
                  <span className="text-slate-400 font-sans">Origin Lead:</span>
                  {onNavigateToLead ? (
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onNavigateToLead(opportunity.leadId!);
                      }}
                      className="text-sky-400 hover:text-sky-300 underline"
                    >
                      View Lead →
                    </button>
                  ) : (
                    <span className="text-slate-200">{opportunity.leadId}</span>
                  )}
                </div>
              )}

              {opportunity.schemeProspectId && (
                <div className="flex items-center justify-between p-2 rounded bg-slate-900 border border-slate-800">
                  <span className="text-slate-400 font-sans">Scheme Prospect:</span>
                  {onNavigateToSchemeProspect ? (
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onNavigateToSchemeProspect(opportunity.schemeProspectId!);
                      }}
                      className="text-sky-400 hover:text-sky-300 underline"
                    >
                      View Prospect →
                    </button>
                  ) : (
                    <span className="text-slate-200">{opportunity.schemeProspectId}</span>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Stage Velocity & Audit Trail */}
        <div>
          <h5 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-2">
            <span>Stage Velocity & Audit History</span>
            {loadingHistory && <Spinner size="xs" />}
          </h5>

          {loadingHistory ? (
            <div className="h-20 flex items-center justify-center text-xs text-slate-500">
              Loading immutable stage transitions...
            </div>
          ) : history.length > 0 ? (
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {history.map((record) => {
                const toCfg = STAGE_CONFIG[record.toStage] || STAGE_CONFIG.DISCOVERY;
                const fromCfg = record.fromStage ? STAGE_CONFIG[record.fromStage] : null;

                return (
                  <div
                    key={record.id}
                    className="p-2.5 bg-slate-950/80 border border-slate-800/80 rounded text-xs flex flex-col gap-1"
                  >
                    <div className="flex items-center justify-between text-slate-300">
                      <div className="flex items-center gap-1.5 font-medium">
                        {fromCfg ? (
                          <>
                            <span>{fromCfg.label}</span>
                            <Icon name="chevron-right" size="xs" className="text-slate-500" />
                          </>
                        ) : null}
                        <span className="text-sky-400 font-semibold">{toCfg.label}</span>
                      </div>
                      <span className="text-[10px] font-mono text-slate-500">
                        {formatDate(record.changedAt)}
                      </span>
                    </div>
                    {record.reason && (
                      <p className="text-[11px] text-slate-400 italic">
                        "{record.reason}"
                      </p>
                    )}
                    <span className="text-[10px] font-mono text-slate-600">
                      Actor: {record.changedBy}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-xs text-slate-500 italic p-3 bg-slate-950 rounded border border-slate-800">
              No previous stage transitions logged for this deal.
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
