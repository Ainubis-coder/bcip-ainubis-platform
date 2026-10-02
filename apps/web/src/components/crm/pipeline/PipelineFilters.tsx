/**
 * BCIP Pipeline Filters Component
 * Phase 2D — Prompt 002D-001: CRM Frontend Foundation & Pipeline Kanban
 * High-performance search and filter controls.
 */

import React from 'react';
import { OpportunityStage, ALL_PIPELINE_STAGES, STAGE_CONFIG } from '../shared/crm-types';
import { Icon } from '@bcip/ui';

interface PipelineFiltersProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedStageFilter: OpportunityStage | 'ALL';
  onStageFilterChange: (stage: OpportunityStage | 'ALL') => void;
  onClearFilters: () => void;
  isFiltered: boolean;
}

export function PipelineFilters({
  searchQuery,
  onSearchChange,
  selectedStageFilter,
  onStageFilterChange,
  onClearFilters,
  isFiltered,
}: PipelineFiltersProps) {
  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-900/40 p-2.5 rounded-lg border border-slate-800/60">
      {/* Search Bar */}
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
          placeholder="Filter deals by name, scheme, or source..."
          className="w-full bg-slate-950 border border-slate-800 rounded-md py-1.5 pl-8 pr-3 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-sky-400"
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

      {/* Stage Dropdown & Reset */}
      <div className="flex items-center gap-2">
        <label htmlFor="pipeline-stage-filter" className="text-xs text-slate-400 shrink-0 font-medium">
          Stage:
        </label>
        <select
          id="pipeline-stage-filter"
          value={selectedStageFilter}
          onChange={(e) => onStageFilterChange(e.target.value as OpportunityStage | 'ALL')}
          className="bg-slate-950 border border-slate-800 rounded-md py-1.5 px-2.5 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-sky-400"
        >
          <option value="ALL">All Stages</option>
          {ALL_PIPELINE_STAGES.map((s) => (
            <option key={s} value={s}>
              {STAGE_CONFIG[s].label}
            </option>
          ))}
        </select>

        {isFiltered && (
          <button
            type="button"
            onClick={onClearFilters}
            className="text-xs text-sky-400 hover:text-sky-300 px-2 py-1 transition-colors"
          >
            Clear
          </button>
        )}
      </div>
    </div>
  );
}
