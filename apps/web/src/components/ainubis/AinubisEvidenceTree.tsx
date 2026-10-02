/**
 * BCIP Ainubis Evidence Tree Component
 * Phase 2E — Prompt 002E-002: Ainubis CRM Intelligence Dashboard & Contextual Intelligence
 * Expandable, hierarchical evidence viewer displaying:
 * Observation -> Operational Reason -> Grounded Evidence Nodes
 */

import React, { useState } from 'react';
import type { EvidenceReference, AIObservationRecord } from '../crm/shared/crm-types';
import { formatDate } from '../crm/shared/crm-formatters';
import { Icon } from '@bcip/ui';

interface AinubisEvidenceTreeProps {
  observation: AIObservationRecord;
  defaultExpanded?: boolean;
}

export function AinubisEvidenceTree({
  observation,
  defaultExpanded = false,
}: AinubisEvidenceTreeProps) {
  const [isTreeExpanded, setIsTreeExpanded] = useState(defaultExpanded);
  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({});

  const toggleNode = (nodeId: string) => {
    setExpandedNodes((prev) => ({
      ...prev,
      [nodeId]: !prev[nodeId],
    }));
  };

  const getEntityIcon = (entityType?: string) => {
    switch (entityType?.toLowerCase()) {
      case 'opportunity':
        return 'layers';
      case 'lead':
        return 'user';
      case 'organisation':
        return 'building';
      case 'scheme_prospect':
        return 'layout';
      case 'task':
        return 'check-circle';
      case 'activity':
        return 'activity';
      default:
        return 'database';
    }
  };

  const maskSafeValue = (val: unknown): string => {
    if (val === null || val === undefined) return 'None / Unspecified';
    if (typeof val === 'object') return JSON.stringify(val);
    const str = String(val);
    // Extra safety layer for credit card or national id format
    return str.replace(/\b\d{4}[ -]?\d{4}[ -]?\d{4}[ -]?\d{4}\b/g, '[REDACTED_CARD]');
  };

  const evidenceList = observation.evidence || [];

  return (
    <div className="space-y-2 text-xs">
      {/* Root Toggle */}
      <button
        type="button"
        onClick={() => setIsTreeExpanded(!isTreeExpanded)}
        className="flex items-center gap-1.5 font-medium text-sky-400 hover:text-sky-300 transition-colors focus-visible:outline-none focus-visible:underline"
        aria-expanded={isTreeExpanded}
      >
        <Icon
          name={isTreeExpanded ? 'chevron-down' : 'chevron-right'}
          size="xs"
        />
        <span>
          Evidence Lineage ({evidenceList.length} verified {evidenceList.length === 1 ? 'fact' : 'facts'})
        </span>
      </button>

      {isTreeExpanded && (
        <div className="pl-3 border-l-2 border-slate-800 space-y-3 mt-2">
          {/* Level 1: Observation Fact */}
          <div className="bg-slate-900/60 p-2.5 rounded border border-slate-800">
            <div className="flex items-center gap-2 text-slate-300 font-semibold mb-1">
              <Icon name="cpu" size="xs" className="text-sky-400 shrink-0" />
              <span>Observation Target</span>
            </div>
            <p className="text-slate-300 text-[11px] leading-relaxed">
              {observation.observation || observation.summary}
            </p>
            <div className="flex items-center gap-2 mt-2 text-[10px] font-mono text-slate-500">
              <span>Tenant: {observation.tenantId}</span>
              <span>•</span>
              <span>Provider: {observation.modelProvider || 'ainubis-rule-engine'}</span>
            </div>
          </div>

          {/* Level 2: Deterministic Reason / Operational Logic */}
          <div className="bg-slate-900/40 p-2.5 rounded border border-slate-800/80">
            <div className="flex items-center gap-2 text-slate-300 font-semibold mb-1">
              <Icon name="sliders" size="xs" className="text-amber-400 shrink-0" />
              <span>Operational Reason & Policy</span>
            </div>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              {observation.suggestedAction?.description ||
                `Evaluated against ${observation.capability} governance policies. Identified operational conditions requiring attention.`}
            </p>
          </div>

          {/* Level 3: Evidence Nodes Tree */}
          <div className="space-y-2">
            <div className="text-[11px] font-semibold text-slate-400 flex items-center gap-1.5 uppercase tracking-wider font-mono">
              <Icon name="database" size="xs" className="text-slate-400" />
              <span>Underlying CRM Records & Telemetry</span>
            </div>

            {evidenceList.length === 0 ? (
              <div className="text-[11px] text-slate-500 italic p-2 bg-slate-950 rounded border border-slate-900">
                No external evidence records attached. Derived from direct operational schema check.
              </div>
            ) : (
              evidenceList.map((ev, idx) => {
                const isNodeOpen = expandedNodes[ev.id || String(idx)] ?? true;
                const iconName = getEntityIcon(ev.entityType);

                return (
                  <div
                    key={ev.id || idx}
                    className="bg-slate-950 border border-slate-800 rounded p-2.5 space-y-1.5 font-mono text-[11px]"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Icon name={iconName as any} size="xs" className="text-sky-400" />
                        <span className="font-semibold text-slate-200 capitalize">
                          {ev.entityType.replace('_', ' ')} Record
                        </span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400">
                          {ev.entityId}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-emerald-400">
                          Relevance: {Math.round((ev.relevance || 1) * 100)}%
                        </span>
                        <button
                          type="button"
                          onClick={() => toggleNode(ev.id || String(idx))}
                          className="text-slate-500 hover:text-slate-300 transition-colors"
                          aria-label="Toggle node detail"
                        >
                          <Icon name={isNodeOpen ? 'chevron-up' : 'chevron-down'} size="xs" />
                        </button>
                      </div>
                    </div>

                    {isNodeOpen && (
                      <div className="pl-4 border-l border-slate-800/80 pt-1.5 space-y-1 text-slate-400 text-[10px]">
                        <div className="flex items-center justify-between">
                          <span>
                            <strong className="text-slate-300">Source:</strong> {ev.source || 'CRM Internal Schema'}
                          </span>
                          <span>
                            <strong className="text-slate-300">Rule Type:</strong> {ev.evidenceType}
                          </span>
                        </div>

                        {ev.field && (
                          <div>
                            <strong className="text-slate-300">Audited Field:</strong>{' '}
                            <span className="text-sky-300">{ev.field}</span>
                          </div>
                        )}

                        <div>
                          <strong className="text-slate-300">Observed Value:</strong>{' '}
                          <span className="text-slate-200 bg-slate-900 px-1 py-0.5 rounded">
                            {maskSafeValue(ev.value)}
                          </span>
                        </div>

                        {ev.timestamp && (
                          <div className="text-slate-500">
                            Recorded: {formatDate(ev.timestamp)}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
