/**
 * BCIP Ainubis Contextual Intelligence Panel
 * Phase 2E — Prompt 002E-002: Ainubis CRM Intelligence Dashboard & Contextual Intelligence
 * Contextual panel mounted inside CRM modules (Pipeline, Leads, Organisations, Schemes, Tasks, Activities).
 */

import React, { useState, useEffect, useCallback } from 'react';
import type { TenantContext, UserAccount } from '../../types/tenant';
import type { AIObservationRecord, ContextualIntelligenceResponse } from '../crm/shared/crm-types';
import { HealthStatus } from '../crm/shared/crm-types';
import { getCrmApiClient } from '../crm/shared/crm-api';
import {
  canReviewAI,
  canApproveAI,
  canDismissAI,
} from '../crm/shared/crm-permissions';
import { IntelligenceObservationCard } from './IntelligenceObservationCard';
import { AinubisDetailModal } from './AinubisDetailModal';
import { Icon, Button } from '@bcip/ui';

export interface AinubisContextualPanelProps {
  activeTenant: TenantContext;
  user: UserAccount;
  entityType: 'opportunity' | 'lead' | 'organisation' | 'scheme_prospect' | 'activity' | 'task';
  entityId?: string;
  title?: string;
  className?: string;
  defaultCollapsed?: boolean;
}

