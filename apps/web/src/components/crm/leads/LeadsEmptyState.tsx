/**
 * BCIP Leads Empty State Component
 * Phase 2D — Prompt 002D-002: CRM Leads Management Table
 * Enterprise empty state adhering to Phase 2A design tokens.
 */

import React from 'react';
import { canCreateLead } from '../shared/crm-permissions';
import { Button, Icon } from '@bcip/ui';

interface LeadsEmptyStateProps {
  userRole?: string;
  isFiltered?: boolean;
  tenantName?: string;
  onCreateLead?: () => void;
  onClearFilters?: () => void;
}

export function LeadsEmptyState({
  userRole,
  isFiltered,
  tenantName,
  onCreateLead,
  onClearFilters,
}: LeadsEmptyStateProps) {
  const allowCreate = canCreateLead(userRole);

  return (
    <div className="bg-slate-900/40 border border-dashed border-slate-800 rounded-xl p-12 text-center flex flex-col items-center justify-center max-w-xl mx-auto my-8">
      <div className="w-12 h-12 rounded-full bg-slate-800/80 border border-slate-700/60 flex items-center justify-center text-slate-400 mb-4">
        <Icon name="user" size="md" />
      </div>

      <h3 className="text-base font-semibold text-slate-100">
        {isFiltered ? 'No matching leads found' : 'No leads recorded yet'}
      </h3>

      <p className="text-xs text-slate-400 mt-2 max-w-md leading-relaxed">
        {isFiltered
          ? 'No lead records match your search terms or active status filters. Clear filters to see all available leads.'
          : `There are currently no inbound or outreach leads for ${tenantName || 'this portfolio partition'}. Capture a new prospect to begin tracking qualification and scheme conversion.`}
      </p>

      <div className="mt-6 flex items-center gap-3">
        {isFiltered && onClearFilters && (
          <Button variant="outline" size="sm" onClick={onClearFilters}>
            Clear Search & Filters
          </Button>
        )}

        {allowCreate && onCreateLead && (
          <Button variant="primary" size="sm" onClick={onCreateLead}>
            <Icon name="plus" size="xs" className="mr-1.5" />
            <span>Create Lead</span>
          </Button>
        )}
      </div>
    </div>
  );
}
