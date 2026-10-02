/**
 * BCIP Ainubis Empty State Component
 * Phase 2E — Prompt 002E-001: Ainubis CRM Intelligence Foundation & Governance
 */

import React from 'react';
import { Icon, Button } from '@bcip/ui';

interface AinubisEmptyStateProps {
  isFiltered?: boolean;
  canGenerate?: boolean;
  onClearFilters?: () => void;
  onRunAnalysis?: () => void;
  isAnalyzing?: boolean;
}

export function AinubisEmptyState({
  isFiltered,
  canGenerate,
  onClearFilters,
  onRunAnalysis,
  isAnalyzing = false,
}: AinubisEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center bg-slate-900/30 border border-slate-800 rounded-lg">
      <div className="p-3 rounded-full bg-sky-950/60 text-sky-400 mb-3 border border-sky-800/40">
        <Icon name="cpu" size="md" />
      </div>

      <h3 className="text-sm font-semibold text-slate-200">
        {isFiltered ? 'No matching intelligence records found' : 'No Ainubis observations recorded'}
      </h3>

      <p className="text-xs text-slate-400 mt-1 max-w-sm leading-relaxed">
        {isFiltered
          ? 'No AI observations or recommendations match your active capability, type, or search filter.'
          : 'Ainubis observes CRM activity logs, overdue tasks, proposal staleness, and missing forecast attributes using evidence-backed rule engines.'}
      </p>

      <div className="mt-4 flex items-center gap-2">
        {isFiltered && onClearFilters && (
          <Button variant="secondary" size="sm" onClick={onClearFilters}>
            Clear Filters
          </Button>
        )}

        {canGenerate && onRunAnalysis && (
          <Button
            variant="primary"
            size="sm"
            onClick={onRunAnalysis}
            disabled={isAnalyzing}
            className="flex items-center gap-1.5"
          >
            {isAnalyzing ? (
              <>
                <span className="w-3 h-3 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                <span>Running Pipeline Hygiene Analysis...</span>
              </>
            ) : (
              <>
                <Icon name="zap" size="xs" />
                <span>Trigger Pipeline Hygiene Analysis</span>
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  );
}
