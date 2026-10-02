/**
 * BCIP Task Filter & Search Toolbar
 * Phase 2D — Prompt 002D-005: Activities & Tasks
 */

import React from 'react';
import {
  TaskStatus,
  TASK_STATUS_CONFIG,
  TaskPriority,
  TASK_PRIORITY_CONFIG,
} from '../shared/crm-types';
import { Icon } from '@bcip/ui';

interface TaskFiltersProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  statusFilter: TaskStatus | 'ALL';
  onStatusFilterChange: (status: TaskStatus | 'ALL') => void;
  priorityFilter: TaskPriority | 'ALL';
  onPriorityFilterChange: (priority: TaskPriority | 'ALL') => void;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  onSortChange: (sortBy: string, sortOrder: 'asc' | 'desc') => void;
  onResetFilters: () => void;
  totalFiltered: number;
}

export function TaskFilters({
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  priorityFilter,
  onPriorityFilterChange,
  sortBy,
  sortOrder,
  onSortChange,
  onResetFilters,
  totalFiltered,
}: TaskFiltersProps) {
  const hasActiveFilters = searchQuery !== '' || statusFilter !== 'ALL' || priorityFilter !== 'ALL';

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
            placeholder="Search tasks by title or description..."
            className="w-full text-xs pl-8 pr-8 py-2 rounded bg-slate-950 border border-slate-800 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-sky-400"
            aria-label="Search tasks"
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
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => onStatusFilterChange(e.target.value as TaskStatus | 'ALL')}
            className="text-xs px-2.5 py-1.5 rounded bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:ring-1 focus:ring-sky-400"
            aria-label="Filter by task status"
          >
            <option value="ALL">All Statuses</option>
            {Object.entries(TASK_STATUS_CONFIG).map(([val, cfg]) => (
              <option key={val} value={val}>
                {cfg.label}
              </option>
            ))}
          </select>

          {/* Priority Filter */}
          <select
            value={priorityFilter}
            onChange={(e) => onPriorityFilterChange(e.target.value as TaskPriority | 'ALL')}
            className="text-xs px-2.5 py-1.5 rounded bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:ring-1 focus:ring-sky-400"
            aria-label="Filter by task priority"
          >
            <option value="ALL">All Priorities</option>
            {Object.entries(TASK_PRIORITY_CONFIG).map(([val, cfg]) => (
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
            aria-label="Sort tasks"
          >
            <option value="dueAt:asc">Due Date (Earliest First)</option>
            <option value="dueAt:desc">Due Date (Latest First)</option>
            <option value="createdAt:desc">Newest First</option>
            <option value="priority:desc">Priority (High to Low)</option>
            <option value="title:asc">Title (A-Z)</option>
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
        <span>Showing {totalFiltered} filtered task records</span>
        {hasActiveFilters && <span className="text-amber-400 font-medium">Filters active</span>}
      </div>
    </div>
  );
}
