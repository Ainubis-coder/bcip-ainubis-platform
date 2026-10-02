/**
 * BCIP Tasks Management Page
 * Phase 2D — Prompt 002D-005: Activities & Tasks
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { TenantContext, UserAccount } from '../../../types/tenant';
import { ModuleId } from '../../../types/navigation';
import {
  CRMTask,
  TaskStatus,
  TaskPriority,
  CreateCRMTaskDto,
  UpdateCRMTaskDto,
} from '../shared/crm-types';
import { getCrmApiClient, CrmApiError } from '../shared/crm-api';
import {
  canViewTasks,
  canCreateTask,
  canEditTask,
  canCompleteTask,
  canDeleteTask,
} from '../shared/crm-permissions';
import { TasksTable } from './TasksTable';
import { TaskFilters } from './TaskFilters';
import { TaskPagination } from './TaskPagination';
import { TasksSkeleton } from './TasksSkeleton';
import { TasksEmptyState } from './TasksEmptyState';
import { TasksErrorState } from './TasksErrorState';
import { TaskDetailModal } from './TaskDetailModal';
import { TaskFormModal } from './TaskFormModal';
import { AinubisContextualPanel } from '../../ainubis/AinubisContextualPanel';
import { Button, Icon, Modal } from '@bcip/ui';

interface TasksPageProps {
  activeTenant: TenantContext;
  user: UserAccount;
  onNavigate?: (id: ModuleId) => void;
  onOpenStatusModal?: () => void;
}

export function TasksPage({
  activeTenant,
  user,
  onNavigate,
  onOpenStatusModal,
}: TasksPageProps) {
  const userRole = user.role || user.userRole;
  const hasViewPermission = canViewTasks(userRole);
  const allowCreate = canCreateTask(userRole);
  const allowDelete = canDeleteTask(userRole);
  const allowComplete = canCompleteTask(userRole);

  // Data & Query States
  const [tasks, setTasks] = useState<CRMTask[]>([]);
  const [totalTasks, setTotalTasks] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [sortBy, setSortBy] = useState('dueAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Filters State
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<TaskStatus | 'ALL'>('ALL');
  const [priorityFilter, setPriorityFilter] = useState<TaskPriority | 'ALL'>('ALL');

  // Loading & Error States
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<{ message: string; status?: number } | null>(null);

  // Modals & Interaction States
  const [selectedTaskForDetail, setSelectedTaskForDetail] = useState<CRMTask | null>(null);
  const [taskToEdit, setTaskToEdit] = useState<CRMTask | null>(null);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<CRMTask | null>(null);
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

  // Load tasks from backend REST API
  const loadTasks = useCallback(
    async (isSilent = false) => {
      if (!hasViewPermission) {
        setError({
          message: 'Your user role is not permitted to view CRM task records.',
          status: 403,
        });
        setIsLoading(false);
        return;
      }

      if (!isSilent) setIsLoading(true);
      else setIsRefreshing(true);
      setError(null);

      try {
        const result = await api.listTasks({
          page,
          pageSize,
          sortBy,
          sortOrder,
          search: debouncedSearch || undefined,
          status: statusFilter !== 'ALL' ? statusFilter : undefined,
          priority: priorityFilter !== 'ALL' ? priorityFilter : undefined,
        });

        setTasks(result.tasks);
        setTotalTasks(result.pagination.total);
        setTotalPages(result.pagination.totalPages);
      } catch (err: unknown) {
        if (err instanceof CrmApiError) {
          setError({ message: err.message, status: err.status });
        } else {
          setError({
            message: (err as Error).message || 'Failed to load tasks from CRM server.',
            status: 500,
          });
        }
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [api, page, pageSize, sortBy, sortOrder, debouncedSearch, statusFilter, priorityFilter, hasViewPermission]
  );

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

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

  // Handle Create Task
  const handleCreateTask = async (dto: CreateCRMTaskDto) => {
    await api.createTask(dto);
    await loadTasks(true);
  };

  // Handle Update Task
  const handleUpdateTask = async (id: string, dto: UpdateCRMTaskDto) => {
    const updated = await api.updateTask(id, dto);
    setTasks((prev) => prev.map((t) => (t.id === id ? updated : t)));
    if (selectedTaskForDetail?.id === id) {
      setSelectedTaskForDetail(updated);
    }
  };

  // Handle Complete Task
  const handleCompleteTask = async (task: CRMTask) => {
    if (!allowComplete) return;
    try {
      const completed = await api.completeTask(task.id);
      setTasks((prev) => prev.map((t) => (t.id === task.id ? completed : t)));
      if (selectedTaskForDetail?.id === task.id) {
        setSelectedTaskForDetail(completed);
      }
    } catch (err: unknown) {
      alert((err as Error).message || 'Failed to complete task');
    }
  };

  // Handle Soft Delete Task
  const handleConfirmDelete = async () => {
    if (!taskToDelete) return;
    setIsDeleting(true);
    try {
      await api.deleteTask(taskToDelete.id);
      setTaskToDelete(null);
      if (selectedTaskForDetail?.id === taskToDelete.id) {
        setSelectedTaskForDetail(null);
      }
      await loadTasks(true);
    } catch (err: unknown) {
      alert((err as Error).message || 'Failed to delete task');
    } finally {
      setIsDeleting(false);
    }
  };

  // Computed summary metrics
  const openCount = tasks.filter((t) => t.status === TaskStatus.OPEN).length;
  const inProgressCount = tasks.filter((t) => t.status === TaskStatus.IN_PROGRESS).length;
  const completedCount = tasks.filter((t) => t.status === TaskStatus.COMPLETED).length;
  const overdueCount = tasks.filter(
    (t) => t.dueAt && new Date(t.dueAt).getTime() < Date.now() && t.status !== TaskStatus.COMPLETED && t.status !== TaskStatus.CANCELLED
  ).length;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-slate-100">
              Tasks & Actions
            </h1>
            <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-sky-500/10 text-sky-400 border border-sky-500/20">
              Action Items
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Track follow-up commitments, proposal reviews, trustee agendas, and task execution deadlines.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => loadTasks(true)}
            disabled={isRefreshing || isLoading}
            className="flex items-center gap-1.5"
            aria-label="Refresh tasks list"
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
                setTaskToEdit(null);
                setIsFormModalOpen(true);
              }}
            >
              <Icon name="plus" size="xs" className="mr-1.5" />
              <span>New Task</span>
            </Button>
          )}
        </div>
      </div>

      {/* Main Content States */}
      {error ? (
        <TasksErrorState
          error={error.message}
          statusCode={error.status}
          onRetry={() => loadTasks()}
        />
      ) : isLoading ? (
        <TasksSkeleton />
      ) : (
        <div className="space-y-4">
          {/* Ainubis Task Contextual Intelligence */}
          <AinubisContextualPanel
            activeTenant={activeTenant}
            user={user}
            entityType="task"
          />

          {/* Summary KPI Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-slate-900/60 border border-slate-800/80 rounded-lg p-3">
              <span className="text-xs text-slate-400 font-mono">Open Tasks</span>
              <div className="text-2xl font-bold font-mono text-sky-400 mt-1">
                {openCount}
              </div>
              <span className="text-[11px] text-slate-500 mt-0.5 block">Pending action</span>
            </div>

            <div className="bg-slate-900/60 border border-slate-800/80 rounded-lg p-3">
              <span className="text-xs text-slate-400 font-mono">In Progress</span>
              <div className="text-2xl font-bold font-mono text-amber-400 mt-1">
                {inProgressCount}
              </div>
              <span className="text-[11px] text-slate-500 mt-0.5 block">Under execution</span>
            </div>

            <div className="bg-slate-900/60 border border-slate-800/80 rounded-lg p-3">
              <span className="text-xs text-slate-400 font-mono">Completed</span>
              <div className="text-2xl font-bold font-mono text-emerald-400 mt-1">
                {completedCount}
              </div>
              <span className="text-[11px] text-slate-500 mt-0.5 block">Closed action items</span>
            </div>

            <div className="bg-slate-900/60 border border-slate-800/80 rounded-lg p-3">
              <span className="text-xs text-slate-400 font-mono">Overdue</span>
              <div className={`text-2xl font-bold font-mono mt-1 ${overdueCount > 0 ? 'text-rose-400' : 'text-slate-400'}`}>
                {overdueCount}
              </div>
              <span className="text-[11px] text-slate-500 mt-0.5 block">Passed deadline</span>
            </div>
          </div>

          {/* Filter & Search Toolbar */}
          <TaskFilters
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            statusFilter={statusFilter}
            onStatusFilterChange={(s) => {
              setStatusFilter(s);
              setPage(1);
            }}
            priorityFilter={priorityFilter}
            onPriorityFilterChange={(p) => {
              setPriorityFilter(p);
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
              setStatusFilter('ALL');
              setPriorityFilter('ALL');
              setPage(1);
            }}
            totalFiltered={totalTasks}
          />

          {/* Tasks Table or Empty State */}
          {tasks.length === 0 ? (
            <TasksEmptyState
              isFiltered={debouncedSearch !== '' || statusFilter !== 'ALL' || priorityFilter !== 'ALL'}
              canCreate={allowCreate}
              onClearFilters={() => {
                setSearchQuery('');
                setStatusFilter('ALL');
                setPriorityFilter('ALL');
                setPage(1);
              }}
              onCreate={() => {
                setTaskToEdit(null);
                setIsFormModalOpen(true);
              }}
            />
          ) : (
            <div className="space-y-0 bg-slate-950 rounded-lg border border-slate-800 overflow-hidden">
              <TasksTable
                tasks={tasks}
                userRole={userRole}
                sortBy={sortBy}
                sortOrder={sortOrder}
                onSortChange={handleSortChange}
                onViewDetails={(tsk) => setSelectedTaskForDetail(tsk)}
                onEdit={(tsk) => {
                  setTaskToEdit(tsk);
                  setIsFormModalOpen(true);
                }}
                onComplete={handleCompleteTask}
                onDelete={allowDelete ? (tsk) => setTaskToDelete(tsk) : undefined}
              />

              {/* Pagination Controls */}
              <TaskPagination
                page={page}
                pageSize={pageSize}
                total={totalTasks}
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

      {/* Task Detail Modal */}
      <TaskDetailModal
        isOpen={Boolean(selectedTaskForDetail)}
        task={selectedTaskForDetail}
        userRole={userRole}
        onClose={() => setSelectedTaskForDetail(null)}
        onEdit={(tsk) => {
          setSelectedTaskForDetail(null);
          setTaskToEdit(tsk);
          setIsFormModalOpen(true);
        }}
        onComplete={handleCompleteTask}
        onDelete={(tsk) => {
          setSelectedTaskForDetail(null);
          setTaskToDelete(tsk);
        }}
        onNavigateToLead={(leadId) => {
          setSelectedTaskForDetail(null);
          onNavigate?.('leads');
        }}
        onNavigateToPipeline={(oppId) => {
          setSelectedTaskForDetail(null);
          onNavigate?.('crm');
        }}
        onNavigateToOrganisation={(orgId) => {
          setSelectedTaskForDetail(null);
          onNavigate?.('organisations');
        }}
      />

      {/* Create / Edit Form Modal */}
      <TaskFormModal
        isOpen={isFormModalOpen}
        taskToEdit={taskToEdit}
        onClose={() => {
          setIsFormModalOpen(false);
          setTaskToEdit(null);
        }}
        onSubmitCreate={handleCreateTask}
        onSubmitUpdate={handleUpdateTask}
      />

      {/* Soft Delete Confirmation Modal */}
      {taskToDelete && (
        <Modal
          isOpen={Boolean(taskToDelete)}
          onClose={() => setTaskToDelete(null)}
          title="Delete Task Record"
          description="Confirm task deactivation"
          maxWidth="sm"
          footer={
            <div className="flex items-center justify-end gap-2 w-full">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setTaskToDelete(null)}
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
              Are you sure you want to delete task{' '}
              <span className="font-semibold text-white">"{taskToDelete.title}"</span>?
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
