/**
 * BCIP CRM Contract Repository
 */

import { BaseCrmRepository, type QueryOptions } from './base.repository.ts';
import type { Contract, CreateContractDto } from '../types.ts';
import { ContractStatus } from '../enums.ts';

export class ContractRepository extends BaseCrmRepository<Contract> {
  private contractCounter: number = 200;

  constructor() {
    super('crm_contracts');
  }

  public async createContract(tenantId: string, dto: CreateContractDto): Promise<Contract> {
    const id = this.generateId('ctr');
    const now = new Date().toISOString();
    this.contractCounter++;
    const contractNumber =
      dto.contractNumber || `CTR-${new Date().getFullYear()}-${String(this.contractCounter).padStart(4, '0')}`;

    const annualValue =
      dto.annualValue !== undefined ? Math.round(Number(dto.annualValue) * 100) / 100 : undefined;
    const monthlyValue =
      dto.monthlyValue !== undefined ? Math.round(Number(dto.monthlyValue) * 100) / 100 : undefined;

    const contract: Contract = {
      id,
      tenantId,
      organisationId: dto.organisationId,
      opportunityId: dto.opportunityId,
      proposalId: dto.proposalId,
      contractNumber,
      title: dto.title,
      status: dto.status || ContractStatus.DRAFT,
      effectiveDate: dto.effectiveDate,
      expiryDate: dto.expiryDate,
      signedAt: dto.signedAt,
      documentId: dto.documentId,
      createdBy: dto.createdBy,
      terms: dto.terms,
      annualValue,
      monthlyValue,
      currency: dto.currency || 'ZAR',
      createdAt: now,
      updatedAt: now,
    };

    return this.create(contract);
  }

  public async findByOpportunity(
    tenantId: string,
    opportunityId: string,
    options?: QueryOptions
  ): Promise<Contract[]> {
    const all = await this.findAll(tenantId, options);
    return all.filter((c) => c.opportunityId === opportunityId);
  }

  public async findByProposal(tenantId: string, proposalId: string): Promise<Contract[]> {
    const all = await this.findAll(tenantId);
    return all.filter((c) => c.proposalId === proposalId);
  }

  public async findByContractNumber(tenantId: string, contractNumber: string): Promise<Contract | null> {
    for (const c of this.items.values()) {
      if (c.tenantId === tenantId && !c.deletedAt && c.contractNumber === contractNumber) {
        return JSON.parse(JSON.stringify(c));
      }
    }
    return null;
  }
}

export const contractRepository = new ContractRepository();
