/**
 * BCIP CRM Contacts Controller
 * Thin HTTP adapter delegating strictly to ContactService.
 * Phase 2 — Prompt 002C: CRM API Layer
 */

import type { Request, Response } from 'express';
import { contactService } from '@bcip/database';
import { ApiResponse } from '../serializers/response.serializer.ts';

export class ContactsController {
  public static async list(req: Request, res: Response): Promise<void> {
    const tenantId = req.tenantId!;
    const page = Number(req.query.page) || 1;
    const pageSize = Number(req.query.pageSize) || 20;
    const offset = (page - 1) * pageSize;
    const sortBy = req.query.sortBy as string | undefined;
    const sortOrder = (req.query.sortOrder as 'asc' | 'desc') || 'desc';
    const search = req.query.search as string | undefined;
    const organisationId = req.query.organisationId as string | undefined;
    const status = req.query.status as string | undefined;

    const filter: Record<string, unknown> = {};
    if (organisationId) filter.organisationId = organisationId;
    if (status) filter.status = status;

    const queryOptions = {
      offset,
      limit: pageSize,
      sortBy: sortBy || 'createdAt',
      sortOrder,
      search,
      searchFields: ['firstName', 'lastName', 'displayName', 'email', 'phone', 'jobTitle'],
      filter: Object.keys(filter).length > 0 ? filter : undefined,
    };

    const contacts = await contactService.list(tenantId, queryOptions);
    const total = contactService.count(tenantId, queryOptions);

    ApiResponse.paginated(res, contacts, { page, pageSize, total });
  }

  public static async getById(req: Request, res: Response): Promise<void> {
    const tenantId = req.tenantId!;
    const { id } = req.params;

    const contact = await contactService.getById(tenantId, id);
    if (!contact) {
      ApiResponse.notFound(res, `Contact with ID '${id}' not found`);
      return;
    }

    ApiResponse.success(res, contact);
  }

  public static async create(req: Request, res: Response): Promise<void> {
    const tenantId = req.tenantId!;
    const actorUserId = req.user!.id;

    try {
      const created = await contactService.create(tenantId, req.body, actorUserId);
      ApiResponse.success(res, created, 201);
    } catch (error) {
      ApiResponse.error(res, 'CONTACT_CREATION_FAILED', (error as Error).message, 400);
    }
  }

  public static async update(req: Request, res: Response): Promise<void> {
    const tenantId = req.tenantId!;
    const actorUserId = req.user!.id;
    const { id } = req.params;

    try {
      const updated = await contactService.update(tenantId, id, req.body, actorUserId);
      ApiResponse.success(res, updated);
    } catch (error) {
      const msg = (error as Error).message;
      if (msg.includes('not found')) {
        ApiResponse.notFound(res, msg);
      } else {
        ApiResponse.error(res, 'CONTACT_UPDATE_FAILED', msg, 400);
      }
    }
  }

  public static async softDelete(req: Request, res: Response): Promise<void> {
    const tenantId = req.tenantId!;
    const actorUserId = req.user!.id;
    const { id } = req.params;

    const ok = await contactService.softDelete(tenantId, id, actorUserId);
    if (!ok) {
      ApiResponse.notFound(res, `Contact with ID '${id}' not found`);
      return;
    }

    ApiResponse.success(res, { id, deleted: true });
  }
}
