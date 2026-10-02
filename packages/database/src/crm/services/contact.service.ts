/**
 * BCIP CRM Contact Domain Service
 */

import { contactRepository, ContactRepository } from '../repositories/contact.repository.ts';
import { organisationRepository, OrganisationRepository } from '../repositories/organisation.repository.ts';
import type { QueryOptions } from '../repositories/base.repository.ts';
import { crmAuditService, CRMAuditService } from '../audit/crm-audit.ts';
import { crmEventBus, CRMEventBus } from '../events/crm-events.ts';
import type { Contact, CreateContactDto, UpdateContactDto } from '../types.ts';
import { CRMEventType } from '../enums.ts';

export class ContactService {
  private contactRepo: ContactRepository;
  private orgRepo: OrganisationRepository;
  private audit: CRMAuditService;
  private eventBus: CRMEventBus;

  constructor(
    contactRepo: ContactRepository = contactRepository,
    orgRepo: OrganisationRepository = organisationRepository,
    audit: CRMAuditService = crmAuditService,
    eventBus: CRMEventBus = crmEventBus
  ) {
    this.contactRepo = contactRepo;
    this.orgRepo = orgRepo;
    this.audit = audit;
    this.eventBus = eventBus;
  }

  public async create(tenantId: string, dto: CreateContactDto, actorUserId: string): Promise<Contact> {
    if (!dto.firstName || !dto.lastName) {
      throw new Error('First name and last name are required');
    }

    if (dto.organisationId) {
      const org = await this.orgRepo.findById(tenantId, dto.organisationId);
      if (!org) {
        throw new Error(`Invalid organisation reference: ${dto.organisationId}`);
      }
    }

    const contact = await this.contactRepo.createContact(tenantId, dto);

    await this.audit.record(
      tenantId,
      'contact',
      contact.id,
      'CONTACT_CREATED',
      actorUserId,
      undefined,
      contact as unknown as Record<string, unknown>
    );

    await this.eventBus.publish(
      CRMEventType.CONTACT_CREATED,
      tenantId,
      { contactId: contact.id, name: contact.displayName, organisationId: contact.organisationId },
      actorUserId
    );

    return contact;
  }

  public async getById(tenantId: string, id: string): Promise<Contact | null> {
    return this.contactRepo.findById(tenantId, id);
  }

  public async list(tenantId: string, options?: QueryOptions): Promise<Contact[]> {
    return this.contactRepo.findAll(tenantId, options);
  }

  public count(tenantId: string, options?: QueryOptions): number {
    return this.contactRepo.count(tenantId, options);
  }

  public async listByOrganisation(tenantId: string, organisationId: string): Promise<Contact[]> {
    return this.contactRepo.findByOrganisation(tenantId, organisationId);
  }

  public async update(tenantId: string, id: string, dto: UpdateContactDto, actorUserId: string): Promise<Contact> {
    const before = await this.contactRepo.findById(tenantId, id);
    if (!before) {
      throw new Error(`Contact not found: ${id}`);
    }

    const updated = await this.contactRepo.update(tenantId, id, dto);
    if (!updated) {
      throw new Error(`Failed to update contact: ${id}`);
    }

    await this.audit.record(
      tenantId,
      'contact',
      id,
      'CONTACT_UPDATED',
      actorUserId,
      before as unknown as Record<string, unknown>,
      updated as unknown as Record<string, unknown>
    );

    await this.eventBus.publish(
      CRMEventType.CONTACT_UPDATED,
      tenantId,
      { contactId: id, changes: dto },
      actorUserId
    );

    return updated;
  }

  public async softDelete(tenantId: string, id: string, actorUserId: string): Promise<boolean> {
    const before = await this.contactRepo.findById(tenantId, id);
    if (!before) return false;

    const ok = await this.contactRepo.softDelete(tenantId, id);
    if (ok) {
      await this.audit.record(
        tenantId,
        'contact',
        id,
        'CONTACT_SOFT_DELETED',
        actorUserId,
        before as unknown as Record<string, unknown>
      );
    }
    return ok;
  }
}

export const contactService = new ContactService();
