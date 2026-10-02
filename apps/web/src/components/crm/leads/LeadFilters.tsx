/**
 * BCIP Lead Filters Toolbar Component
 * Phase 2D — Prompt 002D-002: CRM Leads Management Table
 */

import React from 'react';
import {
  LeadStatus,
  ALL_LEAD_STATUSES,
  LEAD_STATUS_CONFIG,
  QualificationStatus,
  QUALIFICATION_STATUS_CONFIG,
} from '../shared/crm-types';
import { Icon } from '@bcip/ui';

interface LeadFiltersProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  statusFilter: LeadStatus | 'ALL';
  onStatusFilterChange: (status: LeadStatus | 'ALL') => void;
  qualificationFilter: QualificationStatus | 'ALL';
  onQualificationFilterChange: (qual: QualificationStatus | 'ALL') => void;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  onSortChange: (field: string) => void;
  onToggleSortOrder: () => void;
  onClearFilters: () => void;
  isFiltered: boolean;
}

export function LeadFilters({
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  qualificationFilter,
  onQualificationFilterChange,
  sortBy,
  sortOrder,
  onSortChange,
  onToggleSortOrder,
  onClearFilters,
  isFiltered,
}: LeadFiltersProps) {
  return (
    <div className="flex flex-col gap-3 bg-slate-900/40 p-3 rounded-lg border border-slate-800/80">
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Icon
            name="search"
            size="xs"
            className="absolute left-3 top-2.5 text-slate-500 pointer-events-none"
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search leads by title, scheme, email, or managing agent..."
            className="w-full bg-slate-950 border border-slate-800 rounded-md py-1.5 pl-8 pr-7 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-sky-400"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              className="absolute right-2.5 top-2 text-slate-500 hover:text-slate-300"
              aria-label="Clear search"
            >
              <Icon name="x" size="xs" />
            </button>
          )}
        </div>

        {/* Filter Dropdowns */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Status Filter */}
          <div className="flex items-center gap-1.5">
            <label htmlFor="lead-status-filter" className="text-xs text-slate-400 font-medium shrink-0">
              Status:
            </label>
            <select
              id="lead-status-filter"
              value={statusFilter}
              onChange={(e) => onStatusFilterChange(e.target.value as LeadStatus | 'ALL')}
              className="bg-slate-950 border border-slate-800 rounded-md py-1.5 px-2.5 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-sky-400"
            >
              <option value="ALL">All Statuses</option>
              {ALL_LEAD_STATUSES.map((st) => (
                <option key={st} value={st}>
                  {LEAD_STATUS_CONFIG[st].label}
                </option>
              ))}
            </select>
          </div>

          {/* Qualification Filter */}
          <div className="flex items-center gap-1.5">
            <label htmlFor="lead-qual-filter" className="text-xs text-slate-400 font-medium shrink-0">
              Qualification:
            </label>
            <select
              id="lead-qual-filter"
              value={qualificationFilter}
              onChange={(e) =>
                onQualificationFilterChange(e.target.value as QualificationStatus | 'ALL')
              }
              className="bg-slate-950 border border-slate-800 rounded-md py-1.5 px-2.5 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-sky-400"
            >
              <option value="ALL">All Qualifications</option>
              {Object.keys(QUALIFICATION_STATUS_CONFIG).map((q) => (
                <option key={q} value={q}>
                  {QUALIFICATION_STATUS_CONFIG[q as QualificationStatus].label}
                </option>
              ))}
            </select>
          </div>

          {/* Sort selector */}
          <div className="flex items-center gap-1.5">
            <label htmlFor="lead-sort-by" className="text-xs text-slate-400 font-medium shrink-0">
              Sort:
            </label>
            <select
              id="lead-sort-by"
              value={sortBy}
              onChange={(e) => onSortChange(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-md py-1.5 px-2.5 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-sky-400"
            >
              <option value="createdAt">Date Created</option>
              <option value="title">Lead Title</option>
              <option value="status">Status</option>
              <option value="estimatedUnits">Unit Sizing</option>
            </select>

            <button
              type="button"
              onClick={onToggleSortOrder}
              className="p-1.5 rounded bg-slate-950 border border-slate-800 text-slate-400 hover:text-slate-100 transition-colors"
              title={`Sort ${sortOrder === 'asc' ? 'Ascending' : 'Descending'}`}
              aria-label={`Sort ${sortOrder === 'asc' ? 'Ascending' : 'Descending'}`}
            >
              <Icon name={sortOrder === 'asc' ? 'chevron-up' : 'chevron-down'} size="xs" />
            </button>
          </div>

          {/* Clear Filters */}
          {isFiltered && (
            <button
              type="button"
              onClick={onClearFilters}
              className="text-xs text-sky-400 hover:text-sky-300 px-2 py-1 font-medium transition-colors"
            >
              Clear
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
