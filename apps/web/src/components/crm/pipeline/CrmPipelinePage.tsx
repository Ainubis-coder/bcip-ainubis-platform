/**
 * BCIP CRM Sales Pipeline Page
 * Phase 2D — Prompt 002D-001: CRM Frontend Foundation & Pipeline Kanban
 * Production CRM Pipeline view connected to the Phase 2C REST API.
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { TenantContext, UserAccount } from '../../../types/tenant';
import { ModuleId } from '../../../types/navigation';
import {
  Opportunity,
  OpportunityStage,
  PipelineSummary as PipelineSummaryType,
  CreateOpportunityDto,
} from '../shared/crm-types';
import { getCrmApiClient, CrmApiError } from '../shared/crm-api';
import {
  canViewPipeline,
  canCreateOpportunity,
  canDeleteOpportunity,
} from '../shared/crm-permissions';
import { PipelineSummary } from './PipelineSummary';
import { PipelineFilters } from './PipelineFilters';
import { PipelineBoard } from './PipelineBoard';
import { PipelineSkeleton } from './PipelineSkeleton';
import { PipelineEmptyState } from './PipelineEmptyState';
import { PipelineErrorState } from './PipelineErrorState';
import { OpportunityStageTransitionDialog } from './OpportunityStageTransitionDialog';
import { CreateOpportunityDialog } from './CreateOpportunityDialog';
import { OpportunityDetailModal } from './OpportunityDetailModal';
import { AinubisContextualPanel } from '../../ainubis/AinubisContextualPanel';
import { Button, Icon, Modal } from '@bcip/ui';

interface CrmPipelinePageProps {
  activeTenant: TenantContext;
  user: UserAccount;
  onNavigate?: (module: ModuleId) => void;
  onOpenStatusModal?: () => void;
}

export function CrmPipelinePage({
  activeTenant,
  user,
  onNavigate,
  onOpenStatusModal,
}: CrmPipelinePageProps) {
  const userRole = user.userRole || user.role;
  const hasViewPermission = canViewPipeline(userRole);
  const allowCreate = canCreateOpportunity(userRole);

  // Core Data State
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [summary, setSummary] = useState<PipelineSummaryType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<{ message: string; status?: number } | null>(null);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [stageFilter, setStageFilter] = useState<OpportunityStage | 'ALL'>('ALL');

  // Modal / Interaction State
  const [activeMoveOpportunity, setActiveMoveOpportunity] = useState<Opportunity | null>(null);
  const [activeDetailOpportunity, setActiveDetailOpportunity] = useState<Opportunity | null>(null);
  const [deleteConfirmOpp, setDeleteConfirmOpp] = useState<Opportunity | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [quickAddStage, setQuickAddStage] = useState<OpportunityStage>(OpportunityStage.DISCOVERY);

  // Api Client instance
  const api = useMemo(
    () => getCrmApiClient(activeTenant.id, user),
    [activeTenant.id, user.id, user.role, user.userRole]
  );

  // Fetch opportunities and pipeline summary
  const loadPipelineData = useCallback(async (isSilent = false) => {
    if (!hasViewPermission) {
      setError({
        message: 'Your user role is not permitted to view CRM opportunities.',
        status: 403,
      });
      setIsLoading(false);
      return;
    }

    if (!isSilent) setIsLoading(true);
    else setIsRefreshing(true);
    setError(null);

    try {
      const [listResult, summaryResult] = await Promise.all([
        api.listOpportunities({ pageSize: 100 }),
        api.getPipelineSummary().catch(() => null),
      ]);

      setOpportunities(listResult.opportunities || []);
      setSummary(summaryResult);
    } catch (err: unknown) {
      if (err instanceof CrmApiError) {
        setError({ message: err.message, status: err.status });
      } else {
        setError({
          message: err instanceof Error ? err.message : 'Failed to query CRM opportunities',
        });
      }
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [api, hasViewPermission]);

  // Load data on tenant change or mount
  useEffect(() => {
    loadPipelineData();
  }, [loadPipelineData]);

  // Stage Transition Handler
  const handleConfirmStageTransition = async (
    opportunityId: string,
    newStage: OpportunityStage,
    reason?: string
  ) => {
    await api.transitionOpportunityStage(opportunityId, newStage, reason);
    // Refresh pipeline data to show updated board
    await loadPipelineData(true);
  };

  // Create Opportunity Handler
  const handleCreateOpportunity = async (dto: CreateOpportunityDto) => {
    await api.createOpportunity(dto);
    await loadPipelineData(true);
  };

  // Delete Opportunity Handler
  const handleDeleteOpportunity = (opp: Opportunity) => {
    if (!canDeleteOpportunity(userRole)) return;
    setDeleteConfirmOpp(opp);
  };

  const handleConfirmDelete = async () => {
    if (!deleteConfirmOpp) return;
    setIsDeleting(true);
    try {
      await api.deleteOpportunity(deleteConfirmOpp.id);
      setDeleteConfirmOpp(null);
      await loadPipelineData(true);
    } catch (err: unknown) {
      setError({
        message: (err as Error).message || 'Failed to delete opportunity',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  // History Fetcher for Detail Modal
  const fetchOpportunityHistory = useCallback(
    async (id: string) => {
      return api.getOpportunityHistory(id);
    },
    [api]
  );

  // Filtered Opportunities List
  const filteredOpportunities = useMemo(() => {
    return opportunities.filter((opp) => {
      // Stage filter
      if (stageFilter !== 'ALL' && opp.stage !== stageFilter) {
        return false;
      }
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const nameMatch = opp.name.toLowerCase().includes(q);
        const descMatch = opp.description?.toLowerCase().includes(q) || false;
        const sourceMatch = opp.source?.toLowerCase().includes(q) || false;
        if (!nameMatch && !descMatch && !sourceMatch) {
          return false;
        }
      }
      return true;
    });
  }, [opportunities, stageFilter, searchQuery]);

  const isFiltered = searchQuery.trim().length > 0 || stageFilter !== 'ALL';

  return (
    <div className="space-y-6">
      {/* Page Header (Phase 2A Design Language) */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-slate-100">
              CRM Pipeline
            </h1>
            <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-sky-950/60 text-sky-400 border border-sky-800/80">
              Phase 2D
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Manage opportunities, monitor deal velocity, and progress client relationships.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={() => loadPipelineData(true)}
            isLoading={isRefreshing}
          >
            <Icon name="refresh" size="xs" className="mr-1.5" />
            <span>Refresh</span>
          </Button>

          {allowCreate && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                setQuickAddStage(OpportunityStage.DISCOVERY);
                setIsCreateDialogOpen(true);
              }}
            >
              <Icon name="plus" size="xs" className="mr-1.5" />
              <span>New Opportunity</span>
            </Button>
          )}
        </div>
      </div>

      {/* Main View States */}
      {error ? (
        <PipelineErrorState
          error={error.message}
          statusCode={error.status}
          onRetry={() => loadPipelineData()}
        />
      ) : isLoading ? (
        <PipelineSkeleton />
      ) : (
        <div className="space-y-5">
          {/* Ainubis Contextual Intelligence Panel */}
          <AinubisContextualPanel
            activeTenant={activeTenant}
            user={user}
            entityType="opportunity"
          />

          {/* Summary KPI Strip */}
          <PipelineSummary
            opportunities={opportunities}
            summary={summary}
          />

          {/* Filter Bar */}
          <PipelineFilters
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            selectedStageFilter={stageFilter}
            onStageFilterChange={setStageFilter}
            onClearFilters={() => {
              setSearchQuery('');
              setStageFilter('ALL');
            }}
            isFiltered={isFiltered}
          />

          {/* Board or Empty State */}
          {filteredOpportunities.length === 0 ? (
            <PipelineEmptyState
              userRole={userRole}
              isFiltered={isFiltered}
              tenantName={activeTenant.name}
              onCreateOpportunity={() => {
                setQuickAddStage(OpportunityStage.DISCOVERY);
                setIsCreateDialogOpen(true);
              }}
              onClearFilters={() => {
                setSearchQuery('');
                setStageFilter('ALL');
              }}
            />
          ) : (
            <PipelineBoard
              opportunities={filteredOpportunities}
              summary={summary}
              userRole={userRole}
              onMoveStage={(opp) => setActiveMoveOpportunity(opp)}
              onViewDetails={(opp) => setActiveDetailOpportunity(opp)}
              onDeleteOpportunity={handleDeleteOpportunity}
              onQuickAdd={(stage) => {
                setQuickAddStage(stage);
                setIsCreateDialogOpen(true);
              }}
            />
          )}
        </div>
      )}

      {/* Stage Transition Dialog */}
      <OpportunityStageTransitionDialog
        isOpen={Boolean(activeMoveOpportunity)}
        opportunity={activeMoveOpportunity}
        onClose={() => setActiveMoveOpportunity(null)}
        onConfirmTransition={handleConfirmStageTransition}
      />

      {/* Create Opportunity Dialog */}
      <CreateOpportunityDialog
        isOpen={isCreateDialogOpen}
        initialStage={quickAddStage}
        onClose={() => setIsCreateDialogOpen(false)}
        onCreateOpportunity={handleCreateOpportunity}
      />

      {/* Detail / History Modal */}
      <OpportunityDetailModal
        isOpen={Boolean(activeDetailOpportunity)}
        opportunity={activeDetailOpportunity}
        userRole={userRole}
        onClose={() => setActiveDetailOpportunity(null)}
        onMoveStage={(opp) => setActiveMoveOpportunity(opp)}
        fetchHistory={fetchOpportunityHistory}
        onNavigateToOrganisation={(id) => onNavigate?.('organisations')}
        onNavigateToLead={(id) => onNavigate?.('leads')}
        onNavigateToSchemeProspect={(id) => onNavigate?.('scheme_prospects')}
      />

      {/* Soft Delete Confirmation Modal */}
      {deleteConfirmOpp && (
        <Modal
          isOpen={Boolean(deleteConfirmOpp)}
          onClose={() => setDeleteConfirmOpp(null)}
          title="Delete Opportunity"
          description={`Are you sure you want to soft-delete "${deleteConfirmOpp.name}"?`}
          footer={
            <div className="flex items-center justify-end gap-2 w-full">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDeleteConfirmOpp(null)}
                disabled={isDeleting}
              >
                Cancel
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={handleConfirmDelete}
                isLoading={isDeleting}
              >
                Delete Opportunity
              </Button>
            </div>
          }
        >
          <p className="text-xs text-slate-300">
            This action will soft-delete the opportunity record from the active pipeline. It will be hidden from operational views while preserved in the compliance audit trail.
          </p>
        </Modal>
      )}
    </div>
  );
}
