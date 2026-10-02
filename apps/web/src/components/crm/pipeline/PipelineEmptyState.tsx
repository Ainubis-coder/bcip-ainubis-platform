/**
 * BCIP Pipeline Empty State Component
 * Phase 2D — Prompt 002D-001: CRM Frontend Foundation & Pipeline Kanban
 * Enterprise empty state adhering to Phase 2A design tokens.
 */

import React from 'react';
import { canCreateOpportunity } from '../shared/crm-permissions';
import { Button, Icon } from '@bcip/ui';

interface PipelineEmptyStateProps {
  userRole?: string;
  isFiltered?: boolean;
  tenantName?: string;
  onCreateOpportunity?: () => void;
  onClearFilters?: () => void;
}

export function PipelineEmptyState({
  userRole,
  isFiltered,
  tenantName,
  onCreateOpportunity,
  onClearFilters,
}: PipelineEmptyStateProps) {
  const allowCreate = canCreateOpportunity(userRole);

  return (
    <div className="bg-slate-900/40 border border-dashed border-slate-800 rounded-xl p-12 text-center flex flex-col items-center justify-center max-w-xl mx-auto my-8">
      <div className="w-12 h-12 rounded-full bg-slate-800/80 border border-slate-700/60 flex items-center justify-center text-slate-400 mb-4">
        <Icon name="layers" size="md" />
      </div>

      <h3 className="text-base font-semibold text-slate-100">
        {isFiltered ? 'No matching deals found' : 'Your CRM pipeline is ready'}
      </h3>

      <p className="text-xs text-slate-400 mt-2 max-w-md leading-relaxed">
        {isFiltered
          ? 'No opportunities match your current filter and search criteria. Try clearing your filters.'
          : `There are currently no active sales deals for ${tenantName || 'this tenant partition'}. Begin by creating an opportunity to track commercial relationships and deal velocity.`}
      </p>

      <div className="mt-6 flex items-center gap-3">
        {isFiltered && onClearFilters && (
          <Button variant="outline" size="sm" onClick={onClearFilters}>
            Clear Filters
          </Button>
        )}

        {allowCreate && onCreateOpportunity && (
          <Button variant="primary" size="sm" onClick={onCreateOpportunity}>
            <Icon name="plus" size="xs" className="mr-1.5" />
            <span>Create Opportunity</span>
          </Button>
        )}
      </div>
    </div>
  );
}
