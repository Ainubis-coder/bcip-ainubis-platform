/**
 * BCIP Ainubis Intelligence Filters & Toolbar
 * Phase 2E — Prompt 002E-001: Ainubis CRM Intelligence Foundation & Governance
 */

import React from 'react';
import {
  IntelligenceType,
  IntelligenceStatus,
  AICapability,
} from '../crm/shared/crm-types';
import { Icon } from '@bcip/ui';

interface AinubisFiltersProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  capabilityFilter: AICapability | 'ALL';
  onCapabilityFilterChange: (c: AICapability | 'ALL') => void;
  typeFilter: IntelligenceType | 'ALL';
  onTypeFilterChange: (t: IntelligenceType | 'ALL') => void;
  statusFilter: IntelligenceStatus | 'ALL';
  onStatusFilterChange: (s: IntelligenceStatus | 'ALL') => void;
  entityTypeFilter?: string | 'ALL';
  onEntityTypeFilterChange?: (e: string | 'ALL') => void;
  onResetFilters: () => void;
  totalFiltered: number;
}

export function AinubisFilters({
  searchQuery,
  onSearchChange,
  capabilityFilter,
  onCapabilityFilterChange,
  typeFilter,
  onTypeFilterChange,
  statusFilter,
  onStatusFilterChange,
  entityTypeFilter = 'ALL',
  onEntityTypeFilterChange,
  onResetFilters,
  totalFiltered,
}: AinubisFiltersProps) {
  const hasActiveFilters =
    searchQuery !== '' ||
    capabilityFilter !== 'ALL' ||
    typeFilter !== 'ALL' ||
    statusFilter !== 'ALL' ||
    entityTypeFilter !== 'ALL';

  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-lg p-3 space-y-3">
      <div className="flex flex-col md:flex-row gap-2.5 items-stretch md:items-center justify-between">
        {/* Search input with debouncing */}
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
            placeholder="Search intelligence title, summary, or evidence..."
            className="w-full text-xs pl-8 pr-8 py-2 rounded bg-slate-950 border border-slate-800 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-sky-400"
            aria-label="Search intelligence records"
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
          {/* Entity Type Filter */}
          {onEntityTypeFilterChange && (
            <select
              value={entityTypeFilter}
              onChange={(e) => onEntityTypeFilterChange(e.target.value)}
              className="text-xs px-2.5 py-1.5 rounded bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:ring-1 focus:ring-sky-400"
              aria-label="Filter by CRM entity type"
            >
              <option value="ALL">All CRM Entities</option>
              <option value="opportunity">Opportunities</option>
              <option value="lead">Leads</option>
              <option value="organisation">Organisations</option>
              <option value="scheme_prospect">Scheme Prospects</option>
              <option value="task">Tasks</option>
              <option value="activity">Activities</option>
            </select>
          )}

          {/* Capability Filter */}
          <select
            value={capabilityFilter}
            onChange={(e) => onCapabilityFilterChange(e.target.value as AICapability | 'ALL')}
            className="text-xs px-2.5 py-1.5 rounded bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:ring-1 focus:ring-sky-400"
            aria-label="Filter by capability"
          >
            <option value="ALL">All Capabilities</option>
            {Object.values(AICapability).map((cap) => (
              <option key={cap} value={cap}>
                {cap}
              </option>
            ))}
          </select>

          {/* Intelligence Type Filter */}
          <select
            value={typeFilter}
            onChange={(e) => onTypeFilterChange(e.target.value as IntelligenceType | 'ALL')}
            className="text-xs px-2.5 py-1.5 rounded bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:ring-1 focus:ring-sky-400"
            aria-label="Filter by intelligence type"
          >
            <option value="ALL">All Intelligence Types</option>
            {Object.values(IntelligenceType).map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>

          {/* Lifecycle Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => onStatusFilterChange(e.target.value as IntelligenceStatus | 'ALL')}
            className="text-xs px-2.5 py-1.5 rounded bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:ring-1 focus:ring-sky-400"
            aria-label="Filter by lifecycle status"
          >
            <option value="ALL">All Statuses</option>
            {Object.values(IntelligenceStatus).map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
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
        <span>Showing {totalFiltered} intelligence records</span>
        {hasActiveFilters && <span className="text-amber-400 font-medium">Filters active</span>}
      </div>
    </div>
  );
}
