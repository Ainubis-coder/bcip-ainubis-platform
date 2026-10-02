/**
 * BCIP Activities Empty State Component
 * Phase 2D — Prompt 002D-005: Activities & Tasks
 */

import React from 'react';
import { Icon, Button } from '@bcip/ui';

interface ActivitiesEmptyStateProps {
  isFiltered?: boolean;
  canCreate?: boolean;
  onClearFilters?: () => void;
  onCreate?: () => void;
}

export function ActivitiesEmptyState({
  isFiltered,
  canCreate,
  onClearFilters,
  onCreate,
}: ActivitiesEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center bg-slate-900/30 border border-slate-800 rounded-lg">
      <div className="p-3 rounded-full bg-slate-800/80 text-slate-400 mb-3 border border-slate-700/50">
        <Icon name="activity" size="md" />
      </div>

      <h3 className="text-sm font-semibold text-slate-200">
        {isFiltered ? 'No matching customer interactions found' : 'No activities recorded'}
      </h3>

      <p className="text-xs text-slate-400 mt-1 max-w-sm leading-relaxed">
        {isFiltered
          ? 'No activity records match your active search query or type filter.'
          : 'Log client phone calls, emails, meetings, demos, and internal notes across CRM leads and opportunities.'}
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
            <span>Log Activity</span>
          </Button>
        )}
      </div>
    </div>
  );
}
