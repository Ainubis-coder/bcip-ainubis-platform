/**
 * BCIP CRM Campaign Domain Service
 */

import { campaignRepository, CampaignRepository } from '../repositories/campaign.repository.ts';
import type { QueryOptions } from '../repositories/base.repository.ts';
import { crmAuditService, CRMAuditService } from '../audit/crm-audit.ts';
import type { Campaign, CreateCampaignDto, UpdateCampaignDto } from '../types.ts';

export class CampaignService {
  private campaignRepo: CampaignRepository;
  private audit: CRMAuditService;

  constructor(
    campaignRepo: CampaignRepository = campaignRepository,
    audit: CRMAuditService = crmAuditService
  ) {
    this.campaignRepo = campaignRepo;
    this.audit = audit;
  }

  public async create(tenantId: string, dto: CreateCampaignDto, actorUserId: string): Promise<Campaign> {
    if (!dto.name) {
      throw new Error('Campaign name is required');
    }

    const campaign = await this.campaignRepo.createCampaign(tenantId, dto);

    await this.audit.record(
      tenantId,
      'campaign',
      campaign.id,
      'CAMPAIGN_CREATED',
      actorUserId,
      undefined,
      campaign as unknown as Record<string, unknown>
    );

    return campaign;
  }

  public async getById(tenantId: string, id: string): Promise<Campaign | null> {
    return this.campaignRepo.findById(tenantId, id);
  }

  public async list(tenantId: string, options?: QueryOptions): Promise<Campaign[]> {
    return this.campaignRepo.findAll(tenantId, options);
  }

  public count(tenantId: string, options?: QueryOptions): number {
    return this.campaignRepo.count(tenantId, options);
  }

  public async softDelete(tenantId: string, id: string, actorUserId: string): Promise<boolean> {
    const before = await this.campaignRepo.findById(tenantId, id);
    if (!before) return false;

    const ok = await this.campaignRepo.softDelete(tenantId, id);
    if (ok) {
      await this.audit.record(
        tenantId,
        'campaign',
        id,
        'CAMPAIGN_SOFT_DELETED',
        actorUserId,
        before as unknown as Record<string, unknown>
      );
    }
    return ok;
  }

  public async update(tenantId: string, id: string, dto: UpdateCampaignDto, actorUserId: string): Promise<Campaign> {
    const before = await this.campaignRepo.findById(tenantId, id);
    if (!before) {
      throw new Error(`Campaign not found: ${id}`);
    }

    const updated = await this.campaignRepo.update(tenantId, id, dto);
    if (!updated) {
      throw new Error(`Failed to update campaign: ${id}`);
    }

    await this.audit.record(
      tenantId,
      'campaign',
      id,
      'CAMPAIGN_UPDATED',
      actorUserId,
      before as unknown as Record<string, unknown>,
      updated as unknown as Record<string, unknown>
    );

    return updated;
  }
}

export const campaignService = new CampaignService();
