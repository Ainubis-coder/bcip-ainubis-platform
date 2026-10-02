/**
 * BCIP CRM Opportunities Route
 * Phase 2 — Prompt 002C: CRM API Layer
 */

import express from 'express';
import { SYSTEM_PERMISSIONS } from '@bcip/auth';
import { OpportunitiesController } from '../controllers/opportunities.controller.ts';
import { authMiddleware } from '../middleware/auth.middleware.ts';
import { requirePermission } from '../middleware/rbac.middleware.ts';
import { validateRequest } from '../middleware/validation.middleware.ts';
import { idempotencyMiddleware } from '../middleware/idempotency.middleware.ts';
import {
  idParamSchema,
  createOpportunitySchema,
  updateOpportunitySchema,
  listOpportunityQuerySchema,
  stageTransitionSchema,
  pipelineQuerySchema,
} from '../schemas/crm.schemas.ts';

export const opportunitiesRouter = express.Router();

opportunitiesRouter.use(authMiddleware);

// Pipeline aggregation route (must precede /:id)
opportunitiesRouter.get(
  '/pipeline',
  requirePermission(SYSTEM_PERMISSIONS.CRM_OPPORTUNITY_VIEW),
  validateRequest({ query: pipelineQuerySchema }),
  OpportunitiesController.getPipeline
);

opportunitiesRouter.get(
  '/',
  requirePermission(SYSTEM_PERMISSIONS.CRM_OPPORTUNITY_VIEW),
  validateRequest({ query: listOpportunityQuerySchema }),
  OpportunitiesController.list
);

opportunitiesRouter.post(
  '/',
  requirePermission(SYSTEM_PERMISSIONS.CRM_OPPORTUNITY_CREATE),
  idempotencyMiddleware,
  validateRequest({ body: createOpportunitySchema }),
  OpportunitiesController.create
);

opportunitiesRouter.get(
  '/:id',
  requirePermission(SYSTEM_PERMISSIONS.CRM_OPPORTUNITY_VIEW),
  validateRequest({ params: idParamSchema }),
  OpportunitiesController.getById
);

opportunitiesRouter.patch(
  '/:id',
  requirePermission(SYSTEM_PERMISSIONS.CRM_OPPORTUNITY_EDIT),
  idempotencyMiddleware,
  validateRequest({ params: idParamSchema, body: updateOpportunitySchema }),
  OpportunitiesController.update
);

opportunitiesRouter.delete(
  '/:id',
  requirePermission(SYSTEM_PERMISSIONS.CRM_OPPORTUNITY_DELETE),
  validateRequest({ params: idParamSchema }),
  OpportunitiesController.softDelete
);

opportunitiesRouter.post(
  '/:id/stage',
  requirePermission(SYSTEM_PERMISSIONS.CRM_OPPORTUNITY_STAGE),
  idempotencyMiddleware,
  validateRequest({ params: idParamSchema, body: stageTransitionSchema }),
  OpportunitiesController.transitionStage
);

opportunitiesRouter.get(
  '/:id/history',
  requirePermission(SYSTEM_PERMISSIONS.CRM_OPPORTUNITY_VIEW),
  validateRequest({ params: idParamSchema }),
  OpportunitiesController.getHistory
);
