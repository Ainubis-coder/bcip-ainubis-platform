/**
 * BCIP CRM Contracts Controller
 * Thin HTTP adapter delegating strictly to ContractService.
 * Phase 2 — Prompt 002C: CRM API Layer
 */

import type { Request, Response } from 'express';
import { contractService, ContractStatus } from '@bcip/database';
import { ApiResponse } from '../serializers/response.serializer.ts';

export class ContractsController {
  public static async list(req: Request, res: Response): Promise<void> {
    const tenantId = req.tenantId!;
    const page = Number(req.query.page) || 1;
    const pageSize = Number(req.query.pageSize) || 20;
    const offset = (page - 1) * pageSize;
    const sortBy = req.query.sortBy as string | undefined;
    const sortOrder = (req.query.sortOrder as 'asc' | 'desc') || 'desc';
    const search = req.query.search as string | undefined;
    const status = req.query.status as ContractStatus | undefined;
    const opportunityId = req.query.opportunityId as string | undefined;
    const proposalId = req.query.proposalId as string | undefined;

    const filter: Record<string, unknown> = {};
    if (status) filter.status = status;
    if (opportunityId) filter.opportunityId = opportunityId;
    if (proposalId) filter.proposalId = proposalId;

    const queryOptions = {
      offset,
      limit: pageSize,
      sortBy: sortBy || 'createdAt',
      sortOrder,
      search,
      searchFields: ['title', 'contractNumber'],
      filter: Object.keys(filter).length > 0 ? filter : undefined,
    };

    const contracts = await contractService.list(tenantId, queryOptions);
    const total = contractService.count(tenantId, queryOptions);

    ApiResponse.paginated(res, contracts, { page, pageSize, total });
  }

  public static async getById(req: Request, res: Response): Promise<void> {
    const tenantId = req.tenantId!;
    const { id } = req.params;

    const contract = await contractService.getById(tenantId, id);
    if (!contract) {
      ApiResponse.notFound(res, `Contract with ID '${id}' not found`);
      return;
    }

    ApiResponse.success(res, contract);
  }

  public static async create(req: Request, res: Response): Promise<void> {
    const tenantId = req.tenantId!;
    const actorUserId = req.user!.id;

    try {
      const created = await contractService.create(tenantId, req.body, actorUserId);
      ApiResponse.success(res, created, 201);
    } catch (error) {
      ApiResponse.error(res, 'CONTRACT_CREATION_FAILED', (error as Error).message, 400);
    }
  }

  public static async update(req: Request, res: Response): Promise<void> {
    const tenantId = req.tenantId!;
    const actorUserId = req.user!.id;
    const { id } = req.params;

    try {
      const updated = await contractService.update(tenantId, id, req.body, actorUserId);
      ApiResponse.success(res, updated);
    } catch (error) {
      const msg = (error as Error).message;
      if (msg.includes('not found')) {
        ApiResponse.notFound(res, msg);
      } else {
        ApiResponse.error(res, 'CONTRACT_UPDATE_FAILED', msg, 400);
      }
    }
  }

  public static async softDelete(req: Request, res: Response): Promise<void> {
    const tenantId = req.tenantId!;
    const actorUserId = req.user!.id;
    const { id } = req.params;

    const ok = await contractService.softDelete(tenantId, id, actorUserId);
    if (!ok) {
      ApiResponse.notFound(res, `Contract with ID '${id}' not found`);
      return;
    }

    ApiResponse.success(res, { id, deleted: true });
  }

  public static async sign(req: Request, res: Response): Promise<void> {
    const tenantId = req.tenantId!;
    const actorUserId = req.user!.id;
    const { id } = req.params;
    const { signedAt, documentId } = req.body || {};

    try {
      const updated = await contractService.updateStatus(
        tenantId,
        id,
        ContractStatus.SIGNED,
        actorUserId,
        { signedAt, documentId }
      );
      ApiResponse.success(res, updated);
    } catch (error) {
      const msg = (error as Error).message;
      if (msg.includes('not found')) {
        ApiResponse.notFound(res, msg);
      } else {
        ApiResponse.error(res, 'CONTRACT_SIGN_FAILED', msg, 400);
      }
    }
  }

  public static async activate(req: Request, res: Response): Promise<void> {
    const tenantId = req.tenantId!;
    const actorUserId = req.user!.id;
    const { id } = req.params;
    const { effectiveDate } = req.body || {};

    try {
      const updated = await contractService.updateStatus(
        tenantId,
        id,
        ContractStatus.ACTIVE,
        actorUserId,
        { effectiveDate }
      );
      ApiResponse.success(res, updated);
    } catch (error) {
      const msg = (error as Error).message;
      if (msg.includes('not found')) {
        ApiResponse.notFound(res, msg);
      } else {
        ApiResponse.error(res, 'CONTRACT_ACTIVATE_FAILED', msg, 400);
      }
    }
  }

  public static async terminate(req: Request, res: Response): Promise<void> {
    const tenantId = req.tenantId!;
    const actorUserId = req.user!.id;
    const { id } = req.params;

    try {
      const updated = await contractService.updateStatus(tenantId, id, ContractStatus.TERMINATED, actorUserId);
      ApiResponse.success(res, updated);
    } catch (error) {
      const msg = (error as Error).message;
      if (msg.includes('not found')) {
        ApiResponse.notFound(res, msg);
      } else {
        ApiResponse.error(res, 'CONTRACT_TERMINATE_FAILED', msg, 400);
      }
    }
  }
}
