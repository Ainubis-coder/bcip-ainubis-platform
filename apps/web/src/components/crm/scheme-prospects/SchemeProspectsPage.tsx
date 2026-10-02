/**
 * BCIP Scheme Prospects Management Page
 * Phase 2D — Prompt 002D-004: Organisations & Scheme Prospects
 * Primary view for sectional-title body corporate and HOA prospect records.
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { TenantContext, UserAccount } from '../../../types/tenant';
import { ModuleId } from '../../../types/navigation';
import {
  SchemeProspect,
  CreateSchemeProspectDto,
  UpdateSchemeProspectDto,
} from '../shared/crm-types';
import { getCrmApiClient, CrmApiError } from '../shared/crm-api';
import {
  canViewSchemeProspects,
  canCreateSchemeProspect,
  canEditSchemeProspect,
  canDeleteSchemeProspect,
} from '../shared/crm-permissions';
import { SchemeProspectsTable } from './SchemeProspectsTable';
import { SchemeProspectFilters } from './SchemeProspectFilters';
import { SchemeProspectPagination } from './SchemeProspectPagination';
import { SchemeProspectsSkeleton } from './SchemeProspectsSkeleton';
import { SchemeProspectsEmptyState } from './SchemeProspectsEmptyState';
import { SchemeProspectsErrorState } from './SchemeProspectsErrorState';
import { SchemeProspectDetailModal } from './SchemeProspectDetailModal';
import { SchemeProspectFormModal } from './SchemeProspectFormModal';
import { AinubisContextualPanel } from '../../ainubis/AinubisContextualPanel';
import { Button, Icon, Modal } from '@bcip/ui';

interface SchemeProspectsPageProps {
  activeTenant: TenantContext;
  user: UserAccount;
  onNavigate?: (id: ModuleId) => void;
  onOpenStatusModal?: () => void;
}

export function SchemeProspectsPage({
  activeTenant,
  user,
  onNavigate,
  onOpenStatusModal,
}: SchemeProspectsPageProps) {
  const userRole = user.role || user.userRole;
  const hasViewPermission = canViewSchemeProspects(userRole);
  const allowCreate = canCreateSchemeProspect(userRole);
  const allowDelete = canDeleteSchemeProspect(userRole);

  // Data & Query States
  const [schemeProspects, setSchemeProspects] = useState<SchemeProspect[]>([]);
  const [totalProspects, setTotalProspects] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Filters State
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Loading & Error States
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<{ message: string; status?: number } | null>(null);

  // Modals & Interaction States
  const [selectedProspectForDetail, setSelectedProspectForDetail] = useState<SchemeProspect | null>(null);
  const [prospectToEdit, setProspectToEdit] = useState<SchemeProspect | null>(null);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [prospectToDelete, setProspectToDelete] = useState<SchemeProspect | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Debounce search (300ms)
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

  // Load scheme prospects from backend REST API
  const loadProspects = useCallback(
    async (isSilent = false) => {
      if (!hasViewPermission) {
        setError({
          message: 'Your user role is not permitted to view CRM scheme prospects.',
          status: 403,
        });
        setIsLoading(false);
        return;
      }

      if (!isSilent) setIsLoading(true);
      else setIsRefreshing(true);
      setError(null);

      try {
        const result = await api.listSchemeProspects({
          page,
          pageSize,
          sortBy,
          sortOrder,
          search: debouncedSearch || undefined,
        });

        setSchemeProspects(result.schemeProspects);
        setTotalProspects(result.pagination.total);
        setTotalPages(result.pagination.totalPages);
      } catch (err: unknown) {
        if (err instanceof CrmApiError) {
          setError({ message: err.message, status: err.status });
        } else {
          setError({
            message: (err as Error).message || 'Failed to load scheme prospects from CRM server.',
            status: 500,
          });
        }
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [api, page, pageSize, sortBy, sortOrder, debouncedSearch, hasViewPermission]
  );

  useEffect(() => {
    loadProspects();
  }, [loadProspects]);

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

  // Handle Create Scheme Prospect
  const handleCreateProspect = async (dto: CreateSchemeProspectDto) => {
    await api.createSchemeProspect(dto);
    await loadProspects(true);
  };

  // Handle Update Scheme Prospect
  const handleUpdateProspect = async (id: string, dto: UpdateSchemeProspectDto) => {
    const updated = await api.updateSchemeProspect(id, dto);
    setSchemeProspects((prev) => prev.map((s) => (s.id === id ? updated : s)));
    if (selectedProspectForDetail?.id === id) {
      setSelectedProspectForDetail(updated);
    }
  };

  // Handle Soft Delete
  const handleConfirmDelete = async () => {
    if (!prospectToDelete) return;
    setIsDeleting(true);
    try {
      await api.deleteSchemeProspect(prospectToDelete.id);
      setProspectToDelete(null);
      if (selectedProspectForDetail?.id === prospectToDelete.id) {
        setSelectedProspectForDetail(null);
      }
      await loadProspects(true);
    } catch (err: unknown) {
      alert((err as Error).message || 'Failed to delete scheme prospect');
    } finally {
      setIsDeleting(false);
    }
  };

  // Summary Metrics
  const totalUnits = schemeProspects.reduce((sum, sp) => sum + (sp.estimatedUnitCount || 0), 0);
  const withAgentCount = schemeProspects.filter((sp) => Boolean(sp.managingAgentName)).length;
  const selfManagedCount = schemeProspects.length - withAgentCount;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-slate-100">
              Scheme Prospects
            </h1>
            <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-sky-500/10 text-sky-400 border border-sky-500/20">
              Sectional Properties
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Sectional title body corporates, HOA developments, and prospective schemes across managing agent portfolios.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => loadProspects(true)}
            disabled={isRefreshing || isLoading}
            className="flex items-center gap-1.5"
            aria-label="Refresh scheme prospects list"
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
                setProspectToEdit(null);
                setIsFormModalOpen(true);
              }}
            >
              <Icon name="plus" size="xs" className="mr-1.5" />
              <span>New Scheme Prospect</span>
            </Button>
          )}
        </div>
      </div>

      {/* Main Content States */}
      {error ? (
        <SchemeProspectsErrorState
          error={error.message}
          statusCode={error.status}
          onRetry={() => loadProspects()}
        />
      ) : isLoading ? (
        <SchemeProspectsSkeleton />
      ) : (
        <div className="space-y-4">
          {/* Ainubis Scheme Prospect Contextual Intelligence */}
          <AinubisContextualPanel
            activeTenant={activeTenant}
            user={user}
            entityType="scheme_prospect"
          />

          {/* Summary KPI Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-slate-900/60 border border-slate-800/80 rounded-lg p-3">
              <span className="text-xs text-slate-400 font-mono">Total Schemes</span>
              <div className="text-2xl font-bold font-mono text-slate-100 mt-1">
                {totalProspects}
              </div>
              <span className="text-[11px] text-slate-500 mt-0.5 block">Prospect schemes</span>
            </div>

            <div className="bg-slate-900/60 border border-slate-800/80 rounded-lg p-3">
              <span className="text-xs text-slate-400 font-mono">Estimated Units</span>
              <div className="text-2xl font-bold font-mono text-sky-400 mt-1">
                {totalUnits}
              </div>
              <span className="text-[11px] text-slate-500 mt-0.5 block">Total door count</span>
            </div>

            <div className="bg-slate-900/60 border border-slate-800/80 rounded-lg p-3">
              <span className="text-xs text-slate-400 font-mono">With Managing Agent</span>
              <div className="text-2xl font-bold font-mono text-emerald-400 mt-1">
                {withAgentCount}
              </div>
              <span className="text-[11px] text-slate-500 mt-0.5 block">Agency portfolios</span>
            </div>

            <div className="bg-slate-900/60 border border-slate-800/80 rounded-lg p-3">
              <span className="text-xs text-slate-400 font-mono">Self-Managed</span>
              <div className="text-2xl font-bold font-mono text-purple-400 mt-1">
                {selfManagedCount}
              </div>
              <span className="text-[11px] text-slate-500 mt-0.5 block">Direct schemes</span>
            </div>
          </div>

          {/* Filter & Search Toolbar */}
          <SchemeProspectFilters
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            sortBy={sortBy}
            sortOrder={sortOrder}
            onSortChange={(sb, so) => {
              setSortBy(sb);
              setSortOrder(so);
              setPage(1);
            }}
            onResetFilters={() => {
              setSearchQuery('');
              setPage(1);
            }}
            totalFiltered={totalProspects}
          />

          {/* Schemes Table or Empty State */}
          {schemeProspects.length === 0 ? (
            <SchemeProspectsEmptyState
              isFiltered={debouncedSearch !== ''}
              canCreate={allowCreate}
              onClearFilters={() => {
                setSearchQuery('');
                setPage(1);
              }}
              onCreate={() => {
                setProspectToEdit(null);
                setIsFormModalOpen(true);
              }}
            />
          ) : (
            <div className="space-y-0 bg-slate-950 rounded-lg border border-slate-800 overflow-hidden">
              <SchemeProspectsTable
                schemeProspects={schemeProspects}
                userRole={userRole}
                sortBy={sortBy}
                sortOrder={sortOrder}
                onSortChange={handleSortChange}
                onViewDetails={(sp) => setSelectedProspectForDetail(sp)}
                onEdit={(sp) => {
                  setProspectToEdit(sp);
                  setIsFormModalOpen(true);
                }}
                onDelete={allowDelete ? (sp) => setProspectToDelete(sp) : undefined}
              />

              {/* Pagination Controls */}
              <SchemeProspectPagination
                page={page}
                pageSize={pageSize}
                total={totalProspects}
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

      {/* Detail Modal */}
      <SchemeProspectDetailModal
        isOpen={Boolean(selectedProspectForDetail)}
        schemeProspect={selectedProspectForDetail}
        userRole={userRole}
        api={api}
        onClose={() => setSelectedProspectForDetail(null)}
        onEdit={(sp) => {
          setSelectedProspectForDetail(null);
          setProspectToEdit(sp);
          setIsFormModalOpen(true);
        }}
        onDelete={(sp) => {
          setSelectedProspectForDetail(null);
          setProspectToDelete(sp);
        }}
        onNavigateToOrganisation={(orgId) => {
          setSelectedProspectForDetail(null);
          onNavigate?.('organisations');
        }}
      />

      {/* Create / Edit Form Modal */}
      <SchemeProspectFormModal
        isOpen={isFormModalOpen}
        schemeProspectToEdit={prospectToEdit}
        api={api}
        onClose={() => {
          setIsFormModalOpen(false);
          setProspectToEdit(null);
        }}
        onSubmitCreate={handleCreateProspect}
        onSubmitUpdate={handleUpdateProspect}
      />

      {/* Soft Delete Confirmation Modal */}
      {prospectToDelete && (
        <Modal
          isOpen={Boolean(prospectToDelete)}
          onClose={() => setProspectToDelete(null)}
          title="Delete Scheme Prospect"
          description="Confirm record deactivation"
          maxWidth="sm"
          footer={
            <div className="flex items-center justify-end gap-2 w-full">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setProspectToDelete(null)}
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
              Are you sure you want to delete scheme prospect{' '}
              <span className="font-semibold text-white">"{prospectToDelete.name}"</span>?
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
