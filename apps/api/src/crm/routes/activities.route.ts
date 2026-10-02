/**
 * BCIP CRM Activities Route
 * Phase 2 — Prompt 002C: CRM API Layer
 */

import express from 'express';
import { SYSTEM_PERMISSIONS } from '@bcip/auth';
import { ActivitiesController } from '../controllers/activities.controller.ts';
import { authMiddleware } from '../middleware/auth.middleware.ts';
import { requirePermission } from '../middleware/rbac.middleware.ts';
import { validateRequest } from '../middleware/validation.middleware.ts';
import { idempotencyMiddleware } from '../middleware/idempotency.middleware.ts';
import {
  idParamSchema,
  createActivitySchema,
  updateActivitySchema,
  listActivityQuerySchema,
} from '../schemas/crm.schemas.ts';

export const activitiesRouter = express.Router();

activitiesRouter.use(authMiddleware);

activitiesRouter.get(
  '/',
  requirePermission(SYSTEM_PERMISSIONS.CRM_ACTIVITY_VIEW),
  validateRequest({ query: listActivityQuerySchema }),
  ActivitiesController.list
);

activitiesRouter.post(
  '/',
  requirePermission(SYSTEM_PERMISSIONS.CRM_ACTIVITY_CREATE),
  idempotencyMiddleware,
  validateRequest({ body: createActivitySchema }),
  ActivitiesController.create
);

activitiesRouter.get(
  '/:id',
  requirePermission(SYSTEM_PERMISSIONS.CRM_ACTIVITY_VIEW),
  validateRequest({ params: idParamSchema }),
  ActivitiesController.getById
);

activitiesRouter.patch(
  '/:id',
  requirePermission(SYSTEM_PERMISSIONS.CRM_ACTIVITY_EDIT),
  idempotencyMiddleware,
  validateRequest({ params: idParamSchema, body: updateActivitySchema }),
  ActivitiesController.update
);

activitiesRouter.delete(
  '/:id',
  requirePermission(SYSTEM_PERMISSIONS.CRM_ACTIVITY_DELETE),
  validateRequest({ params: idParamSchema }),
  ActivitiesController.softDelete
);
