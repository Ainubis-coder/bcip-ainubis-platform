/**
 * BCIP CRM Lead Repository
 */

import { BaseCrmRepository, type QueryOptions } from './base.repository.ts';
import type { Lead, CreateLeadDto } from '../types.ts';
import { LeadStatus, LeadSource, QualificationStatus, ExpectedTimeline, DataQualityState } from '../enums.ts';

export class LeadRepository extends BaseCrmRepository<Lead> {
  constructor() {
    super('crm_leads');
  }

  public async createLead(tenantId: string, dto: CreateLeadDto): Promise<Lead> {
    const id = this.generateId('lead');
    const now = new Date().toISOString();

    const lead: Lead = {
      id,
      tenantId,
      organisationId: dto.organisationId,
      contactId: dto.contactId,
      source: dto.source || LeadSource.DIRECT_OUTREACH,
      sourceDetail: dto.sourceDetail,
      status: dto.status || LeadStatus.NEW,
      qualificationStatus: dto.qualificationStatus || QualificationStatus.UNQUALIFIED,
      leadOwnerId: dto.leadOwnerId,
      title: dto.title,
      description: dto.description,
      email: dto.email,
      phone: dto.phone,
      website: dto.website,
      schemeName: dto.schemeName,
      estimatedUnits: dto.estimatedUnits,
      managingAgent: dto.managingAgent,
      currentSystem: dto.currentSystem,
      painPoints: dto.painPoints || [],
      requiredModules: dto.requiredModules || [],
      expectedTimeline: dto.expectedTimeline || ExpectedTimeline.UNKNOWN,
      campaignId: dto.campaignId,
      lastContactedAt: dto.lastContactedAt,
      nextActionAt: dto.nextActionAt,
      dataQualityState: dto.dataQualityState || DataQualityState.UNVERIFIED,
      aiContext: dto.aiContext,
      lineage: dto.lineage,
      createdAt: now,
      updatedAt: now,
    };

    return this.create(lead);
  }

  public async findByStatus(tenantId: string, status: LeadStatus, options?: QueryOptions): Promise<Lead[]> {
    const all = await this.findAll(tenantId, options);
    return all.filter((l) => l.status === status);
  }

  public async findByOwner(tenantId: string, ownerUserId: string, options?: QueryOptions): Promise<Lead[]> {
    const all = await this.findAll(tenantId, options);
    return all.filter((l) => l.leadOwnerId === ownerUserId);
  }

  public async findByCampaign(tenantId: string, campaignId: string, options?: QueryOptions): Promise<Lead[]> {
    const all = await this.findAll(tenantId, options);
    return all.filter((l) => l.campaignId === campaignId);
  }
}

export const leadRepository = new LeadRepository();
