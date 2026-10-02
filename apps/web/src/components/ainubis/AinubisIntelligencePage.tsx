/**
 * BCIP Ainubis Intelligence Workspace Page & CRM Health Dashboard
 * Phase 2E — Prompt 002E-002: Ainubis CRM Intelligence Dashboard & Contextual Intelligence
 * Executive summary, category health scorecards, evidence-backed observation feed, and human-in-the-loop governance.
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import type { TenantContext, UserAccount } from '../../types/tenant';
import type { ModuleId } from '../../types/navigation';
import type {
  AIObservationRecord,
  AinubisDashboardSummary,
  CRMHealthCategoryKey,
} from '../crm/shared/crm-types';
import {
  AICapability,
  IntelligenceType,
  IntelligenceStatus,
} from '../crm/shared/crm-types';
import { getCrmApiClient, CrmApiError } from '../crm/shared/crm-api';
import {
  canViewAI,
  canGenerateAI,
  canReviewAI,
  canApproveAI,
  canDismissAI,
} from '../crm/shared/crm-permissions';
import { IntelligenceObservationCard } from './IntelligenceObservationCard';
import { AinubisHealthSummary } from './AinubisHealthSummary';
import { AinubisFilters } from './AinubisFilters';
import { AinubisPagination } from './AinubisPagination';
import { AinubisSkeleton } from './AinubisSkeleton';
import { AinubisEmptyState } from './AinubisEmptyState';
import { AinubisErrorState } from './AinubisErrorState';
import { AinubisDetailModal } from './AinubisDetailModal';
import { Button, Icon, Modal } from '@bcip/ui';

interface AinubisIntelligencePageProps {
  activeTenant: TenantContext;
  user: UserAccount;
  onNavigate?: (id: ModuleId) => void;
  onOpenStatusModal?: () => void;
}

export function AinubisIntelligencePage({
  activeTenant,
  user,
  onNavigate,
  onOpenStatusModal,
}: AinubisIntelligencePageProps) {
  const userRole = user.role || user.userRole;
  const hasViewPermission = canViewAI(userRole);
  const allowGenerate = canGenerateAI(userRole);
  const allowReview = canReviewAI(userRole);
  const allowApprove = canApproveAI(userRole);
  const allowDismiss = canDismissAI(userRole);

  // Summary Metrics State
  const [summary, setSummary] = useState<AinubisDashboardSummary | null>(null);
  const [selectedHealthCategory, setSelectedHealthCategory] = useState<CRMHealthCategoryKey | 'all'>('all');

  // Observations Data & Query States
  const [observations, setObservations] = useState<AIObservationRecord[]>([]);
  const [totalObservations, setTotalObservations] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  // Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [capabilityFilter, setCapabilityFilter] = useState<AICapability | 'ALL'>('ALL');
  const [typeFilter, setTypeFilter] = useState<IntelligenceType | 'ALL'>('ALL');
  const [statusFilter, setStatusFilter] = useState<IntelligenceStatus | 'ALL'>('ALL');
  const [entityTypeFilter, setEntityTypeFilter] = useState<string | 'ALL'>('ALL');

  // Loading & Error States
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<{ message: string; status?: number } | null>(null);

  // Modals & Triggers
  const [selectedObservationForDetail, setSelectedObservationForDetail] = useState<AIObservationRecord | null>(null);
  const [isAnalysisModalOpen, setIsAnalysisModalOpen] = useState(false);
  const [analysisMode, setAnalysisMode] = useState<'portfolio' | 'opportunity'>('portfolio');
  const [targetOpportunityId, setTargetOpportunityId] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Debounce search query (300ms)
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  const api = useMemo(
    () => getCrmApiClient(activeTenant.id, user),
    [activeTenant.id, user]
  );

  // Load summary and observations from backend
  const loadData = useCallback(
    async (isSilent = false) => {
      if (!hasViewPermission) {
        setError({
          message: 'Your user role is not permitted to view Ainubis CRM intelligence records.',
          status: 403,
        });
        setIsLoading(false);
        return;
      }

      if (!isSilent) setIsLoading(true);
      else setIsRefreshing(true);
      setError(null);

      try {
        // Parallel load of summary metrics and observations list
        const [summaryResult, listResult] = await Promise.all([
          api.getAiSummary().catch(() => null),
          api.listAIObservations({
            page,
            pageSize,
            search: debouncedSearch || undefined,
            capability: capabilityFilter !== 'ALL' ? capabilityFilter : undefined,
            intelligenceType: typeFilter !== 'ALL' ? typeFilter : undefined,
            status: statusFilter !== 'ALL' ? statusFilter : undefined,
            targetEntityType: entityTypeFilter !== 'ALL' ? entityTypeFilter : undefined,
          }),
        ]);

        if (summaryResult) {
          setSummary(summaryResult);
        }

        setObservations(listResult.observations);
        setTotalObservations(listResult.pagination.total);
        setTotalPages(listResult.pagination.totalPages);
      } catch (err: unknown) {
        if (err instanceof CrmApiError) {
          setError({ message: err.message, status: err.status });
        } else {
          setError({
            message: (err as Error).message || 'Failed to load Ainubis intelligence records from server.',
            status: 500,
          });
        }
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [api, page, pageSize, debouncedSearch, capabilityFilter, typeFilter, statusFilter, entityTypeFilter, hasViewPermission]
  );

  useEffect(() => {
    loadData();
  }, [loadData]);

  // When category is clicked in Health Summary, update entityTypeFilter
  const handleSelectCategory = (cat: CRMHealthCategoryKey | 'all') => {
    setSelectedHealthCategory(cat);
    setPage(1);
    if (cat === 'all') {
      setEntityTypeFilter('ALL');
    } else if (cat === 'pipeline') {
      setEntityTypeFilter('opportunity');
    } else if (cat === 'leads') {
      setEntityTypeFilter('lead');
    } else if (cat === 'organisations') {
      setEntityTypeFilter('organisation');
    } else if (cat === 'schemeProspects') {
      setEntityTypeFilter('scheme_prospect');
    } else if (cat === 'tasksAndActivities') {
      setEntityTypeFilter('task');
    }
  };

  // Handle Review
  const handleReview = async (obs: AIObservationRecord) => {
    try {
      const updated = await api.reviewAIObservation(obs.id);
      setObservations((prev) => prev.map((item) => (item.id === obs.id ? updated : item)));
      if (selectedObservationForDetail?.id === obs.id) setSelectedObservationForDetail(updated);
      loadData(true);
    } catch (err: unknown) {
      alert((err as Error).message || 'Failed to mark observation as reviewed');
    }
  };

  // Handle Approve
  const handleApprove = async (obs: AIObservationRecord) => {
    try {
      const updated = await api.approveAIObservation(obs.id);
      setObservations((prev) => prev.map((item) => (item.id === obs.id ? updated : item)));
      if (selectedObservationForDetail?.id === obs.id) setSelectedObservationForDetail(updated);
      loadData(true);
    } catch (err: unknown) {
      alert((err as Error).message || 'Failed to approve recommendation');
    }
  };

  // Handle Reject
  const handleReject = async (obs: AIObservationRecord) => {
    const reason = prompt('Please enter rejection reason:', 'Verified by managing agent, offline review completed');
    if (reason === null) return;

    try {
      const updated = await api.rejectAIObservation(obs.id, reason);
      setObservations((prev) => prev.map((item) => (item.id === obs.id ? updated : item)));
      if (selectedObservationForDetail?.id === obs.id) setSelectedObservationForDetail(updated);
      loadData(true);
    } catch (err: unknown) {
      alert((err as Error).message || 'Failed to reject recommendation');
    }
  };

  // Handle Dismiss
  const handleDismiss = async (obs: AIObservationRecord) => {
    try {
      const updated = await api.dismissAIObservation(obs.id);
      setObservations((prev) => prev.map((item) => (item.id === obs.id ? updated : item)));
      if (selectedObservationForDetail?.id === obs.id) setSelectedObservationForDetail(updated);
      loadData(true);
    } catch (err: unknown) {
      alert((err as Error).message || 'Failed to dismiss observation');
    }
  };

  // Trigger CRM Hygiene or Health Audit
  const handleRunAnalysis = async () => {
    setIsAnalyzing(true);
    try {
      if (analysisMode === 'opportunity') {
        if (!targetOpportunityId.trim()) return;
        await api.analyzeAIObservation(AICapability.CRM_PIPELINE_HYGIENE, targetOpportunityId.trim());
      } else {
        // Portfolio-wide CRM Health Evaluation
        await api.analyzeAIObservation('CRM_HEALTH_EVALUATION');
      }
      setIsAnalysisModalOpen(false);
      setTargetOpportunityId('');
      await loadData(true);
    } catch (err: unknown) {
      alert((err as Error).message || 'CRM hygiene analysis failed');
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-slate-100 flex items-center gap-2">
              <Icon name="cpu" size="sm" className="text-sky-400" />
              <span>Ainubis CRM Intelligence</span>
            </h1>
            <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-sky-500/10 text-sky-400 border border-sky-500/20">
              Dashboard & Governance
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Deterministic CRM health audits, evidence-grounded observations, and human-in-the-loop decision governance.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => loadData(true)}
            disabled={isRefreshing || isLoading}
            className="flex items-center gap-1.5"
            aria-label="Refresh intelligence records"
          >
            <Icon
              name="refresh"
              size="xs"
              className={isRefreshing ? 'animate-spin' : ''}
            />
            <span className="hidden sm:inline">Refresh</span>
          </Button>

          {allowGenerate && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => setIsAnalysisModalOpen(true)}
              className="flex items-center gap-1.5"
            >
              <Icon name="cpu" size="xs" />
              <span>Audit CRM Health</span>
            </Button>
          )}
        </div>
      </div>

      {/* Main Content States */}
      {error ? (
        <AinubisErrorState
          error={error.message}
          statusCode={error.status}
          onRetry={() => loadData()}
        />
      ) : isLoading && !summary ? (
        <AinubisSkeleton />
      ) : (
        <div className="space-y-6">
          {/* 1. Executive Summary Metric Strip */}
          {summary && (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              <div className="bg-slate-950 border border-slate-800 rounded-lg p-3">
                <span className="text-[10px] font-mono uppercase text-slate-500 block">Total Active</span>
                <div className="text-xl font-bold font-mono text-slate-100 mt-1">{summary.totalActive}</div>
                <span className="text-[10px] text-slate-500">Monitored findings</span>
              </div>

              <div className="bg-slate-950 border border-slate-800 rounded-lg p-3">
                <span className="text-[10px] font-mono uppercase text-amber-400 block">Attention Needed</span>
                <div className="text-xl font-bold font-mono text-amber-300 mt-1">{summary.requiringAttention}</div>
                <span className="text-[10px] text-slate-500">Alerts & actions</span>
              </div>

              <div className="bg-slate-950 border border-slate-800 rounded-lg p-3">
                <span className="text-[10px] font-mono uppercase text-rose-400 block">High Priority</span>
                <div className="text-xl font-bold font-mono text-rose-300 mt-1">{summary.highPriority}</div>
                <span className="text-[10px] text-slate-500">Critical confidence</span>
              </div>

              <div className="bg-slate-950 border border-slate-800 rounded-lg p-3">
                <span className="text-[10px] font-mono uppercase text-blue-400 block">Under Review</span>
                <div className="text-xl font-bold font-mono text-blue-300 mt-1">{summary.underReview}</div>
                <span className="text-[10px] text-slate-500">Human verified</span>
              </div>

              <div className="bg-slate-950 border border-slate-800 rounded-lg p-3">
                <span className="text-[10px] font-mono uppercase text-emerald-400 block">Approved</span>
                <div className="text-xl font-bold font-mono text-emerald-300 mt-1">{summary.approved}</div>
                <span className="text-[10px] text-slate-500">Signed off by admin</span>
              </div>

              <div className="bg-slate-950 border border-slate-800 rounded-lg p-3">
                <span className="text-[10px] font-mono uppercase text-slate-400 block">Dismissed</span>
                <div className="text-xl font-bold font-mono text-slate-300 mt-1">{summary.dismissed}</div>
                <span className="text-[10px] text-slate-500">Hidden from views</span>
              </div>
            </div>
          )}

          {/* 2. CRM Health Summary Pillar Section */}
          {summary && (
            <AinubisHealthSummary
              summary={summary}
              selectedCategory={selectedHealthCategory}
              onSelectCategory={handleSelectCategory}
            />
          )}

          {/* 3. Filter & Search Toolbar */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wider font-mono flex items-center gap-2">
                <Icon name="layers" size="xs" className="text-sky-400" />
                <span>Evidence-Backed Observation Feed</span>
              </h2>

              {selectedHealthCategory !== 'all' && (
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-slate-400">Category Filter:</span>
                  <span className="px-2 py-0.5 rounded bg-sky-500/10 text-sky-300 border border-sky-500/30 font-mono text-[11px]">
                    {selectedHealthCategory}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleSelectCategory('all')}
                    className="text-slate-400 hover:text-slate-200 text-xs ml-1"
                  >
                    ×
                  </button>
                </div>
              )}
            </div>

            <AinubisFilters
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              capabilityFilter={capabilityFilter}
              onCapabilityFilterChange={(c) => {
                setCapabilityFilter(c);
                setPage(1);
              }}
              typeFilter={typeFilter}
              onTypeFilterChange={(t) => {
                setTypeFilter(t);
                setPage(1);
              }}
              statusFilter={statusFilter}
              onStatusFilterChange={(s) => {
                setStatusFilter(s);
                setPage(1);
              }}
              entityTypeFilter={entityTypeFilter}
              onEntityTypeFilterChange={(e) => {
                setEntityTypeFilter(e);
                setPage(1);
              }}
              onResetFilters={() => {
                setSearchQuery('');
                setCapabilityFilter('ALL');
                setTypeFilter('ALL');
                setStatusFilter('ALL');
                setEntityTypeFilter('ALL');
                setSelectedHealthCategory('all');
                setPage(1);
              }}
              totalFiltered={totalObservations}
            />
          </div>

          {/* 4. Observations List */}
          {observations.length === 0 ? (
            <AinubisEmptyState
              isFiltered={
                searchQuery !== '' ||
                capabilityFilter !== 'ALL' ||
                typeFilter !== 'ALL' ||
                statusFilter !== 'ALL' ||
                entityTypeFilter !== 'ALL'
              }
              canGenerate={allowGenerate}
              onClearFilters={() => {
                setSearchQuery('');
                setCapabilityFilter('ALL');
                setTypeFilter('ALL');
                setStatusFilter('ALL');
                setEntityTypeFilter('ALL');
                setSelectedHealthCategory('all');
                setPage(1);
              }}
              onRunAnalysis={() => setIsAnalysisModalOpen(true)}
              isAnalyzing={isAnalyzing}
            />
          ) : (
            <div className="space-y-3">
              {observations.map((obs) => (
                <IntelligenceObservationCard
                  key={obs.id}
                  observation={obs}
                  mode="expanded"
                  onViewDetail={(o) => setSelectedObservationForDetail(o)}
                  onReview={handleReview}
                  onApprove={handleApprove}
                  onReject={handleReject}
                  onDismiss={handleDismiss}
                  allowReview={allowReview}
                  allowApprove={allowApprove}
                  allowDismiss={allowDismiss}
                />
              ))}

              <AinubisPagination
                page={page}
                totalPages={totalPages}
                pageSize={pageSize}
                total={totalObservations}
                onPageChange={(p) => setPage(p)}
                onPageSizeChange={(sz) => {
                  setPageSize(sz);
                  setPage(1);
                }}
              />
            </div>
          )}
        </div>
      )}

      {/* Observation Detail Modal */}
      {selectedObservationForDetail && (
        <AinubisDetailModal
          isOpen={Boolean(selectedObservationForDetail)}
          observation={selectedObservationForDetail}
          onClose={() => setSelectedObservationForDetail(null)}
          onReview={handleReview}
          onApprove={handleApprove}
          onReject={handleReject}
          onDismiss={handleDismiss}
          allowReview={allowReview}
          allowApprove={allowApprove}
          allowDismiss={allowDismiss}
          onNavigateToTargetEntity={(entityType) => {
            if (onNavigate) {
              if (entityType === 'opportunity') onNavigate('crm');
              else if (entityType === 'lead') onNavigate('leads');
              else if (entityType === 'organisation') onNavigate('organisations');
              else if (entityType === 'scheme_prospect') onNavigate('scheme_prospects');
              else if (entityType === 'task') onNavigate('tasks');
              else if (entityType === 'activity') onNavigate('activities');
            }
          }}
        />
      )}

      {/* Manual CRM Hygiene / Health Analysis Modal */}
      <Modal
        isOpen={isAnalysisModalOpen}
        onClose={() => setIsAnalysisModalOpen(false)}
        title="Execute Ainubis CRM Health Audit"
        description="Run deterministic hygiene checks across active deals, leads, tasks, and scheme prospects."
        maxWidth="sm"
        footer={
          <div className="flex items-center justify-end gap-2 w-full">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setIsAnalysisModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleRunAnalysis}
              disabled={isAnalyzing || (analysisMode === 'opportunity' && !targetOpportunityId.trim())}
              className="flex items-center gap-1.5"
            >
              {isAnalyzing ? (
                <>
                  <span className="w-3 h-3 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  <span>Evaluating CRM Telemetry...</span>
                </>
              ) : (
                <>
                  <Icon name="cpu" size="xs" />
                  <span>Execute Audit</span>
                </>
              )}
            </Button>
          </div>
        }
      >
        <div className="space-y-4 text-xs">
          <div className="space-y-2">
            <label className="text-[11px] font-bold text-slate-300 block">
              Audit Scope
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setAnalysisMode('portfolio')}
                className={`p-2.5 rounded border text-left transition-colors ${
                  analysisMode === 'portfolio'
                    ? 'border-sky-500 bg-sky-950/30 text-sky-200'
                    : 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="font-semibold text-xs">Portfolio-Wide</div>
                <div className="text-[10px] text-slate-500 mt-0.5">Audit deals, leads, tasks, & schemes</div>
              </button>

              <button
                type="button"
                onClick={() => setAnalysisMode('opportunity')}
                className={`p-2.5 rounded border text-left transition-colors ${
                  analysisMode === 'opportunity'
                    ? 'border-sky-500 bg-sky-950/30 text-sky-200'
                    : 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="font-semibold text-xs">Single Deal</div>
                <div className="text-[10px] text-slate-500 mt-0.5">Targeted opportunity hygiene</div>
              </button>
            </div>
          </div>

          {analysisMode === 'opportunity' ? (
            <div>
              <label className="text-[11px] font-medium text-slate-300 block mb-1">
                Target Opportunity ID <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                value={targetOpportunityId}
                onChange={(e) => setTargetOpportunityId(e.target.value)}
                placeholder="e.g. opp_demo_highland_01"
                className="w-full text-xs px-3 py-2 rounded bg-slate-950 border border-slate-800 text-slate-100 font-mono focus:outline-none focus:ring-1 focus:ring-sky-400"
              />
            </div>
          ) : (
            <div className="bg-slate-950 p-2.5 rounded border border-slate-800/80 text-slate-400 text-[11px] leading-relaxed">
              Ainubis will evaluate stale opportunities (&gt; 14 days idle), overdue tasks, missing valuation forecasts, unverified contact numbers, and incomplete scheme records.
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
