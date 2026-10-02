/**
 * BCIP Leads Table Component
 * Phase 2D — Prompt 002D-002: CRM Leads Management Table
 * Responsive tabular representation with sortable headers.
 */

import React from 'react';
import { Lead } from '../shared/crm-types';
import { LeadRow } from './LeadRow';
import { LeadCardMobile } from './LeadCardMobile';
import { Icon } from '@bcip/ui';

interface LeadsTableProps {
  leads: Lead[];
  userRole?: string;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  onSortChange: (field: string) => void;
  onViewDetails: (lead: Lead) => void;
  onEdit: (lead: Lead) => void;
  onChangeStatus: (lead: Lead) => void;
  onConvert?: (lead: Lead) => void;
  onDelete?: (lead: Lead) => void;
}

export function LeadsTable({
  leads,
  userRole,
  sortBy,
  sortOrder,
  onSortChange,
  onViewDetails,
  onEdit,
  onChangeStatus,
  onConvert,
  onDelete,
}: LeadsTableProps) {
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
        {leads.map((lead) => (
          <LeadCardMobile
            key={lead.id}
            lead={lead}
            userRole={userRole}
            onViewDetails={onViewDetails}
            onEdit={onEdit}
            onChangeStatus={onChangeStatus}
            onConvert={onConvert}
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
                  onClick={() => onSortChange('title')}
                  className="flex items-center gap-1.5 hover:text-slate-200 transition-colors focus-visible:outline-none focus-visible:underline"
                >
                  <span>Lead & Scope</span>
                  {renderSortIndicator('title')}
                </button>
              </th>
              <th scope="col" className="py-2.5 px-4 font-semibold">
                Contact Details
              </th>
              <th scope="col" className="py-2.5 px-4 font-semibold">
                Source
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
                Qualification
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
            {leads.map((lead) => (
              <LeadRow
                key={lead.id}
                lead={lead}
                userRole={userRole}
                onViewDetails={onViewDetails}
                onEdit={onEdit}
                onChangeStatus={onChangeStatus}
                onConvert={onConvert}
                onDelete={onDelete}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
