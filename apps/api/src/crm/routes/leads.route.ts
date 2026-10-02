/**
 * BCIP CRM Leads Route
 * Phase 2 — Prompt 002C: CRM API Layer
 */

import express from 'express';
import { SYSTEM_PERMISSIONS } from '@bcip/auth';
import { LeadsController } from '../controllers/leads.controller.ts';
import { authMiddleware } from '../middleware/auth.middleware.ts';
import { requirePermission } from '../middleware/rbac.middleware.ts';
import { validateRequest } from '../middleware/validation.middleware.ts';
import { idempotencyMiddleware } from '../middleware/idempotency.middleware.ts';
import {
  idParamSchema,
  createLeadSchema,
  updateLeadSchema,
  listLeadQuerySchema,
  convertLeadSchema,
} from '../schemas/crm.schemas.ts';

export const leadsRouter = express.Router();

leadsRouter.use(authMiddleware);

leadsRouter.get(
  '/',
  requirePermission(SYSTEM_PERMISSIONS.CRM_LEAD_VIEW),
  validateRequest({ query: listLeadQuerySchema }),
  LeadsController.list
);

leadsRouter.post(
  '/',
  requirePermission(SYSTEM_PERMISSIONS.CRM_LEAD_CREATE),
  idempotencyMiddleware,
  validateRequest({ body: createLeadSchema }),
  LeadsController.create
);

leadsRouter.get(
  '/:id',
  requirePermission(SYSTEM_PERMISSIONS.CRM_LEAD_VIEW),
  validateRequest({ params: idParamSchema }),
  LeadsController.getById
);

leadsRouter.patch(
  '/:id',
  requirePermission(SYSTEM_PERMISSIONS.CRM_LEAD_EDIT),
  idempotencyMiddleware,
  validateRequest({ params: idParamSchema, body: updateLeadSchema }),
  LeadsController.update
);

leadsRouter.delete(
  '/:id',
  requirePermission(SYSTEM_PERMISSIONS.CRM_LEAD_DELETE),
  validateRequest({ params: idParamSchema }),
  LeadsController.softDelete
);

leadsRouter.post(
  '/:id/convert',
  requirePermission(SYSTEM_PERMISSIONS.CRM_LEAD_CONVERT),
  idempotencyMiddleware,
  validateRequest({ params: idParamSchema, body: convertLeadSchema }),
  LeadsController.convert
);
