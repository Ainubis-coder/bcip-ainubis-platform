/**
 * BCIP Ainubis CRM AI Observation Repository
 * Phase 2E — Prompt 002E-001: Ainubis CRM Intelligence Foundation & Governance
 */

import { BaseCrmRepository, type QueryOptions } from './base.repository.ts';
import {
  type AIObservationRecord,
  type CreateAIObservationDto,
  IntelligenceType,
  IntelligenceStatus,
  AICapability,
} from '../ai-types.ts';

export interface AIObservationQueryOptions extends QueryOptions {
  capability?: AICapability;
  intelligenceType?: IntelligenceType;
  status?: IntelligenceStatus;
  targetEntityType?: string;
  targetEntityId?: string;
  conditionKey?: string;
  sourceMode?: 'AUTOMATED_MONITORING' | 'MANUAL_ANALYSIS' | 'EVENT_TRIGGERED';
}

export class AIObservationRepository extends BaseCrmRepository<AIObservationRecord> {
  constructor() {
    super('crm_ai_observations');
  }

  public async createObservation(
    tenantId: string,
    dto: CreateAIObservationDto
  ): Promise<AIObservationRecord> {
    const id = this.generateId('obs');
    const now = new Date().toISOString();

    const record: AIObservationRecord = {
      ...dto,
      id,
      tenantId,
      status: dto.status || IntelligenceStatus.GENERATED,
      createdAt: now,
      updatedAt: now,
    };

    this.items.set(id, record);
    return { ...record };
  }

  public async findById(
    tenantId: string,
    id: string
  ): Promise<AIObservationRecord | null> {
    const item = this.items.get(id);
    if (!item) return null;
    if (item.tenantId !== tenantId) return null;
    return { ...item };
  }

  public async findMany(
    tenantId: string,
    options?: AIObservationQueryOptions
  ): Promise<{ data: AIObservationRecord[]; total: number }> {
    let results: AIObservationRecord[] = [];

    for (const item of this.items.values()) {
      if (!this.matchesQuery(item, tenantId, options)) continue;

      if (options?.capability && item.capability !== options.capability) continue;
      if (options?.intelligenceType && item.intelligenceType !== options.intelligenceType) continue;
      if (options?.status && item.status !== options.status) continue;
      if (options?.targetEntityType && item.targetEntityType !== options.targetEntityType) continue;
      if (options?.targetEntityId && item.targetEntityId !== options.targetEntityId) continue;
      if (options?.conditionKey && item.conditionKey !== options.conditionKey) continue;
      if (options?.sourceMode && item.sourceMode !== options.sourceMode) continue;

      results.push({ ...item });
    }

    // Search filter
    if (options?.search && options.search.trim().length > 0) {
      const q = options.search.trim().toLowerCase();
      results = results.filter(
        (r) =>
          r.title.toLowerCase().includes(q) ||
          r.summary.toLowerCase().includes(q) ||
          r.observation.toLowerCase().includes(q)
      );
    }

    const total = results.length;

    // Sorting
    const sortBy = options?.sortBy || 'createdAt';
    const sortOrder = options?.sortOrder || 'desc';

    results.sort((a, b) => {
      const valA = (a as unknown as Record<string, unknown>)[sortBy];
      const valB = (b as unknown as Record<string, unknown>)[sortBy];

      if (valA === valB) return 0;
      if (valA === undefined || valA === null) return 1;
      if (valB === undefined || valB === null) return -1;

      if (sortOrder === 'asc') {
        return valA < valB ? -1 : 1;
      }
      return valA > valB ? -1 : 1;
    });

    // Pagination
    const offset = options?.offset || 0;
    const limit = options?.limit || 50;
    const paginated = results.slice(offset, offset + limit);

    return { data: paginated, total };
  }

  public async update(
    tenantId: string,
    id: string,
    patch: Partial<AIObservationRecord>
  ): Promise<AIObservationRecord | null> {
    const existing = await this.findById(tenantId, id);
    if (!existing) return null;

    const updated: AIObservationRecord = {
      ...existing,
      ...patch,
      tenantId, // Immutable tenant boundary
      id, // Immutable ID
      updatedAt: new Date().toISOString(),
    };

    this.items.set(id, updated);
    return { ...updated };
  }

  /**
   * Finds an active observation for the specified entity and condition.
   * Active statuses: GENERATED, REVIEWED, APPROVED, REOPENED.
   */
  public async findActiveByCondition(
    tenantId: string,
    targetEntityType: string,
    targetEntityId: string,
    conditionKey: string
  ): Promise<AIObservationRecord | null> {
    for (const item of this.items.values()) {
      if (item.tenantId !== tenantId) continue;
      if (item.targetEntityType !== targetEntityType) continue;
      if (item.targetEntityId !== targetEntityId) continue;
      if (item.conditionKey !== conditionKey) continue;

      const isActive =
        item.status === IntelligenceStatus.GENERATED ||
        item.status === IntelligenceStatus.REVIEWED ||
        item.status === IntelligenceStatus.APPROVED ||
        item.status === IntelligenceStatus.REOPENED;

      if (isActive) {
        return { ...item };
      }
    }
    return null;
  }

  /**
   * Finds the latest observation for the specified entity and condition (active or past).
   */
  public async findLatestByCondition(
    tenantId: string,
    targetEntityType: string,
    targetEntityId: string,
    conditionKey: string
  ): Promise<AIObservationRecord | null> {
    const matches: AIObservationRecord[] = [];
    for (const item of this.items.values()) {
      if (item.tenantId !== tenantId) continue;
      if (item.targetEntityType !== targetEntityType) continue;
      if (item.targetEntityId !== targetEntityId) continue;
      if (item.conditionKey !== conditionKey) continue;
      matches.push({ ...item });
    }

    if (matches.length === 0) return null;
    matches.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return matches[0];
  }

  /**
   * Resolves an observation when the observed condition is verified no longer present in CRM data.
   */
  public async resolveObservation(
    tenantId: string,
    id: string,
    reason: string = 'Observed condition verified resolved in CRM data'
  ): Promise<AIObservationRecord | null> {
    const existing = await this.findById(tenantId, id);
    if (!existing) return null;

    return this.update(tenantId, id, {
      status: IntelligenceStatus.RESOLVED,
      resolvedAt: new Date().toISOString(),
      resolvedReason: reason,
    });
  }

  /**
   * Reopens an observation or records a new occurrence linked to a previously resolved observation.
   */
  public async reopenObservation(
    tenantId: string,
    previousObservationId: string,
    patch?: Partial<CreateAIObservationDto>
  ): Promise<AIObservationRecord | null> {
    const prev = await this.findById(tenantId, previousObservationId);
    if (!prev) return null;

    const reopened: AIObservationRecord = {
      ...prev,
      ...patch,
      id: this.generateId('obs'),
      tenantId,
      status: IntelligenceStatus.REOPENED,
      reopenedAt: new Date().toISOString(),
      reopenedFromId: prev.id,
      resolvedAt: undefined,
      resolvedReason: undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.items.set(reopened.id, reopened);
    return { ...reopened };
  }

  public async clear(): Promise<void> {
    this.items.clear();
  }
}

export const aiObservationRepository = new AIObservationRepository();
