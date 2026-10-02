/**
 * BCIP CRM Contract Domain Service
 * Manages contractual agreements, legal execution status, and revenue activation.
 */

import { contractRepository, ContractRepository } from '../repositories/contract.repository.ts';
import { opportunityRepository, OpportunityRepository } from '../repositories/opportunity.repository.ts';
import { proposalRepository, ProposalRepository } from '../repositories/proposal.repository.ts';
import type { QueryOptions } from '../repositories/base.repository.ts';
import { crmAuditService, CRMAuditService } from '../audit/crm-audit.ts';
import { crmEventBus, CRMEventBus } from '../events/crm-events.ts';
import type { Contract, CreateContractDto, UpdateContractDto } from '../types.ts';
import { ContractStatus, CRMEventType, OpportunityStage } from '../enums.ts';

export class ContractService {
  private contractRepo: ContractRepository;
  private oppRepo: OpportunityRepository;
  private propRepo: ProposalRepository;
  private audit: CRMAuditService;
  private eventBus: CRMEventBus;

  constructor(
    contractRepo: ContractRepository = contractRepository,
    oppRepo: OpportunityRepository = opportunityRepository,
    propRepo: ProposalRepository = proposalRepository,
    audit: CRMAuditService = crmAuditService,
    eventBus: CRMEventBus = crmEventBus
  ) {
    this.contractRepo = contractRepo;
    this.oppRepo = oppRepo;
    this.propRepo = propRepo;
    this.audit = audit;
    this.eventBus = eventBus;
  }

  public async create(tenantId: string, dto: CreateContractDto, actorUserId: string): Promise<Contract> {
    if (!dto.title) {
      throw new Error('Contract title is required');
    }

    if (dto.opportunityId) {
      const opp = await this.oppRepo.findById(tenantId, dto.opportunityId);
      if (!opp) {
        throw new Error(`Invalid opportunity reference: ${dto.opportunityId}`);
      }
    }

    if (dto.proposalId) {
      const prop = await this.propRepo.findById(tenantId, dto.proposalId);
      if (!prop) {
        throw new Error(`Invalid proposal reference: ${dto.proposalId}`);
      }
    }

    const contract = await this.contractRepo.createContract(tenantId, dto);

    await this.audit.record(
      tenantId,
      'contract',
      contract.id,
      'CONTRACT_CREATED',
      actorUserId,
      undefined,
      contract as unknown as Record<string, unknown>
    );

    await this.eventBus.publish(
      CRMEventType.CONTRACT_CREATED,
      tenantId,
      {
        contractId: contract.id,
        contractNumber: contract.contractNumber,
        opportunityId: contract.opportunityId,
      },
      actorUserId
    );

    return contract;
  }

  public async getById(tenantId: string, id: string): Promise<Contract | null> {
    return this.contractRepo.findById(tenantId, id);
  }

  public async list(tenantId: string, options?: QueryOptions): Promise<Contract[]> {
    return this.contractRepo.findAll(tenantId, options);
  }

  public count(tenantId: string, options?: QueryOptions): number {
    return this.contractRepo.count(tenantId, options);
  }

  public async listByOpportunity(tenantId: string, opportunityId: string): Promise<Contract[]> {
    return this.contractRepo.findByOpportunity(tenantId, opportunityId);
  }

  public async updateStatus(
    tenantId: string,
    id: string,
    newStatus: ContractStatus,
    actorUserId: string,
    metadata?: { signedAt?: string; effectiveDate?: string; documentId?: string }
  ): Promise<Contract> {
    const before = await this.contractRepo.findById(tenantId, id);
    if (!before) {
      throw new Error(`Contract not found: ${id}`);
    }

    const patch: Partial<Contract> = {
      status: newStatus,
    };
    if (metadata?.documentId) patch.documentId = metadata.documentId;
    if (metadata?.effectiveDate) patch.effectiveDate = metadata.effectiveDate;
    if (metadata?.signedAt || (newStatus === ContractStatus.SIGNED && !before.signedAt)) {
      patch.signedAt = metadata?.signedAt || new Date().toISOString();
    }

    const updated = await this.contractRepo.update(tenantId, id, patch);
    if (!updated) {
      throw new Error(`Failed to update contract status: ${id}`);
    }

    await this.audit.record(
      tenantId,
      'contract',
      id,
      `CONTRACT_STATUS_${newStatus}`,
      actorUserId,
      { status: before.status },
      { status: newStatus, metadata }
    );

    if (newStatus === ContractStatus.SENT) {
      await this.eventBus.publish(
        CRMEventType.CONTRACT_SENT,
        tenantId,
        { contractId: id, contractNumber: updated.contractNumber },
        actorUserId
      );
    } else if (newStatus === ContractStatus.SIGNED) {
      await this.eventBus.publish(
        CRMEventType.CONTRACT_SIGNED,
        tenantId,
        { contractId: id, signedAt: updated.signedAt },
        actorUserId
      );
    } else if (newStatus === ContractStatus.ACTIVE) {
      await this.eventBus.publish(
        CRMEventType.CONTRACT_ACTIVATED,
        tenantId,
        { contractId: id, effectiveDate: updated.effectiveDate },
        actorUserId
      );

      // Auto-advance opportunity to WON if currently in CONTRACT
      if (updated.opportunityId) {
        const opp = await this.oppRepo.findById(tenantId, updated.opportunityId);
        if (opp && opp.stage !== OpportunityStage.WON) {
          await this.oppRepo.updateStage(
            tenantId,
            opp.id,
            OpportunityStage.WON,
            actorUserId,
            `Contract ${updated.contractNumber} activated`
          );
        }
      }
    }

    return updated;
  }

  public async update(
    tenantId: string,
    id: string,
    dto: UpdateContractDto,
    actorUserId: string
  ): Promise<Contract> {
    const before = await this.contractRepo.findById(tenantId, id);
    if (!before) {
      throw new Error(`Contract not found: ${id}`);
    }

    const updated = await this.contractRepo.update(tenantId, id, dto);
    if (!updated) {
      throw new Error(`Failed to update contract: ${id}`);
    }

    await this.audit.record(
      tenantId,
      'contract',
      id,
      'CONTRACT_UPDATED',
      actorUserId,
      before as unknown as Record<string, unknown>,
      updated as unknown as Record<string, unknown>
    );

    return updated;
  }

  public async softDelete(tenantId: string, id: string, actorUserId: string): Promise<boolean> {
    const before = await this.contractRepo.findById(tenantId, id);
    if (!before) return false;

    const ok = await this.contractRepo.softDelete(tenantId, id);
    if (ok) {
      await this.audit.record(
        tenantId,
        'contract',
        id,
        'CONTRACT_SOFT_DELETED',
        actorUserId,
        before as unknown as Record<string, unknown>
      );
    }
    return ok;
  }
}

export const contractService = new ContractService();
