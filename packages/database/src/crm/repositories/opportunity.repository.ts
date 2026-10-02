/**
 * BCIP CRM Opportunity Repository
 * Tracks pipeline deals and immutable OpportunityStageHistory transitions.
 */

import { BaseCrmRepository, type QueryOptions } from './base.repository.ts';
import type { Opportunity, CreateOpportunityDto, OpportunityStageHistory } from '../types.ts';
import { OpportunityStage } from '../enums.ts';

export class OpportunityRepository extends BaseCrmRepository<Opportunity> {
  private stageHistory: Map<string, OpportunityStageHistory[]> = new Map();

  constructor() {
    super('crm_opportunities');
  }

  public async createOpportunity(
    tenantId: string,
    dto: CreateOpportunityDto,
    creatorUserId: string
  ): Promise<Opportunity> {
    const id = this.generateId('opp');
    const now = new Date().toISOString();
    const stage = dto.stage || OpportunityStage.DISCOVERY;

    const opp: Opportunity = {
      id,
      tenantId,
      organisationId: dto.organisationId,
      leadId: dto.leadId,
      primaryContactId: dto.primaryContactId,
      schemeProspectId: dto.schemeProspectId,
      name: dto.name,
      description: dto.description,
      stage,
      estimatedValue: Number(dto.estimatedValue) || 0,
      currency: dto.currency || 'ZAR',
      probability: typeof dto.probability === 'number' ? dto.probability : 20,
      expectedCloseDate: dto.expectedCloseDate,
      ownerUserId: dto.ownerUserId,
      source: dto.source,
      nextAction: dto.nextAction,
      nextActionAt: dto.nextActionAt,
      createdAt: now,
      updatedAt: now,
    };

    const saved = await this.create(opp);

    // Record initial stage in history
    await this.recordStageTransition(tenantId, id, undefined, stage, creatorUserId, 'Initial Opportunity Creation');

    return saved;
  }

  public async recordStageTransition(
    tenantId: string,
    opportunityId: string,
    fromStage: OpportunityStage | undefined,
    toStage: OpportunityStage,
    changedBy: string,
    reason?: string
  ): Promise<OpportunityStageHistory> {
    const historyId = this.generateId('osh');
    const historyRecord: OpportunityStageHistory = {
      id: historyId,
      tenantId,
      opportunityId,
      fromStage,
      toStage,
      changedBy,
      reason,
      changedAt: new Date().toISOString(),
    };

    if (!this.stageHistory.has(opportunityId)) {
      this.stageHistory.set(opportunityId, []);
    }
    this.stageHistory.get(opportunityId)!.push(historyRecord);

    return historyRecord;
  }

  public async updateStage(
    tenantId: string,
    opportunityId: string,
    newStage: OpportunityStage,
    actorUserId: string,
    reason?: string
  ): Promise<{ opportunity: Opportunity; history: OpportunityStageHistory } | null> {
    const existing = await this.findById(tenantId, opportunityId);
    if (!existing) {
      return null;
    }

    const previousStage = existing.stage;
    if (previousStage === newStage) {
      const history = await this.recordStageTransition(
        tenantId,
        opportunityId,
        previousStage,
        newStage,
        actorUserId,
        reason || 'Stage confirmed'
      );
      return { opportunity: existing, history };
    }

    const patch: Partial<Opportunity> = {
      stage: newStage,
    };

    if (newStage === OpportunityStage.WON) {
      patch.wonAt = new Date().toISOString();
      patch.probability = 100;
    } else if (newStage === OpportunityStage.LOST) {
      patch.lostAt = new Date().toISOString();
      patch.lossReason = reason;
      patch.probability = 0;
    } else if (newStage === OpportunityStage.PROPOSAL) {
      patch.probability = 60;
    } else if (newStage === OpportunityStage.CONTRACT) {
      patch.probability = 85;
    } else if (newStage === OpportunityStage.SOLUTION_DESIGN) {
      patch.probability = 40;
    }

    const updated = await this.update(tenantId, opportunityId, patch);
    if (!updated) return null;

    const history = await this.recordStageTransition(
      tenantId,
      opportunityId,
      previousStage,
      newStage,
      actorUserId,
      reason
    );

    return { opportunity: updated, history };
  }

  public getStageHistory(tenantId: string, opportunityId: string): OpportunityStageHistory[] {
    const list = this.stageHistory.get(opportunityId) || [];
    return list.filter((h) => h.tenantId === tenantId);
  }

  public async findByStage(tenantId: string, stage: OpportunityStage, options?: QueryOptions): Promise<Opportunity[]> {
    const all = await this.findAll(tenantId, options);
    return all.filter((o) => o.stage === stage);
  }

  public async findByOrganisation(tenantId: string, orgId: string): Promise<Opportunity[]> {
    const all = await this.findAll(tenantId);
    return all.filter((o) => o.organisationId === orgId);
  }

  public override clear(): void {
    super.clear();
    this.stageHistory.clear();
  }
}

export const opportunityRepository = new OpportunityRepository();
