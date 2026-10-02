/**
 * BCIP CRM Tasks Controller
 * Thin HTTP adapter delegating strictly to TaskService.
 * Phase 2 — Prompt 002C: CRM API Layer
 */

import type { Request, Response } from 'express';
import { taskService } from '@bcip/database';
import { ApiResponse } from '../serializers/response.serializer.ts';

export class TasksController {
  public static async list(req: Request, res: Response): Promise<void> {
    const tenantId = req.tenantId!;
    const page = Number(req.query.page) || 1;
    const pageSize = Number(req.query.pageSize) || 20;
    const offset = (page - 1) * pageSize;
    const sortBy = req.query.sortBy as string | undefined;
    const sortOrder = (req.query.sortOrder as 'asc' | 'desc') || 'desc';
    const search = req.query.search as string | undefined;
    const status = req.query.status as string | undefined;
    const priority = req.query.priority as string | undefined;
    const assignedTo = req.query.assignedTo as string | undefined;
    const leadId = req.query.leadId as string | undefined;
    const opportunityId = req.query.opportunityId as string | undefined;

    const filter: Record<string, unknown> = {};
    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (assignedTo) filter.assignedTo = assignedTo;
    if (leadId) filter.leadId = leadId;
    if (opportunityId) filter.opportunityId = opportunityId;

    const queryOptions = {
      offset,
      limit: pageSize,
      sortBy: sortBy || 'createdAt',
      sortOrder,
      search,
      searchFields: ['title', 'description'],
      filter: Object.keys(filter).length > 0 ? filter : undefined,
    };

    const tasks = await taskService.list(tenantId, queryOptions);
    const total = taskService.count(tenantId, queryOptions);

    ApiResponse.paginated(res, tasks, { page, pageSize, total });
  }

  public static async getById(req: Request, res: Response): Promise<void> {
    const tenantId = req.tenantId!;
    const { id } = req.params;

    const task = await taskService.getById(tenantId, id);
    if (!task) {
      ApiResponse.notFound(res, `Task with ID '${id}' not found`);
      return;
    }

    ApiResponse.success(res, task);
  }

  public static async create(req: Request, res: Response): Promise<void> {
    const tenantId = req.tenantId!;
    const actorUserId = req.user!.id;

    try {
      const created = await taskService.createTask(tenantId, req.body, actorUserId);
      ApiResponse.success(res, created, 201);
    } catch (error) {
      ApiResponse.error(res, 'TASK_CREATION_FAILED', (error as Error).message, 400);
    }
  }

  public static async update(req: Request, res: Response): Promise<void> {
    const tenantId = req.tenantId!;
    const actorUserId = req.user!.id;
    const { id } = req.params;

    try {
      const updated = await taskService.update(tenantId, id, req.body, actorUserId);
      ApiResponse.success(res, updated);
    } catch (error) {
      const msg = (error as Error).message;
      if (msg.includes('not found')) {
        ApiResponse.notFound(res, msg);
      } else {
        ApiResponse.error(res, 'TASK_UPDATE_FAILED', msg, 400);
      }
    }
  }

  public static async complete(req: Request, res: Response): Promise<void> {
    const tenantId = req.tenantId!;
    const actorUserId = req.user!.id;
    const { id } = req.params;

    try {
      const completed = await taskService.completeTask(tenantId, id, actorUserId);
      ApiResponse.success(res, completed);
    } catch (error) {
      const msg = (error as Error).message;
      if (msg.includes('not found')) {
        ApiResponse.notFound(res, msg);
      } else {
        ApiResponse.error(res, 'TASK_COMPLETION_FAILED', msg, 400);
      }
    }
  }

  public static async softDelete(req: Request, res: Response): Promise<void> {
    const tenantId = req.tenantId!;
    const actorUserId = req.user!.id;
    const { id } = req.params;

    const ok = await taskService.softDelete(tenantId, id, actorUserId);
    if (!ok) {
      ApiResponse.notFound(res, `Task with ID '${id}' not found`);
      return;
    }

    ApiResponse.success(res, { id, deleted: true });
  }
}
