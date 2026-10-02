/**
 * BCIP CRM Proposal Domain Service
 * Enforces financial integrity, version progression, and commercial approval lifecycles.
 */

import { proposalRepository, ProposalRepository } from '../repositories/proposal.repository.ts';
import { opportunityRepository, OpportunityRepository } from '../repositories/opportunity.repository.ts';
import type { QueryOptions } from '../repositories/base.repository.ts';
import { crmAuditService, CRMAuditService } from '../audit/crm-audit.ts';
import { crmEventBus, CRMEventBus } from '../events/crm-events.ts';
import type { Proposal, CreateProposalDto, UpdateProposalDto } from '../types.ts';
import { ProposalStatus, CRMEventType, OpportunityStage } from '../enums.ts';

export class ProposalService {
  private propRepo: ProposalRepository;
  private oppRepo: OpportunityRepository;
  private audit: CRMAuditService;
  private eventBus: CRMEventBus;

  constructor(
    propRepo: ProposalRepository = proposalRepository,
    oppRepo: OpportunityRepository = opportunityRepository,
    audit: CRMAuditService = crmAuditService,
    eventBus: CRMEventBus = crmEventBus
  ) {
    this.propRepo = propRepo;
    this.oppRepo = oppRepo;
    this.audit = audit;
    this.eventBus = eventBus;
  }

  public async create(tenantId: string, dto: CreateProposalDto, actorUserId: string): Promise<Proposal> {
    if (!dto.title) {
      throw new Error('Proposal title is required');
    }

    const opp = await this.oppRepo.findById(tenantId, dto.opportunityId);
    if (!opp) {
      throw new Error(`Invalid opportunity reference: ${dto.opportunityId}`);
    }

    const proposal = await this.propRepo.createProposal(tenantId, dto);

    await this.audit.record(
      tenantId,
      'proposal',
      proposal.id,
      'PROPOSAL_CREATED',
      actorUserId,
      undefined,
      proposal as unknown as Record<string, unknown>
    );

    await this.eventBus.publish(
      CRMEventType.PROPOSAL_CREATED,
      tenantId,
      {
        proposalId: proposal.id,
        proposalNumber: proposal.proposalNumber,
        opportunityId: proposal.opportunityId,
        total: proposal.total,
      },
      actorUserId
    );

    return proposal;
  }

  public async getById(tenantId: string, id: string): Promise<Proposal | null> {
    return this.propRepo.findById(tenantId, id);
  }

  public async list(tenantId: string, options?: QueryOptions): Promise<Proposal[]> {
    return this.propRepo.findAll(tenantId, options);
  }

  public count(tenantId: string, options?: QueryOptions): number {
    return this.propRepo.count(tenantId, options);
  }

  public async listByOpportunity(tenantId: string, opportunityId: string): Promise<Proposal[]> {
    return this.propRepo.findByOpportunity(tenantId, opportunityId);
  }

  public async updateStatus(
    tenantId: string,
    id: string,
    newStatus: ProposalStatus,
    actorUserId: string,
    documentId?: string
  ): Promise<Proposal> {
    const before = await this.propRepo.findById(tenantId, id);
    if (!before) {
      throw new Error(`Proposal not found: ${id}`);
    }

    const patch: Partial<Proposal> = {
      status: newStatus,
    };
    if (documentId) {
      patch.documentId = documentId;
    }

    if (newStatus === ProposalStatus.SENT && !before.issuedAt) {
      patch.issuedAt = new Date().toISOString();
    } else if (newStatus === ProposalStatus.ACCEPTED && !before.acceptedAt) {
      patch.acceptedAt = new Date().toISOString();
    }

    const updated = await this.propRepo.update(tenantId, id, patch);
    if (!updated) {
      throw new Error(`Failed to update proposal status: ${id}`);
    }

    await this.audit.record(
      tenantId,
      'proposal',
      id,
      `PROPOSAL_STATUS_${newStatus}`,
      actorUserId,
      { status: before.status },
      { status: newStatus }
    );

    if (newStatus === ProposalStatus.APPROVED) {
      await this.eventBus.publish(
        CRMEventType.PROPOSAL_APPROVED,
        tenantId,
        { proposalId: id, total: updated.total },
        actorUserId
      );
    } else if (newStatus === ProposalStatus.SENT) {
      await this.eventBus.publish(
        CRMEventType.PROPOSAL_SENT,
        tenantId,
        { proposalId: id, total: updated.total, issuedAt: updated.issuedAt },
        actorUserId
      );
    } else if (newStatus === ProposalStatus.ACCEPTED) {
      await this.eventBus.publish(
        CRMEventType.PROPOSAL_ACCEPTED,
        tenantId,
        { proposalId: id, total: updated.total, acceptedAt: updated.acceptedAt },
        actorUserId
      );

      // Auto-advance opportunity to CONTRACT stage if currently PROPOSAL
      const opp = await this.oppRepo.findById(tenantId, updated.opportunityId);
      if (opp && opp.stage === OpportunityStage.PROPOSAL) {
        await this.oppRepo.updateStage(
          tenantId,
          opp.id,
          OpportunityStage.CONTRACT,
          actorUserId,
          `Proposal ${updated.proposalNumber} accepted`
        );
      }
    }

    return updated;
  }

  public async update(
    tenantId: string,
    id: string,
    dto: UpdateProposalDto,
    actorUserId: string
  ): Promise<Proposal> {
    const before = await this.propRepo.findById(tenantId, id);
    if (!before) {
      throw new Error(`Proposal not found: ${id}`);
    }

    const updated = await this.propRepo.update(tenantId, id, dto);
    if (!updated) {
      throw new Error(`Failed to update proposal: ${id}`);
    }

    await this.audit.record(
      tenantId,
      'proposal',
      id,
      'PROPOSAL_UPDATED',
      actorUserId,
      before as unknown as Record<string, unknown>,
      updated as unknown as Record<string, unknown>
    );

    return updated;
  }

  public async softDelete(tenantId: string, id: string, actorUserId: string): Promise<boolean> {
    const before = await this.propRepo.findById(tenantId, id);
    if (!before) return false;

    const ok = await this.propRepo.softDelete(tenantId, id);
    if (ok) {
      await this.audit.record(
        tenantId,
        'proposal',
        id,
        'PROPOSAL_SOFT_DELETED',
        actorUserId,
        before as unknown as Record<string, unknown>
      );
    }
    return ok;
  }
}

export const proposalService = new ProposalService();
