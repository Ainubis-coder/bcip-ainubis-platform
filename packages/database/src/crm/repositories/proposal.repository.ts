/**
 * BCIP CRM Proposal Repository
 * Handles commercial proposals, multi-versioning, and decimal financial integrity.
 */

import { BaseCrmRepository, type QueryOptions } from './base.repository.ts';
import type { Proposal, CreateProposalDto } from '../types.ts';
import { ProposalStatus } from '../enums.ts';

export class ProposalRepository extends BaseCrmRepository<Proposal> {
  private proposalCounter: number = 100;

  constructor() {
    super('crm_proposals');
  }

  public async createProposal(tenantId: string, dto: CreateProposalDto): Promise<Proposal> {
    const id = this.generateId('prop');
    const now = new Date().toISOString();
    this.proposalCounter++;
    const proposalNumber =
      dto.proposalNumber || `PROP-${new Date().getFullYear()}-${String(this.proposalCounter).padStart(4, '0')}`;

    // Precise financial calculations: Round to 2 decimals
    const subtotal = Math.round(Number(dto.subtotal || 0) * 100) / 100;
    const tax = Math.round(Number(dto.tax || 0) * 100) / 100;
    const total = Math.round((subtotal + tax) * 100) / 100;

    const proposal: Proposal = {
      id,
      tenantId,
      organisationId: dto.organisationId,
      opportunityId: dto.opportunityId,
      proposalNumber,
      title: dto.title,
      status: dto.status || ProposalStatus.DRAFT,
      version: dto.version || 1,
      items: dto.items || [],
      subtotal,
      tax,
      total,
      currency: dto.currency || 'ZAR',
      validUntil: dto.validUntil,
      issuedAt: dto.issuedAt,
      acceptedAt: dto.acceptedAt,
      documentId: dto.documentId,
      notes: dto.notes,
      createdBy: dto.createdBy,
      createdAt: now,
      updatedAt: now,
    };

    return this.create(proposal);
  }

  public async findByOpportunity(
    tenantId: string,
    opportunityId: string,
    options?: QueryOptions
  ): Promise<Proposal[]> {
    const all = await this.findAll(tenantId, options);
    return all.filter((p) => p.opportunityId === opportunityId);
  }

  public async findByProposalNumber(tenantId: string, proposalNumber: string): Promise<Proposal | null> {
    for (const p of this.items.values()) {
      if (p.tenantId === tenantId && !p.deletedAt && p.proposalNumber === proposalNumber) {
        return JSON.parse(JSON.stringify(p));
      }
    }
    return null;
  }
}

export const proposalRepository = new ProposalRepository();
