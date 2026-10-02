/**
 * BCIP Ainubis Evidence List Component
 * Phase 2E — Prompt 002E-001: Ainubis CRM Intelligence Foundation & Governance
 */

import React, { useState } from 'react';
import { EvidenceReference } from '../crm/shared/crm-types';
import { Icon } from '@bcip/ui';

interface AinubisEvidenceListProps {
  evidence: EvidenceReference[];
  defaultExpanded?: boolean;
}

export function AinubisEvidenceList({
  evidence,
  defaultExpanded = false,
}: AinubisEvidenceListProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  if (!evidence || evidence.length === 0) {
    return (
      <div className="text-[11px] text-slate-500 italic bg-slate-950 p-2.5 rounded border border-slate-800">
        No supporting evidence references attached.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-1.5 text-xs font-semibold text-sky-400 hover:text-sky-300 transition-colors focus-visible:outline-none focus-visible:underline"
      >
        <Icon
          name={isExpanded ? 'chevron-down' : 'chevron-right'}
          size="xs"
        />
        <span>Supporting Evidence ({evidence.length} items)</span>
      </button>

      {isExpanded && (
        <div className="space-y-1.5 pl-2 border-l-2 border-slate-800">
          {evidence.map((item, idx) => (
            <div
              key={item.id || idx}
              className="p-2 bg-slate-950/80 rounded border border-slate-800/80 text-[11px] font-mono space-y-1"
            >
              <div className="flex items-center justify-between text-slate-300">
                <span className="font-semibold text-slate-200">
                  {item.source || 'CRM System Record'}
                </span>
                <span className="text-[10px] text-slate-500">
                  Relevance: {Math.round((item.relevance || 1) * 100)}%
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-slate-400">
                <div>
                  <span className="text-slate-500">Entity:</span> {item.entityType} ({item.entityId})
                </div>
                {item.field && (
                  <div>
                    <span className="text-slate-500">Field:</span> {item.field}
                  </div>
                )}
              </div>

              {item.value !== undefined && (
                <div className="text-slate-300 bg-slate-900/60 p-1.5 rounded border border-slate-800/60 font-sans">
                  <span className="text-slate-500 font-mono text-[10px]">Value:</span>{' '}
                  {typeof item.value === 'object' ? JSON.stringify(item.value) : String(item.value)}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
