/**
 * BCIP Lead Detail Modal Component
 * Phase 2D — Prompt 002D-002: CRM Leads Management Table
 * Detailed inspector for commercial and qualification lead attributes.
 */

import React from 'react';
import {
  Lead,
  LEAD_STATUS_CONFIG,
  LEAD_SOURCE_LABELS,
  QUALIFICATION_STATUS_CONFIG,
  EXPECTED_TIMELINE_LABELS,
} from '../shared/crm-types';
import { formatDate } from '../shared/crm-formatters';
import { canEditLead, canConvertLead } from '../shared/crm-permissions';
import { Modal, Button, Icon } from '@bcip/ui';

interface LeadDetailModalProps {
  isOpen: boolean;
  lead: Lead | null;
  userRole?: string;
  onClose: () => void;
  onEdit: (lead: Lead) => void;
  onChangeStatus: (lead: Lead) => void;
  onConvert?: (lead: Lead) => void;
  onNavigateToPipeline?: (opportunityId?: string) => void;
}

export function LeadDetailModal({
  isOpen,
  lead,
  userRole,
  onClose,
  onEdit,
  onChangeStatus,
  onConvert,
  onNavigateToPipeline,
}: LeadDetailModalProps) {
  if (!lead) return null;

  const statusCfg = LEAD_STATUS_CONFIG[lead.status] || LEAD_STATUS_CONFIG.NEW;
  const qualCfg = QUALIFICATION_STATUS_CONFIG[lead.qualificationStatus] || QUALIFICATION_STATUS_CONFIG.UNQUALIFIED;
  const allowEdit = canEditLead(userRole);
  const allowConvert = canConvertLead(userRole);
  const isConverted = lead.status === 'CONVERTED';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={lead.title}
      description={`Lead record for tenant partition ${lead.tenantId}`}
      footer={
        <div className="flex items-center justify-between w-full">
          <span className="text-[11px] font-mono text-slate-500">
            ID: {lead.id}
          </span>
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" onClick={onClose}>
              Close
            </Button>
            {allowConvert && !isConverted && onConvert && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  onClose();
                  onConvert(lead);
                }}
                className="bg-emerald-600 hover:bg-emerald-500 text-white"
              >
                Convert Lead
              </Button>
            )}
            {isConverted && onNavigateToPipeline && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  onClose();
                  onNavigateToPipeline(lead.convertedOpportunityId);
                }}
                className="text-sky-400 border-sky-800"
              >
                View Pipeline Opportunity
              </Button>
            )}
            {allowEdit && !isConverted && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  onClose();
                  onChangeStatus(lead);
                }}
              >
                Change Status
              </Button>
            )}
            {allowEdit && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  onClose();
                  onEdit(lead);
                }}
              >
                Edit Lead
              </Button>
            )}
          </div>
        </div>
      }
    >
      <div className="space-y-4">
        {isConverted && (
          <div className="p-3 rounded-lg bg-emerald-950/40 border border-emerald-800/60 flex items-center justify-between text-xs text-emerald-200">
            <div className="flex items-center gap-2">
              <Icon name="check" size="xs" className="text-emerald-400" />
              <span>
                Lead Converted {lead.convertedAt ? `on ${formatDate(lead.convertedAt)}` : ''}
              </span>
            </div>
            {lead.convertedOpportunityId && onNavigateToPipeline && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onNavigateToPipeline(lead.convertedOpportunityId);
                }}
                className="text-[11px] font-medium text-emerald-400 hover:text-emerald-300 underline font-mono"
              >
                View Pipeline Deal →
              </button>
            )}
          </div>
        )}

        {/* Commercial & Qualification Highlights Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-950/70 border border-slate-800 rounded-lg p-3">
          <div>
            <span className="text-[10px] uppercase font-mono text-slate-500">Status</span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className={`w-2 h-2 rounded-full ${statusCfg.colorClasses.dot}`} />
              <span className={`text-xs font-bold ${statusCfg.colorClasses.text}`}>
                {statusCfg.label}
              </span>
            </div>
          </div>
          <div>
            <span className="text-[10px] uppercase font-mono text-slate-500">Qualification</span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className={`w-1.5 h-1.5 rounded-full ${qualCfg.dotClass}`} />
              <span className={`text-xs font-semibold ${qualCfg.textClass}`}>
                {qualCfg.label}
              </span>
            </div>
          </div>
          <div>
            <span className="text-[10px] uppercase font-mono text-slate-500">Source</span>
            <div className="text-xs font-semibold text-slate-200 mt-0.5 truncate">
              {LEAD_SOURCE_LABELS[lead.source] || lead.source}
            </div>
          </div>
          <div>
            <span className="text-[10px] uppercase font-mono text-slate-500">Timeline</span>
            <div className="text-xs font-mono text-slate-300 mt-0.5 truncate">
              {EXPECTED_TIMELINE_LABELS[lead.expectedTimeline] || lead.expectedTimeline || '—'}
            </div>
          </div>
        </div>

        {/* Section: Scope & Scheme */}
        <div className="space-y-2 bg-slate-950/40 p-3 rounded-lg border border-slate-800/80">
          <h5 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Prospect & Portfolio Scope
          </h5>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div>
              <span className="text-slate-500">Scheme Prospect:</span>{' '}
              <span className="text-slate-200 font-medium">{lead.schemeName || '—'}</span>
            </div>
            <div>
              <span className="text-slate-500">Estimated Sizing:</span>{' '}
              <span className="text-slate-200 font-mono">
                {lead.estimatedUnits !== undefined ? `${lead.estimatedUnits} units` : '—'}
              </span>
            </div>
            <div>
              <span className="text-slate-500">Managing Agent:</span>{' '}
              <span className="text-slate-200">{lead.managingAgent || '—'}</span>
            </div>
            <div>
              <span className="text-slate-500">Current Software:</span>{' '}
              <span className="text-slate-200">{lead.currentSystem || '—'}</span>
            </div>
          </div>
        </div>

        {/* Section: Contact Details */}
        <div className="space-y-2 bg-slate-950/40 p-3 rounded-lg border border-slate-800/80">
          <h5 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Direct Contact Information
          </h5>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs font-mono">
            <div>
              <span className="text-slate-500 text-[10px] block">Email</span>
              <span className="text-slate-200 truncate block">{lead.email || '—'}</span>
            </div>
            <div>
              <span className="text-slate-500 text-[10px] block">Phone</span>
              <span className="text-slate-200 block">{lead.phone || '—'}</span>
            </div>
            <div>
              <span className="text-slate-500 text-[10px] block">Website</span>
              <span className="text-slate-200 truncate block">{lead.website || '—'}</span>
            </div>
          </div>
        </div>

        {/* Description / Notes if present */}
        {lead.description && (
          <div>
            <h5 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              Description & Notes
            </h5>
            <p className="text-xs text-slate-200 bg-slate-950 p-2.5 rounded border border-slate-800/80 leading-relaxed">
              {lead.description}
            </p>
          </div>
        )}

        {/* Pain points & Required modules (Zero-Pill discipline) */}
        {lead.painPoints && lead.painPoints.length > 0 && (
          <div>
            <h5 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
              Identified Pain Points
            </h5>
            <ul className="space-y-1 text-xs text-slate-300">
              {lead.painPoints.map((pt, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-sky-400 mt-0.5">•</span>
                  <span>{pt}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Data Quality & Lineage */}
        <div className="border-t border-slate-800/80 pt-3 flex flex-wrap items-center justify-between text-[11px] font-mono text-slate-500 gap-2">
          <div className="flex items-center gap-2">
            <span>Data Quality:</span>
            <span className="text-slate-300">{lead.dataQualityState}</span>
          </div>
          <div>
            Created: {formatDate(lead.createdAt)} · Updated: {formatDate(lead.updatedAt)}
          </div>
        </div>
      </div>
    </Modal>
  );
}
