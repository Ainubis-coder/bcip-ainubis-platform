/**
 * BCIP Organisation Table Row Component
 * Phase 2D — Prompt 002D-004: Organisations & Scheme Prospects
 * Clean data presentation adhering to Phase 2A Design Tokens and Zero-Pill discipline.
 */

import React from 'react';
import {
  Organisation,
  ORGANISATION_STATUS_CONFIG,
  ORGANISATION_TYPE_LABELS,
} from '../shared/crm-types';
import { formatDate } from '../shared/crm-formatters';
import { canEditOrganisation, canDeleteOrganisation } from '../shared/crm-permissions';
import { Icon } from '@bcip/ui';

interface OrganisationRowProps {
  organisation: Organisation;
  userRole?: string;
  onViewDetails: (org: Organisation) => void;
  onEdit: (org: Organisation) => void;
  onDelete?: (org: Organisation) => void;
}

export function OrganisationRow({
  organisation,
  userRole,
  onViewDetails,
  onEdit,
  onDelete,
}: OrganisationRowProps) {
  const statusCfg = ORGANISATION_STATUS_CONFIG[organisation.status] || ORGANISATION_STATUS_CONFIG.PROSPECT;
  const typeLabel = ORGANISATION_TYPE_LABELS[organisation.organisationType] || organisation.organisationType;
  const allowEdit = canEditOrganisation(userRole);
  const allowDelete = canDeleteOrganisation(userRole);

  return (
    <tr
      tabIndex={0}
      className="group hover:bg-slate-900/60 transition-colors border-b border-slate-800/60 focus-visible:outline-none focus-visible:bg-slate-900/80"
    >
      {/* 1. Organisation Name & Legal Scope */}
      <td className="py-3 px-4 max-w-[260px]">
        <div className="flex flex-col gap-0.5">
          <button
            type="button"
            onClick={() => onViewDetails(organisation)}
            className="text-xs font-semibold text-slate-100 hover:text-sky-400 text-left line-clamp-1 transition-colors focus-visible:outline-none focus-visible:underline"
            title={organisation.name}
          >
            {organisation.name}
          </button>
          <div className="flex items-center gap-1.5 text-[11px] font-mono text-slate-400 truncate">
            {organisation.legalName && (
              <span className="text-slate-400 truncate" title={organisation.legalName}>
                {organisation.legalName}
              </span>
            )}
            {organisation.registrationNumber && (
              <>
                <span className="text-slate-600">·</span>
                <span>Reg: {organisation.registrationNumber}</span>
              </>
            )}
          </div>
        </div>
      </td>

      {/* 2. Organisation Type */}
      <td className="py-3 px-4 whitespace-nowrap text-xs text-slate-300">
        <span className="font-medium text-slate-200">{typeLabel}</span>
      </td>

      {/* 3. Status (Zero-Pill discipline) */}
      <td className="py-3 px-4 whitespace-nowrap">
        <div className="flex items-center gap-1.5">
          <span className={`w-2 h-2 rounded-full ${statusCfg.colorClasses.dot}`} />
          <span className={`text-xs font-mono font-medium ${statusCfg.colorClasses.text}`}>
            {statusCfg.label}
          </span>
        </div>
      </td>

      {/* 4. Contact Information */}
      <td className="py-3 px-4 max-w-[200px]">
        <div className="flex flex-col gap-0.5 text-xs font-mono text-slate-300 truncate">
          {organisation.email ? (
            <span className="truncate text-slate-200">{organisation.email}</span>
          ) : (
            <span className="text-slate-600">No email</span>
          )}
          {organisation.phone ? (
            <span className="text-[11px] text-slate-400 truncate">{organisation.phone}</span>
          ) : null}
        </div>
      </td>

      {/* 5. Data Quality */}
      <td className="py-3 px-4 whitespace-nowrap text-xs font-mono text-slate-400">
        <span>{organisation.dataQualityState}</span>
      </td>

      {/* 6. Created Date */}
      <td className="py-3 px-4 whitespace-nowrap text-xs font-mono text-slate-400">
        {formatDate(organisation.createdAt)}
      </td>

      {/* 7. Row Actions */}
      <td className="py-3 px-4 whitespace-nowrap text-right">
        <div className="flex items-center justify-end gap-1.5">
          <button
            type="button"
            onClick={() => onViewDetails(organisation)}
            className="text-[11px] text-slate-400 hover:text-slate-200 py-1 px-2 rounded hover:bg-slate-800/60 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-sky-400"
            title="View Details"
          >
            View
          </button>

          {allowEdit && (
            <button
              type="button"
              onClick={() => onEdit(organisation)}
              className="text-[11px] text-slate-400 hover:text-slate-200 py-1 px-2 rounded hover:bg-slate-800/60 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-sky-400"
              title="Edit Organisation"
            >
              Edit
            </button>
          )}

          {allowDelete && onDelete && (
            <button
              type="button"
              onClick={() => onDelete(organisation)}
              className="text-slate-500 hover:text-rose-400 p-1 rounded hover:bg-rose-950/40 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-rose-400"
              title="Delete Organisation"
              aria-label="Delete Organisation"
            >
              <Icon name="x" size="xs" />
            </button>
          )}
        </div>
      </td>
    </tr>
  );
}
