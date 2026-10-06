/**
 * BCIP Ainubis CRM Portfolio Intelligence Router
 * Phase 2E — Prompt 002E-007
 */

import express from 'express';
import { SYSTEM_PERMISSIONS } from '@bcip/auth';
import { AIPortfolioController } from '../controllers/ai-portfolio.controller.ts';
import { authMiddleware } from '../middleware/auth.middleware.ts';
import { requirePermission } from '../middleware/rbac.middleware.ts';
import { idempotencyMiddleware } from '../middleware/idempotency.middleware.ts';

export const aiPortfolioRouter = express.Router();

aiPortfolioRouter.use(authMiddleware);

// Get snapshot
aiPortfolioRouter.get(
  '/snapshot',
  requirePermission(SYSTEM_PERMISSIONS.CRM_AI_PORTFOLIO_VIEW),
  AIPortfolioController.getSnapshot
);

// Get metrics
aiPortfolioRouter.get(
  '/metrics',
  requirePermission(SYSTEM_PERMISSIONS.CRM_AI_PORTFOLIO_VIEW),
  AIPortfolioController.getMetrics
);

// Get signals
aiPortfolioRouter.get(
  '/signals',
  requirePermission(SYSTEM_PERMISSIONS.CRM_AI_PORTFOLIO_VIEW),
  AIPortfolioController.getSignals
);

// Get risks
aiPortfolioRouter.get(
  '/risks',
  requirePermission(SYSTEM_PERMISSIONS.CRM_AI_PORTFOLIO_VIEW),
  AIPortfolioController.getRisks
);

// Get trends
aiPortfolioRouter.get(
  '/trends',
  requirePermission(SYSTEM_PERMISSIONS.CRM_AI_PORTFOLIO_VIEW),
  AIPortfolioController.getTrends
);

// Get insights
aiPortfolioRouter.get(
  '/insights',
  requirePermission(SYSTEM_PERMISSIONS.CRM_AI_PORTFOLIO_INSIGHT_VIEW),
  AIPortfolioController.getInsights
);

// Get priorities
aiPortfolioRouter.get(
  '/priorities',
  requirePermission(SYSTEM_PERMISSIONS.CRM_AI_PORTFOLIO_VIEW),
  AIPortfolioController.getPriorities
);

// Get health
aiPortfolioRouter.get(
  '/health',
  requirePermission(SYSTEM_PERMISSIONS.CRM_AI_PORTFOLIO_VIEW),
  AIPortfolioController.getHealth
);

// Post execute analysis run
aiPortfolioRouter.post(
  '/analyze',
  requirePermission(SYSTEM_PERMISSIONS.CRM_AI_PORTFOLIO_ANALYZE),
  idempotencyMiddleware,
  AIPortfolioController.analyze
);
