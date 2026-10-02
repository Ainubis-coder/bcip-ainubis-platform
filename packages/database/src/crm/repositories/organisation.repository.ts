/**
 * BCIP CRM Organisation Repository
 */

import { BaseCrmRepository, type QueryOptions } from './base.repository.ts';
import type { Organisation, CreateOrganisationDto } from '../types.ts';
import { OrganisationStatus, OrganisationType, DataQualityState } from '../enums.ts';

export class OrganisationRepository extends BaseCrmRepository<Organisation> {
  constructor() {
    super('crm_organisations');
  }

  public async createOrganisation(
    tenantId: string,
    dto: CreateOrganisationDto
  ): Promise<Organisation> {
    const id = this.generateId('org');
    const now = new Date().toISOString();

    const org: Organisation = {
      id,
      tenantId,
      name: dto.name,
      legalName: dto.legalName,
      organisationType: dto.organisationType || OrganisationType.MANAGING_AGENT,
      registrationNumber: dto.registrationNumber,
      vatNumber: dto.vatNumber,
      email: dto.email,
      phone: dto.phone,
      website: dto.website,
      address: dto.address,
      status: dto.status || OrganisationStatus.PROSPECT,
      ownerUserId: dto.ownerUserId,
      notes: dto.notes,
      dataQualityState: dto.dataQualityState || DataQualityState.COMPLETE,
      lineage: dto.lineage,
      createdAt: now,
      updatedAt: now,
    };

    return this.create(org);
  }

  public async findByName(tenantId: string, name: string): Promise<Organisation | null> {
    for (const org of this.items.values()) {
      if (org.tenantId === tenantId && !org.deletedAt && org.name.toLowerCase() === name.toLowerCase()) {
        return JSON.parse(JSON.stringify(org));
      }
    }
    return null;
  }

  public async findByStatus(tenantId: string, status: OrganisationStatus, options?: QueryOptions): Promise<Organisation[]> {
    const all = await this.findAll(tenantId, options);
    return all.filter((o) => o.status === status);
  }

  public async findByType(tenantId: string, type: OrganisationType, options?: QueryOptions): Promise<Organisation[]> {
    const all = await this.findAll(tenantId, options);
    return all.filter((o) => o.organisationType === type);
  }
}

export const organisationRepository = new OrganisationRepository();
