/**
 * BCIP CRM Campaigns Route
 * Phase 2 — Prompt 002C: CRM API Layer
 */

import express from 'express';
import { SYSTEM_PERMISSIONS } from '@bcip/auth';
import { CampaignsController } from '../controllers/campaigns.controller.ts';
import { authMiddleware } from '../middleware/auth.middleware.ts';
import { requirePermission } from '../middleware/rbac.middleware.ts';
import { validateRequest } from '../middleware/validation.middleware.ts';
import { idempotencyMiddleware } from '../middleware/idempotency.middleware.ts';
import {
  idParamSchema,
  createCampaignSchema,
  updateCampaignSchema,
  listCampaignQuerySchema,
} from '../schemas/crm.schemas.ts';

export const campaignsRouter = express.Router();

campaignsRouter.use(authMiddleware);

campaignsRouter.get(
  '/',
  requirePermission(SYSTEM_PERMISSIONS.CRM_CAMPAIGN_VIEW),
  validateRequest({ query: listCampaignQuerySchema }),
  CampaignsController.list
);

campaignsRouter.post(
  '/',
  requirePermission(SYSTEM_PERMISSIONS.CRM_CAMPAIGN_CREATE),
  idempotencyMiddleware,
  validateRequest({ body: createCampaignSchema }),
  CampaignsController.create
);

campaignsRouter.get(
  '/:id',
  requirePermission(SYSTEM_PERMISSIONS.CRM_CAMPAIGN_VIEW),
  validateRequest({ params: idParamSchema }),
  CampaignsController.getById
);

campaignsRouter.patch(
  '/:id',
  requirePermission(SYSTEM_PERMISSIONS.CRM_CAMPAIGN_EDIT),
  idempotencyMiddleware,
  validateRequest({ params: idParamSchema, body: updateCampaignSchema }),
  CampaignsController.update
);

campaignsRouter.delete(
  '/:id',
  requirePermission(SYSTEM_PERMISSIONS.CRM_CAMPAIGN_DELETE),
  validateRequest({ params: idParamSchema }),
  CampaignsController.softDelete
);
