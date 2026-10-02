/**
 * BCIP Automation Workflow Repository
 * Phase 2E — Prompt 002E-005: Ainubis CRM Automation Orchestration & Workflow Intelligence
 */

import { BaseCrmRepository, type QueryOptions } from './base.repository.ts';
import {
  type AutomationWorkflow,
  type WorkflowStatus,
} from '../workflow-types.ts';

export interface WorkflowQueryOptions extends QueryOptions {
  status?: WorkflowStatus;
  workflowKey?: string;
}

export class AutomationWorkflowRepository extends BaseCrmRepository<AutomationWorkflow> {
  constructor() {
    super('crm_ai_workflows');
  }

  public async createWorkflow(
    tenantId: string,
    workflow: Omit<AutomationWorkflow, 'id' | 'tenantId' | 'createdAt' | 'updatedAt'>
  ): Promise<AutomationWorkflow> {
    const id = this.generateId('wf');
    const now = new Date().toISOString();

    const record: AutomationWorkflow = {
      ...workflow,
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
    options?: WorkflowQueryOptions
  ): Promise<{ data: AutomationWorkflow[]; total: number }> {
    const results: AutomationWorkflow[] = [];

    for (const item of this.items.values()) {
      if (!this.matchesQuery(item, tenantId, options)) continue;

      if (options?.status && item.status !== options.status) continue;
      if (options?.workflowKey && item.workflowKey !== options.workflowKey) continue;

      results.push({ ...item });
    }

    const total = results.length;

    // Sort by createdAt descending
    results.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const offset = options?.offset || 0;
    const limit = options?.limit || 50;
    const paginated = results.slice(offset, offset + limit);

    return { data: paginated, total };
  }

  public async findByKey(tenantId: string, workflowKey: string): Promise<AutomationWorkflow | undefined> {
    for (const item of this.items.values()) {
      if (item.tenantId === tenantId && item.workflowKey === workflowKey && item.status !== 'ARCHIVED') {
        return { ...item };
      }
    }
    return undefined;
  }

  public async clear(): Promise<void> {
    this.items.clear();
  }
}

export const automationWorkflowRepository = new AutomationWorkflowRepository();
