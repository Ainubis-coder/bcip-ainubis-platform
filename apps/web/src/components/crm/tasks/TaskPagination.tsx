/**
 * BCIP Task Pagination Component
 * Phase 2D — Prompt 002D-005: Activities & Tasks
 */

import React from 'react';
import { Icon } from '@bcip/ui';

interface TaskPaginationProps {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  onPageChange: (newPage: number) => void;
  onPageSizeChange: (newPageSize: number) => void;
}

export function TaskPagination({
  page,
  pageSize,
  total,
  totalPages,
  onPageChange,
  onPageSizeChange,
}: TaskPaginationProps) {
  const startItem = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const endItem = Math.min(page * pageSize, total);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 bg-slate-950/80 border-t border-slate-800 text-xs">
      <div className="flex items-center gap-2 text-slate-400 font-mono">
        <span>
          Showing <span className="text-slate-200">{startItem}</span> to{' '}
          <span className="text-slate-200">{endItem}</span> of{' '}
          <span className="text-slate-200">{total}</span> tasks
        </span>
      </div>

      <div className="flex items-center gap-3">
        {/* Page size dropdown */}
        <div className="flex items-center gap-1.5 text-slate-400">
          <span className="text-[11px]">Rows:</span>
          <select
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            className="text-xs px-2 py-1 rounded bg-slate-900 border border-slate-800 text-slate-200 focus:outline-none focus:ring-1 focus:ring-sky-400 font-mono"
            aria-label="Rows per page"
          >
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
          </select>
        </div>

        {/* Page Navigation Buttons */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => onPageChange(page - 1)}
            className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            aria-label="Previous page"
          >
            <Icon name="chevron-left" size="xs" />
          </button>

          <span className="px-2 font-mono text-[11px] text-slate-300">
            Page {page} of {Math.max(1, totalPages)}
          </span>

          <button
            type="button"
            disabled={page >= totalPages || totalPages === 0}
            onClick={() => onPageChange(page + 1)}
            className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            aria-label="Next page"
          >
            <Icon name="chevron-right" size="xs" />
          </button>
        </div>
      </div>
    </div>
  );
}
