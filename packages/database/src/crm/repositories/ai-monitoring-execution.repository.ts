/**
 * BCIP Ainubis AI Monitoring Execution Repository
 * Phase 2E — Prompt 002E-003: Ainubis Continuous CRM Intelligence & Automated Monitoring
 * Tenant-scoped in-memory execution repository tracking automated monitoring runs.
 */

import { BaseCrmRepository, type QueryOptions } from './base.repository.ts';
import type { AIMonitoringExecutionRecord, MonitoringExecutionStatus, MonitoringTriggerType } from '../ai-types.ts';

export interface MonitoringExecutionQueryOptions extends QueryOptions {
  capability?: string;
  status?: MonitoringExecutionStatus;
  triggerType?: MonitoringTriggerType;
}

export class AIMonitoringExecutionRepository extends BaseCrmRepository<AIMonitoringExecutionRecord> {
  constructor() {
    super('crm_ai_monitoring_executions');
  }

  public async recordExecution(
    tenantId: string,
    dto: Omit<AIMonitoringExecutionRecord, 'id' | 'tenantId' | 'createdAt' | 'updatedAt'>
  ): Promise<AIMonitoringExecutionRecord> {
    const id = this.generateId('mon_exec');
    const now = new Date().toISOString();
    const record: AIMonitoringExecutionRecord = {
      ...dto,
      id,
      tenantId,
      createdAt: now,
      updatedAt: now,
    };

    this.items.set(id, record);
    return { ...record };
  }

  public async updateExecution(
    tenantId: string,
    id: string,
    patch: Partial<AIMonitoringExecutionRecord>
  ): Promise<AIMonitoringExecutionRecord | null> {
    const existing = await this.findById(tenantId, id);
    if (!existing) return null;

    const updated: AIMonitoringExecutionRecord = {
      ...existing,
      ...patch,
      id,
      tenantId,
      updatedAt: new Date().toISOString(),
    };

    this.items.set(id, updated);
    return { ...updated };
  }

  public async findById(tenantId: string, id: string): Promise<AIMonitoringExecutionRecord | null> {
    const item = this.items.get(id);
    if (!item || item.tenantId !== tenantId) return null;
    return { ...item };
  }

  public async findMany(
    tenantId: string,
    options?: MonitoringExecutionQueryOptions
  ): Promise<{ data: AIMonitoringExecutionRecord[]; total: number }> {
    const results: AIMonitoringExecutionRecord[] = [];

    for (const item of this.items.values()) {
      if (!this.matchesQuery(item, tenantId, options)) continue;
      if (options?.capability && item.capability !== options.capability) continue;
      if (options?.status && item.status !== options.status) continue;
      if (options?.triggerType && item.triggerType !== options.triggerType) continue;

      results.push({ ...item });
    }

    const total = results.length;

    // Default sort by startedAt descending
    results.sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime());

    const offset = options?.offset || 0;
    const limit = options?.limit || 50;
    const paginated = results.slice(offset, offset + limit);

    return { data: paginated, total };
  }

  public async getLatestForTenant(tenantId: string): Promise<AIMonitoringExecutionRecord | null> {
    const { data } = await this.findMany(tenantId, { limit: 1 });
    return data.length > 0 ? data[0] : null;
  }

  public async clear(): Promise<void> {
    this.items.clear();
  }
}

export const aiMonitoringExecutionRepository = new AIMonitoringExecutionRepository();
