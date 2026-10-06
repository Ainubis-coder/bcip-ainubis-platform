/**
 * BCIP Leads Management Page
 * Phase 2D — Prompt 002D-002: CRM Leads Management Table
 * Primary production view for managing agent and scheme prospect pipeline.
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { TenantContext, UserAccount } from '../../../types/tenant';
import { ModuleId } from '../../../types/navigation';
import {
  Lead,
  LeadStatus,
  QualificationStatus,
  CreateLeadDto,
  UpdateLeadDto,
} from '../shared/crm-types';
import { getCrmApiClient, CrmApiError } from '../shared/crm-api';
import {
  canViewLeads,
  canCreateLead,
  canEditLead,
  canDeleteLead,
} from '../shared/crm-permissions';
import { LeadsTable } from './LeadsTable';
import { LeadFilters } from './LeadFilters';
import { LeadPagination } from './LeadPagination';
import { LeadsSkeleton } from './LeadsSkeleton';
import { LeadsEmptyState } from './LeadsEmptyState';
import { LeadsErrorState } from './LeadsErrorState';
import { LeadDetailModal } from './LeadDetailModal';
import { LeadFormModal } from './LeadFormModal';
import { LeadStatusModal } from './LeadStatusModal';
import { LeadConversionWizard } from '../conversion';
import { AinubisContextualPanel } from '../../ainubis/AinubisContextualPanel';
import { Button, Icon, Modal } from '@bcip/ui';

interface LeadsPageProps {
  activeTenant: TenantContext;
  user: UserAccount;
  onNavigate?: (module: ModuleId) => void;
  onOpenStatusModal?: () => void;
}

export function LeadsPage({
  activeTenant,
  user,
  onNavigate,
  onOpenStatusModal,
}: LeadsPageProps) {
  const userRole = user.userRole || user.role;
  const hasViewPermission = canViewLeads(userRole);
  const allowCreate = canCreateLead(userRole);
  const allowDelete = canDeleteLead(userRole);

  // Data & Query States
  const [leads, setLeads] = useState<Lead[]>([]);
  const [totalLeads, setTotalLeads] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Filters State
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<LeadStatus | 'ALL'>('ALL');
  const [qualificationFilter, setQualificationFilter] = useState<QualificationStatus | 'ALL'>('ALL');

  // Loading & Error States
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<{ message: string; status?: number } | null>(null);

  // Modals & Interaction States
  const [selectedLeadForDetail, setSelectedLeadForDetail] = useState<Lead | null>(null);
  const [leadToEdit, setLeadToEdit] = useState<Lead | null>(null);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [leadForStatusChange, setLeadForStatusChange] = useState<Lead | null>(null);
  const [leadToConvert, setLeadToConvert] = useState<Lead | null>(null);
  const [leadToDelete, setLeadToDelete] = useState<Lead | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Debounce search query input (300ms)
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery.trim());
      setPage(1); // reset to page 1 on search change
    }, 300);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Api Client instance
  const api = useMemo(
    () => getCrmApiClient(activeTenant.id, user),
    [activeTenant.id, user.id, user.role, user.userRole]
  );

  // Fetch leads from backend API
  const loadLeads = useCallback(
    async (isSilent = false) => {
      if (!hasViewPermission) {
        setError({
          message: 'Your user role is not permitted to view CRM leads.',
          status: 403,
        });
        setIsLoading(false);
        return;
      }

      if (!isSilent) setIsLoading(true);
      else setIsRefreshing(true);
      setError(null);

      try {
        const result = await api.listLeads({
          page,
          pageSize,
          sortBy,
          sortOrder,
          search: debouncedSearch || undefined,
          status: statusFilter !== 'ALL' ? statusFilter : undefined,
          qualificationStatus: qualificationFilter !== 'ALL' ? qualificationFilter : undefined,
        });

        setLeads(result.leads || []);
        setTotalLeads(result.pagination?.total || 0);
        setTotalPages(result.pagination?.totalPages || 1);
      } catch (err: unknown) {
        if (err instanceof CrmApiError) {
          setError({ message: err.message, status: err.status });
        } else {
          setError({
            message: err instanceof Error ? err.message : 'Failed to query CRM leads',
          });
        }
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [api, hasViewPermission, page, pageSize, sortBy, sortOrder, debouncedSearch, statusFilter, qualificationFilter]
  );

  // Reload when query params or tenant changes
  useEffect(() => {
    loadLeads();
  }, [loadLeads]);

  // Handlers for Filters & Sorting
  const handleSortChange = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
    setPage(1);
  };

  const handleToggleSortOrder = () => {
    setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    setPage(1);
  };

  const handleClearFilters = () => {
    setSearchQuery('');
    setDebouncedSearch('');
    setStatusFilter('ALL');
    setQualificationFilter('ALL');
    setPage(1);
  };

  const isFiltered =
    debouncedSearch.length > 0 ||
    statusFilter !== 'ALL' ||
    qualificationFilter !== 'ALL';

  // Lead CRUD handlers
  const handleCreateLead = async (dto: CreateLeadDto) => {
    await api.createLead(dto);
    await loadLeads(true);
  };

  const handleUpdateLead = async (id: string, dto: UpdateLeadDto) => {
    await api.updateLead(id, dto);
    await loadLeads(true);
  };

  const handleStatusChange = async (leadId: string, newStatus: LeadStatus) => {
    await api.updateLead(leadId, { status: newStatus });
    await loadLeads(true);
  };

  const handleConfirmDelete = async () => {
    if (!leadToDelete) return;
    setIsDeleting(true);
    try {
      await api.deleteLead(leadToDelete.id);
      setLeadToDelete(null);
      await loadLeads(true);
    } catch (err: unknown) {
      setError({
        message: (err as Error).message || 'Failed to delete lead',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  // KPI Calculations
  const newCount = leads.filter((l) => l.status === LeadStatus.NEW).length;
  const qualifiedCount = leads.filter(
    (l) => l.status === LeadStatus.QUALIFIED || l.qualificationStatus === QualificationStatus.QUALIFIED
  ).length;
  const convertedCount = leads.filter((l) => l.status === LeadStatus.CONVERTED).length;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-slate-100">
              Leads Management
            </h1>
            <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-sky-950/60 text-sky-400 border border-sky-800/80">
              Phase 2D
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Capture, qualify, and track managing agent and sectional scheme prospects.
          </p>
        </div>

        {/* Header Actions */}
        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={() => loadLeads(true)}
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
                setLeadToEdit(null);
                setIsFormModalOpen(true);
              }}
            >
              <Icon name="plus" size="xs" className="mr-1.5" />
              <span>New Lead</span>
            </Button>
          )}
        </div>
      </div>

      {/* Main Content States */}
      {error ? (
        <LeadsErrorState
          error={error.message}
          statusCode={error.status}
          onRetry={() => loadLeads()}
        />
      ) : isLoading ? (
        <LeadsSkeleton />
      ) : (
        <div className="space-y-4">
          {/* Ainubis Lead Contextual Intelligence */}
          <AinubisContextualPanel
            activeTenant={activeTenant}
            user={user}
            entityType="lead"
          />

          {/* Summary KPI Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-slate-900/60 border border-slate-800/80 rounded-lg p-3">
              <span className="text-xs text-slate-400 font-mono">Total Leads</span>
              <div className="text-2xl font-bold font-mono text-slate-100 mt-1">
                {totalLeads}
              </div>
              <span className="text-[11px] text-slate-500 mt-0.5 block">Portfolio scope</span>
            </div>

            <div className="bg-slate-900/60 border border-slate-800/80 rounded-lg p-3">
              <span className="text-xs text-slate-400 font-mono">New Prospects</span>
              <div className="text-2xl font-bold font-mono text-sky-400 mt-1">
                {newCount}
              </div>
              <span className="text-[11px] text-slate-500 mt-0.5 block">Pending review</span>
            </div>

            <div className="bg-slate-900/60 border border-slate-800/80 rounded-lg p-3">
              <span className="text-xs text-slate-400 font-mono">Qualified Fits</span>
              <div className="text-2xl font-bold font-mono text-emerald-400 mt-1">
                {qualifiedCount}
              </div>
              <span className="text-[11px] text-slate-500 mt-0.5 block">Ready for proposal</span>
            </div>

            <div className="bg-slate-900/60 border border-slate-800/80 rounded-lg p-3">
              <span className="text-xs text-slate-400 font-mono">Converted</span>
              <div className="text-2xl font-bold font-mono text-purple-400 mt-1">
                {convertedCount}
              </div>
              <span className="text-[11px] text-slate-500 mt-0.5 block">Active opportunities</span>
            </div>
          </div>

          {/* Filter & Search Toolbar */}
          <LeadFilters
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            statusFilter={statusFilter}
            onStatusFilterChange={(s) => {
              setStatusFilter(s);
              setPage(1);
            }}
            qualificationFilter={qualificationFilter}
            onQualificationFilterChange={(q) => {
              setQualificationFilter(q);
              setPage(1);
            }}
            sortBy={sortBy}
            sortOrder={sortOrder}
            onSortChange={handleSortChange}
            onToggleSortOrder={handleToggleSortOrder}
            onClearFilters={handleClearFilters}
            isFiltered={isFiltered}
          />

          {/* Table or Empty State */}
          {leads.length === 0 ? (
            <LeadsEmptyState
              userRole={userRole}
              isFiltered={isFiltered}
              tenantName={activeTenant.name}
              onCreateLead={() => {
                setLeadToEdit(null);
                setIsFormModalOpen(true);
              }}
              onClearFilters={handleClearFilters}
            />
          ) : (
            <div className="space-y-0 bg-slate-950 rounded-lg border border-slate-800 overflow-hidden">
              <LeadsTable
                leads={leads}
                userRole={userRole}
                sortBy={sortBy}
                sortOrder={sortOrder}
                onSortChange={handleSortChange}
                onViewDetails={(lead) => setSelectedLeadForDetail(lead)}
                onEdit={(lead) => {
                  setLeadToEdit(lead);
                  setIsFormModalOpen(true);
                }}
                onChangeStatus={(lead) => setLeadForStatusChange(lead)}
                onConvert={(lead) => setLeadToConvert(lead)}
                onDelete={allowDelete ? (lead) => setLeadToDelete(lead) : undefined}
              />

              {/* Pagination Controls */}
              <LeadPagination
                page={page}
                pageSize={pageSize}
                total={totalLeads}
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

      {/* Lead Detail Modal */}
      <LeadDetailModal
        isOpen={Boolean(selectedLeadForDetail)}
        lead={selectedLeadForDetail}
        userRole={userRole}
        onClose={() => setSelectedLeadForDetail(null)}
        onEdit={(lead) => {
          setSelectedLeadForDetail(null);
          setLeadToEdit(lead);
          setIsFormModalOpen(true);
        }}
        onChangeStatus={(lead) => {
          setSelectedLeadForDetail(null);
          setLeadForStatusChange(lead);
        }}
        onConvert={(lead) => {
          setSelectedLeadForDetail(null);
          setLeadToConvert(lead);
        }}
        onNavigateToPipeline={(oppId) => {
          setSelectedLeadForDetail(null);
          onNavigate?.('crm');
        }}
      />

      {/* Lead Conversion Wizard Modal */}
      <LeadConversionWizard
        isOpen={Boolean(leadToConvert)}
        lead={leadToConvert}
        activeTenant={activeTenant}
        user={user}
        onClose={() => setLeadToConvert(null)}
        onConversionSuccess={() => {
          loadLeads(true);
        }}
        onNavigateToPipeline={(oppId) => {
          onNavigate?.('crm');
        }}
      />

      {/* Create / Edit Form Modal */}
      <LeadFormModal
        isOpen={isFormModalOpen}
        leadToEdit={leadToEdit}
        onClose={() => {
          setIsFormModalOpen(false);
          setLeadToEdit(null);
        }}
        onSubmitCreate={handleCreateLead}
        onSubmitUpdate={handleUpdateLead}
      />

      {/* Status Transition Modal */}
      <LeadStatusModal
        isOpen={Boolean(leadForStatusChange)}
        lead={leadForStatusChange}
        onClose={() => setLeadForStatusChange(null)}
        onConfirmStatusChange={handleStatusChange}
      />

      {/* Soft Delete Confirmation Modal */}
      {leadToDelete && (
        <Modal
          isOpen={Boolean(leadToDelete)}
          onClose={() => setLeadToDelete(null)}
          title="Delete Lead"
          description={`Are you sure you want to soft-delete lead "${leadToDelete.title}"?`}
          footer={
            <div className="flex items-center justify-end gap-2 w-full">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setLeadToDelete(null)}
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
                Delete Lead
              </Button>
            </div>
          }
        >
          <p className="text-xs text-slate-300">
            This lead will be hidden from operational queries while retained for compliance and audit logs.
          </p>
        </Modal>
      )}
    </div>
  );
}
