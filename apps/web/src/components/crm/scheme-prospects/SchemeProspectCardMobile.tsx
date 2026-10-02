/**
 * BCIP Scheme Prospect Mobile Card Component
 * Phase 2D — Prompt 002D-004: Organisations & Scheme Prospects
 */

import React from 'react';
import { SchemeProspect } from '../shared/crm-types';
import { formatDate } from '../shared/crm-formatters';
import { canEditSchemeProspect, canDeleteSchemeProspect } from '../shared/crm-permissions';
import { Icon } from '@bcip/ui';

interface SchemeProspectCardMobileProps {
  schemeProspect: SchemeProspect;
  userRole?: string;
  onViewDetails: (sp: SchemeProspect) => void;
  onEdit: (sp: SchemeProspect) => void;
  onDelete?: (sp: SchemeProspect) => void;
}

export function SchemeProspectCardMobile({
  schemeProspect,
  userRole,
  onViewDetails,
  onEdit,
  onDelete,
}: SchemeProspectCardMobileProps) {
  const allowEdit = canEditSchemeProspect(userRole);
  const allowDelete = canDeleteSchemeProspect(userRole);

  return (
    <div className="bg-slate-950 border border-slate-800 rounded-lg p-3.5 space-y-2.5">
      {/* Top Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <button
            type="button"
            onClick={() => onViewDetails(schemeProspect)}
            className="text-xs font-semibold text-slate-100 hover:text-sky-400 text-left line-clamp-1 transition-colors"
          >
            {schemeProspect.name}
          </button>
          <div className="text-[11px] text-slate-400 font-mono mt-0.5">
            {schemeProspect.estimatedUnitCount || 0} Units ·{' '}
            {schemeProspect.managingAgentName || 'Self-Managed'}
          </div>
        </div>

        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 shrink-0">
          {schemeProspect.dataQualityState}
        </span>
      </div>

      {/* Footer Metadata & Actions */}
      <div className="flex items-center justify-between border-t border-slate-800/60 pt-2 text-[11px]">
        <span className="text-slate-500 font-mono">
          Created: {formatDate(schemeProspect.createdAt)}
        </span>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onViewDetails(schemeProspect)}
            className="text-slate-300 hover:text-white px-2 py-0.5 rounded bg-slate-800/80 transition-colors"
          >
            Details
          </button>
          {allowEdit && (
            <button
              type="button"
              onClick={() => onEdit(schemeProspect)}
              className="text-sky-400 hover:text-sky-300 px-2 py-0.5 rounded bg-sky-950/40 border border-sky-800/40 transition-colors"
            >
              Edit
            </button>
          )}
          {allowDelete && onDelete && (
            <button
              type="button"
              onClick={() => onDelete(schemeProspect)}
              className="text-slate-500 hover:text-rose-400 p-1"
              aria-label="Delete Scheme Prospect"
            >
              <Icon name="x" size="xs" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
