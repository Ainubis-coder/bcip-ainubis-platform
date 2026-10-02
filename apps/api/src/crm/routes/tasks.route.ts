/**
 * BCIP CRM Tasks Route
 * Phase 2 — Prompt 002C: CRM API Layer
 */

import express from 'express';
import { SYSTEM_PERMISSIONS } from '@bcip/auth';
import { TasksController } from '../controllers/tasks.controller.ts';
import { authMiddleware } from '../middleware/auth.middleware.ts';
import { requirePermission } from '../middleware/rbac.middleware.ts';
import { validateRequest } from '../middleware/validation.middleware.ts';
import { idempotencyMiddleware } from '../middleware/idempotency.middleware.ts';
import {
  idParamSchema,
  createTaskSchema,
  updateTaskSchema,
  listTaskQuerySchema,
} from '../schemas/crm.schemas.ts';

export const tasksRouter = express.Router();

tasksRouter.use(authMiddleware);

tasksRouter.get(
  '/',
  requirePermission(SYSTEM_PERMISSIONS.CRM_TASK_VIEW),
  validateRequest({ query: listTaskQuerySchema }),
  TasksController.list
);

tasksRouter.post(
  '/',
  requirePermission(SYSTEM_PERMISSIONS.CRM_TASK_CREATE),
  idempotencyMiddleware,
  validateRequest({ body: createTaskSchema }),
  TasksController.create
);

tasksRouter.get(
  '/:id',
  requirePermission(SYSTEM_PERMISSIONS.CRM_TASK_VIEW),
  validateRequest({ params: idParamSchema }),
  TasksController.getById
);

tasksRouter.patch(
  '/:id',
  requirePermission(SYSTEM_PERMISSIONS.CRM_TASK_EDIT),
  idempotencyMiddleware,
  validateRequest({ params: idParamSchema, body: updateTaskSchema }),
  TasksController.update
);

tasksRouter.delete(
  '/:id',
  requirePermission(SYSTEM_PERMISSIONS.CRM_TASK_DELETE),
  validateRequest({ params: idParamSchema }),
  TasksController.softDelete
);

tasksRouter.post(
  '/:id/complete',
  requirePermission(SYSTEM_PERMISSIONS.CRM_TASK_COMPLETE),
  idempotencyMiddleware,
  validateRequest({ params: idParamSchema }),
  TasksController.complete
);
