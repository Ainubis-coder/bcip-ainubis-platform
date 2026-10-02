/**
 * BCIP CRM Proposals Controller
 * Thin HTTP adapter delegating strictly to ProposalService.
 * Phase 2 — Prompt 002C: CRM API Layer
 */

import type { Request, Response } from 'express';
import { proposalService, ProposalStatus } from '@bcip/database';
import { ApiResponse } from '../serializers/response.serializer.ts';

export class ProposalsController {
  public static async list(req: Request, res: Response): Promise<void> {
    const tenantId = req.tenantId!;
    const page = Number(req.query.page) || 1;
    const pageSize = Number(req.query.pageSize) || 20;
    const offset = (page - 1) * pageSize;
    const sortBy = req.query.sortBy as string | undefined;
    const sortOrder = (req.query.sortOrder as 'asc' | 'desc') || 'desc';
    const search = req.query.search as string | undefined;
    const status = req.query.status as ProposalStatus | undefined;
    const opportunityId = req.query.opportunityId as string | undefined;

    const filter: Record<string, unknown> = {};
    if (status) filter.status = status;
    if (opportunityId) filter.opportunityId = opportunityId;

    const queryOptions = {
      offset,
      limit: pageSize,
      sortBy: sortBy || 'createdAt',
      sortOrder,
      search,
      searchFields: ['title', 'proposalNumber'],
      filter: Object.keys(filter).length > 0 ? filter : undefined,
    };

    const proposals = await proposalService.list(tenantId, queryOptions);
    const total = proposalService.count(tenantId, queryOptions);

    ApiResponse.paginated(res, proposals, { page, pageSize, total });
  }

  public static async getById(req: Request, res: Response): Promise<void> {
    const tenantId = req.tenantId!;
    const { id } = req.params;

    const proposal = await proposalService.getById(tenantId, id);
    if (!proposal) {
      ApiResponse.notFound(res, `Proposal with ID '${id}' not found`);
      return;
    }

    ApiResponse.success(res, proposal);
  }

  public static async create(req: Request, res: Response): Promise<void> {
    const tenantId = req.tenantId!;
    const actorUserId = req.user!.id;

    try {
      const created = await proposalService.create(tenantId, req.body, actorUserId);
      ApiResponse.success(res, created, 201);
    } catch (error) {
      ApiResponse.error(res, 'PROPOSAL_CREATION_FAILED', (error as Error).message, 400);
    }
  }

  public static async update(req: Request, res: Response): Promise<void> {
    const tenantId = req.tenantId!;
    const actorUserId = req.user!.id;
    const { id } = req.params;

    try {
      const updated = await proposalService.update(tenantId, id, req.body, actorUserId);
      ApiResponse.success(res, updated);
    } catch (error) {
      const msg = (error as Error).message;
      if (msg.includes('not found')) {
        ApiResponse.notFound(res, msg);
      } else {
        ApiResponse.error(res, 'PROPOSAL_UPDATE_FAILED', msg, 400);
      }
    }
  }

  public static async softDelete(req: Request, res: Response): Promise<void> {
    const tenantId = req.tenantId!;
    const actorUserId = req.user!.id;
    const { id } = req.params;

    const ok = await proposalService.softDelete(tenantId, id, actorUserId);
    if (!ok) {
      ApiResponse.notFound(res, `Proposal with ID '${id}' not found`);
      return;
    }

    ApiResponse.success(res, { id, deleted: true });
  }

  public static async send(req: Request, res: Response): Promise<void> {
    const tenantId = req.tenantId!;
    const actorUserId = req.user!.id;
    const { id } = req.params;
    const { documentId } = req.body || {};

    try {
      const updated = await proposalService.updateStatus(
        tenantId,
        id,
        ProposalStatus.SENT,
        actorUserId,
        documentId
      );
      ApiResponse.success(res, updated);
    } catch (error) {
      const msg = (error as Error).message;
      if (msg.includes('not found')) {
        ApiResponse.notFound(res, msg);
      } else {
        ApiResponse.error(res, 'PROPOSAL_SEND_FAILED', msg, 400);
      }
    }
  }

  public static async accept(req: Request, res: Response): Promise<void> {
    const tenantId = req.tenantId!;
    const actorUserId = req.user!.id;
    const { id } = req.params;

    try {
      const updated = await proposalService.updateStatus(tenantId, id, ProposalStatus.ACCEPTED, actorUserId);
      ApiResponse.success(res, updated);
    } catch (error) {
      const msg = (error as Error).message;
      if (msg.includes('not found')) {
        ApiResponse.notFound(res, msg);
      } else {
        ApiResponse.error(res, 'PROPOSAL_ACCEPT_FAILED', msg, 400);
      }
    }
  }

  public static async reject(req: Request, res: Response): Promise<void> {
    const tenantId = req.tenantId!;
    const actorUserId = req.user!.id;
    const { id } = req.params;

    try {
      const updated = await proposalService.updateStatus(tenantId, id, ProposalStatus.DECLINED, actorUserId);
      ApiResponse.success(res, updated);
    } catch (error) {
      const msg = (error as Error).message;
      if (msg.includes('not found')) {
        ApiResponse.notFound(res, msg);
      } else {
        ApiResponse.error(res, 'PROPOSAL_REJECT_FAILED', msg, 400);
      }
    }
  }
}
