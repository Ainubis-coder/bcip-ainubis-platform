/**
 * BCIP Organisations Filter & Search Toolbar
 * Phase 2D — Prompt 002D-004: Organisations & Scheme Prospects
 */

import React from 'react';
import {
  OrganisationType,
  OrganisationStatus,
  ORGANISATION_TYPE_LABELS,
  ORGANISATION_STATUS_CONFIG,
} from '../shared/crm-types';
import { Icon } from '@bcip/ui';

interface OrganisationFiltersProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  typeFilter: OrganisationType | 'ALL';
  onTypeFilterChange: (type: OrganisationType | 'ALL') => void;
  statusFilter: OrganisationStatus | 'ALL';
  onStatusFilterChange: (status: OrganisationStatus | 'ALL') => void;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  onSortChange: (sortBy: string, sortOrder: 'asc' | 'desc') => void;
  onResetFilters: () => void;
  totalFiltered: number;
}

export function OrganisationFilters({
  searchQuery,
  onSearchChange,
  typeFilter,
  onTypeFilterChange,
  statusFilter,
  onStatusFilterChange,
  sortBy,
  sortOrder,
  onSortChange,
  onResetFilters,
  totalFiltered,
}: OrganisationFiltersProps) {
  const hasActiveFilters = searchQuery !== '' || typeFilter !== 'ALL' || statusFilter !== 'ALL';

  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-lg p-3 space-y-3">
      <div className="flex flex-col md:flex-row gap-2.5 items-stretch md:items-center justify-between">
        {/* Search input with debouncing at parent */}
        <div className="relative flex-1 max-w-md">
          <Icon
            name="search"
            size="xs"
            className="absolute left-3 top-2.5 text-slate-500"
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search by name, legal name, email, phone..."
            className="w-full text-xs pl-8 pr-8 py-2 rounded bg-slate-950 border border-slate-800 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-sky-400"
            aria-label="Search organisations"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              className="absolute right-2.5 top-2.5 text-slate-500 hover:text-slate-300"
              aria-label="Clear search query"
            >
              <Icon name="x" size="xs" />
            </button>
          )}
        </div>

        {/* Filter Dropdowns */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Organisation Type Filter */}
          <select
            value={typeFilter}
            onChange={(e) => onTypeFilterChange(e.target.value as OrganisationType | 'ALL')}
            className="text-xs px-2.5 py-1.5 rounded bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:ring-1 focus:ring-sky-400"
            aria-label="Filter by organisation type"
          >
            <option value="ALL">All Types</option>
            {Object.entries(ORGANISATION_TYPE_LABELS).map(([val, label]) => (
              <option key={val} value={val}>
                {label}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => onStatusFilterChange(e.target.value as OrganisationStatus | 'ALL')}
            className="text-xs px-2.5 py-1.5 rounded bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:ring-1 focus:ring-sky-400"
            aria-label="Filter by organisation status"
          >
            <option value="ALL">All Statuses</option>
            {Object.entries(ORGANISATION_STATUS_CONFIG).map(([val, cfg]) => (
              <option key={val} value={val}>
                {cfg.label}
              </option>
            ))}
          </select>

          {/* Sort Selector */}
          <select
            value={`${sortBy}:${sortOrder}`}
            onChange={(e) => {
              const [sb, so] = e.target.value.split(':') as [string, 'asc' | 'desc'];
              onSortChange(sb, so);
            }}
            className="text-xs px-2.5 py-1.5 rounded bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:ring-1 focus:ring-sky-400 font-mono"
            aria-label="Sort organisations"
          >
            <option value="createdAt:desc">Newest First</option>
            <option value="createdAt:asc">Oldest First</option>
            <option value="name:asc">Name (A-Z)</option>
            <option value="name:desc">Name (Z-A)</option>
            <option value="status:asc">Status</option>
          </select>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={onResetFilters}
              className="text-xs text-sky-400 hover:text-sky-300 px-2 py-1 rounded hover:bg-slate-800/60 transition-colors"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between text-[11px] font-mono text-slate-500 pt-1 border-t border-slate-800/40">
        <span>Showing {totalFiltered} filtered organisations</span>
        {hasActiveFilters && <span className="text-amber-400">Filters active</span>}
      </div>
    </div>
  );
}
