/**
 * BCIP CRM Activities Controller
 * Thin HTTP adapter delegating strictly to ActivityService.
 * Phase 2 — Prompt 002C: CRM API Layer
 */

import type { Request, Response } from 'express';
import { activityService } from '@bcip/database';
import { ApiResponse } from '../serializers/response.serializer.ts';

export class ActivitiesController {
  public static async list(req: Request, res: Response): Promise<void> {
    const tenantId = req.tenantId!;
    const page = Number(req.query.page) || 1;
    const pageSize = Number(req.query.pageSize) || 20;
    const offset = (page - 1) * pageSize;
    const sortBy = req.query.sortBy as string | undefined;
    const sortOrder = (req.query.sortOrder as 'asc' | 'desc') || 'desc';
    const search = req.query.search as string | undefined;
    const activityType = req.query.activityType as string | undefined;
    const leadId = req.query.leadId as string | undefined;
    const contactId = req.query.contactId as string | undefined;
    const organisationId = req.query.organisationId as string | undefined;
    const opportunityId = req.query.opportunityId as string | undefined;

    const filter: Record<string, unknown> = {};
    if (activityType) filter.activityType = activityType;
    if (leadId) filter.leadId = leadId;
    if (contactId) filter.contactId = contactId;
    if (organisationId) filter.organisationId = organisationId;
    if (opportunityId) filter.opportunityId = opportunityId;

    const queryOptions = {
      offset,
      limit: pageSize,
      sortBy: sortBy || 'createdAt',
      sortOrder,
      search,
      searchFields: ['subject', 'description'],
      filter: Object.keys(filter).length > 0 ? filter : undefined,
    };

    const activities = await activityService.list(tenantId, queryOptions);
    const total = activityService.count(tenantId, queryOptions);

    ApiResponse.paginated(res, activities, { page, pageSize, total });
  }

  public static async getById(req: Request, res: Response): Promise<void> {
    const tenantId = req.tenantId!;
    const { id } = req.params;

    const activity = await activityService.getById(tenantId, id);
    if (!activity) {
      ApiResponse.notFound(res, `Activity with ID '${id}' not found`);
      return;
    }

    ApiResponse.success(res, activity);
  }

  public static async create(req: Request, res: Response): Promise<void> {
    const tenantId = req.tenantId!;
    const actorUserId = req.user!.id;

    try {
      const created = await activityService.logActivity(tenantId, req.body, actorUserId);
      ApiResponse.success(res, created, 201);
    } catch (error) {
      ApiResponse.error(res, 'ACTIVITY_CREATION_FAILED', (error as Error).message, 400);
    }
  }

  public static async update(req: Request, res: Response): Promise<void> {
    const tenantId = req.tenantId!;
    const actorUserId = req.user!.id;
    const { id } = req.params;

    try {
      const updated = await activityService.update(tenantId, id, req.body, actorUserId);
      ApiResponse.success(res, updated);
    } catch (error) {
      const msg = (error as Error).message;
      if (msg.includes('not found')) {
        ApiResponse.notFound(res, msg);
      } else {
        ApiResponse.error(res, 'ACTIVITY_UPDATE_FAILED', msg, 400);
      }
    }
  }

  public static async softDelete(req: Request, res: Response): Promise<void> {
    const tenantId = req.tenantId!;
    const actorUserId = req.user!.id;
    const { id } = req.params;

    const ok = await activityService.softDelete(tenantId, id, actorUserId);
    if (!ok) {
      ApiResponse.notFound(res, `Activity with ID '${id}' not found`);
      return;
    }

    ApiResponse.success(res, { id, deleted: true });
  }
}
