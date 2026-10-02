/**
 * BCIP Lead Pagination Component
 * Phase 2D — Prompt 002D-002: CRM Leads Management Table
 */

import React from 'react';
import { Button, Icon } from '@bcip/ui';

interface LeadPaginationProps {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  onPageChange: (newPage: number) => void;
  onPageSizeChange: (newPageSize: number) => void;
}

export function LeadPagination({
  page,
  pageSize,
  total,
  totalPages,
  onPageChange,
  onPageSizeChange,
}: LeadPaginationProps) {
  if (total === 0) return null;

  const startRecord = (page - 1) * pageSize + 1;
  const endRecord = Math.min(page * pageSize, total);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 bg-slate-950/80 border-t border-slate-800 text-xs text-slate-400">
      {/* Range text */}
      <div className="flex items-center gap-2 font-mono">
        <span>
          Showing <strong className="text-slate-200">{startRecord}</strong> to{' '}
          <strong className="text-slate-200">{endRecord}</strong> of{' '}
          <strong className="text-slate-200">{total}</strong> leads
        </span>
      </div>

      {/* Page Controls & Size selector */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5">
          <label htmlFor="lead-page-size" className="text-slate-500 text-[11px]">
            Rows:
          </label>
          <select
            id="lead-page-size"
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            className="bg-slate-900 border border-slate-800 rounded px-2 py-1 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-sky-400"
          >
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
          </select>
        </div>

        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(page - 1)}
            disabled={page <= 1}
            aria-label="Previous Page"
          >
            <Icon name="chevron-left" size="xs" />
          </Button>

          <span className="px-2 font-mono text-[11px] text-slate-300">
            Page {page} of {Math.max(1, totalPages)}
          </span>

          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(page + 1)}
            disabled={page >= totalPages}
            aria-label="Next Page"
          >
            <Icon name="chevron-right" size="xs" />
          </Button>
        </div>
      </div>
    </div>
  );
}
