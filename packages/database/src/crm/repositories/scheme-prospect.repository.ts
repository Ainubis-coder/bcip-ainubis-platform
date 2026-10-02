/**
 * BCIP CRM Scheme Prospect Repository
 */

import { BaseCrmRepository, type QueryOptions } from './base.repository.ts';
import type { SchemeProspect, CreateSchemeProspectDto } from '../types.ts';
import { DataQualityState } from '../enums.ts';

export class SchemeProspectRepository extends BaseCrmRepository<SchemeProspect> {
  constructor() {
    super('crm_scheme_prospects');
  }

  public async createProspect(
    tenantId: string,
    dto: CreateSchemeProspectDto
  ): Promise<SchemeProspect> {
    const id = this.generateId('sp');
    const now = new Date().toISOString();

    const prospect: SchemeProspect = {
      id,
      tenantId,
      organisationId: dto.organisationId,
      leadId: dto.leadId,
      name: dto.name,
      registrationNumber: dto.registrationNumber,
      sectionalTitleSchemeCode: dto.sectionalTitleSchemeCode,
      estimatedUnitCount: dto.estimatedUnitCount || 0,
      location: dto.location,
      managingAgentName: dto.managingAgentName,
      currentPropertySystem: dto.currentPropertySystem,
      currentAccountingSystem: dto.currentAccountingSystem,
      requirementsSummary: dto.requirementsSummary,
      painPoints: dto.painPoints || [],
      notes: dto.notes,
      dataQualityState: dto.dataQualityState || DataQualityState.UNVERIFIED,
      createdAt: now,
      updatedAt: now,
    };

    return this.create(prospect);
  }

  public async findByOrganisation(
    tenantId: string,
    organisationId: string,
    options?: QueryOptions
  ): Promise<SchemeProspect[]> {
    const all = await this.findAll(tenantId, options);
    return all.filter((p) => p.organisationId === organisationId);
  }

  public async findByLead(tenantId: string, leadId: string): Promise<SchemeProspect[]> {
    const all = await this.findAll(tenantId);
    return all.filter((p) => p.leadId === leadId);
  }
}

export const schemeProspectRepository = new SchemeProspectRepository();
