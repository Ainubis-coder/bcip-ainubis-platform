/**
 * BCIP Ainubis AI Continuous Monitoring Routes
 * Phase 2E — Prompt 002E-003: Ainubis Continuous CRM Intelligence & Automated Monitoring
 */

import express from 'express';
import { SYSTEM_PERMISSIONS } from '@bcip/auth';
import { AIMonitoringController } from '../controllers/ai-monitoring.controller.ts';
import { authMiddleware } from '../middleware/auth.middleware.ts';
import { requirePermission } from '../middleware/rbac.middleware.ts';
import { idempotencyMiddleware } from '../middleware/idempotency.middleware.ts';

export const aiMonitoringRouter = express.Router();

aiMonitoringRouter.use(authMiddleware);

// Monitoring status overview
aiMonitoringRouter.get(
  '/status',
  requirePermission(SYSTEM_PERMISSIONS.CRM_AI_VIEW),
  AIMonitoringController.getStatus
);

// Intelligence capability registry
aiMonitoringRouter.get(
  '/capabilities',
  requirePermission(SYSTEM_PERMISSIONS.CRM_AI_VIEW),
  AIMonitoringController.getCapabilities
);

// Execution history timeline
aiMonitoringRouter.get(
  '/executions',
  requirePermission(SYSTEM_PERMISSIONS.CRM_AI_VIEW),
  AIMonitoringController.getExecutions
);

// Manual trigger action
aiMonitoringRouter.post(
  '/run',
  requirePermission(SYSTEM_PERMISSIONS.CRM_AI_MONITOR),
  idempotencyMiddleware,
  AIMonitoringController.runMonitoring
);
