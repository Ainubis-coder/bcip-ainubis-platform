/**
 * BCIP Scheme Prospect Table Row Component
 * Phase 2D — Prompt 002D-004: Organisations & Scheme Prospects
 */

import React from 'react';
import { SchemeProspect } from '../shared/crm-types';
import { formatDate } from '../shared/crm-formatters';
import { canEditSchemeProspect, canDeleteSchemeProspect } from '../shared/crm-permissions';
import { Icon } from '@bcip/ui';

interface SchemeProspectRowProps {
  schemeProspect: SchemeProspect;
  userRole?: string;
  onViewDetails: (sp: SchemeProspect) => void;
  onEdit: (sp: SchemeProspect) => void;
  onDelete?: (sp: SchemeProspect) => void;
}

export function SchemeProspectRow({
  schemeProspect,
  userRole,
  onViewDetails,
  onEdit,
  onDelete,
}: SchemeProspectRowProps) {
  const allowEdit = canEditSchemeProspect(userRole);
  const allowDelete = canDeleteSchemeProspect(userRole);

  const locationString = typeof schemeProspect.location === 'string'
    ? schemeProspect.location
    : schemeProspect.location
    ? [schemeProspect.location.suburb, schemeProspect.location.city].filter(Boolean).join(', ')
    : '—';

  return (
    <tr
      tabIndex={0}
      className="group hover:bg-slate-900/60 transition-colors border-b border-slate-800/60 focus-visible:outline-none focus-visible:bg-slate-900/80"
    >
      {/* 1. Scheme Name & Identifiers */}
      <td className="py-3 px-4 max-w-[280px]">
        <div className="flex flex-col gap-0.5">
          <button
            type="button"
            onClick={() => onViewDetails(schemeProspect)}
            className="text-xs font-semibold text-slate-100 hover:text-sky-400 text-left line-clamp-1 transition-colors focus-visible:outline-none focus-visible:underline"
            title={schemeProspect.name}
          >
            {schemeProspect.name}
          </button>
          <div className="flex items-center gap-1.5 text-[11px] font-mono text-slate-400 truncate">
            {schemeProspect.sectionalTitleSchemeCode && (
              <span>Code: {schemeProspect.sectionalTitleSchemeCode}</span>
            )}
            {schemeProspect.registrationNumber && (
              <>
                <span className="text-slate-600">·</span>
                <span>Reg: {schemeProspect.registrationNumber}</span>
              </>
            )}
          </div>
        </div>
      </td>

      {/* 2. Unit Sizing */}
      <td className="py-3 px-4 whitespace-nowrap text-xs font-mono text-slate-200">
        <span className="font-semibold">{schemeProspect.estimatedUnitCount || 0}</span>{' '}
        <span className="text-slate-500">Units</span>
      </td>

      {/* 3. Managing Agent */}
      <td className="py-3 px-4 max-w-[180px] text-xs text-slate-300 truncate">
        {schemeProspect.managingAgentName || (
          <span className="text-slate-500 italic">Direct / Self-Managed</span>
        )}
      </td>

      {/* 4. Location */}
      <td className="py-3 px-4 max-w-[160px] text-xs text-slate-300 font-mono truncate">
        {locationString}
      </td>

      {/* 5. Current Property Software */}
      <td className="py-3 px-4 max-w-[150px] text-xs text-slate-400 truncate">
        {schemeProspect.currentPropertySystem || '—'}
      </td>

      {/* 6. Created Date */}
      <td className="py-3 px-4 whitespace-nowrap text-xs font-mono text-slate-400">
        {formatDate(schemeProspect.createdAt)}
      </td>

      {/* 7. Row Actions */}
      <td className="py-3 px-4 whitespace-nowrap text-right">
        <div className="flex items-center justify-end gap-1.5">
          <button
            type="button"
            onClick={() => onViewDetails(schemeProspect)}
            className="text-[11px] text-slate-400 hover:text-slate-200 py-1 px-2 rounded hover:bg-slate-800/60 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-sky-400"
            title="View Details"
          >
            View
          </button>

          {allowEdit && (
            <button
              type="button"
              onClick={() => onEdit(schemeProspect)}
              className="text-[11px] text-slate-400 hover:text-slate-200 py-1 px-2 rounded hover:bg-slate-800/60 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-sky-400"
              title="Edit Scheme Prospect"
            >
              Edit
            </button>
          )}

          {allowDelete && onDelete && (
            <button
              type="button"
              onClick={() => onDelete(schemeProspect)}
              className="text-slate-500 hover:text-rose-400 p-1 rounded hover:bg-rose-950/40 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-rose-400"
              title="Delete Scheme Prospect"
              aria-label="Delete Scheme Prospect"
            >
              <Icon name="x" size="xs" />
            </button>
          )}
        </div>
      </td>
    </tr>
  );
}
