/**
 * BCIP Ainubis AI Actions Workspace Tab
 * Phase 2E — Prompt 002E-004: Ainubis CRM Intelligence Actions & Human-Approved CRM Automation
 * Displays interactive lists of proposed, approved, executed, and failed automation tasks.
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Button, Icon } from '@bcip/ui';
import { getCrmApiClient, CrmApiError } from '../crm/shared/crm-api.ts';
import type { TenantContext, UserAccount } from '../../types/tenant';
import { formatDate } from '../crm/shared/crm-formatters.ts';
import { ActionReviewModal } from './ActionReviewModal.tsx';
import {
  canApproveAIActions,
  canExecuteAIActions,
} from '../crm/shared/crm-permissions.ts';

interface AinubisActionsTabProps {
  activeTenant: TenantContext;
  user: UserAccount;
}

export function AinubisActionsTab({ activeTenant, user }: AinubisActionsTabProps) {
  const [actions, setActions] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [isLoading, setIsLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [search, setSearch] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Selected Action for Modal
  const [selectedAction, setSelectedAction] = useState<any | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const api = useMemo(
    () => getCrmApiClient(activeTenant.id, user),
    [activeTenant.id, user]
  );

  const userRole = user.role || user.userRole;
  const allowApprove = canApproveAIActions(userRole);
  const allowExecute = canExecuteAIActions(userRole);

  const loadActions = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.listAiActions({
        page,
        pageSize,
        status: statusFilter !== 'ALL' ? statusFilter : undefined,
        actionType: typeFilter !== 'ALL' ? typeFilter : undefined,
      });

      setActions(res.actions);
      setTotal(res.pagination.total);
    } catch (err: any) {
      setError(err.message || 'Failed to retrieve AI automation actions.');
    } finally {
      setIsLoading(false);
    }
  }, [api, page, pageSize, statusFilter, typeFilter]);

  useEffect(() => {
    loadActions();
  }, [loadActions]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PROPOSED':
        return 'bg-blue-500/10 text-blue-400 border border-blue-500/20';
      case 'APPROVED':
        return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
      case 'EXECUTED':
        return 'bg-violet-500/10 text-violet-400 border border-violet-500/20';
      case 'VERIFIED':
        return 'bg-teal-500/10 text-teal-400 border border-teal-500/20';
      case 'FAILED':
        return 'bg-rose-500/10 text-rose-400 border border-rose-500/20';
      case 'EXPIRED':
        return 'bg-slate-600/15 text-slate-400 border border-slate-600/30';
      case 'REJECTED':
        return 'bg-orange-500/10 text-orange-400 border border-orange-500/20';
      default:
        return 'bg-slate-800 text-slate-400 border border-slate-700';
    }
  };

  const filteredActions = actions.filter((act) => {
    if (!search.trim()) return true;
    const term = search.toLowerCase();
    return (
      act.title.toLowerCase().includes(term) ||
      act.description.toLowerCase().includes(term) ||
      act.id.toLowerCase().includes(term)
    );
  });

  return (
    <div className="space-y-4">
      {/* Header Filters row */}
      <div className="flex flex-col md:flex-row gap-3 items-center justify-between bg-slate-900/40 p-4 rounded-lg border border-slate-800">
        <div className="flex flex-1 gap-2 w-full">
          <div className="relative flex-1">
            <span className="absolute left-2.5 top-2.5 text-slate-400">
              <Icon name="search" size="sm" />
            </span>
            <input
              type="text"
              placeholder="Search actions or targets..."
              className="w-full text-xs bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-3 py-2 text-slate-300 placeholder-slate-500 focus:outline-none focus:border-sky-500"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <select
            className="text-xs bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-300 focus:outline-none"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="ALL">All Statuses</option>
            <option value="PROPOSED">Proposed</option>
            <option value="APPROVED">Approved</option>
            <option value="EXECUTING">Executing</option>
            <option value="VERIFIED">Verified</option>
            <option value="FAILED">Failed</option>
            <option value="EXPIRED">Expired</option>
            <option value="REJECTED">Rejected</option>
            <option value="CANCELLED">Cancelled</option>
          </select>

          <select
            className="text-xs bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-300 focus:outline-none"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
          >
            <option value="ALL">All Action Types</option>
            <option value="CREATE_TASK">CREATE_TASK</option>
            <option value="CREATE_ACTIVITY">CREATE_ACTIVITY</option>
            <option value="UPDATE_LEAD_STATUS">UPDATE_LEAD_STATUS</option>
            <option value="UPDATE_OPPORTUNITY_STAGE">UPDATE_OPPORTUNITY_STAGE</option>
            <option value="UPDATE_OPPORTUNITY_ATTRIBUTES">UPDATE_OPPORTUNITY_ATTRIBUTES</option>
          </select>
        </div>

        <Button variant="secondary" size="sm" onClick={loadActions} disabled={isLoading}>
          <span className="flex items-center gap-1.5">
            <Icon name="refresh" size="xs" /> Refresh
          </span>
        </Button>
      </div>

      {error && (
        <div className="p-3 text-xs bg-rose-950/20 border border-rose-900 text-rose-400 rounded">
          {error}
        </div>
      )}

      {/* Main List */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center p-12 text-slate-500 space-y-2">
          <div className="text-sky-400">
            <Icon name="refresh" size="md" className="animate-spin" />
          </div>
          <span className="text-xs font-mono">Retrieving governance records...</span>
        </div>
      ) : filteredActions.length === 0 ? (
        <div className="text-center p-12 bg-slate-900/20 rounded-lg border border-slate-800">
          <div className="p-3 bg-slate-900 rounded-full inline-block text-slate-500 mb-2">
            <Icon name="shield" size="md" />
          </div>
          <p className="text-xs text-slate-400">No automation actions recorded matching current filters.</p>
        </div>
      ) : (
        <div className="border border-slate-800 rounded-lg overflow-hidden bg-slate-950/40">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-900/60 border-b border-slate-800 text-slate-400">
                <th className="p-3 font-semibold">Action Detail</th>
                <th className="p-3 font-semibold">Target Entity</th>
                <th className="p-3 font-semibold">Risk / Conf</th>
                <th className="p-3 font-semibold">Status</th>
                <th className="p-3 font-semibold text-right">Proposed</th>
              </tr>
            </thead>
            <tbody>
              {filteredActions.map((act) => (
                <tr
                  key={act.id}
                  className="border-b border-slate-800/60 hover:bg-slate-900/30 cursor-pointer transition-colors"
                  onClick={() => {
                    setSelectedAction(act);
                    setIsModalOpen(true);
                  }}
                >
                  <td className="p-3">
                    <div className="font-semibold text-slate-200">{act.title}</div>
                    <div className="text-[11px] text-slate-400 mt-0.5 max-w-sm truncate">{act.description}</div>
                  </td>
                  <td className="p-3 font-mono text-[11px] text-slate-300">
                    <div className="font-semibold">{act.targetEntityType}</div>
                    <div className="text-slate-500">{act.targetEntityId}</div>
                  </td>
                  <td className="p-3">
                    <div className="flex flex-col">
                      <span className={`text-[10px] uppercase font-bold ${act.riskLevel === 'HIGH' ? 'text-rose-400' : act.riskLevel === 'MEDIUM' ? 'text-amber-400' : 'text-slate-400'}`}>
                        {act.riskLevel} Risk
                      </span>
                      <span className="text-[10px] text-slate-400">{act.confidenceLevel}</span>
                    </div>
                  </td>
                  <td className="p-3">
                    <span className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded border ${getStatusBadge(act.status)}`}>
                      {act.status}
                    </span>
                  </td>
                  <td className="p-3 text-right text-slate-400 font-mono text-[11px]">
                    {formatDate(act.createdAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Review Dialog modal */}
      {selectedAction && (
        <ActionReviewModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedAction(null);
          }}
          action={selectedAction}
          activeTenant={activeTenant}
          user={user}
          onActionUpdated={loadActions}
          allowApprove={allowApprove}
          allowExecute={allowExecute}
        />
      )}
    </div>
  );
}
