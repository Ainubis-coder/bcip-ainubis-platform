/**
 * BCIP Organisation Mobile Card Component
 * Phase 2D — Prompt 002D-004: Organisations & Scheme Prospects
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

interface OrganisationCardMobileProps {
  organisation: Organisation;
  userRole?: string;
  onViewDetails: (org: Organisation) => void;
  onEdit: (org: Organisation) => void;
  onDelete?: (org: Organisation) => void;
}

export function OrganisationCardMobile({
  organisation,
  userRole,
  onViewDetails,
  onEdit,
  onDelete,
}: OrganisationCardMobileProps) {
  const statusCfg = ORGANISATION_STATUS_CONFIG[organisation.status] || ORGANISATION_STATUS_CONFIG.PROSPECT;
  const typeLabel = ORGANISATION_TYPE_LABELS[organisation.organisationType] || organisation.organisationType;
  const allowEdit = canEditOrganisation(userRole);
  const allowDelete = canDeleteOrganisation(userRole);

  return (
    <div className="bg-slate-950 border border-slate-800 rounded-lg p-3.5 space-y-2.5">
      {/* Top Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <button
            type="button"
            onClick={() => onViewDetails(organisation)}
            className="text-xs font-semibold text-slate-100 hover:text-sky-400 text-left line-clamp-1 transition-colors"
          >
            {organisation.name}
          </button>
          <div className="text-[11px] text-slate-400 font-mono mt-0.5">
            {typeLabel}
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <span className={`w-2 h-2 rounded-full ${statusCfg.colorClasses.dot}`} />
          <span className={`text-[11px] font-mono font-medium ${statusCfg.colorClasses.text}`}>
            {statusCfg.label}
          </span>
        </div>
      </div>

      {/* Contact info if available */}
      {(organisation.email || organisation.phone) && (
        <div className="text-[11px] font-mono text-slate-400 space-y-0.5 border-t border-slate-800/60 pt-2">
          {organisation.email && <div className="truncate text-slate-300">{organisation.email}</div>}
          {organisation.phone && <div>{organisation.phone}</div>}
        </div>
      )}

      {/* Footer Metadata & Actions */}
      <div className="flex items-center justify-between border-t border-slate-800/60 pt-2 text-[11px]">
        <span className="text-slate-500 font-mono">
          Created: {formatDate(organisation.createdAt)}
        </span>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onViewDetails(organisation)}
            className="text-slate-300 hover:text-white px-2 py-0.5 rounded bg-slate-800/80 transition-colors"
          >
            Details
          </button>
          {allowEdit && (
            <button
              type="button"
              onClick={() => onEdit(organisation)}
              className="text-sky-400 hover:text-sky-300 px-2 py-0.5 rounded bg-sky-950/40 border border-sky-800/40 transition-colors"
            >
              Edit
            </button>
          )}
          {allowDelete && onDelete && (
            <button
              type="button"
              onClick={() => onDelete(organisation)}
              className="text-slate-500 hover:text-rose-400 p-1"
              aria-label="Delete Organisation"
            >
              <Icon name="x" size="xs" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
