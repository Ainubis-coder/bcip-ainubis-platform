/**
 * BCIP Ainubis AI Observations Route
 * Phase 2E — Prompt 002E-001: Ainubis CRM Intelligence Foundation & Governance
 */

import express from 'express';
import { SYSTEM_PERMISSIONS } from '@bcip/auth';
import { AIObservationsController } from '../controllers/ai-observations.controller.ts';
import { authMiddleware } from '../middleware/auth.middleware.ts';
import { requirePermission } from '../middleware/rbac.middleware.ts';
import { idempotencyMiddleware } from '../middleware/idempotency.middleware.ts';
import { aiMonitoringRouter } from './ai-monitoring.route.ts';

export const aiObservationsRouter = express.Router();

aiObservationsRouter.use(authMiddleware);

// Continuous Monitoring Sub-Router
aiObservationsRouter.use('/monitoring', aiMonitoringRouter);

aiObservationsRouter.get(
  '/summary',
  requirePermission(SYSTEM_PERMISSIONS.CRM_AI_VIEW),
  AIObservationsController.summary
);

aiObservationsRouter.get(
  '/context/:entityType/:entityId',
  requirePermission(SYSTEM_PERMISSIONS.CRM_AI_VIEW),
  AIObservationsController.getContext
);

aiObservationsRouter.get(
  '/',
  requirePermission(SYSTEM_PERMISSIONS.CRM_AI_VIEW),
  AIObservationsController.list
);

aiObservationsRouter.get(
  '/observations',
  requirePermission(SYSTEM_PERMISSIONS.CRM_AI_VIEW),
  AIObservationsController.list
);

aiObservationsRouter.post(
  '/analyze',
  requirePermission(SYSTEM_PERMISSIONS.CRM_AI_GENERATE),
  idempotencyMiddleware,
  AIObservationsController.analyze
);

aiObservationsRouter.post(
  '/observations/analyze',
  requirePermission(SYSTEM_PERMISSIONS.CRM_AI_GENERATE),
  idempotencyMiddleware,
  AIObservationsController.analyze
);

aiObservationsRouter.get(
  '/:id',
  requirePermission(SYSTEM_PERMISSIONS.CRM_AI_VIEW),
  AIObservationsController.getById
);

aiObservationsRouter.get(
  '/observations/:id',
  requirePermission(SYSTEM_PERMISSIONS.CRM_AI_VIEW),
  AIObservationsController.getById
);

aiObservationsRouter.post(
  '/:id/review',
  requirePermission(SYSTEM_PERMISSIONS.CRM_AI_REVIEW),
  idempotencyMiddleware,
  AIObservationsController.review
);

aiObservationsRouter.post(
  '/observations/:id/review',
  requirePermission(SYSTEM_PERMISSIONS.CRM_AI_REVIEW),
  idempotencyMiddleware,
  AIObservationsController.review
);

aiObservationsRouter.post(
  '/:id/approve',
  requirePermission(SYSTEM_PERMISSIONS.CRM_AI_APPROVE),
  idempotencyMiddleware,
  AIObservationsController.approve
);

aiObservationsRouter.post(
  '/observations/:id/approve',
  requirePermission(SYSTEM_PERMISSIONS.CRM_AI_APPROVE),
  idempotencyMiddleware,
  AIObservationsController.approve
);

aiObservationsRouter.post(
  '/:id/reject',
  requirePermission(SYSTEM_PERMISSIONS.CRM_AI_APPROVE),
  idempotencyMiddleware,
  AIObservationsController.reject
);

aiObservationsRouter.post(
  '/observations/:id/reject',
  requirePermission(SYSTEM_PERMISSIONS.CRM_AI_APPROVE),
  idempotencyMiddleware,
  AIObservationsController.reject
);

aiObservationsRouter.post(
  '/:id/dismiss',
  requirePermission(SYSTEM_PERMISSIONS.CRM_AI_DISMISS),
  idempotencyMiddleware,
  AIObservationsController.dismiss
);

aiObservationsRouter.post(
  '/observations/:id/dismiss',
  requirePermission(SYSTEM_PERMISSIONS.CRM_AI_DISMISS),
  idempotencyMiddleware,
  AIObservationsController.dismiss
);
