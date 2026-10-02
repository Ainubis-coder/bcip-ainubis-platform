/**
 * BCIP Ainubis AI Actions Router
 * Phase 2E — Prompt 002E-004: Ainubis Intelligence Actions & Human-Approved CRM Automation
 */

import express from 'express';
import { SYSTEM_PERMISSIONS } from '@bcip/auth';
import { AIActionsController } from '../controllers/ai-actions.controller.ts';
import { authMiddleware } from '../middleware/auth.middleware.ts';
import { requirePermission } from '../middleware/rbac.middleware.ts';
import { idempotencyMiddleware } from '../middleware/idempotency.middleware.ts';

export const aiActionsRouter = express.Router();

aiActionsRouter.use(authMiddleware);

// List Actions
aiActionsRouter.get(
  '/',
  requirePermission(SYSTEM_PERMISSIONS.CRM_AI_ACTION_VIEW),
  AIActionsController.list
);

// Get Action by ID
aiActionsRouter.get(
  '/:id',
  requirePermission(SYSTEM_PERMISSIONS.CRM_AI_ACTION_VIEW),
  AIActionsController.getById
);

// Propose Action
aiActionsRouter.post(
  '/',
  requirePermission(SYSTEM_PERMISSIONS.CRM_AI_ACTION_VIEW),
  idempotencyMiddleware,
  AIActionsController.propose
);

// Request Review
aiActionsRouter.post(
  '/:id/review',
  requirePermission(SYSTEM_PERMISSIONS.CRM_AI_ACTION_VIEW),
  idempotencyMiddleware,
  AIActionsController.review
);

// Approve Action
aiActionsRouter.post(
  '/:id/approve',
  requirePermission(SYSTEM_PERMISSIONS.CRM_AI_ACTION_APPROVE),
  idempotencyMiddleware,
  AIActionsController.approve
);

// Reject Action
aiActionsRouter.post(
  '/:id/reject',
  requirePermission(SYSTEM_PERMISSIONS.CRM_AI_ACTION_REJECT),
  idempotencyMiddleware,
  AIActionsController.reject
);

// Cancel Action
aiActionsRouter.post(
  '/:id/cancel',
  requirePermission(SYSTEM_PERMISSIONS.CRM_AI_ACTION_VIEW),
  idempotencyMiddleware,
  AIActionsController.cancel
);

// Execute Action
aiActionsRouter.post(
  '/:id/execute',
  requirePermission(SYSTEM_PERMISSIONS.CRM_AI_ACTION_EXECUTE),
  idempotencyMiddleware,
  AIActionsController.execute
);

// Evidence lookup
aiActionsRouter.get(
  '/:id/evidence',
  requirePermission(SYSTEM_PERMISSIONS.CRM_AI_ACTION_VIEW),
  AIActionsController.evidence
);

// Execution history
aiActionsRouter.get(
  '/:id/execution',
  requirePermission(SYSTEM_PERMISSIONS.CRM_AI_ACTION_VIEW),
  AIActionsController.execution
);

// Verification logs
aiActionsRouter.get(
  '/:id/verification',
  requirePermission(SYSTEM_PERMISSIONS.CRM_AI_ACTION_VIEW),
  AIActionsController.verification
);
