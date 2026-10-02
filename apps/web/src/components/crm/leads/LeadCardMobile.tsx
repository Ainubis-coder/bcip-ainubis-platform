/**
 * BCIP Lead Mobile Card Component
 * Phase 2D — Prompt 002D-002: CRM Leads Management Table
 * Adaptive mobile view for smaller viewports.
 */

import React from 'react';
import {
  Lead,
  LEAD_STATUS_CONFIG,
  LEAD_SOURCE_LABELS,
  QUALIFICATION_STATUS_CONFIG,
} from '../shared/crm-types';
import { formatDate } from '../shared/crm-formatters';
import { canEditLead, canDeleteLead, canConvertLead } from '../shared/crm-permissions';
import { Icon } from '@bcip/ui';

interface LeadCardMobileProps {
  lead: Lead;
  userRole?: string;
  onViewDetails: (lead: Lead) => void;
  onEdit: (lead: Lead) => void;
  onChangeStatus: (lead: Lead) => void;
  onConvert?: (lead: Lead) => void;
  onDelete?: (lead: Lead) => void;
}

export function LeadCardMobile({
  lead,
  userRole,
  onViewDetails,
  onEdit,
  onChangeStatus,
  onConvert,
  onDelete,
}: LeadCardMobileProps) {
  const statusCfg = LEAD_STATUS_CONFIG[lead.status] || LEAD_STATUS_CONFIG.NEW;
  const qualCfg = QUALIFICATION_STATUS_CONFIG[lead.qualificationStatus] || QUALIFICATION_STATUS_CONFIG.UNQUALIFIED;
  const allowEdit = canEditLead(userRole);
  const allowDelete = canDeleteLead(userRole);
  const allowConvert = canConvertLead(userRole);
  const isConverted = lead.status === 'CONVERTED';

  return (
    <div
      tabIndex={0}
      className="p-3.5 bg-slate-900/80 border border-slate-800 rounded-lg space-y-2.5 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-sky-400"
    >
      {/* Title & Status */}
      <div className="flex items-start justify-between gap-2">
        <h4
          onClick={() => onViewDetails(lead)}
          className="text-xs font-semibold text-slate-100 hover:text-sky-400 cursor-pointer line-clamp-2 transition-colors leading-snug"
        >
          {lead.title}
        </h4>
        <div className="flex items-center gap-1.5 shrink-0">
          <span className={`w-2 h-2 rounded-full ${statusCfg.colorClasses.dot}`} />
          <span className={`text-[11px] font-semibold ${statusCfg.colorClasses.text}`}>
            {statusCfg.label}
          </span>
        </div>
      </div>

      {/* Scope / Scheme / Units */}
      <div className="flex items-center gap-2 text-[11px] font-mono text-slate-400">
        {lead.schemeName && <span className="text-slate-200">{lead.schemeName}</span>}
        {lead.estimatedUnits !== undefined && lead.estimatedUnits > 0 && (
          <>
            <span className="text-slate-600">·</span>
            <span>{lead.estimatedUnits} units</span>
          </>
        )}
        {lead.managingAgent && !lead.schemeName && (
          <span className="text-slate-300">{lead.managingAgent}</span>
        )}
      </div>

      {/* Contact & Source Line */}
      <div className="flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-800/60 pt-2 font-mono">
        <div className="truncate max-w-[180px]">
          {lead.email || lead.phone || 'No direct contact'}
        </div>
        <div className="text-slate-500">
          {LEAD_SOURCE_LABELS[lead.source] || lead.source}
        </div>
      </div>

      {/* Footer Metadata & Actions */}
      <div className="flex items-center justify-between border-t border-slate-800/60 pt-2 text-[11px]">
        <div className="flex items-center gap-1.5">
          <span className={`w-1.5 h-1.5 rounded-full ${qualCfg.dotClass}`} />
          <span className={qualCfg.textClass}>{qualCfg.label}</span>
          <span className="text-slate-600 font-mono">·</span>
          <span className="text-slate-500 font-mono">{formatDate(lead.createdAt)}</span>
        </div>

        <div className="flex items-center gap-2">
          {allowConvert && !isConverted && onConvert && (
            <button
              type="button"
              onClick={() => onConvert(lead)}
              className="text-emerald-400 hover:text-emerald-300 font-semibold px-2 py-0.5 rounded bg-emerald-950/40 border border-emerald-800/50 transition-colors"
            >
              Convert
            </button>
          )}
          <button
            type="button"
            onClick={() => onViewDetails(lead)}
            className="text-slate-300 hover:text-white px-2 py-0.5 rounded bg-slate-800/80 transition-colors"
          >
            Details
          </button>
          {allowEdit && (
            <button
              type="button"
              onClick={() => onChangeStatus(lead)}
              className="text-sky-400 hover:text-sky-300 px-2 py-0.5 rounded bg-sky-950/40 border border-sky-800/40 transition-colors"
            >
              Status
            </button>
          )}
          {allowDelete && onDelete && (
            <button
              type="button"
              onClick={() => onDelete(lead)}
              className="text-slate-500 hover:text-rose-400 p-1"
              aria-label="Delete Lead"
            >
              <Icon name="x" size="xs" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
