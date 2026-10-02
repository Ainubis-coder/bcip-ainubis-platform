/**
 * BCIP CRM Opportunity Domain Service
 * Enforces sales pipeline governance, stage velocity audit trails, and win/loss analytics.
 */

import { opportunityRepository, OpportunityRepository } from '../repositories/opportunity.repository.ts';
import { organisationRepository, OrganisationRepository } from '../repositories/organisation.repository.ts';
import { contactRepository, ContactRepository } from '../repositories/contact.repository.ts';
import { schemeProspectRepository, SchemeProspectRepository } from '../repositories/scheme-prospect.repository.ts';
import { crmAuditService, CRMAuditService } from '../audit/crm-audit.ts';
import { crmEventBus, CRMEventBus } from '../events/crm-events.ts';
import type { Opportunity, CreateOpportunityDto, UpdateOpportunityDto, OpportunityStageHistory } from '../types.ts';
import { OpportunityStage, CRMEventType } from '../enums.ts';
import type { QueryOptions } from '../repositories/base.repository.ts';

export interface PipelineStageSummary {
  stage: OpportunityStage;
  count: number;
  totalValue: number;
  weightedValue: number;
  averageProbability: number;
  opportunities: Opportunity[];
}

export interface PipelineSummary {
  totalOpportunities: number;
  totalPipelineValue: number;
  totalWeightedValue: number;
  stages: Record<OpportunityStage, PipelineStageSummary>;
}

export class OpportunityService {
  private oppRepo: OpportunityRepository;
  private orgRepo: OrganisationRepository;
  private contactRepo: ContactRepository;
  private prospectRepo: SchemeProspectRepository;
  private audit: CRMAuditService;
  private eventBus: CRMEventBus;

  constructor(
    oppRepo: OpportunityRepository = opportunityRepository,
    orgRepo: OrganisationRepository = organisationRepository,
    contactRepo: ContactRepository = contactRepository,
    prospectRepo: SchemeProspectRepository = schemeProspectRepository,
    audit: CRMAuditService = crmAuditService,
    eventBus: CRMEventBus = crmEventBus
  ) {
    this.oppRepo = oppRepo;
    this.orgRepo = orgRepo;
    this.contactRepo = contactRepo;
    this.prospectRepo = prospectRepo;
    this.audit = audit;
    this.eventBus = eventBus;
  }

  public async create(
    tenantId: string,
    dto: CreateOpportunityDto,
    actorUserId: string
  ): Promise<Opportunity> {
    if (!dto.name) {
      throw new Error('Opportunity name is required');
    }

    if (dto.organisationId) {
      const org = await this.orgRepo.findById(tenantId, dto.organisationId);
      if (!org) {
        throw new Error(`Invalid organisation reference: ${dto.organisationId}`);
      }
    }

    if (dto.primaryContactId) {
      const cnt = await this.contactRepo.findById(tenantId, dto.primaryContactId);
      if (!cnt) {
        throw new Error(`Invalid contact reference: ${dto.primaryContactId}`);
      }
    }

    if (dto.schemeProspectId) {
      const sp = await this.prospectRepo.findById(tenantId, dto.schemeProspectId);
      if (!sp) {
        throw new Error(`Invalid scheme prospect reference: ${dto.schemeProspectId}`);
      }
    }

    const opp = await this.oppRepo.createOpportunity(tenantId, dto, actorUserId);

    await this.audit.record(
      tenantId,
      'opportunity',
      opp.id,
      'OPPORTUNITY_CREATED',
      actorUserId,
      undefined,
      opp as unknown as Record<string, unknown>
    );

    await this.eventBus.publish(
      CRMEventType.OPPORTUNITY_CREATED,
      tenantId,
      { opportunityId: opp.id, name: opp.name, stage: opp.stage, value: opp.estimatedValue },
      actorUserId
    );

    return opp;
  }

  public async getById(tenantId: string, id: string): Promise<Opportunity | null> {
    return this.oppRepo.findById(tenantId, id);
  }

  public async list(tenantId: string, options?: QueryOptions | OpportunityStage): Promise<Opportunity[]> {
    if (typeof options === 'string') {
      return this.oppRepo.findByStage(tenantId, options);
    }
    return this.oppRepo.findAll(tenantId, options);
  }

  public count(tenantId: string, options?: QueryOptions): number {
    return this.oppRepo.count(tenantId, options);
  }

