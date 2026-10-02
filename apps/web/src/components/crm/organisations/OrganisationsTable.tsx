/**
 * BCIP Organisations Table Component
 * Phase 2D — Prompt 002D-004: Organisations & Scheme Prospects
 */

import React from 'react';
import { Organisation } from '../shared/crm-types';
import { OrganisationRow } from './OrganisationRow';
import { OrganisationCardMobile } from './OrganisationCardMobile';
import { Icon } from '@bcip/ui';

interface OrganisationsTableProps {
  organisations: Organisation[];
  userRole?: string;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  onSortChange: (field: string) => void;
  onViewDetails: (org: Organisation) => void;
  onEdit: (org: Organisation) => void;
  onDelete?: (org: Organisation) => void;
}

export function OrganisationsTable({
  organisations,
  userRole,
  sortBy,
  sortOrder,
  onSortChange,
  onViewDetails,
  onEdit,
  onDelete,
}: OrganisationsTableProps) {
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
        {organisations.map((org) => (
          <OrganisationCardMobile
            key={org.id}
            organisation={org}
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
                  <span>Organisation & Legal</span>
                  {renderSortIndicator('name')}
                </button>
              </th>
              <th scope="col" className="py-2.5 px-4 font-semibold">
                Type
              </th>
              <th scope="col" className="py-2.5 px-4 font-semibold">
                <button
                  type="button"
                  onClick={() => onSortChange('status')}
                  className="flex items-center gap-1.5 hover:text-slate-200 transition-colors focus-visible:outline-none focus-visible:underline"
                >
                  <span>Status</span>
                  {renderSortIndicator('status')}
                </button>
              </th>
              <th scope="col" className="py-2.5 px-4 font-semibold">
                Contact Details
              </th>
              <th scope="col" className="py-2.5 px-4 font-semibold">
                Quality
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
            {organisations.map((org) => (
              <OrganisationRow
                key={org.id}
                organisation={org}
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
