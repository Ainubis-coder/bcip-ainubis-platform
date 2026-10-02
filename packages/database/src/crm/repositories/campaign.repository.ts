/**
 * BCIP CRM Campaign Repository
 */

import { BaseCrmRepository } from './base.repository.ts';
import type { Campaign, CreateCampaignDto } from '../types.ts';
import { CampaignStatus, CampaignType } from '../enums.ts';

export class CampaignRepository extends BaseCrmRepository<Campaign> {
  constructor() {
    super('crm_campaigns');
  }

  public async createCampaign(tenantId: string, dto: CreateCampaignDto): Promise<Campaign> {
    const id = this.generateId('cmp');
    const now = new Date().toISOString();

    const campaign: Campaign = {
      id,
      tenantId,
      name: dto.name,
      description: dto.description,
      campaignType: dto.campaignType || CampaignType.MARKETING,
      status: dto.status || CampaignStatus.PLANNING,
      budget: dto.budget,
      actualSpend: dto.actualSpend,
      startDate: dto.startDate,
      endDate: dto.endDate,
      ownerUserId: dto.ownerUserId,
      createdAt: now,
      updatedAt: now,
    };

    return this.create(campaign);
  }
}

export const campaignRepository = new CampaignRepository();
