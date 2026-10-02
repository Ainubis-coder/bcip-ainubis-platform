/**
 * BCIP Organisations Empty State Component
 * Phase 2D — Prompt 002D-004: Organisations & Scheme Prospects
 */

import React from 'react';
import { Icon, Button } from '@bcip/ui';

interface OrganisationsEmptyStateProps {
  isFiltered?: boolean;
  canCreate?: boolean;
  onClearFilters?: () => void;
  onCreate?: () => void;
}

export function OrganisationsEmptyState({
  isFiltered,
  canCreate,
  onClearFilters,
  onCreate,
}: OrganisationsEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center bg-slate-900/30 border border-slate-800 rounded-lg">
      <div className="p-3 rounded-full bg-slate-800/80 text-slate-400 mb-3 border border-slate-700/50">
        <Icon name="building" size="md" />
      </div>

      <h3 className="text-sm font-semibold text-slate-200">
        {isFiltered ? 'No matching organisations found' : 'No organisations registered'}
      </h3>

      <p className="text-xs text-slate-400 mt-1 max-w-sm leading-relaxed">
        {isFiltered
          ? 'No organisation records match your search criteria or active status filters.'
          : 'Organisations represent managing agents, body corporates, and corporate portfolios in this tenant partition.'}
      </p>

      <div className="mt-4 flex items-center gap-2">
        {isFiltered && onClearFilters && (
          <Button variant="secondary" size="sm" onClick={onClearFilters}>
            Clear Filters
          </Button>
        )}

        {canCreate && onCreate && (
          <Button variant="primary" size="sm" onClick={onCreate}>
            <Icon name="plus" size="xs" className="mr-1.5" />
            <span>Create Organisation</span>
          </Button>
        )}
      </div>
    </div>
  );
}
