/**
 * BCIP Workflow Run & Execution State Repository
 * Phase 2E — Prompt 002E-005: Ainubis CRM Automation Orchestration & Workflow Intelligence
 */

import { BaseCrmRepository, type QueryOptions } from './base.repository.ts';
import {
  type WorkflowRun,
  type WorkflowStepExecution,
  type WorkflowApproval,
  type WorkflowOutcome,
  type WorkflowRunStatus,
} from '../workflow-types.ts';

export interface WorkflowRunQueryOptions extends QueryOptions {
  workflowId?: string;
  status?: WorkflowRunStatus;
  correlationId?: string;
}

export class WorkflowRunRepository extends BaseCrmRepository<WorkflowRun> {
  private stepExecutions: Map<string, WorkflowStepExecution> = new Map();
  private approvals: Map<string, WorkflowApproval> = new Map();
  private outcomes: Map<string, WorkflowOutcome> = new Map();

  constructor() {
    super('crm_ai_workflow_runs');
  }

  // 1. Workflow Runs
  public async createRun(
    tenantId: string,
    run: Omit<WorkflowRun, 'id' | 'tenantId' | 'createdAt' | 'updatedAt'>
  ): Promise<WorkflowRun> {
    const id = this.generateId('wfrun');
    const now = new Date().toISOString();

    const record: WorkflowRun = {
      ...run,
      id,
      tenantId,
      createdAt: now,
      updatedAt: now,
    };

    this.items.set(id, record);
    return { ...record };
  }

  public async findMany(
    tenantId: string,
    options?: WorkflowRunQueryOptions
  ): Promise<{ data: WorkflowRun[]; total: number }> {
    const results: WorkflowRun[] = [];

    for (const item of this.items.values()) {
      if (!this.matchesQuery(item, tenantId, options)) continue;

      if (options?.workflowId && item.workflowId !== options.workflowId) continue;
      if (options?.status && item.status !== options.status) continue;
      if (options?.correlationId && item.correlationId !== options.correlationId) continue;

      results.push({ ...item });
    }

    const total = results.length;

    // Sort by startedAt descending
    results.sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime());

    const offset = options?.offset || 0;
    const limit = options?.limit || 50;
    const paginated = results.slice(offset, offset + limit);

    return { data: paginated, total };
  }

  public async findByIdempotencyKey(tenantId: string, idempotencyKey: string): Promise<WorkflowRun | undefined> {
    for (const item of this.items.values()) {
      if (item.tenantId === tenantId && item.idempotencyKey === idempotencyKey) {
        return { ...item };
      }
    }
    return undefined;
  }

  // 2. Step Executions
  public async createStepExecution(
    tenantId: string,
    exec: Omit<WorkflowStepExecution, 'id' | 'tenantId' | 'createdAt' | 'updatedAt'>
  ): Promise<WorkflowStepExecution> {
    const id = this.generateId('wfstep');
    const now = new Date().toISOString();

    const record: WorkflowStepExecution = {
      ...exec,
      id,
      tenantId,
      createdAt: now,
      updatedAt: now,
    };

    this.stepExecutions.set(id, record);
    return { ...record };
  }

  public async updateStepExecution(
    id: string,
    updates: Partial<Omit<WorkflowStepExecution, 'id' | 'tenantId' | 'createdAt' | 'updatedAt'>>
  ): Promise<WorkflowStepExecution | undefined> {
    const existing = this.stepExecutions.get(id);
    if (!existing) return undefined;

    const updated: WorkflowStepExecution = {
      ...existing,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    this.stepExecutions.set(id, updated);
    return { ...updated };
  }

  public async findStepExecutions(tenantId: string, runId: string): Promise<WorkflowStepExecution[]> {
    const results: WorkflowStepExecution[] = [];
    for (const item of this.stepExecutions.values()) {
      if (item.tenantId === tenantId && item.workflowRunId === runId) {
        results.push({ ...item });
      }
    }
    // Sort by order/date
    results.sort((a, b) => new Date(a.startedAt).getTime() - new Date(b.startedAt).getTime());
    return results;
  }

  // 3. Approvals
  public async createApproval(
    tenantId: string,
    approval: Omit<WorkflowApproval, 'id' | 'tenantId' | 'createdAt' | 'updatedAt'>
  ): Promise<WorkflowApproval> {
    const id = this.generateId('wfappr');
    const now = new Date().toISOString();

    const record: WorkflowApproval = {
      ...approval,
      id,
      tenantId,
      createdAt: now,
      updatedAt: now,
    };

    this.approvals.set(id, record);
    return { ...record };
  }

  public async updateApproval(
    id: string,
    updates: Partial<Omit<WorkflowApproval, 'id' | 'tenantId' | 'createdAt' | 'updatedAt'>>
  ): Promise<WorkflowApproval | undefined> {
    const existing = this.approvals.get(id);
    if (!existing) return undefined;

    const updated: WorkflowApproval = {
      ...existing,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    this.approvals.set(id, updated);
    return { ...updated };
  }

  public async findApprovals(tenantId: string, runId: string): Promise<WorkflowApproval[]> {
    const results: WorkflowApproval[] = [];
    for (const item of this.approvals.values()) {
      if (item.tenantId === tenantId && item.workflowRunId === runId) {
        results.push({ ...item });
      }
    }
    return results;
  }

  public async findPendingApprovalsByActionId(tenantId: string, actionId: string): Promise<WorkflowApproval[]> {
    const results: WorkflowApproval[] = [];
    for (const item of this.approvals.values()) {
      if (item.tenantId === tenantId && item.actionId === actionId && item.status === 'PENDING') {
        results.push({ ...item });
      }
    }
    return results;
  }

  // 4. Outcomes
  public async createOutcome(
    tenantId: string,
    outcome: Omit<WorkflowOutcome, 'id' | 'tenantId' | 'createdAt' | 'updatedAt'>
  ): Promise<WorkflowOutcome> {
    const id = this.generateId('wfout');
    const now = new Date().toISOString();

    const record: WorkflowOutcome = {
      ...outcome,
      id,
      tenantId,
      createdAt: now,
      updatedAt: now,
    };

    this.outcomes.set(id, record);
    return { ...record };
  }

  public async findOutcome(tenantId: string, runId: string): Promise<WorkflowOutcome | undefined> {
    for (const item of this.outcomes.values()) {
      if (item.tenantId === tenantId && item.workflowRunId === runId) {
        return { ...item };
      }
    }
    return undefined;
  }

  public async clear(): Promise<void> {
    this.items.clear();
    this.stepExecutions.clear();
    this.approvals.clear();
    this.outcomes.clear();
  }
}

export const workflowRunRepository = new WorkflowRunRepository();
