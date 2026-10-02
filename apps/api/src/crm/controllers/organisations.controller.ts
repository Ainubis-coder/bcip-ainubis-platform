/**
 * BCIP CRM Organisations Controller
 * Thin HTTP adapter delegating strictly to OrganisationService.
 * Phase 2 — Prompt 002C: CRM API Layer
 */

import type { Request, Response } from 'express';
import { organisationService } from '@bcip/database';
import { ApiResponse } from '../serializers/response.serializer.ts';

export class OrganisationsController {
  public static async list(req: Request, res: Response): Promise<void> {
    const tenantId = req.tenantId!;
    const page = Number(req.query.page) || 1;
    const pageSize = Number(req.query.pageSize) || 20;
    const offset = (page - 1) * pageSize;
    const sortBy = req.query.sortBy as string | undefined;
    const sortOrder = (req.query.sortOrder as 'asc' | 'desc') || 'desc';
    const search = req.query.search as string | undefined;
    const status = req.query.status as string | undefined;
    const organisationType = req.query.organisationType as string | undefined;

    const filter: Record<string, unknown> = {};
    if (status) filter.status = status;
    if (organisationType) filter.organisationType = organisationType;

    const queryOptions = {
      offset,
      limit: pageSize,
      sortBy: sortBy || 'createdAt',
      sortOrder,
      search,
      searchFields: ['name', 'legalName', 'email', 'phone', 'registrationNumber'],
      filter: Object.keys(filter).length > 0 ? filter : undefined,
    };

    const organisations = await organisationService.list(tenantId, queryOptions);
    const total = organisationService.count(tenantId, queryOptions);

    ApiResponse.paginated(res, organisations, { page, pageSize, total });
  }

  public static async getById(req: Request, res: Response): Promise<void> {
    const tenantId = req.tenantId!;
    const { id } = req.params;

    const organisation = await organisationService.getById(tenantId, id);
    if (!organisation) {
      ApiResponse.notFound(res, `Organisation with ID '${id}' not found`);
      return;
    }

    ApiResponse.success(res, organisation);
  }

  public static async create(req: Request, res: Response): Promise<void> {
    const tenantId = req.tenantId!;
    const actorUserId = req.user!.id;

    try {
      const created = await organisationService.create(tenantId, req.body, actorUserId);
      ApiResponse.success(res, created, 201);
    } catch (error) {
      ApiResponse.error(res, 'ORGANISATION_CREATION_FAILED', (error as Error).message, 400);
    }
  }

  public static async update(req: Request, res: Response): Promise<void> {
    const tenantId = req.tenantId!;
    const actorUserId = req.user!.id;
    const { id } = req.params;

    try {
      const updated = await organisationService.update(tenantId, id, req.body, actorUserId);
      ApiResponse.success(res, updated);
    } catch (error) {
      const msg = (error as Error).message;
      if (msg.includes('not found')) {
        ApiResponse.notFound(res, msg);
      } else {
        ApiResponse.error(res, 'ORGANISATION_UPDATE_FAILED', msg, 400);
      }
    }
  }

  public static async softDelete(req: Request, res: Response): Promise<void> {
    const tenantId = req.tenantId!;
    const actorUserId = req.user!.id;
    const { id } = req.params;

    const ok = await organisationService.softDelete(tenantId, id, actorUserId);
    if (!ok) {
      ApiResponse.notFound(res, `Organisation with ID '${id}' not found`);
      return;
    }

    ApiResponse.success(res, { id, deleted: true });
  }

  public static async getContacts(req: Request, res: Response): Promise<void> {
    const tenantId = req.tenantId!;
    const { id } = req.params;

    const org = await organisationService.getById(tenantId, id);
    if (!org) {
      ApiResponse.notFound(res, `Organisation with ID '${id}' not found`);
      return;
    }

    const contacts = await organisationService.getContacts(tenantId, id);
    ApiResponse.success(res, contacts);
  }

  public static async getOpportunities(req: Request, res: Response): Promise<void> {
    const tenantId = req.tenantId!;
    const { id } = req.params;

    const org = await organisationService.getById(tenantId, id);
    if (!org) {
      ApiResponse.notFound(res, `Organisation with ID '${id}' not found`);
      return;
    }

    const opportunities = await organisationService.getOpportunities(tenantId, id);
    ApiResponse.success(res, opportunities);
  }

  public static async getSchemeProspects(req: Request, res: Response): Promise<void> {
    const tenantId = req.tenantId!;
    const { id } = req.params;

    const org = await organisationService.getById(tenantId, id);
    if (!org) {
      ApiResponse.notFound(res, `Organisation with ID '${id}' not found`);
      return;
    }

    const prospects = await organisationService.getSchemeProspects(tenantId, id);
    ApiResponse.success(res, prospects);
  }
}
