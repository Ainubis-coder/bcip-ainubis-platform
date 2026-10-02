/**
 * BCIP CRM Contact Repository
 */

import { BaseCrmRepository, type QueryOptions } from './base.repository.ts';
import type { Contact, CreateContactDto } from '../types.ts';
import { ContactStatus, PreferredContactMethod, DataQualityState } from '../enums.ts';

export class ContactRepository extends BaseCrmRepository<Contact> {
  constructor() {
    super('crm_contacts');
  }

  public async createContact(tenantId: string, dto: CreateContactDto): Promise<Contact> {
    const id = this.generateId('cnt');
    const now = new Date().toISOString();
    const displayName = dto.displayName || `${dto.firstName} ${dto.lastName}`.trim();

    const contact: Contact = {
      id,
      tenantId,
      organisationId: dto.organisationId,
      firstName: dto.firstName,
      lastName: dto.lastName,
      displayName,
      jobTitle: dto.jobTitle,
      email: dto.email,
      phone: dto.phone,
      mobile: dto.mobile,
      preferredContactMethod: dto.preferredContactMethod || PreferredContactMethod.EMAIL,
      status: dto.status || ContactStatus.ACTIVE,
      notes: dto.notes,
      dataQualityState: dto.dataQualityState || DataQualityState.COMPLETE,
      lineage: dto.lineage,
      createdAt: now,
      updatedAt: now,
    };

    return this.create(contact);
  }

  public async findByOrganisation(
    tenantId: string,
    organisationId: string,
    options?: QueryOptions
  ): Promise<Contact[]> {
    const all = await this.findAll(tenantId, options);
    return all.filter((c) => c.organisationId === organisationId);
  }

  public async findByEmail(tenantId: string, email: string): Promise<Contact | null> {
    for (const c of this.items.values()) {
      if (c.tenantId === tenantId && !c.deletedAt && c.email?.toLowerCase() === email.toLowerCase()) {
        return JSON.parse(JSON.stringify(c));
      }
    }
    return null;
  }
}

export const contactRepository = new ContactRepository();
