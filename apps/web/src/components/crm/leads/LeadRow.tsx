/**
 * BCIP Lead Table Row Component
 * Phase 2D — Prompt 002D-002: CRM Leads Management Table
 * Clean data presentation adhering to Phase 2A Design Tokens and Zero-Pill discipline.
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

interface LeadRowProps {
  lead: Lead;
  userRole?: string;
  onViewDetails: (lead: Lead) => void;
  onEdit: (lead: Lead) => void;
  onChangeStatus: (lead: Lead) => void;
  onConvert?: (lead: Lead) => void;
  onDelete?: (lead: Lead) => void;
}

export function LeadRow({
  lead,
  userRole,
  onViewDetails,
  onEdit,
  onChangeStatus,
  onConvert,
  onDelete,
}: LeadRowProps) {
  const statusCfg = LEAD_STATUS_CONFIG[lead.status] || LEAD_STATUS_CONFIG.NEW;
  const qualCfg = QUALIFICATION_STATUS_CONFIG[lead.qualificationStatus] || QUALIFICATION_STATUS_CONFIG.UNQUALIFIED;
  const allowEdit = canEditLead(userRole);
  const allowDelete = canDeleteLead(userRole);
  const allowConvert = canConvertLead(userRole);
  const isConverted = lead.status === 'CONVERTED';

  return (
    <tr
      tabIndex={0}
      className="group hover:bg-slate-900/60 transition-colors border-b border-slate-800/60 focus-visible:outline-none focus-visible:bg-slate-900/80"
    >
      {/* 1. Lead Title & Scope */}
      <td className="py-3 px-4 max-w-[280px]">
        <div className="flex flex-col gap-0.5">
          <button
            type="button"
            onClick={() => onViewDetails(lead)}
            className="text-xs font-semibold text-slate-100 hover:text-sky-400 text-left line-clamp-1 transition-colors focus-visible:outline-none focus-visible:underline"
            title={lead.title}
          >
            {lead.title}
          </button>
          <div className="flex items-center gap-1.5 text-[11px] font-mono text-slate-400 truncate">
            {lead.schemeName && (
              <span className="text-slate-300 truncate" title={lead.schemeName}>
                {lead.schemeName}
              </span>
            )}
            {lead.estimatedUnits !== undefined && lead.estimatedUnits > 0 && (
              <>
                <span className="text-slate-600">·</span>
                <span>{lead.estimatedUnits} units</span>
              </>
            )}
            {lead.managingAgent && !lead.schemeName && (
              <span className="text-slate-400 truncate">{lead.managingAgent}</span>
            )}
          </div>
        </div>
      </td>

      {/* 2. Contact Details */}
      <td className="py-3 px-4 max-w-[200px]">
        <div className="flex flex-col gap-0.5 text-xs">
          {lead.email ? (
            <span className="text-slate-300 font-mono truncate" title={lead.email}>
              {lead.email}
            </span>
          ) : (
            <span className="text-slate-600 font-mono">—</span>
          )}
          {lead.phone && (
            <span className="text-[11px] font-mono text-slate-500 truncate" title={lead.phone}>
              {lead.phone}
            </span>
          )}
        </div>
      </td>

      {/* 3. Acquisition Source */}
      <td className="py-3 px-4 whitespace-nowrap">
        <div className="text-xs text-slate-300">
          {LEAD_SOURCE_LABELS[lead.source] || lead.source}
        </div>
        {lead.sourceDetail && (
          <div className="text-[10px] text-slate-500 font-mono truncate max-w-[140px]">
            {lead.sourceDetail}
          </div>
        )}
      </td>

      {/* 4. Status (Zero-Pill Discipline) */}
      <td className="py-3 px-4 whitespace-nowrap">
        <div className="flex items-center gap-1.5">
          <span className={`w-2 h-2 rounded-full ${statusCfg.colorClasses.dot}`} />
          <span className={`text-xs font-semibold ${statusCfg.colorClasses.text}`}>
            {statusCfg.label}
          </span>
        </div>
      </td>

      {/* 5. Qualification Assessment */}
      <td className="py-3 px-4 whitespace-nowrap">
        <div className="flex items-center gap-1.5 text-xs">
          <span className={`w-1.5 h-1.5 rounded-full ${qualCfg.dotClass}`} />
          <span className={qualCfg.textClass}>{qualCfg.label}</span>
        </div>
      </td>

      {/* 6. Created Date */}
      <td className="py-3 px-4 whitespace-nowrap text-xs font-mono text-slate-400">
        {formatDate(lead.createdAt)}
      </td>

      {/* 7. Row Actions */}
      <td className="py-3 px-4 whitespace-nowrap text-right">
        <div className="flex items-center justify-end gap-1.5">
          {allowConvert && !isConverted && onConvert && (
            <button
              type="button"
              onClick={() => onConvert(lead)}
              className="text-[11px] font-semibold text-emerald-400 hover:text-emerald-300 py-1 px-2 rounded hover:bg-emerald-950/40 border border-emerald-800/50 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-emerald-400"
              title="Convert Lead to Opportunity"
            >
              Convert
            </button>
          )}

          <button
            type="button"
            onClick={() => onViewDetails(lead)}
            className="text-[11px] text-slate-400 hover:text-slate-200 py-1 px-2 rounded hover:bg-slate-800/60 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-sky-400"
            title="View Details"
          >
            View
          </button>

          {allowEdit && (
            <button
              type="button"
              onClick={() => onChangeStatus(lead)}
              className="text-[11px] font-medium text-sky-400 hover:text-sky-300 py-1 px-2 rounded hover:bg-sky-950/40 border border-sky-800/40 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-sky-400"
              title="Change Status"
            >
              Status
            </button>
          )}

          {allowEdit && (
            <button
              type="button"
              onClick={() => onEdit(lead)}
              className="text-[11px] text-slate-400 hover:text-slate-200 py-1 px-2 rounded hover:bg-slate-800/60 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-sky-400"
              title="Edit Lead"
            >
              Edit
            </button>
          )}

          {allowDelete && onDelete && (
            <button
              type="button"
              onClick={() => onDelete(lead)}
              className="text-slate-500 hover:text-rose-400 p-1 rounded hover:bg-rose-950/40 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-rose-400"
              title="Delete Lead"
              aria-label="Delete Lead"
            >
              <Icon name="x" size="xs" />
            </button>
          )}
        </div>
      </td>
    </tr>
  );
}
