/**
 * BCIP Activities Management Page
 * Phase 2D — Prompt 002D-005: Activities & Tasks
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { TenantContext, UserAccount } from '../../../types/tenant';
import { ModuleId } from '../../../types/navigation';
import {
  Activity,
  ActivityType,
  CreateActivityDto,
  UpdateActivityDto,
} from '../shared/crm-types';
import { getCrmApiClient, CrmApiError } from '../shared/crm-api';
import {
  canViewActivities,
  canCreateActivity,
  canEditActivity,
  canDeleteActivity,
} from '../shared/crm-permissions';
import { ActivitiesTable } from './ActivitiesTable';
import { ActivityFilters } from './ActivityFilters';
import { ActivityPagination } from './ActivityPagination';
import { ActivitiesSkeleton } from './ActivitiesSkeleton';
import { ActivitiesEmptyState } from './ActivitiesEmptyState';
import { ActivitiesErrorState } from './ActivitiesErrorState';
import { ActivityDetailModal } from './ActivityDetailModal';
import { ActivityFormModal } from './ActivityFormModal';
import { AinubisContextualPanel } from '../../ainubis/AinubisContextualPanel';
import { Button, Icon, Modal } from '@bcip/ui';

interface ActivitiesPageProps {
  activeTenant: TenantContext;
  user: UserAccount;
  onNavigate?: (id: ModuleId) => void;
  onOpenStatusModal?: () => void;
}

export function ActivitiesPage({
  activeTenant,
  user,
  onNavigate,
  onOpenStatusModal,
}: ActivitiesPageProps) {
  const userRole = user.role || user.userRole;
  const hasViewPermission = canViewActivities(userRole);
  const allowCreate = canCreateActivity(userRole);
  const allowDelete = canDeleteActivity(userRole);

  // Data & Query States
  const [activities, setActivities] = useState<Activity[]>([]);
  const [totalActivities, setTotalActivities] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [sortBy, setSortBy] = useState('activityAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Filters State
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<ActivityType | 'ALL'>('ALL');

  // Loading & Error States
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<{ message: string; status?: number } | null>(null);

  // Modals & Interaction States
  const [selectedActivityForDetail, setSelectedActivityForDetail] = useState<Activity | null>(null);
  const [activityToEdit, setActivityToEdit] = useState<Activity | null>(null);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [activityToDelete, setActivityToDelete] = useState<Activity | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

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

  // Load activities from backend REST API
  const loadActivities = useCallback(
    async (isSilent = false) => {
      if (!hasViewPermission) {
        setError({
          message: 'Your user role is not permitted to view CRM activity logs.',
          status: 403,
        });
        setIsLoading(false);
        return;
      }

      if (!isSilent) setIsLoading(true);
      else setIsRefreshing(true);
      setError(null);

      try {
        const result = await api.listActivities({
          page,
          pageSize,
          sortBy,
          sortOrder,
          search: debouncedSearch || undefined,
          activityType: typeFilter !== 'ALL' ? typeFilter : undefined,
        });

        setActivities(result.activities);
        setTotalActivities(result.pagination.total);
        setTotalPages(result.pagination.totalPages);
      } catch (err: unknown) {
        if (err instanceof CrmApiError) {
          setError({ message: err.message, status: err.status });
        } else {
          setError({
            message: (err as Error).message || 'Failed to load activities from CRM server.',
            status: 500,
          });
        }
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [api, page, pageSize, sortBy, sortOrder, debouncedSearch, typeFilter, hasViewPermission]
  );

  useEffect(() => {
    loadActivities();
  }, [loadActivities]);

  // Handle Sort Change
  const handleSortChange = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
    setPage(1);
  };

  // Handle Create Activity
  const handleCreateActivity = async (dto: CreateActivityDto) => {
    await api.createActivity(dto);
    await loadActivities(true);
  };

  // Handle Update Activity
  const handleUpdateActivity = async (id: string, dto: UpdateActivityDto) => {
    const updated = await api.updateActivity(id, dto);
    setActivities((prev) => prev.map((a) => (a.id === id ? updated : a)));
    if (selectedActivityForDetail?.id === id) {
      setSelectedActivityForDetail(updated);
    }
  };

  // Handle Soft Delete Activity
  const handleConfirmDelete = async () => {
    if (!activityToDelete) return;
    setIsDeleting(true);
    try {
      await api.deleteActivity(activityToDelete.id);
      setActivityToDelete(null);
      if (selectedActivityForDetail?.id === activityToDelete.id) {
        setSelectedActivityForDetail(null);
      }
      await loadActivities(true);
    } catch (err: unknown) {
      alert((err as Error).message || 'Failed to delete activity');
    } finally {
      setIsDeleting(false);
    }
  };

  // Computed summary metrics
  const callsCount = activities.filter((a) => a.activityType === ActivityType.CALL).length;
  const meetingsCount = activities.filter((a) => a.activityType === ActivityType.MEETING).length;
  const notesCount = activities.filter((a) => a.activityType === ActivityType.NOTE).length;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-slate-100">
              Customer Activities
            </h1>
            <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-sky-500/10 text-sky-400 border border-sky-500/20">
              Interaction Log
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Log, track, and audit client touchpoints across CRM leads, sales opportunities, and managing agencies.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => loadActivities(true)}
            disabled={isRefreshing || isLoading}
            className="flex items-center gap-1.5"
            aria-label="Refresh activity logs"
          >
            <Icon
              name="refresh"
              size="xs"
              className={isRefreshing ? 'animate-spin' : ''}
            />
            <span className="hidden sm:inline">Refresh</span>
          </Button>

          {allowCreate && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                setActivityToEdit(null);
                setIsFormModalOpen(true);
              }}
            >
              <Icon name="plus" size="xs" className="mr-1.5" />
              <span>Log Activity</span>
            </Button>
          )}
        </div>
      </div>

      {/* Main Content States */}
      {error ? (
        <ActivitiesErrorState
          error={error.message}
          statusCode={error.status}
          onRetry={() => loadActivities()}
        />
      ) : isLoading ? (
        <ActivitiesSkeleton />
      ) : (
        <div className="space-y-4">
          {/* Ainubis Activity Contextual Intelligence */}
          <AinubisContextualPanel
            activeTenant={activeTenant}
            user={user}
            entityType="activity"
          />

          {/* Summary KPI Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-slate-900/60 border border-slate-800/80 rounded-lg p-3">
              <span className="text-xs text-slate-400 font-mono">Total Interactions</span>
              <div className="text-2xl font-bold font-mono text-slate-100 mt-1">
                {totalActivities}
              </div>
              <span className="text-[11px] text-slate-500 mt-0.5 block">Logged customer touchpoints</span>
            </div>

            <div className="bg-slate-900/60 border border-slate-800/80 rounded-lg p-3">
              <span className="text-xs text-slate-400 font-mono">Phone Calls</span>
              <div className="text-2xl font-bold font-mono text-sky-400 mt-1">
                {callsCount}
              </div>
              <span className="text-[11px] text-slate-500 mt-0.5 block">Voice conversations</span>
            </div>

            <div className="bg-slate-900/60 border border-slate-800/80 rounded-lg p-3">
              <span className="text-xs text-slate-400 font-mono">Meetings & Demos</span>
              <div className="text-2xl font-bold font-mono text-emerald-400 mt-1">
                {meetingsCount}
              </div>
              <span className="text-[11px] text-slate-500 mt-0.5 block">Executive reviews</span>
            </div>

            <div className="bg-slate-900/60 border border-slate-800/80 rounded-lg p-3">
              <span className="text-xs text-slate-400 font-mono">Internal Notes</span>
              <div className="text-2xl font-bold font-mono text-purple-400 mt-1">
                {notesCount}
              </div>
              <span className="text-[11px] text-slate-500 mt-0.5 block">Team context notes</span>
            </div>
          </div>

          {/* Filter & Search Toolbar */}
          <ActivityFilters
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            typeFilter={typeFilter}
            onTypeFilterChange={(t) => {
              setTypeFilter(t);
              setPage(1);
            }}
            sortBy={sortBy}
            sortOrder={sortOrder}
            onSortChange={(sb, so) => {
              setSortBy(sb);
              setSortOrder(so);
              setPage(1);
            }}
            onResetFilters={() => {
              setSearchQuery('');
              setTypeFilter('ALL');
              setPage(1);
            }}
            totalFiltered={totalActivities}
          />

          {/* Activities Table or Empty State */}
          {activities.length === 0 ? (
            <ActivitiesEmptyState
              isFiltered={debouncedSearch !== '' || typeFilter !== 'ALL'}
              canCreate={allowCreate}
              onClearFilters={() => {
                setSearchQuery('');
                setTypeFilter('ALL');
                setPage(1);
              }}
              onCreate={() => {
                setActivityToEdit(null);
                setIsFormModalOpen(true);
              }}
            />
          ) : (
            <div className="space-y-0 bg-slate-950 rounded-lg border border-slate-800 overflow-hidden">
              <ActivitiesTable
                activities={activities}
                userRole={userRole}
                sortBy={sortBy}
                sortOrder={sortOrder}
                onSortChange={handleSortChange}
                onViewDetails={(act) => setSelectedActivityForDetail(act)}
                onEdit={(act) => {
                  setActivityToEdit(act);
                  setIsFormModalOpen(true);
                }}
                onDelete={allowDelete ? (act) => setActivityToDelete(act) : undefined}
              />

              {/* Pagination Controls */}
              <ActivityPagination
                page={page}
                pageSize={pageSize}
                total={totalActivities}
                totalPages={totalPages}
                onPageChange={(p) => setPage(p)}
                onPageSizeChange={(s) => {
                  setPageSize(s);
                  setPage(1);
                }}
              />
            </div>
          )}
        </div>
      )}

      {/* Activity Detail Modal */}
      <ActivityDetailModal
        isOpen={Boolean(selectedActivityForDetail)}
        activity={selectedActivityForDetail}
        userRole={userRole}
        onClose={() => setSelectedActivityForDetail(null)}
        onEdit={(act) => {
          setSelectedActivityForDetail(null);
          setActivityToEdit(act);
          setIsFormModalOpen(true);
        }}
        onDelete={(act) => {
          setSelectedActivityForDetail(null);
          setActivityToDelete(act);
        }}
        onNavigateToLead={(leadId) => {
          setSelectedActivityForDetail(null);
          onNavigate?.('leads');
        }}
        onNavigateToPipeline={(oppId) => {
          setSelectedActivityForDetail(null);
          onNavigate?.('crm');
        }}
        onNavigateToOrganisation={(orgId) => {
          setSelectedActivityForDetail(null);
          onNavigate?.('organisations');
        }}
      />

      {/* Create / Edit Form Modal */}
      <ActivityFormModal
        isOpen={isFormModalOpen}
        activityToEdit={activityToEdit}
        onClose={() => {
          setIsFormModalOpen(false);
          setActivityToEdit(null);
        }}
        onSubmitCreate={handleCreateActivity}
        onSubmitUpdate={handleUpdateActivity}
      />

      {/* Soft Delete Confirmation Modal */}
      {activityToDelete && (
        <Modal
          isOpen={Boolean(activityToDelete)}
          onClose={() => setActivityToDelete(null)}
          title="Delete Activity Record"
          description="Confirm activity deactivation"
          maxWidth="sm"
          footer={
            <div className="flex items-center justify-end gap-2 w-full">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setActivityToDelete(null)}
                disabled={isDeleting}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="bg-rose-600 hover:bg-rose-700 text-white"
              >
                {isDeleting ? 'Deleting...' : 'Confirm Deletion'}
              </Button>
            </div>
          }
        >
          <div className="text-xs text-slate-300 space-y-2">
            <p>
              Are you sure you want to delete activity{' '}
              <span className="font-semibold text-white">"{activityToDelete.subject}"</span>?
            </p>
            <p className="text-slate-400">
              The record will be soft-deleted and preserved for compliance audit purposes.
            </p>
          </div>
        </Modal>
      )}
    </div>
  );
}