export function AinubisContextualPanel({
  activeTenant,
  user,
  entityType,
  entityId,
  title,
  className = '',
  defaultCollapsed = false,
}: AinubisContextualPanelProps) {
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);
  const [observations, setObservations] = useState<AIObservationRecord[]>([]);
  const [healthStatus, setHealthStatus] = useState<HealthStatus>(HealthStatus.HEALTHY);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedObservation, setSelectedObservation] = useState<AIObservationRecord | null>(null);

  const client = getCrmApiClient(activeTenant.id, user);

  const defaultTitles: Record<string, string> = {
    opportunity: 'Ainubis Pipeline Intelligence',
    lead: 'Ainubis Lead Intelligence',
    organisation: 'Ainubis Organisation Intelligence',
    scheme_prospect: 'Ainubis Scheme Intelligence',
    activity: 'Ainubis Activity Intelligence',
    task: 'Ainubis Task Intelligence',
  };

  const panelTitle = title || defaultTitles[entityType] || 'Ainubis Contextual Intelligence';

  const loadContext = useCallback(async () => {
    setIsLoading(true);
    try {
      if (entityId) {
        // Fetch specific entity contextual intelligence
        const res: ContextualIntelligenceResponse = await client.getAiContext(entityType, entityId);
        setObservations(res.observations || []);
        setHealthStatus(res.status || HealthStatus.HEALTHY);
      } else {
        // Fetch module-level active observations
        const res = await client.listAIObservations({
          targetEntityType: entityType,
          pageSize: 10,
          sortBy: 'createdAt',
          sortOrder: 'desc',
        });
        const list = res.observations || [];
        setObservations(list);

        const hasAlert = list.some((o) => o.intelligenceType === 'ALERT');
        const hasRec = list.some((o) => o.intelligenceType === 'RECOMMENDATION');
        setHealthStatus(
          hasAlert
            ? HealthStatus.ATTENTION_REQUIRED
            : hasRec
            ? HealthStatus.WARNING
            : HealthStatus.HEALTHY
        );
      }
    } catch {
      // Graceful fallback: Keep UI resilient
      setObservations([]);
    } finally {
      setIsLoading(false);
    }
  }, [client, entityType, entityId]);

  useEffect(() => {
    loadContext();
  }, [loadContext]);

  const handleReview = async (obs: AIObservationRecord) => {
    try {
      await client.reviewAIObservation(obs.id);
      loadContext();
    } catch {
      // Fail safely
    }
  };

  const handleApprove = async (obs: AIObservationRecord) => {
    try {
      await client.approveAIObservation(obs.id);
      loadContext();
    } catch {
      // Fail safely
    }
  };

  const handleReject = async (obs: AIObservationRecord) => {
    try {
      await client.rejectAIObservation(obs.id, 'Rejected via contextual panel');
      loadContext();
    } catch {
      // Fail safely
    }
  };

  const handleDismiss = async (obs: AIObservationRecord) => {
    try {
      await client.dismissAIObservation(obs.id);
      loadContext();
    } catch {
      // Fail safely
    }
  };

  const activeObservations = observations.filter((o) => o.status !== 'DISMISSED');

  if (activeObservations.length === 0 && !isLoading) {
    return (
      <div
        className={`bg-slate-900/30 border border-slate-800/80 rounded-lg px-3.5 py-2.5 flex items-center justify-between text-xs text-slate-400 ${className}`}
      >
        <div className="flex items-center gap-2">
          <Icon name="cpu" size="xs" className="text-sky-400" />
          <span className="font-semibold text-slate-300 font-mono text-[11px]">{panelTitle}</span>
          <span className="text-[10px] font-mono px-2 py-0.2 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            Healthy • No Active Alerts
          </span>
        </div>

        <button
          type="button"
          onClick={loadContext}
          className="text-[10px] font-mono text-slate-500 hover:text-slate-300 flex items-center gap-1"
        >
          <Icon name="refresh" size="xs" />
          <span>Refresh</span>
        </button>
      </div>
    );
  }

  return (
    <div
      className={`bg-slate-900/40 border border-slate-800 rounded-lg p-3 space-y-2.5 ${className}`}
    >
      {/* Panel Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon name="cpu" size="xs" className="text-sky-400" />
          <h3 className="text-xs font-bold text-slate-200 font-mono uppercase tracking-wider">
            {panelTitle}
          </h3>

          <span
            className={`text-[10px] font-mono px-2 py-0.2 rounded border ${
              healthStatus === HealthStatus.HEALTHY
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                : healthStatus === HealthStatus.WARNING
                ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
            }`}
          >
            {activeObservations.length} active {activeObservations.length === 1 ? 'finding' : 'findings'}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={loadContext}
            disabled={isLoading}
            className="text-slate-400 hover:text-slate-200 text-xs p-1"
            title="Refresh contextual intelligence"
          >
            <Icon name="refresh" size="xs" className={isLoading ? 'animate-spin' : ''} />
          </button>

          <button
            type="button"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="text-slate-400 hover:text-slate-200 text-xs p-1"
            title={isCollapsed ? 'Expand panel' : 'Collapse panel'}
          >
            <Icon name={isCollapsed ? 'chevron-down' : 'chevron-up'} size="xs" />
          </button>
        </div>
      </div>

      {/* Observation Cards Carousel / Grid */}
      {!isCollapsed && (
        <div className="space-y-2 pt-1">
          {isLoading ? (
            <div className="text-xs text-slate-500 p-2 font-mono">
              Loading Ainubis intelligence observations...
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
              {activeObservations.map((obs) => (
                <IntelligenceObservationCard
                  key={obs.id}
                  observation={obs}
                  mode="compact"
                  onViewDetail={(o) => setSelectedObservation(o)}
                  onReview={handleReview}
                  onApprove={handleApprove}
                  onReject={handleReject}
                  onDismiss={handleDismiss}
                  allowReview={canReviewAI(user.role)}
                  allowApprove={canApproveAI(user.role)}
                  allowDismiss={canDismissAI(user.role)}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Detail Modal */}
      {selectedObservation && (
        <AinubisDetailModal
          observation={selectedObservation}
          isOpen={Boolean(selectedObservation)}
          onClose={() => setSelectedObservation(null)}
          onReview={handleReview}
          onApprove={handleApprove}
          onReject={handleReject}
          onDismiss={handleDismiss}
          allowReview={canReviewAI(user.role)}
          allowApprove={canApproveAI(user.role)}
          allowDismiss={canDismissAI(user.role)}
        />
      )}
    </div>
  );
}
