/**
 * BCIP Scheme Prospects Table Component
 * Phase 2D — Prompt 002D-004: Organisations & Scheme Prospects
 */

import React from 'react';
import { SchemeProspect } from '../shared/crm-types';
import { SchemeProspectRow } from './SchemeProspectRow';
import { SchemeProspectCardMobile } from './SchemeProspectCardMobile';
import { Icon } from '@bcip/ui';

interface SchemeProspectsTableProps {
  schemeProspects: SchemeProspect[];
  userRole?: string;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  onSortChange: (field: string) => void;
  onViewDetails: (sp: SchemeProspect) => void;
  onEdit: (sp: SchemeProspect) => void;
  onDelete?: (sp: SchemeProspect) => void;
}

export function SchemeProspectsTable({
  schemeProspects,
  userRole,
  sortBy,
  sortOrder,
  onSortChange,
  onViewDetails,
  onEdit,
  onDelete,
}: SchemeProspectsTableProps) {
  const renderSortIndicator = (field: string) => {
    if (sortBy !== field) return null;
    return (
      <Icon
        name={sortOrder === 'asc' ? 'chevron-up' : 'chevron-down'}
        size="xs"
        className="text-sky-400 shrink-0"
      />
    );
  };

  return (
    <div className="w-full">
      {/* Mobile view (< 768px): Card list representation */}
      <div className="md:hidden space-y-2.5">
        {schemeProspects.map((sp) => (
          <SchemeProspectCardMobile
            key={sp.id}
            schemeProspect={sp}
            userRole={userRole}
            onViewDetails={onViewDetails}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        ))}
      </div>

      {/* Desktop / Tablet view (>= 768px): Structured Table */}
      <div className="hidden md:block overflow-x-auto rounded-lg border border-slate-800 bg-slate-950 shadow-xs">
        <table className="w-full text-left border-collapse" role="table">
          <thead>
            <tr className="border-b border-slate-800 bg-slate-900/80 text-[11px] font-mono uppercase tracking-wider text-slate-400">
              <th scope="col" className="py-2.5 px-4 font-semibold">
                <button
                  type="button"
                  onClick={() => onSortChange('name')}
                  className="flex items-center gap-1.5 hover:text-slate-200 transition-colors focus-visible:outline-none focus-visible:underline"
                >
                  <span>Scheme Name & Code</span>
                  {renderSortIndicator('name')}
                </button>
              </th>
              <th scope="col" className="py-2.5 px-4 font-semibold">
                <button
                  type="button"
                  onClick={() => onSortChange('estimatedUnitCount')}
                  className="flex items-center gap-1.5 hover:text-slate-200 transition-colors focus-visible:outline-none focus-visible:underline"
                >
                  <span>Units</span>
                  {renderSortIndicator('estimatedUnitCount')}
                </button>
              </th>
              <th scope="col" className="py-2.5 px-4 font-semibold">
                Managing Agent
              </th>
              <th scope="col" className="py-2.5 px-4 font-semibold">
                Location
              </th>
              <th scope="col" className="py-2.5 px-4 font-semibold">
                Current Software
              </th>
              <th scope="col" className="py-2.5 px-4 font-semibold">
                <button
                  type="button"
                  onClick={() => onSortChange('createdAt')}
                  className="flex items-center gap-1.5 hover:text-slate-200 transition-colors focus-visible:outline-none focus-visible:underline"
                >
                  <span>Created</span>
                  {renderSortIndicator('createdAt')}
                </button>
              </th>
              <th scope="col" className="py-2.5 px-4 font-semibold text-right">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {schemeProspects.map((sp) => (
              <SchemeProspectRow
                key={sp.id}
                schemeProspect={sp}
                userRole={userRole}
                onViewDetails={onViewDetails}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
