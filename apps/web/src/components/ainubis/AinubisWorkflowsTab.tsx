/**
 * BCIP Ainubis Workflows & Automation Orchestration Workspace Tab
 * Phase 2E — Prompt 002E-005 & 002E-006 & 4A: Ainubis Workflow Intelligence, Templates & Operational Control
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Button, Icon, Modal } from '@bcip/ui';
import { getCrmApiClient } from '../crm/shared/crm-api.ts';
import type { TenantContext, UserAccount } from '../../types/tenant';
import { formatDate } from '../crm/shared/crm-formatters.ts';
import {
  canViewWorkflows,
  canCreateWorkflows,
  canEditWorkflows,
  canActivateWorkflows,
  canRunWorkflows,
  canApproveWorkflows,
  canViewWorkflowTemplates,
  canCreateWorkflowTemplates,
  canEditWorkflowTemplates,
  canPublishWorkflowTemplates,
  canArchiveWorkflowTemplates,
  canInstantiateWorkflowTemplates,
} from '../crm/shared/crm-permissions.ts';

interface AinubisWorkflowsTabProps {
  activeTenant: TenantContext;
  user: UserAccount;
}

export function AinubisWorkflowsTab({ activeTenant, user }: AinubisWorkflowsTabProps) {
  const [activeSubTab, setActiveSubTab] = useState<'workflows' | 'templates' | 'runs'>('workflows');
  const [workflows, setWorkflows] = useState<any[]>([]);
  const [runs, setRuns] = useState<any[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isTemplateLoading, setIsTemplateLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Workflow Filters
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [search, setSearch] = useState('');

  // Template Filters
  const [templateScopeFilter, setTemplateScopeFilter] = useState<'ALL' | 'SYSTEM' | 'TENANT'>('ALL');
  const [templateStatusFilter, setTemplateStatusFilter] = useState<string>('ALL');
  const [templateSearch, setTemplateSearch] = useState<string>('');

  // Modals State
  const [isBuilderOpen, setIsBuilderOpen] = useState(false);
  const [editingWorkflow, setEditingWorkflow] = useState<any | null>(null);

  // Timeline / Run Details Modal
  const [selectedRun, setSelectedRun] = useState<any | null>(null);
  const [timeline, setTimeline] = useState<any[]>([]);
  const [outcome, setOutcome] = useState<any | null>(null);
  const [approvals, setApprovals] = useState<any[]>([]);
  const [isRunModalOpen, setIsRunModalOpen] = useState(false);
  const [loadingRunDetails, setLoadingRunDetails] = useState(false);

  // Builder Form State
  const [formName, setFormName] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formKey, setFormKey] = useState('');
  const [formTriggerType, setFormTriggerType] = useState('CRM_EVENT');
  const [formEventType, setFormEventType] = useState('crm.lead.created');
  const [formSteps, setFormSteps] = useState<any[]>([
    {
      id: 'step_1',
      stepKey: 'observe',
      name: 'Observe Entity',
      type: 'OBSERVE',
      order: 1,
      configuration: { entityType: 'lead' },
      enabled: true,
    },
    {
      id: 'step_2',
      stepKey: 'propose',
      name: 'Propose Follow-up Action',
      type: 'PROPOSE_ACTION',
      order: 2,
      configuration: { actionType: 'CREATE_TASK' },
      enabled: true,
    },
    {
      id: 'step_3',
      stepKey: 'approval_gate',
      name: 'Human Approval Gate',
      type: 'REQUEST_APPROVAL',
      order: 3,
      configuration: { requiredPermission: 'crm:ai:action:approve' },
      enabled: true,
    },
    {
      id: 'step_4',
      stepKey: 'execute',
      name: 'Execute Action',
      type: 'EXECUTE_ACTION',
      order: 4,
      configuration: {},
      enabled: true,
    },
    {
      id: 'step_5',
      stepKey: 'verify',
      name: 'Verify Execution State',
      type: 'VERIFY',
      order: 5,
      configuration: { targetEntityType: 'task' },
      enabled: true,
    },
  ]);

  const api = useMemo(
    () => getCrmApiClient(activeTenant.id, user),
    [activeTenant.id, user.id, user.role, user.userRole]
  );

  const userRole = user.role || user.userRole;
  const allowCreate = canCreateWorkflows(userRole);
  const allowActivate = canActivateWorkflows(userRole);
  const allowRun = canRunWorkflows(userRole);
  const allowApprove = canApproveWorkflows(userRole);

  const allowViewTemplates = canViewWorkflowTemplates(userRole);
  const allowCreateTemplates = canCreateWorkflowTemplates(userRole);
  const allowPublishTemplates = canPublishWorkflowTemplates(userRole);
  const allowArchiveTemplates = canArchiveWorkflowTemplates(userRole);
  const allowInstantiateTemplates = canInstantiateWorkflowTemplates(userRole);

  // Load Workflows & Runs
  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [wfRes, runsRes] = await Promise.all([
        api.listWorkflows({
          status: statusFilter !== 'ALL' ? statusFilter : undefined,
        }),
        api.listWorkflows().then((res) => {
          if (res.workflows.length > 0) {
            return api.listWorkflowRuns(res.workflows[0].id).then((r) => r.runs).catch(() => []);
          }
          return [];
        }),
      ]);

      setWorkflows(wfRes.workflows);
      setRuns(runsRes);
    } catch (err: any) {
      setError(err.message || 'Failed to load workflow automation records.');
    } finally {
      setIsLoading(false);
    }
  }, [api, statusFilter]);

  // Load Templates
  const loadTemplates = useCallback(async () => {
    setIsTemplateLoading(true);
    try {
      const res = await api.listWorkflowTemplates({
        scope: templateScopeFilter !== 'ALL' ? templateScopeFilter : undefined,
        status: templateStatusFilter !== 'ALL' ? templateStatusFilter : undefined,
      });
      setTemplates(res.templates || []);
    } catch (err: any) {
      console.error('Failed to load templates:', err);
    } finally {
      setIsTemplateLoading(false);
    }
  }, [api, templateScopeFilter, templateStatusFilter]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (activeSubTab === 'templates') {
      loadTemplates();
    }
  }, [activeSubTab, loadTemplates]);

  // Handle Workflow Action Controls
  const handleToggleActivate = async (wf: any) => {
    try {
      if (wf.status === 'ACTIVE') {
        await api.pauseWorkflow(wf.id);
      } else {
        await api.activateWorkflow(wf.id);
      }
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to update workflow state');
    }
  };

  const handleManualRun = async (wf: any) => {
    try {
      await api.triggerWorkflowRun(wf.id, { manualTriggeredBy: user.email });
      setSuccessMessage(`Workflow "${wf.name}" launched successfully.`);
      setTimeout(() => setSuccessMessage(null), 4000);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to launch workflow run');
    }
  };

  const handleOpenRunDetails = async (run: any) => {
    setSelectedRun(run);
    setIsRunModalOpen(true);
    setLoadingRunDetails(true);
    try {
      const [tData, oData, aData] = await Promise.all([
        api.getWorkflowRunTimeline(run.id).catch(() => []),
        api.getWorkflowRunOutcome(run.id).catch(() => null),
        api.getWorkflowRunApprovals(run.id).catch(() => []),
      ]);
      setTimeline(tData);
      setOutcome(oData);
      setApprovals(aData);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoadingRunDetails(false);
    }
  };

  // Template Handlers
  const handleInstantiateTemplate = async (tpl: any) => {
    try {
      const res = await api.instantiateWorkflowTemplate(tpl.id);
      setSuccessMessage(
        `Template "${tpl.name}" successfully instantiated into active workflow "${res?.workflow?.name || tpl.name}".`
      );
      setTimeout(() => setSuccessMessage(null), 5000);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to instantiate template');
    }
  };

  const handleCloneTemplate = async (tpl: any) => {
    try {
      await api.cloneWorkflowTemplate(tpl.id);
      setSuccessMessage(`Template "${tpl.name}" cloned into a tenant-owned custom template.`);
      setTimeout(() => setSuccessMessage(null), 5000);
      loadTemplates();
    } catch (err: any) {
      alert(err.message || 'Failed to clone template');
    }
  };

  const handlePublishTemplate = async (tpl: any) => {
    try {
      await api.publishWorkflowTemplate(tpl.id);
      setSuccessMessage(`Tenant template "${tpl.name}" published successfully.`);
      setTimeout(() => setSuccessMessage(null), 4000);
      loadTemplates();
    } catch (err: any) {
      alert(err.message || 'Failed to publish template');
    }
  };

  const handleArchiveTemplate = async (tpl: any) => {
    try {
      await api.archiveWorkflowTemplate(tpl.id);
      setSuccessMessage(`Tenant template "${tpl.name}" archived.`);
      setTimeout(() => setSuccessMessage(null), 4000);
      loadTemplates();
    } catch (err: any) {
      alert(err.message || 'Failed to archive template');
    }
  };

  // Handle Workflow Builder Save
  const handleSaveWorkflow = async () => {
    if (!formName.trim() || !formKey.trim()) {
      alert('Workflow Name and Deterministic Key are required.');
      return;
    }

    try {
      const dto = {
        name: formName.trim(),
        description: formDesc.trim(),
        workflowKey: formKey.trim(),
        version: editingWorkflow ? editingWorkflow.version + 1 : 1,
        trigger: {
          type: formTriggerType,
          eventType: formTriggerType === 'CRM_EVENT' ? formEventType : undefined,
        },
        steps: formSteps,
      };

      if (editingWorkflow) {
        await api.updateWorkflow(editingWorkflow.id, dto);
      } else {
        await api.createWorkflow(dto);
      }

      setIsBuilderOpen(false);
      setEditingWorkflow(null);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to save workflow definition');
    }
  };

  // Metrics calculation
  const totalWorkflows = workflows.length;
  const activeCount = workflows.filter((w) => w.status === 'ACTIVE').length;
  const pausedCount = workflows.filter((w) => w.status === 'PAUSED').length;

  const filteredWorkflows = workflows.filter((w) => {
    if (!search.trim()) return true;
    const term = search.toLowerCase();
    return (
      w.name.toLowerCase().includes(term) ||
      w.description.toLowerCase().includes(term) ||
      w.workflowKey.toLowerCase().includes(term)
    );
  });

  const filteredTemplates = templates.filter((t) => {
    if (!templateSearch.trim()) return true;
    const term = templateSearch.toLowerCase();
    return (
      t.name.toLowerCase().includes(term) ||
      t.description.toLowerCase().includes(term) ||
      t.templateKey.toLowerCase().includes(term) ||
      t.category.toLowerCase().includes(term)
    );
  });

  return (
    <div className="space-y-6">
      {/* Sub-Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
        <button
          onClick={() => setActiveSubTab('workflows')}
          className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${
            activeSubTab === 'workflows'
              ? 'bg-slate-800 text-sky-400 border border-slate-700 font-semibold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Active Workflows ({totalWorkflows})
        </button>
        <button
          onClick={() => setActiveSubTab('templates')}
          className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${
            activeSubTab === 'templates'
              ? 'bg-slate-800 text-sky-400 border border-slate-700 font-semibold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Workflow Templates ({templates.length > 0 ? templates.length : 'Governed'})
        </button>
        <button
          onClick={() => setActiveSubTab('runs')}
          className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${
            activeSubTab === 'runs'
              ? 'bg-slate-800 text-sky-400 border border-slate-700 font-semibold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Operational Runs & Timelines ({runs.length})
        </button>
      </div>

      {successMessage && (
        <div className="p-3 text-xs bg-emerald-950/40 border border-emerald-800 text-emerald-300 rounded flex items-center justify-between">
          <span className="font-mono">{successMessage}</span>
          <button onClick={() => setSuccessMessage(null)} className="text-emerald-400 hover:text-emerald-200">
            ×
          </button>
        </div>
      )}

      {error && (
        <div className="p-3 text-xs bg-rose-950/20 border border-rose-900 text-rose-400 rounded">
          {error}
        </div>
      )}

      {/* VIEW 1: ACTIVE WORKFLOWS */}
      {activeSubTab === 'workflows' && (
        <div className="space-y-6">
          {/* Overview Metric Scorecards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-slate-950 border border-slate-800 rounded-lg p-3">
              <span className="text-[10px] font-mono uppercase text-slate-500 block">Total Workflows</span>
              <div className="text-xl font-bold font-mono text-slate-100 mt-1">{totalWorkflows}</div>
              <span className="text-[10px] text-slate-500">Tenant automations</span>
            </div>

            <div className="bg-slate-950 border border-slate-800 rounded-lg p-3">
              <span className="text-[10px] font-mono uppercase text-emerald-400 block">Active & Running</span>
              <div className="text-xl font-bold font-mono text-emerald-300 mt-1">{activeCount}</div>
              <span className="text-[10px] text-slate-500">Autonomous monitoring</span>
            </div>

            <div className="bg-slate-950 border border-slate-800 rounded-lg p-3">
              <span className="text-[10px] font-mono uppercase text-amber-400 block">Paused / Inactive</span>
              <div className="text-xl font-bold font-mono text-amber-300 mt-1">{pausedCount}</div>
              <span className="text-[10px] text-slate-500">Suspended executions</span>
            </div>

            <div className="bg-slate-950 border border-slate-800 rounded-lg p-3">
              <span className="text-[10px] font-mono uppercase text-sky-400 block">Safety Guardrails</span>
              <div className="text-xl font-bold font-mono text-sky-300 mt-1">Enforced</div>
              <span className="text-[10px] text-slate-500">Human Approval Gates</span>
            </div>
          </div>

          {/* Toolbar & Filters */}
          <div className="flex flex-col md:flex-row gap-3 items-center justify-between bg-slate-900/40 p-4 rounded-lg border border-slate-800">
            <div className="flex flex-1 gap-2 w-full">
              <div className="relative flex-1">
                <span className="absolute left-2.5 top-2.5 text-slate-400">
                  <Icon name="search" size="sm" />
                </span>
                <input
                  type="text"
                  placeholder="Search workflows by key or name..."
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
                <option value="ACTIVE">Active</option>
                <option value="PAUSED">Paused</option>
                <option value="DRAFT">Draft</option>
                <option value="DISABLED">Disabled</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="secondary" size="sm" onClick={loadData} disabled={isLoading}>
                <span className="flex items-center gap-1.5">
                  <Icon name="refresh" size="xs" /> Refresh
                </span>
              </Button>

              {allowCreate && (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => {
                    setEditingWorkflow(null);
                    setFormName('');
                    setFormDesc('');
                    setFormKey(`WF_CUSTOM_${Date.now()}`);
                    setIsBuilderOpen(true);
                  }}
                  className="flex items-center gap-1.5"
                >
                  <Icon name="zap" size="xs" />
                  <span>Create Workflow</span>
                </Button>
              )}
            </div>
          </div>

          {/* Workflows List Table */}
          {isLoading ? (
            <div className="flex flex-col items-center justify-center p-12 text-slate-500 space-y-2">
              <div className="animate-spin text-sky-400">
                <Icon name="refresh" size="md" />
              </div>
              <span className="text-xs font-mono">Loading automation workflows...</span>
            </div>
          ) : filteredWorkflows.length === 0 ? (
            <div className="text-center p-12 bg-slate-900/20 rounded-lg border border-slate-800">
              <div className="p-3 bg-slate-900 rounded-full inline-block text-slate-500 mb-2">
                <Icon name="zap" size="md" />
              </div>
              <p className="text-xs text-slate-400">No automation workflows found matching criteria.</p>
              <p className="text-[11px] text-slate-500 mt-1">
                You can instantiate one of the 6 governed platform templates in the "Workflow Templates" tab.
              </p>
            </div>
          ) : (
            <div className="border border-slate-800 rounded-lg overflow-hidden bg-slate-950/40">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-900/60 border-b border-slate-800 text-slate-400 font-mono">
                    <th className="p-3 font-semibold">Workflow Details</th>
                    <th className="p-3 font-semibold">Trigger Condition</th>
                    <th className="p-3 font-semibold">Origin / Template</th>
                    <th className="p-3 font-semibold">Steps & Verification</th>
                    <th className="p-3 font-semibold">Status</th>
                    <th className="p-3 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredWorkflows.map((wf) => (
                    <tr key={wf.id} className="hover:bg-slate-900/30 transition-colors">
                      <td className="p-3">
                        <div className="font-semibold text-slate-200">{wf.name}</div>
                        <div className="text-[11px] text-slate-400 line-clamp-1">{wf.description}</div>
                        <div className="font-mono text-[10px] text-sky-400 mt-0.5">{wf.workflowKey} • v{wf.version}</div>
                      </td>

                      <td className="p-3">
                        <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300">
                          {wf.trigger.type}
                        </span>
                        {wf.trigger.eventType && (
                          <div className="text-[10px] text-slate-500 font-mono mt-0.5">{wf.trigger.eventType}</div>
                        )}
                        {wf.trigger.conditionKey && (
                          <div className="text-[10px] text-slate-500 font-mono mt-0.5">{wf.trigger.conditionKey}</div>
                        )}
                      </td>

                      <td className="p-3">
                        {wf.sourceTemplateId ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-mono px-1.5 py-0.5 rounded bg-sky-950/50 text-sky-300 border border-sky-800">
                            Derived v{wf.sourceTemplateVersion || 1}
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-500 font-mono">Custom</span>
                        )}
                      </td>

                      <td className="p-3">
                        <div className="font-mono text-slate-300">{wf.steps?.length || 0} sequential steps</div>
                        <div className="text-[10px] text-emerald-400">Post-execution verify</div>
                      </td>

                      <td className="p-3">
                        <span
                          className={`font-mono text-[10px] px-2 py-0.5 rounded-full border ${
                            wf.status === 'ACTIVE'
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                              : wf.status === 'PAUSED'
                              ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                              : 'bg-slate-800 text-slate-400 border-slate-700'
                          }`}
                        >
                          {wf.status}
                        </span>
                      </td>

                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {allowRun && wf.status === 'ACTIVE' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleManualRun(wf)}
                              className="text-[11px]"
                            >
                              Run Now
                            </Button>
                          )}

                          {allowActivate && (
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => handleToggleActivate(wf)}
                              className="text-[11px]"
                            >
                              {wf.status === 'ACTIVE' ? 'Pause' : 'Activate'}
                            </Button>
                          )}

                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => {
                              setEditingWorkflow(wf);
                              setFormName(wf.name);
                              setFormDesc(wf.description);
                              setFormKey(wf.workflowKey);
                              setFormTriggerType(wf.trigger.type);
                              setFormEventType(wf.trigger.eventType || 'crm.lead.created');
                              setFormSteps(wf.steps || []);
                              setIsBuilderOpen(true);
                            }}
                            className="text-[11px]"
                          >
                            Edit
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* VIEW 2: WORKFLOW TEMPLATES (Prompt 4A.14) */}
      {activeSubTab === 'templates' && (
        <div className="space-y-6">
          {/* Tenancy & Scope Informational Banner */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-lg p-4 text-xs text-slate-300 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 font-mono text-[11px] text-sky-400 mb-0.5">
                <Icon name="cpu" size="xs" />
                <span className="font-semibold uppercase tracking-wider">Governed Template Architecture</span>
              </div>
              <p className="text-slate-400 text-xs">
                Platform <strong className="text-slate-200">SYSTEM</strong> templates are immutable, canonical blueprints reusable by all authorized tenants.
                Tenants may instantiate or clone them into private <strong className="text-slate-200">TENANT</strong> templates customized for local operational rules.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="secondary" size="sm" onClick={loadTemplates} disabled={isTemplateLoading}>
                <span className="flex items-center gap-1.5">
                  <Icon name="refresh" size="xs" /> Refresh
                </span>
              </Button>
            </div>
          </div>

          {/* Template Toolbar & Filters */}
          <div className="flex flex-col md:flex-row gap-3 items-center justify-between bg-slate-900/40 p-4 rounded-lg border border-slate-800">
            <div className="flex flex-1 gap-2 w-full">
              <div className="relative flex-1">
                <span className="absolute left-2.5 top-2.5 text-slate-400">
                  <Icon name="search" size="sm" />
                </span>
                <input
                  type="text"
                  placeholder="Search templates by name, key, or category..."
                  className="w-full text-xs bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-3 py-2 text-slate-300 placeholder-slate-500 focus:outline-none focus:border-sky-500"
                  value={templateSearch}
                  onChange={(e) => setTemplateSearch(e.target.value)}
                />
              </div>

              {/* Scope Filter (Prompt 4A.14) */}
              <select
                className="text-xs bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-300 focus:outline-none font-mono"
                value={templateScopeFilter}
                onChange={(e) => setTemplateScopeFilter(e.target.value as any)}
              >
                <option value="ALL">All Scopes</option>
                <option value="SYSTEM">SYSTEM (Platform)</option>
                <option value="TENANT">TENANT (Private)</option>
              </select>

              <select
                className="text-xs bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-300 focus:outline-none"
                value={templateStatusFilter}
                onChange={(e) => setTemplateStatusFilter(e.target.value)}
              >
                <option value="ALL">All Statuses</option>
                <option value="PUBLISHED">Published</option>
                <option value="DRAFT">Draft</option>
                <option value="DEPRECATED">Deprecated</option>
                <option value="ARCHIVED">Archived</option>
              </select>
            </div>
          </div>

          {/* Template Cards Grid */}
          {isTemplateLoading ? (
            <div className="flex flex-col items-center justify-center p-12 text-slate-500 space-y-2">
              <div className="animate-spin text-sky-400">
                <Icon name="refresh" size="md" />
              </div>
              <span className="text-xs font-mono">Loading workflow templates...</span>
            </div>
          ) : filteredTemplates.length === 0 ? (
            <div className="text-center p-12 bg-slate-900/20 rounded-lg border border-slate-800">
              <p className="text-xs text-slate-400">No workflow templates found matching criteria.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredTemplates.map((tpl) => {
                const isSystem = tpl.templateScope === 'SYSTEM';
                return (
                  <div
                    key={tpl.id}
                    className="p-4 bg-slate-950/60 border border-slate-800 rounded-lg flex flex-col justify-between space-y-3 hover:border-slate-700 transition-colors"
                  >
                    <div>
                      {/* Badge Header: SYSTEM vs TENANT (Prompt 4A.14) */}
                      <div className="flex items-center justify-between gap-2 mb-2">
                        {isSystem ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[11px] font-mono font-semibold bg-sky-500/10 text-sky-400 border border-sky-500/20">
                            <span className="w-1.5 h-1.5 rounded-full bg-sky-400"></span>
                            SYSTEM • Platform Governed
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[11px] font-mono font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                            TENANT • {tpl.ownerTenantId || activeTenant.name}
                          </span>
                        )}

                        <span
                          className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                            tpl.status === 'PUBLISHED'
                              ? 'bg-teal-500/10 text-teal-400 border-teal-500/20'
                              : tpl.status === 'DRAFT'
                              ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                              : 'bg-slate-800 text-slate-400 border-slate-700'
                          }`}
                        >
                          {tpl.status} • v{tpl.version}
                        </span>
                      </div>

                      <h3 className="font-semibold text-slate-100 text-sm">{tpl.name}</h3>
                      <p className="text-xs text-slate-400 mt-1 line-clamp-2">{tpl.description}</p>

                      <div className="mt-3 pt-2.5 border-t border-slate-800/80 grid grid-cols-2 gap-2 text-[11px] font-mono">
                        <div>
                          <span className="text-slate-500 block text-[10px]">CATEGORY</span>
                          <span className="text-slate-300">{tpl.category}</span>
                        </div>
                        <div>
                          <span className="text-slate-500 block text-[10px]">TRIGGER</span>
                          <span className="text-slate-300">{tpl.trigger?.type || 'MANUAL'}</span>
                        </div>
                        <div>
                          <span className="text-slate-500 block text-[10px]">STEPS</span>
                          <span className="text-slate-300">{tpl.steps?.length || 0} sequential steps</span>
                        </div>
                        <div>
                          <span className="text-slate-500 block text-[10px]">DERIVATION</span>
                          <span className="text-slate-300">
                            {tpl.sourceTemplateId ? `Derived v${tpl.sourceTemplateVersion || 1}` : 'Canonical'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Action Controls per Prompt 4A.14 */}
                    <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
                      <div className="text-[10px] font-mono text-slate-500">
                        {isSystem ? 'Canonical Reusable Blueprint' : 'Tenant Private Blueprint'}
                      </div>

                      <div className="flex items-center gap-1.5">
                        {/* For SYSTEM templates: display Instantiate and Clone/Customise. NO Edit/Publish/Archive for ordinary tenant users */}
                        {isSystem ? (
                          <>
                            {allowCreateTemplates && (
                              <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => handleCloneTemplate(tpl)}
                                className="text-[11px]"
                              >
                                Clone / Customise
                              </Button>
                            )}

                            {allowInstantiateTemplates && tpl.status === 'PUBLISHED' && (
                              <Button
                                variant="primary"
                                size="sm"
                                onClick={() => handleInstantiateTemplate(tpl)}
                                className="text-[11px]"
                              >
                                Instantiate
                              </Button>
                            )}
                          </>
                        ) : (
                          /* For TENANT templates: display tenant admin controls according to RBAC */
                          <>
                            {allowCreateTemplates && (
                              <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => handleCloneTemplate(tpl)}
                                className="text-[11px]"
                              >
                                Clone
                              </Button>
                            )}

                            {allowPublishTemplates && tpl.status === 'DRAFT' && (
                              <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => handlePublishTemplate(tpl)}
                                className="text-[11px] text-teal-400"
                              >
                                Publish
                              </Button>
                            )}

                            {allowArchiveTemplates && tpl.status !== 'ARCHIVED' && (
                              <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => handleArchiveTemplate(tpl)}
                                className="text-[11px] text-slate-400"
                              >
                                Archive
                              </Button>
                            )}

                            {allowInstantiateTemplates && tpl.status === 'PUBLISHED' && (
                              <Button
                                variant="primary"
                                size="sm"
                                onClick={() => handleInstantiateTemplate(tpl)}
                                className="text-[11px]"
                              >
                                Instantiate
                              </Button>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* VIEW 3: OPERATIONAL RUNS & TIMELINE */}
      {activeSubTab === 'runs' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-semibold text-slate-200">Execution Runs & Audit Timeline</h3>
            <Button variant="secondary" size="sm" onClick={loadData}>
              <Icon name="refresh" size="xs" />
            </Button>
          </div>

          {runs.length === 0 ? (
            <div className="p-8 text-center bg-slate-900/20 border border-slate-800 rounded text-slate-500 text-xs">
              No executions recorded yet. Launch a workflow to inspect timeline and verifications.
            </div>
          ) : (
            <div className="border border-slate-800 rounded-lg overflow-hidden bg-slate-950/40">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-900/60 border-b border-slate-800 text-slate-400 font-mono">
                    <th className="p-3">Run ID</th>
                    <th className="p-3">Trigger Type</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Started At</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {runs.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-900/30">
                      <td className="p-3 font-mono text-slate-300">{r.id}</td>
                      <td className="p-3 font-mono text-slate-400">{r.triggerType}</td>
                      <td className="p-3">
                        <span
                          className={`font-mono text-[10px] px-2 py-0.5 rounded ${
                            r.status === 'COMPLETED'
                              ? 'bg-emerald-500/10 text-emerald-400'
                              : r.status === 'FAILED'
                              ? 'bg-rose-500/10 text-rose-400'
                              : 'bg-amber-500/10 text-amber-400'
                          }`}
                        >
                          {r.status}
                        </span>
                      </td>
                      <td className="p-3 font-mono text-slate-400">{formatDate(r.startedAt)}</td>
                      <td className="p-3 text-right">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleOpenRunDetails(r)}
                          className="text-[11px]"
                        >
                          Inspect Timeline
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Workflow Builder Modal */}
      {isBuilderOpen && (
        <Modal
          isOpen={isBuilderOpen}
          onClose={() => setIsBuilderOpen(false)}
          title={editingWorkflow ? 'Edit Workflow Definition' : 'Controlled Workflow Builder'}
          maxWidth="lg"
        >
          <div className="space-y-4 text-xs text-slate-300">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">Workflow Name *</label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. Inbound Lead Qualification"
                  className="w-full text-xs px-3 py-2 bg-slate-950 border border-slate-800 rounded focus:border-sky-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">Deterministic Key *</label>
                <input
                  type="text"
                  value={formKey}
                  onChange={(e) => setFormKey(e.target.value)}
                  placeholder="e.g. WF_LEAD_QUALIFICATION"
                  className="w-full text-xs px-3 py-2 bg-slate-950 border border-slate-800 rounded font-mono focus:border-sky-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">Description</label>
              <textarea
                value={formDesc}
                onChange={(e) => setFormDesc(e.target.value)}
                placeholder="Workflow execution purpose..."
                className="w-full text-xs px-3 py-2 bg-slate-950 border border-slate-800 rounded focus:border-sky-500"
                rows={2}
              />
            </div>

            <div className="p-3 bg-slate-950 rounded border border-slate-800 space-y-2">
              <span className="text-[11px] font-bold text-slate-200 uppercase font-mono">Trigger Configuration</span>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] text-slate-400 mb-1">Trigger Type</label>
                  <select
                    value={formTriggerType}
                    onChange={(e) => setFormTriggerType(e.target.value)}
                    className="w-full text-xs bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5"
                  >
                    <option value="CRM_EVENT">CRM_EVENT (Domain Event)</option>
                    <option value="AI_OBSERVATION">AI_OBSERVATION (Continuous Monitor)</option>
                    <option value="SCHEDULED_CONDITION">SCHEDULED_CONDITION (Time-based)</option>
                    <option value="MANUAL">MANUAL (Admin Triggered)</option>
                  </select>
                </div>

                {formTriggerType === 'CRM_EVENT' && (
                  <div>
                    <label className="block text-[10px] text-slate-400 mb-1">CRM Event</label>
                    <select
                      value={formEventType}
                      onChange={(e) => setFormEventType(e.target.value)}
                      className="w-full text-xs bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5"
                    >
                      <option value="crm.lead.created">crm.lead.created</option>
                      <option value="crm.lead.updated">crm.lead.updated</option>
                      <option value="crm.opportunity.stage_changed">crm.opportunity.stage_changed</option>
                      <option value="crm.task.completed">crm.task.completed</option>
                      <option value="crm.activity.created">crm.activity.created</option>
                    </select>
                  </div>
                )}
              </div>
            </div>

            {/* Steps Sequence */}
            <div className="space-y-2">
              <span className="text-[11px] font-bold text-slate-200 uppercase font-mono">Configured Steps Sequence ({formSteps.length})</span>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {formSteps.map((step, idx) => (
                  <div key={step.id || idx} className="p-2.5 bg-slate-900/60 rounded border border-slate-800 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-semibold text-slate-200">{idx + 1}. {step.name}</span>
                      <span className="text-[10px] font-mono text-sky-400 ml-2 px-1.5 py-0.5 rounded bg-sky-950 border border-sky-800">
                        {step.type}
                      </span>
                    </div>
                    <span className="text-[10px] font-mono text-slate-500">Order: {step.order}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <Button variant="secondary" size="sm" onClick={() => setIsBuilderOpen(false)}>
                Cancel
              </Button>
              <Button variant="primary" size="sm" onClick={handleSaveWorkflow}>
                Save Workflow
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Workflow Run Timeline Modal */}
      {selectedRun && (
        <Modal
          isOpen={isRunModalOpen}
          onClose={() => setIsRunModalOpen(false)}
          title={`Workflow Run Timeline: ${selectedRun.id}`}
          maxWidth="lg"
        >
          <div className="space-y-4 text-xs text-slate-300">
            {loadingRunDetails ? (
              <div className="p-8 text-center text-slate-500">Loading timeline...</div>
            ) : (
              <>
                <div className="p-3 bg-slate-950 rounded border border-slate-800 flex justify-between items-center">
                  <div>
                    <span className="text-slate-400">Status: </span>
                    <span className="font-bold text-emerald-400 font-mono">{selectedRun.status}</span>
                  </div>
                  <div className="text-[10px] font-mono text-slate-500">
                    Correlation: {selectedRun.correlationId}
                  </div>
                </div>

                {/* Timeline */}
                <div className="space-y-2">
                  <h4 className="text-[11px] font-bold uppercase font-mono text-slate-400">Step Executions Timeline</h4>
                  {timeline.length === 0 ? (
                    <div className="p-4 text-slate-500 italic text-center">No step executions recorded.</div>
                  ) : (
                    timeline.map((step, idx) => (
                      <div key={step.id} className="p-3 bg-slate-900/40 rounded border border-slate-800 flex justify-between items-start">
                        <div>
                          <div className="font-semibold text-slate-200">
                            {idx + 1}. Step: {step.stepId}
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                            Status: <span className="text-emerald-400">{step.status}</span>
                          </div>
                        </div>
                        <span className="text-[10px] font-mono text-slate-500">{formatDate(step.startedAt)}</span>
                      </div>
                    ))
                  )}
                </div>

                {/* Outcome */}
                {outcome && (
                  <div className="p-3 bg-teal-950/20 border border-teal-900/40 rounded text-teal-300 space-y-1">
                    <div className="font-bold font-mono">Outcome: {outcome.outcomeType}</div>
                    <p className="text-[11px] text-teal-200">{outcome.summary}</p>
                  </div>
                )}
              </>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}
