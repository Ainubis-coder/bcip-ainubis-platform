/**
 * BCIP Ainubis AI Workflows Router
 * Phase 2E — Prompt 002E-005: Ainubis CRM Automation Orchestration & Workflow Intelligence
 */

import express from 'express';
import { SYSTEM_PERMISSIONS } from '@bcip/auth';
import { AIWorkflowsController } from '../controllers/ai-workflows.controller.ts';
import { authMiddleware } from '../middleware/auth.middleware.ts';
import { requirePermission } from '../middleware/rbac.middleware.ts';
import { idempotencyMiddleware } from '../middleware/idempotency.middleware.ts';

export const aiWorkflowsRouter = express.Router();

aiWorkflowsRouter.use(authMiddleware);

// 0. Operations, Analytics & Health (Prompt 002E-006)
aiWorkflowsRouter.get(
  '/operations',
  requirePermission(SYSTEM_PERMISSIONS.CRM_AI_WORKFLOW_ANALYTICS_VIEW),
  AIWorkflowsController.getOperations
);

aiWorkflowsRouter.get(
  '/analytics',
  requirePermission(SYSTEM_PERMISSIONS.CRM_AI_WORKFLOW_ANALYTICS_VIEW),
  AIWorkflowsController.getAnalytics
);

aiWorkflowsRouter.get(
  '/health',
  requirePermission(SYSTEM_PERMISSIONS.CRM_AI_WORKFLOW_HEALTH_VIEW),
  AIWorkflowsController.getHealth
);

aiWorkflowsRouter.get(
  '/step-analytics',
  requirePermission(SYSTEM_PERMISSIONS.CRM_AI_WORKFLOW_ANALYTICS_VIEW),
  AIWorkflowsController.getStepAnalytics
);

aiWorkflowsRouter.get(
  '/failures',
  requirePermission(SYSTEM_PERMISSIONS.CRM_AI_WORKFLOW_ADMIN),
  AIWorkflowsController.analyzeFailures
);

// 1. Workflows CRUD
aiWorkflowsRouter.get(
  '/',
  requirePermission(SYSTEM_PERMISSIONS.CRM_AI_WORKFLOW_VIEW),
  AIWorkflowsController.listWorkflows
);

aiWorkflowsRouter.post(
  '/',
  requirePermission(SYSTEM_PERMISSIONS.CRM_AI_WORKFLOW_CREATE),
  idempotencyMiddleware,
  AIWorkflowsController.createWorkflow
);

aiWorkflowsRouter.get(
  '/:id',
  requirePermission(SYSTEM_PERMISSIONS.CRM_AI_WORKFLOW_VIEW),
  AIWorkflowsController.getWorkflowById
);

aiWorkflowsRouter.put(
  '/:id',
  requirePermission(SYSTEM_PERMISSIONS.CRM_AI_WORKFLOW_EDIT),
  idempotencyMiddleware,
  AIWorkflowsController.updateWorkflow
);

// 2. Lifecycle transitions
aiWorkflowsRouter.post(
  '/:id/activate',
  requirePermission(SYSTEM_PERMISSIONS.CRM_AI_WORKFLOW_ACTIVATE),
  idempotencyMiddleware,
  AIWorkflowsController.activateWorkflow
);

aiWorkflowsRouter.post(
  '/:id/pause',
  requirePermission(SYSTEM_PERMISSIONS.CRM_AI_WORKFLOW_ACTIVATE),
  idempotencyMiddleware,
  AIWorkflowsController.pauseWorkflow
);

aiWorkflowsRouter.post(
  '/:id/disable',
  requirePermission(SYSTEM_PERMISSIONS.CRM_AI_WORKFLOW_ACTIVATE),
  idempotencyMiddleware,
  AIWorkflowsController.disableWorkflow
);

aiWorkflowsRouter.post(
  '/:id/archive',
  requirePermission(SYSTEM_PERMISSIONS.CRM_AI_WORKFLOW_ADMIN),
  idempotencyMiddleware,
  AIWorkflowsController.archiveWorkflow
);

// 3. Workflow Runs
aiWorkflowsRouter.get(
  '/:id/runs',
  requirePermission(SYSTEM_PERMISSIONS.CRM_AI_WORKFLOW_VIEW),
  AIWorkflowsController.listWorkflowRuns
);

aiWorkflowsRouter.post(
  '/:id/run',
  requirePermission(SYSTEM_PERMISSIONS.CRM_AI_WORKFLOW_RUN),
  idempotencyMiddleware,
  AIWorkflowsController.triggerWorkflowRun
);

// Dedicated Workflow Runs Router
export const aiWorkflowRunsRouter = express.Router();

aiWorkflowRunsRouter.use(authMiddleware);

aiWorkflowRunsRouter.get(
  '/:id',
  requirePermission(SYSTEM_PERMISSIONS.CRM_AI_WORKFLOW_VIEW),
  AIWorkflowsController.getWorkflowRun
);

aiWorkflowRunsRouter.post(
  '/:id/cancel',
  requirePermission(SYSTEM_PERMISSIONS.CRM_AI_WORKFLOW_EDIT),
  idempotencyMiddleware,
  AIWorkflowsController.cancelWorkflowRun
);

aiWorkflowRunsRouter.post(
  '/:id/retry',
  requirePermission(SYSTEM_PERMISSIONS.CRM_AI_WORKFLOW_RUN),
  idempotencyMiddleware,
  AIWorkflowsController.retryWorkflowRun
);

aiWorkflowRunsRouter.get(
  '/:id/timeline',
  requirePermission(SYSTEM_PERMISSIONS.CRM_AI_WORKFLOW_VIEW),
  AIWorkflowsController.getWorkflowRunTimeline
);

aiWorkflowRunsRouter.get(
  '/:id/outcome',
  requirePermission(SYSTEM_PERMISSIONS.CRM_AI_WORKFLOW_VIEW),
  AIWorkflowsController.getWorkflowRunOutcome
);

aiWorkflowRunsRouter.get(
  '/:id/evidence',
  requirePermission(SYSTEM_PERMISSIONS.CRM_AI_WORKFLOW_VIEW),
  AIWorkflowsController.getWorkflowRunEvidence
);

aiWorkflowRunsRouter.get(
  '/:id/approvals',
  requirePermission(SYSTEM_PERMISSIONS.CRM_AI_WORKFLOW_VIEW),
  AIWorkflowsController.getWorkflowRunApprovals
);
