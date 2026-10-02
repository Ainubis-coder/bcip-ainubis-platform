/**
 * BCIP CRM Opportunities Controller
 * Thin HTTP adapter delegating strictly to OpportunityService.
 * Phase 2 — Prompt 002C: CRM API Layer
 */

import type { Request, Response } from 'express';
import { opportunityService, OpportunityStage } from '@bcip/database';
import { ApiResponse } from '../serializers/response.serializer.ts';

export class OpportunitiesController {
  public static async list(req: Request, res: Response): Promise<void> {
    const tenantId = req.tenantId!;
    const page = Number(req.query.page) || 1;
    const pageSize = Number(req.query.pageSize) || 20;
    const offset = (page - 1) * pageSize;
    const sortBy = req.query.sortBy as string | undefined;
    const sortOrder = (req.query.sortOrder as 'asc' | 'desc') || 'desc';
    const search = req.query.search as string | undefined;
    const stage = req.query.stage as OpportunityStage | undefined;
    const organisationId = req.query.organisationId as string | undefined;
    const ownerUserId = req.query.ownerUserId as string | undefined;

    const filter: Record<string, unknown> = {};
    if (stage) filter.stage = stage;
    if (organisationId) filter.organisationId = organisationId;
    if (ownerUserId) filter.ownerUserId = ownerUserId;

    const queryOptions = {
      offset,
      limit: pageSize,
      sortBy: sortBy || 'createdAt',
      sortOrder,
      search,
      searchFields: ['name', 'description', 'source'],
      filter: Object.keys(filter).length > 0 ? filter : undefined,
    };

    const opportunities = await opportunityService.list(tenantId, queryOptions);
    const total = opportunityService.count(tenantId, queryOptions);

    ApiResponse.paginated(res, opportunities, { page, pageSize, total });
  }

  public static async getPipeline(req: Request, res: Response): Promise<void> {
    const tenantId = req.tenantId!;
    const stage = req.query.stage as OpportunityStage | undefined;
    const owner = req.query.owner as string | undefined;
    const status = req.query.status as string | undefined;
    const fromDate = req.query.fromDate as string | undefined;
    const toDate = req.query.toDate as string | undefined;

    const pipeline = await opportunityService.getPipelineSummary(tenantId, {
      stage,
      owner,
      status,
      fromDate,
      toDate,
    });

    ApiResponse.success(res, pipeline);
  }

  public static async getById(req: Request, res: Response): Promise<void> {
    const tenantId = req.tenantId!;
    const { id } = req.params;

    const opportunity = await opportunityService.getById(tenantId, id);
    if (!opportunity) {
      ApiResponse.notFound(res, `Opportunity with ID '${id}' not found`);
      return;
    }

    ApiResponse.success(res, opportunity);
  }

  public static async create(req: Request, res: Response): Promise<void> {
    const tenantId = req.tenantId!;
    const actorUserId = req.user!.id;

    try {
      const created = await opportunityService.create(tenantId, req.body, actorUserId);
      ApiResponse.success(res, created, 201);
    } catch (error) {
      ApiResponse.error(res, 'OPPORTUNITY_CREATION_FAILED', (error as Error).message, 400);
    }
  }

  public static async update(req: Request, res: Response): Promise<void> {
    const tenantId = req.tenantId!;
    const actorUserId = req.user!.id;
    const { id } = req.params;

    try {
      const updated = await opportunityService.update(tenantId, id, req.body, actorUserId);
      ApiResponse.success(res, updated);
    } catch (error) {
      const msg = (error as Error).message;
      if (msg.includes('not found')) {
        ApiResponse.notFound(res, msg);
      } else {
        ApiResponse.error(res, 'OPPORTUNITY_UPDATE_FAILED', msg, 400);
      }
    }
  }

  public static async softDelete(req: Request, res: Response): Promise<void> {
    const tenantId = req.tenantId!;
    const actorUserId = req.user!.id;
    const { id } = req.params;

    const ok = await opportunityService.softDelete(tenantId, id, actorUserId);
    if (!ok) {
      ApiResponse.notFound(res, `Opportunity with ID '${id}' not found`);
      return;
    }

    ApiResponse.success(res, { id, deleted: true });
  }

  public static async transitionStage(req: Request, res: Response): Promise<void> {
    const tenantId = req.tenantId!;
    const actorUserId = req.user!.id;
    const { id } = req.params;
    const { stage, reason } = req.body;

    try {
      const result = await opportunityService.transitionStage(tenantId, id, stage, actorUserId, reason);
      ApiResponse.success(res, result);
    } catch (error) {
      const msg = (error as Error).message;
      if (msg.includes('not found')) {
        ApiResponse.notFound(res, msg);
      } else {
        ApiResponse.error(res, 'STAGE_TRANSITION_FAILED', msg, 400);
      }
    }
  }

  public static async getHistory(req: Request, res: Response): Promise<void> {
    const tenantId = req.tenantId!;
    const { id } = req.params;

    const existing = await opportunityService.getById(tenantId, id);
    if (!existing) {
      ApiResponse.notFound(res, `Opportunity with ID '${id}' not found`);
      return;
    }

    const history = opportunityService.getStageHistory(tenantId, id);
    ApiResponse.success(res, history);
  }
}
