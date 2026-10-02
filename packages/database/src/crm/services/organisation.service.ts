/**
 * BCIP CRM Organisation Domain Service
 */

import { organisationRepository, OrganisationRepository } from '../repositories/organisation.repository.ts';
import { contactRepository, ContactRepository } from '../repositories/contact.repository.ts';
import { opportunityRepository, OpportunityRepository } from '../repositories/opportunity.repository.ts';
import { schemeProspectRepository, SchemeProspectRepository } from '../repositories/scheme-prospect.repository.ts';
import type { QueryOptions } from '../repositories/base.repository.ts';
import { crmAuditService, CRMAuditService } from '../audit/crm-audit.ts';
import { crmEventBus, CRMEventBus } from '../events/crm-events.ts';
import type { Organisation, CreateOrganisationDto, UpdateOrganisationDto, Contact, Opportunity, SchemeProspect } from '../types.ts';
import { CRMEventType, OrganisationStatus } from '../enums.ts';

export class OrganisationService {
  private orgRepo: OrganisationRepository;
  private contactRepo: ContactRepository;
  private oppRepo: OpportunityRepository;
  private prospectRepo: SchemeProspectRepository;
  private audit: CRMAuditService;
  private eventBus: CRMEventBus;

  constructor(
    orgRepo: OrganisationRepository = organisationRepository,
    contactRepo: ContactRepository = contactRepository,
    oppRepo: OpportunityRepository = opportunityRepository,
    prospectRepo: SchemeProspectRepository = schemeProspectRepository,
    audit: CRMAuditService = crmAuditService,
    eventBus: CRMEventBus = crmEventBus
  ) {
    this.orgRepo = orgRepo;
    this.contactRepo = contactRepo;
    this.oppRepo = oppRepo;
    this.prospectRepo = prospectRepo;
    this.audit = audit;
    this.eventBus = eventBus;
  }

  public async create(
    tenantId: string,
    dto: CreateOrganisationDto,
    actorUserId: string
  ): Promise<Organisation> {
    if (!dto.name || dto.name.trim().length === 0) {
      throw new Error('Organisation name is required');
    }

    const org = await this.orgRepo.createOrganisation(tenantId, dto);

    // Audit Log
    await this.audit.record(
      tenantId,
      'organisation',
      org.id,
      'ORGANISATION_CREATED',
      actorUserId,
      undefined,
      org as unknown as Record<string, unknown>
    );

    // Event Publish
    await this.eventBus.publish(
      CRMEventType.ORGANISATION_CREATED,
      tenantId,
      { organisationId: org.id, name: org.name, type: org.organisationType },
      actorUserId
    );

    return org;
  }

  public async getById(tenantId: string, id: string): Promise<Organisation | null> {
    return this.orgRepo.findById(tenantId, id);
  }

  public async list(tenantId: string, options?: QueryOptions | OrganisationStatus): Promise<Organisation[]> {
    if (typeof options === 'string') {
      return this.orgRepo.findByStatus(tenantId, options);
    }
    return this.orgRepo.findAll(tenantId, options);
  }

  public count(tenantId: string, options?: QueryOptions): number {
    return this.orgRepo.count(tenantId, options);
  }

  public async getContacts(tenantId: string, orgId: string, options?: QueryOptions): Promise<Contact[]> {
    const org = await this.orgRepo.findById(tenantId, orgId);
    if (!org) return [];
    return this.contactRepo.findByOrganisation(tenantId, orgId, options);
  }

  public async getOpportunities(tenantId: string, orgId: string): Promise<Opportunity[]> {
    const org = await this.orgRepo.findById(tenantId, orgId);
    if (!org) return [];
    return this.oppRepo.findByOrganisation(tenantId, orgId);
  }

  public async getSchemeProspects(tenantId: string, orgId: string, options?: QueryOptions): Promise<SchemeProspect[]> {
    const org = await this.orgRepo.findById(tenantId, orgId);
    if (!org) return [];
    return this.prospectRepo.findByOrganisation(tenantId, orgId, options);
  }

  public async update(
    tenantId: string,
    id: string,
    dto: UpdateOrganisationDto,
    actorUserId: string
  ): Promise<Organisation> {
    const before = await this.orgRepo.findById(tenantId, id);
    if (!before) {
      throw new Error(`Organisation not found: ${id}`);
    }

    const updated = await this.orgRepo.update(tenantId, id, dto);
    if (!updated) {
      throw new Error(`Failed to update organisation: ${id}`);
    }

    await this.audit.record(
      tenantId,
      'organisation',
      id,
      'ORGANISATION_UPDATED',
      actorUserId,
      before as unknown as Record<string, unknown>,
      updated as unknown as Record<string, unknown>
    );

    await this.eventBus.publish(
      CRMEventType.ORGANISATION_UPDATED,
      tenantId,
      { organisationId: id, changes: dto },
      actorUserId
    );

    return updated;
  }

  public async softDelete(tenantId: string, id: string, actorUserId: string): Promise<boolean> {
    const before = await this.orgRepo.findById(tenantId, id);
    if (!before) return false;

    const ok = await this.orgRepo.softDelete(tenantId, id);
    if (ok) {
      await this.audit.record(
        tenantId,
        'organisation',
        id,
        'ORGANISATION_SOFT_DELETED',
        actorUserId,
        before as unknown as Record<string, unknown>
      );
    }
    return ok;
  }
}

export const organisationService = new OrganisationService();
