/**
 * BCIP CRM Scheme Prospects Controller
 * Thin HTTP adapter delegating strictly to SchemeProspectService.
 * Phase 2 — Prompt 002C: CRM API Layer
 */

import type { Request, Response } from 'express';
import { schemeProspectService } from '@bcip/database';
import { ApiResponse } from '../serializers/response.serializer.ts';

export class SchemeProspectsController {
  public static async list(req: Request, res: Response): Promise<void> {
    const tenantId = req.tenantId!;
    const page = Number(req.query.page) || 1;
    const pageSize = Number(req.query.pageSize) || 20;
    const offset = (page - 1) * pageSize;
    const sortBy = req.query.sortBy as string | undefined;
    const sortOrder = (req.query.sortOrder as 'asc' | 'desc') || 'desc';
    const search = req.query.search as string | undefined;
    const organisationId = req.query.organisationId as string | undefined;
    const leadId = req.query.leadId as string | undefined;

    const filter: Record<string, unknown> = {};
    if (organisationId) filter.organisationId = organisationId;
    if (leadId) filter.leadId = leadId;

    const queryOptions = {
      offset,
      limit: pageSize,
      sortBy: sortBy || 'createdAt',
      sortOrder,
      search,
      searchFields: ['name', 'registrationNumber', 'sectionalTitleSchemeCode', 'location', 'managingAgentName'],
      filter: Object.keys(filter).length > 0 ? filter : undefined,
    };

    const prospects = await schemeProspectService.list(tenantId, queryOptions);
    const total = schemeProspectService.count(tenantId, queryOptions);

    ApiResponse.paginated(res, prospects, { page, pageSize, total });
  }

  public static async getById(req: Request, res: Response): Promise<void> {
    const tenantId = req.tenantId!;
    const { id } = req.params;

    const prospect = await schemeProspectService.getById(tenantId, id);
    if (!prospect) {
      ApiResponse.notFound(res, `Scheme prospect with ID '${id}' not found`);
      return;
    }

    ApiResponse.success(res, prospect);
  }

  public static async create(req: Request, res: Response): Promise<void> {
    const tenantId = req.tenantId!;
    const actorUserId = req.user!.id;

    try {
      const created = await schemeProspectService.create(tenantId, req.body, actorUserId);
      ApiResponse.success(res, created, 201);
    } catch (error) {
      ApiResponse.error(res, 'SCHEME_PROSPECT_CREATION_FAILED', (error as Error).message, 400);
    }
  }

  public static async update(req: Request, res: Response): Promise<void> {
    const tenantId = req.tenantId!;
    const actorUserId = req.user!.id;
    const { id } = req.params;

    try {
      const updated = await schemeProspectService.update(tenantId, id, req.body, actorUserId);
      ApiResponse.success(res, updated);
    } catch (error) {
      const msg = (error as Error).message;
      if (msg.includes('not found')) {
        ApiResponse.notFound(res, msg);
      } else {
        ApiResponse.error(res, 'SCHEME_PROSPECT_UPDATE_FAILED', msg, 400);
      }
    }
  }

  public static async softDelete(req: Request, res: Response): Promise<void> {
    const tenantId = req.tenantId!;
    const actorUserId = req.user!.id;
    const { id } = req.params;

    const ok = await schemeProspectService.softDelete(tenantId, id, actorUserId);
    if (!ok) {
      ApiResponse.notFound(res, `Scheme prospect with ID '${id}' not found`);
      return;
    }

    ApiResponse.success(res, { id, deleted: true });
  }
}
