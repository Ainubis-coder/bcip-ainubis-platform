/**
 * BCIP CRM Scheme Prospects Route
 * Phase 2 — Prompt 002C: CRM API Layer
 */

import express from 'express';
import { SYSTEM_PERMISSIONS } from '@bcip/auth';
import { SchemeProspectsController } from '../controllers/scheme-prospects.controller.ts';
import { authMiddleware } from '../middleware/auth.middleware.ts';
import { requirePermission } from '../middleware/rbac.middleware.ts';
import { validateRequest } from '../middleware/validation.middleware.ts';
import { idempotencyMiddleware } from '../middleware/idempotency.middleware.ts';
import {
  idParamSchema,
  createSchemeProspectSchema,
  updateSchemeProspectSchema,
  listSchemeProspectQuerySchema,
} from '../schemas/crm.schemas.ts';

export const schemeProspectsRouter = express.Router();

schemeProspectsRouter.use(authMiddleware);

schemeProspectsRouter.get(
  '/',
  requirePermission(SYSTEM_PERMISSIONS.CRM_SCHEME_PROSPECT_VIEW),
  validateRequest({ query: listSchemeProspectQuerySchema }),
  SchemeProspectsController.list
);

schemeProspectsRouter.post(
  '/',
  requirePermission(SYSTEM_PERMISSIONS.CRM_SCHEME_PROSPECT_CREATE),
  idempotencyMiddleware,
  validateRequest({ body: createSchemeProspectSchema }),
  SchemeProspectsController.create
);

schemeProspectsRouter.get(
  '/:id',
  requirePermission(SYSTEM_PERMISSIONS.CRM_SCHEME_PROSPECT_VIEW),
  validateRequest({ params: idParamSchema }),
  SchemeProspectsController.getById
);

schemeProspectsRouter.patch(
  '/:id',
  requirePermission(SYSTEM_PERMISSIONS.CRM_SCHEME_PROSPECT_EDIT),
  idempotencyMiddleware,
  validateRequest({ params: idParamSchema, body: updateSchemeProspectSchema }),
  SchemeProspectsController.update
);

schemeProspectsRouter.delete(
  '/:id',
  requirePermission(SYSTEM_PERMISSIONS.CRM_SCHEME_PROSPECT_DELETE),
  validateRequest({ params: idParamSchema }),
  SchemeProspectsController.softDelete
);
