/**
 * BCIP Organisations Management Page
 * Phase 2D — Prompt 002D-004: Organisations & Scheme Prospects
 * Primary production view for managing agent portfolios and scheme client accounts.
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { TenantContext, UserAccount } from '../../../types/tenant';
import { ModuleId } from '../../../types/navigation';
import {
  Organisation,
  OrganisationType,
  OrganisationStatus,
  CreateOrganisationDto,
  UpdateOrganisationDto,
} from '../shared/crm-types';
import { getCrmApiClient, CrmApiError } from '../shared/crm-api';
import {
  canViewOrganisations,
  canCreateOrganisation,
  canEditOrganisation,
  canDeleteOrganisation,
} from '../shared/crm-permissions';
import { OrganisationsTable } from './OrganisationsTable';
import { OrganisationFilters } from './OrganisationFilters';
import { OrganisationPagination } from './OrganisationPagination';
import { OrganisationsSkeleton } from './OrganisationsSkeleton';
import { OrganisationsEmptyState } from './OrganisationsEmptyState';
import { OrganisationsErrorState } from './OrganisationsErrorState';
import { OrganisationDetailModal } from './OrganisationDetailModal';
import { OrganisationFormModal } from './OrganisationFormModal';
import { Button, Icon, Modal } from '@bcip/ui';

interface OrganisationsPageProps {
  activeTenant: TenantContext;
  user: UserAccount;
  onNavigate?: (id: ModuleId) => void;
  onOpenStatusModal?: () => void;
}

export function OrganisationsPage({
  activeTenant,
  user,
  onNavigate,
  onOpenStatusModal,
}: OrganisationsPageProps) {
  const userRole = user.role || user.userRole;
  const hasViewPermission = canViewOrganisations(userRole);
  const allowCreate = canCreateOrganisation(userRole);
  const allowDelete = canDeleteOrganisation(userRole);

  // Data & Query States
  const [organisations, setOrganisations] = useState<Organisation[]>([]);
  const [totalOrganisations, setTotalOrganisations] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Filters State
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<OrganisationType | 'ALL'>('ALL');
  const [statusFilter, setStatusFilter] = useState<OrganisationStatus | 'ALL'>('ALL');

  // Loading & Error States
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<{ message: string; status?: number } | null>(null);

  // Modals & Interaction States
  const [selectedOrgForDetail, setSelectedOrgForDetail] = useState<Organisation | null>(null);
  const [orgToEdit, setOrgToEdit] = useState<Organisation | null>(null);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [orgToDelete, setOrgToDelete] = useState<Organisation | null>(null);
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

  // Load organisations from backend REST API
  const loadOrganisations = useCallback(
    async (isSilent = false) => {
      if (!hasViewPermission) {
        setError({
          message: 'Your user role is not permitted to view CRM organisations.',
          status: 403,
        });
        setIsLoading(false);
        return;
      }

      if (!isSilent) setIsLoading(true);
      else setIsRefreshing(true);
      setError(null);

      try {
        const result = await api.listOrganisations({
          page,
          pageSize,
          sortBy,
          sortOrder,
          search: debouncedSearch || undefined,
          status: statusFilter !== 'ALL' ? statusFilter : undefined,
          organisationType: typeFilter !== 'ALL' ? typeFilter : undefined,
        });

        setOrganisations(result.organisations);
        setTotalOrganisations(result.pagination.total);
        setTotalPages(result.pagination.totalPages);
      } catch (err: unknown) {
        if (err instanceof CrmApiError) {
          setError({ message: err.message, status: err.status });
        } else {
          setError({
            message: (err as Error).message || 'Failed to load organisations from CRM server.',
            status: 500,
          });
        }
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [api, page, pageSize, sortBy, sortOrder, debouncedSearch, statusFilter, typeFilter, hasViewPermission]
  );

  useEffect(() => {
    loadOrganisations();
  }, [loadOrganisations]);

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

  // Handle Create Organisation
  const handleCreateOrganisation = async (dto: CreateOrganisationDto) => {
    await api.createOrganisation(dto);
    await loadOrganisations(true);
  };

  // Handle Update Organisation
  const handleUpdateOrganisation = async (id: string, dto: UpdateOrganisationDto) => {
    const updated = await api.updateOrganisation(id, dto);
    setOrganisations((prev) => prev.map((o) => (o.id === id ? updated : o)));
    if (selectedOrgForDetail?.id === id) {
      setSelectedOrgForDetail(updated);
    }
  };

  // Handle Soft Delete
  const handleConfirmDelete = async () => {
    if (!orgToDelete) return;
    setIsDeleting(true);
    try {
      await api.deleteOrganisation(orgToDelete.id);
      setOrgToDelete(null);
      if (selectedOrgForDetail?.id === orgToDelete.id) {
        setSelectedOrgForDetail(null);
      }
      await loadOrganisations(true);
    } catch (err: unknown) {
      alert((err as Error).message || 'Failed to delete organisation');
    } finally {
      setIsDeleting(false);
    }
  };

  // Computed summary metrics
  const managingAgentsCount = organisations.filter(
    (o) => o.organisationType === OrganisationType.MANAGING_AGENT
  ).length;
  const bodyCorporateCount = organisations.filter(
    (o) => o.organisationType === OrganisationType.BODY_CORPORATE
  ).length;
  const activeClientsCount = organisations.filter(
    (o) => o.status === OrganisationStatus.ACTIVE_CLIENT
  ).length;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-slate-100">
              Organisations
            </h1>
            <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-sky-500/10 text-sky-400 border border-sky-500/20">
              Commercial Accounts
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Manage CRM organisations, managing agent portfolios, and associated sectional scheme accounts.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => loadOrganisations(true)}
            disabled={isRefreshing || isLoading}
            className="flex items-center gap-1.5"
            aria-label="Refresh organisations list"
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
                setOrgToEdit(null);
                setIsFormModalOpen(true);
              }}
            >
              <Icon name="plus" size="xs" className="mr-1.5" />
              <span>New Organisation</span>
            </Button>
          )}
        </div>
      </div>

      {/* Main Content States */}
      {error ? (
        <OrganisationsErrorState
          error={error.message}
          statusCode={error.status}
          onRetry={() => loadOrganisations()}
        />
      ) : isLoading ? (
        <OrganisationsSkeleton />
      ) : (
        <div className="space-y-4">
          {/* Summary KPI Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-slate-900/60 border border-slate-800/80 rounded-lg p-3">
              <span className="text-xs text-slate-400 font-mono">Total Organisations</span>
              <div className="text-2xl font-bold font-mono text-slate-100 mt-1">
                {totalOrganisations}
              </div>
              <span className="text-[11px] text-slate-500 mt-0.5 block">Portfolio register</span>
            </div>

            <div className="bg-slate-900/60 border border-slate-800/80 rounded-lg p-3">
              <span className="text-xs text-slate-400 font-mono">Managing Agents</span>
              <div className="text-2xl font-bold font-mono text-sky-400 mt-1">
                {managingAgentsCount}
              </div>
              <span className="text-[11px] text-slate-500 mt-0.5 block">Portfolio management</span>
            </div>

            <div className="bg-slate-900/60 border border-slate-800/80 rounded-lg p-3">
              <span className="text-xs text-slate-400 font-mono">Body Corporates</span>
              <div className="text-2xl font-bold font-mono text-emerald-400 mt-1">
                {bodyCorporateCount}
              </div>
              <span className="text-[11px] text-slate-500 mt-0.5 block">Sectional schemes</span>
            </div>

            <div className="bg-slate-900/60 border border-slate-800/80 rounded-lg p-3">
              <span className="text-xs text-slate-400 font-mono">Active Clients</span>
              <div className="text-2xl font-bold font-mono text-purple-400 mt-1">
                {activeClientsCount}
              </div>
              <span className="text-[11px] text-slate-500 mt-0.5 block">Onboarded accounts</span>
            </div>
          </div>

          {/* Filter & Search Toolbar */}
          <OrganisationFilters
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
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
              setStatusFilter('ALL');
              setPage(1);
            }}
            totalFiltered={totalOrganisations}
          />

          {/* Organisations Table or Empty State */}
          {organisations.length === 0 ? (
            <OrganisationsEmptyState
              isFiltered={debouncedSearch !== '' || typeFilter !== 'ALL' || statusFilter !== 'ALL'}
              canCreate={allowCreate}
              onClearFilters={() => {
                setSearchQuery('');
                setTypeFilter('ALL');
                setStatusFilter('ALL');
                setPage(1);
              }}
              onCreate={() => {
                setOrgToEdit(null);
                setIsFormModalOpen(true);
              }}
            />
          ) : (
            <div className="space-y-0 bg-slate-950 rounded-lg border border-slate-800 overflow-hidden">
              <OrganisationsTable
                organisations={organisations}
                userRole={userRole}
                sortBy={sortBy}
                sortOrder={sortOrder}
                onSortChange={handleSortChange}
                onViewDetails={(org) => setSelectedOrgForDetail(org)}
                onEdit={(org) => {
                  setOrgToEdit(org);
                  setIsFormModalOpen(true);
                }}
                onDelete={allowDelete ? (org) => setOrgToDelete(org) : undefined}
              />

              {/* Pagination Controls */}
              <OrganisationPagination
                page={page}
                pageSize={pageSize}
                total={totalOrganisations}
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

      {/* Organisation Detail Modal */}
      <OrganisationDetailModal
        isOpen={Boolean(selectedOrgForDetail)}
        organisation={selectedOrgForDetail}
        userRole={userRole}
        api={api}
        onClose={() => setSelectedOrgForDetail(null)}
        onEdit={(org) => {
          setSelectedOrgForDetail(null);
          setOrgToEdit(org);
          setIsFormModalOpen(true);
        }}
        onDelete={(org) => {
          setSelectedOrgForDetail(null);
          setOrgToDelete(org);
        }}
        onNavigateToSchemeProspect={(schemeId) => {
          setSelectedOrgForDetail(null);
          onNavigate?.('scheme_prospects');
        }}
        onNavigateToPipeline={(oppId) => {
          setSelectedOrgForDetail(null);
          onNavigate?.('crm');
        }}
      />

      {/* Create / Edit Form Modal */}
      <OrganisationFormModal
        isOpen={isFormModalOpen}
        organisationToEdit={orgToEdit}
        onClose={() => {
          setIsFormModalOpen(false);
          setOrgToEdit(null);
        }}
        onSubmitCreate={handleCreateOrganisation}
        onSubmitUpdate={handleUpdateOrganisation}
      />

      {/* Soft Delete Confirmation Modal */}
      {orgToDelete && (
        <Modal
          isOpen={Boolean(orgToDelete)}
          onClose={() => setOrgToDelete(null)}
          title="Delete Organisation"
          description="Confirm record deactivation"
          maxWidth="sm"
          footer={
            <div className="flex items-center justify-end gap-2 w-full">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setOrgToDelete(null)}
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
              Are you sure you want to delete organisation{' '}
              <span className="font-semibold text-white">"{orgToDelete.name}"</span>?
            </p>
            <p className="text-slate-400">
              The record will be soft-deleted and hidden from operational queries, while preserved for audit compliance.
            </p>
          </div>
        </Modal>
      )}
    </div>
  );
}
