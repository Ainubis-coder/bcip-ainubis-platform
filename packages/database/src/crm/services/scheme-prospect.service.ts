/**
 * BCIP CRM Scheme Prospect Domain Service
 * Represents CRM prospect schemes prior to onboarding into Phase 006 Property Intelligence.
 */

import { schemeProspectRepository, SchemeProspectRepository } from '../repositories/scheme-prospect.repository.ts';
import { organisationRepository, OrganisationRepository } from '../repositories/organisation.repository.ts';
import type { QueryOptions } from '../repositories/base.repository.ts';
import { crmAuditService, CRMAuditService } from '../audit/crm-audit.ts';
import { crmEventBus, CRMEventBus } from '../events/crm-events.ts';
import type { SchemeProspect, CreateSchemeProspectDto, UpdateSchemeProspectDto } from '../types.ts';
import { CRMEventType } from '../enums.ts';

export class SchemeProspectService {
  private prospectRepo: SchemeProspectRepository;
  private orgRepo: OrganisationRepository;
  private audit: CRMAuditService;
  private eventBus: CRMEventBus;

  constructor(
    prospectRepo: SchemeProspectRepository = schemeProspectRepository,
    orgRepo: OrganisationRepository = organisationRepository,
    audit: CRMAuditService = crmAuditService,
    eventBus: CRMEventBus = crmEventBus
  ) {
    this.prospectRepo = prospectRepo;
    this.orgRepo = orgRepo;
    this.audit = audit;
    this.eventBus = eventBus;
  }

  public async create(
    tenantId: string,
    dto: CreateSchemeProspectDto,
    actorUserId: string
  ): Promise<SchemeProspect> {
    if (!dto.name) {
      throw new Error('Scheme prospect name is required');
    }

    if (dto.organisationId) {
      const org = await this.orgRepo.findById(tenantId, dto.organisationId);
      if (!org) {
        throw new Error(`Invalid organisation reference: ${dto.organisationId}`);
      }
    }

    const prospect = await this.prospectRepo.createProspect(tenantId, dto);

    await this.audit.record(
      tenantId,
      'scheme_prospect',
      prospect.id,
      'SCHEME_PROSPECT_CREATED',
      actorUserId,
      undefined,
      prospect as unknown as Record<string, unknown>
    );

    await this.eventBus.publish(
      CRMEventType.SCHEME_PROSPECT_CREATED,
      tenantId,
      { schemeProspectId: prospect.id, name: prospect.name, unitCount: prospect.estimatedUnitCount },
      actorUserId
    );

    return prospect;
  }

  public async getById(tenantId: string, id: string): Promise<SchemeProspect | null> {
    return this.prospectRepo.findById(tenantId, id);
  }

  public async list(tenantId: string, options?: QueryOptions): Promise<SchemeProspect[]> {
    return this.prospectRepo.findAll(tenantId, options);
  }

  public count(tenantId: string, options?: QueryOptions): number {
    return this.prospectRepo.count(tenantId, options);
  }

  public async listByOrganisation(tenantId: string, orgId: string): Promise<SchemeProspect[]> {
    return this.prospectRepo.findByOrganisation(tenantId, orgId);
  }

  public async update(
    tenantId: string,
    id: string,
    dto: UpdateSchemeProspectDto,
    actorUserId: string
  ): Promise<SchemeProspect> {
    const before = await this.prospectRepo.findById(tenantId, id);
    if (!before) {
      throw new Error(`Scheme prospect not found: ${id}`);
    }

    const updated = await this.prospectRepo.update(tenantId, id, dto);
    if (!updated) {
      throw new Error(`Failed to update scheme prospect: ${id}`);
    }

    await this.audit.record(
      tenantId,
      'scheme_prospect',
      id,
      'SCHEME_PROSPECT_UPDATED',
      actorUserId,
      before as unknown as Record<string, unknown>,
      updated as unknown as Record<string, unknown>
    );

    await this.eventBus.publish(
      CRMEventType.SCHEME_PROSPECT_UPDATED,
      tenantId,
      { schemeProspectId: id, changes: dto },
      actorUserId
    );

    return updated;
  }

  public async softDelete(tenantId: string, id: string, actorUserId: string): Promise<boolean> {
    const before = await this.prospectRepo.findById(tenantId, id);
    if (!before) return false;

    const ok = await this.prospectRepo.softDelete(tenantId, id);
    if (ok) {
      await this.audit.record(
        tenantId,
        'scheme_prospect',
        id,
        'SCHEME_PROSPECT_SOFT_DELETED',
        actorUserId,
        before as unknown as Record<string, unknown>
      );
    }
    return ok;
  }
}

export const schemeProspectService = new SchemeProspectService();
