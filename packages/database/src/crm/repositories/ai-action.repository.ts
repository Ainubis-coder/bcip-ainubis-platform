/**
 * BCIP Ainubis AI Action Repository
 * Phase 2E — Prompt 002E-004: Ainubis Intelligence Actions & Human-Approved CRM Automation
 * Tenant-isolated in-memory repository for Ainubis AI actions, evidence, approvals, and executions.
 */

import { BaseCrmRepository, type QueryOptions } from './base.repository.ts';
import {
  type AIActionRecord,
  type AIActionEvidence,
  type AIActionApproval,
  type AIActionExecution,
  type AIActionVerification,
  AIActionStatus,
} from '../ai-types.ts';

export interface AIActionQueryOptions extends QueryOptions {
  status?: AIActionStatus;
  actionType?: string;
  targetEntityType?: string;
  targetEntityId?: string;
}

export class AIActionRepository extends BaseCrmRepository<AIActionRecord> {
  // Auxiliary in-memory store for related sub-entities
  private evidenceStore: Map<string, AIActionEvidence> = new Map();
  private approvalStore: Map<string, AIActionApproval> = new Map();
  private executionStore: Map<string, AIActionExecution> = new Map();
  private verificationStore: Map<string, AIActionVerification> = new Map();

  constructor() {
    super('crm_ai_actions');
  }

  // AI Actions Methods
  public async createAction(
    tenantId: string,
    record: Omit<AIActionRecord, 'id' | 'tenantId' | 'createdAt' | 'updatedAt'>
  ): Promise<AIActionRecord> {
    const id = this.generateId('act');
    const now = new Date().toISOString();

    const newRecord: AIActionRecord = {
      ...record,
      id,
      tenantId,
      createdAt: now,
      updatedAt: now,
    };

    this.items.set(id, newRecord);
    return { ...newRecord };
  }

  public async findMany(
    tenantId: string,
    options?: AIActionQueryOptions
  ): Promise<{ data: AIActionRecord[]; total: number }> {
    let results: AIActionRecord[] = [];

    for (const item of this.items.values()) {
      if (!this.matchesQuery(item, tenantId, options)) continue;

      if (options?.status && item.status !== options.status) continue;
      if (options?.actionType && item.actionType !== options.actionType) continue;
      if (options?.targetEntityType && item.targetEntityType !== options.targetEntityType) continue;
      if (options?.targetEntityId && item.targetEntityId !== options.targetEntityId) continue;

      results.push({ ...item });
    }

    const total = results.length;

    // Sorting by createdAt descending
    results.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const offset = options?.offset || 0;
    const limit = options?.limit || 50;
    const paginated = results.slice(offset, offset + limit);

    return { data: paginated, total };
  }

  // Evidence Methods
  public async createEvidence(
    tenantId: string,
    evidence: Omit<AIActionEvidence, 'id' | 'tenantId' | 'createdAt' | 'updatedAt'>
  ): Promise<AIActionEvidence> {
    const id = this.generateId('evd');
    const now = new Date().toISOString();

    const record: AIActionEvidence = {
      ...evidence,
      id,
      tenantId,
      createdAt: now,
      updatedAt: now,
    };

    this.evidenceStore.set(id, record);
    return { ...record };
  }

  public async findEvidenceByActionId(tenantId: string, actionId: string): Promise<AIActionEvidence[]> {
    const results: AIActionEvidence[] = [];
    for (const item of this.evidenceStore.values()) {
      if (item.tenantId === tenantId && item.actionId === actionId) {
        results.push({ ...item });
      }
    }
    return results;
  }

  // Approvals Methods
  public async createApproval(
    tenantId: string,
    approval: Omit<AIActionApproval, 'id' | 'tenantId' | 'createdAt' | 'updatedAt'>
  ): Promise<AIActionApproval> {
    const id = this.generateId('appr');
    const now = new Date().toISOString();

    const record: AIActionApproval = {
      ...approval,
      id,
      tenantId,
      createdAt: now,
      updatedAt: now,
    };

    this.approvalStore.set(id, record);
    return { ...record };
  }

  public async findApprovalsByActionId(tenantId: string, actionId: string): Promise<AIActionApproval[]> {
    const results: AIActionApproval[] = [];
    for (const item of this.approvalStore.values()) {
      if (item.tenantId === tenantId && item.actionId === actionId) {
        results.push({ ...item });
      }
    }
    return results;
  }

  // Executions Methods
  public async createExecution(
    tenantId: string,
    execution: Omit<AIActionExecution, 'id' | 'tenantId' | 'createdAt' | 'updatedAt'>
  ): Promise<AIActionExecution> {
    const id = this.generateId('exec');
    const now = new Date().toISOString();

    const record: AIActionExecution = {
      ...execution,
      id,
      tenantId,
      createdAt: now,
      updatedAt: now,
    };

    this.executionStore.set(id, record);
    return { ...record };
  }

  public async findExecutionsByActionId(tenantId: string, actionId: string): Promise<AIActionExecution[]> {
    const results: AIActionExecution[] = [];
    for (const item of this.executionStore.values()) {
      if (item.tenantId === tenantId && item.actionId === actionId) {
        results.push({ ...item });
      }
    }
    return results;
  }

  // Verifications Methods
  public async createVerification(
    tenantId: string,
    verification: Omit<AIActionVerification, 'id' | 'tenantId' | 'createdAt' | 'updatedAt'>
  ): Promise<AIActionVerification> {
    const id = this.generateId('ver');
    const now = new Date().toISOString();

    const record: AIActionVerification = {
      ...verification,
      id,
      tenantId,
      createdAt: now,
      updatedAt: now,
    };

    this.verificationStore.set(id, record);
    return { ...record };
  }

  public async findVerificationsByActionId(tenantId: string, actionId: string): Promise<AIActionVerification[]> {
    const results: AIActionVerification[] = [];
    for (const item of this.verificationStore.values()) {
      if (item.tenantId === tenantId && item.actionId === actionId) {
        results.push({ ...item });
      }
    }
    return results;
  }

  // Clean-up for Testing
  public async clear(): Promise<void> {
    this.items.clear();
    this.evidenceStore.clear();
    this.approvalStore.clear();
    this.executionStore.clear();
    this.verificationStore.clear();
  }
}

export const aiActionRepository = new AIActionRepository();