  public async getPipelineSummary(
    tenantId: string,
    filters?: {
      stage?: OpportunityStage;
      owner?: string;
      status?: string;
      fromDate?: string;
      toDate?: string;
    }
  ): Promise<PipelineSummary> {
    const all = await this.oppRepo.findAll(tenantId);
    let filtered = all;

    if (filters?.stage) {
      filtered = filtered.filter((o) => o.stage === filters.stage);
    }
    if (filters?.owner) {
      filtered = filtered.filter((o) => o.ownerUserId === filters.owner);
    }
    if (filters?.fromDate) {
      filtered = filtered.filter((o) => o.createdAt >= filters.fromDate!);
    }
    if (filters?.toDate) {
      filtered = filtered.filter((o) => o.createdAt <= filters.toDate!);
    }

    const allStages: OpportunityStage[] = [
      OpportunityStage.DISCOVERY,
      OpportunityStage.SOLUTION_DESIGN,
      OpportunityStage.PROPOSAL,
      OpportunityStage.CONTRACT,
      OpportunityStage.WON,
      OpportunityStage.LOST,
    ];

    const stages: Record<OpportunityStage, PipelineStageSummary> = {} as Record<OpportunityStage, PipelineStageSummary>;
    let totalPipelineValue = 0;
    let totalWeightedValue = 0;

    for (const stage of allStages) {
      const stageOpps = filtered.filter((o) => o.stage === stage);
      const stageTotal = stageOpps.reduce((acc, o) => acc + (Number(o.estimatedValue) || 0), 0);
      const stageWeighted = stageOpps.reduce((acc, o) => acc + ((Number(o.estimatedValue) || 0) * (o.probability || 0)) / 100, 0);
      const avgProb = stageOpps.length > 0
        ? Math.round(stageOpps.reduce((acc, o) => acc + (o.probability || 0), 0) / stageOpps.length)
        : 0;

      stages[stage] = {
        stage,
        count: stageOpps.length,
        totalValue: Math.round(stageTotal * 100) / 100,
        weightedValue: Math.round(stageWeighted * 100) / 100,
        averageProbability: avgProb,
        opportunities: stageOpps,
      };

      totalPipelineValue += stageTotal;
      totalWeightedValue += stageWeighted;
    }

    return {
      totalOpportunities: filtered.length,
      totalPipelineValue: Math.round(totalPipelineValue * 100) / 100,
      totalWeightedValue: Math.round(totalWeightedValue * 100) / 100,
      stages,
    };
  }

  public async transitionStage(
    tenantId: string,
    opportunityId: string,
    newStage: OpportunityStage,
    actorUserId: string,
    reason?: string
  ): Promise<{ opportunity: Opportunity; history: OpportunityStageHistory }> {
    const existing = await this.oppRepo.findById(tenantId, opportunityId);
    if (!existing) {
      throw new Error(`Opportunity not found: ${opportunityId}`);
    }

    const fromStage = existing.stage;
    const result = await this.oppRepo.updateStage(tenantId, opportunityId, newStage, actorUserId, reason);
    if (!result) {
      throw new Error(`Failed to transition stage for opportunity: ${opportunityId}`);
    }

    await this.audit.record(
      tenantId,
      'opportunity',
      opportunityId,
      'OPPORTUNITY_STAGE_CHANGED',
      actorUserId,
      { stage: fromStage },
      { stage: newStage, reason }
    );

    await this.eventBus.publish(
      CRMEventType.OPPORTUNITY_STAGE_CHANGED,
      tenantId,
      {
        opportunityId,
        fromStage,
        toStage: newStage,
        reason,
        value: result.opportunity.estimatedValue,
      },
      actorUserId
    );

    return result;
  }

  public async update(
    tenantId: string,
    id: string,
    dto: UpdateOpportunityDto,
    actorUserId: string
  ): Promise<Opportunity> {
    const before = await this.oppRepo.findById(tenantId, id);
    if (!before) {
      throw new Error(`Opportunity not found: ${id}`);
    }

    const updated = await this.oppRepo.update(tenantId, id, dto);
    if (!updated) {
      throw new Error(`Failed to update opportunity: ${id}`);
    }

    await this.audit.record(
      tenantId,
      'opportunity',
      id,
      'OPPORTUNITY_UPDATED',
      actorUserId,
      before as unknown as Record<string, unknown>,
      updated as unknown as Record<string, unknown>
    );

    await this.eventBus.publish(
      CRMEventType.OPPORTUNITY_UPDATED,
      tenantId,
      { opportunityId: id, changes: dto },
      actorUserId
    );

    return updated;
  }

  public getStageHistory(tenantId: string, opportunityId: string): OpportunityStageHistory[] {
    return this.oppRepo.getStageHistory(tenantId, opportunityId);
  }

  public async softDelete(tenantId: string, id: string, actorUserId: string): Promise<boolean> {
    const before = await this.oppRepo.findById(tenantId, id);
    if (!before) return false;

    const ok = await this.oppRepo.softDelete(tenantId, id);
    if (ok) {
      await this.audit.record(
        tenantId,
        'opportunity',
        id,
        'OPPORTUNITY_SOFT_DELETED',
        actorUserId,
        before as unknown as Record<string, unknown>
      );
    }
    return ok;
  }
}

export const opportunityService = new OpportunityService();
