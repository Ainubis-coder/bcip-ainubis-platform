/**
 * BCIP CRM Leads Controller
 * Thin HTTP adapter delegating strictly to LeadService.
 * Phase 2 — Prompt 002C: CRM API Layer
 */

import type { Request, Response } from 'express';
import { leadService } from '@bcip/database';
import { ApiResponse } from '../serializers/response.serializer.ts';

export class LeadsController {
  public static async list(req: Request, res: Response): Promise<void> {
    const tenantId = req.tenantId!;
    const page = Number(req.query.page) || 1;
    const pageSize = Number(req.query.pageSize) || 20;
    const offset = (page - 1) * pageSize;
    const sortBy = req.query.sortBy as string | undefined;
    const sortOrder = (req.query.sortOrder as 'asc' | 'desc') || 'desc';
    const search = req.query.search as string | undefined;
    const status = req.query.status as string | undefined;
    const qualificationStatus = req.query.qualificationStatus as string | undefined;
    const campaignId = req.query.campaignId as string | undefined;
    const leadOwnerId = req.query.leadOwnerId as string | undefined;

    const filter: Record<string, unknown> = {};
    if (status) filter.status = status;
    if (qualificationStatus) filter.qualificationStatus = qualificationStatus;
    if (campaignId) filter.campaignId = campaignId;
    if (leadOwnerId) filter.leadOwnerId = leadOwnerId;

    const queryOptions = {
      offset,
      limit: pageSize,
      sortBy: sortBy || 'createdAt',
      sortOrder,
      search,
      searchFields: ['title', 'description', 'email', 'phone', 'schemeName', 'managingAgent'],
      filter: Object.keys(filter).length > 0 ? filter : undefined,
    };

    const leads = await leadService.list(tenantId, queryOptions);
    const total = leadService.count(tenantId, queryOptions);

    ApiResponse.paginated(res, leads, { page, pageSize, total });
  }

  public static async getById(req: Request, res: Response): Promise<void> {
    const tenantId = req.tenantId!;
    const { id } = req.params;

    const lead = await leadService.getById(tenantId, id);
    if (!lead) {
      ApiResponse.notFound(res, `Lead with ID '${id}' not found`);
      return;
    }

    ApiResponse.success(res, lead);
  }

  public static async create(req: Request, res: Response): Promise<void> {
    const tenantId = req.tenantId!;
    const actorUserId = req.user!.id;

    try {
      const created = await leadService.create(tenantId, req.body, actorUserId);
      ApiResponse.success(res, created, 201);
    } catch (error) {
      ApiResponse.error(res, 'LEAD_CREATION_FAILED', (error as Error).message, 400);
    }
  }

  public static async update(req: Request, res: Response): Promise<void> {
    const tenantId = req.tenantId!;
    const actorUserId = req.user!.id;
    const { id } = req.params;

    try {
      const updated = await leadService.update(tenantId, id, req.body, actorUserId);
      ApiResponse.success(res, updated);
    } catch (error) {
      const msg = (error as Error).message;
      if (msg.includes('not found')) {
        ApiResponse.notFound(res, msg);
      } else {
        ApiResponse.error(res, 'LEAD_UPDATE_FAILED', msg, 400);
      }
    }
  }

  public static async softDelete(req: Request, res: Response): Promise<void> {
    const tenantId = req.tenantId!;
    const actorUserId = req.user!.id;
    const { id } = req.params;

    const ok = await leadService.softDelete(tenantId, id, actorUserId);
    if (!ok) {
      ApiResponse.notFound(res, `Lead with ID '${id}' not found`);
      return;
    }

    ApiResponse.success(res, { id, deleted: true });
  }

  public static async convert(req: Request, res: Response): Promise<void> {
    const tenantId = req.tenantId!;
    const actorUserId = req.user!.id;
    const { id } = req.params;

    try {
      const result = await leadService.convertLead(tenantId, id, req.body, actorUserId);
      ApiResponse.success(res, result, 200);
    } catch (error) {
      const msg = (error as Error).message;
      if (msg.includes('not found')) {
        ApiResponse.notFound(res, msg);
      } else if (msg.includes('already been converted')) {
        ApiResponse.conflict(res, msg);
      } else {
        ApiResponse.error(res, 'LEAD_CONVERSION_FAILED', msg, 400);
      }
    }
  }
}
