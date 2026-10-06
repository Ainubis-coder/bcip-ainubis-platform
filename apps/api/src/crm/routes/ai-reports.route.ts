/**
 * BCIP Ainubis CRM Executive Reporting Router
 * Phase 2E — Prompt 002E-008
 */

import express from 'express';
import { SYSTEM_PERMISSIONS } from '@bcip/auth';
import { AIReportsController } from '../controllers/ai-reports.controller.ts';
import { authMiddleware } from '../middleware/auth.middleware.ts';
import { requirePermission } from '../middleware/rbac.middleware.ts';

export const aiReportsRouter = express.Router();

aiReportsRouter.use(authMiddleware);

// 1. List reports
aiReportsRouter.get(
  '/',
  requirePermission(SYSTEM_PERMISSIONS.CRM_AI_REPORT_VIEW),
  AIReportsController.listReports
);

// 4. Generate report
aiReportsRouter.post(
  '/generate',
  requirePermission(SYSTEM_PERMISSIONS.CRM_AI_REPORT_GENERATE),
  AIReportsController.generateReport
);

// 2. Get report by ID
aiReportsRouter.get(
  '/:id',
  requirePermission(SYSTEM_PERMISSIONS.CRM_AI_REPORT_VIEW),
  AIReportsController.getReportById
);

// 3. List report versions
aiReportsRouter.get(
  '/:id/versions',
  requirePermission(SYSTEM_PERMISSIONS.CRM_AI_REPORT_VIEW),
  AIReportsController.listVersions
);

// 5. Shift back to review required / submit for review
aiReportsRouter.post(
  '/:id/review',
  requirePermission(SYSTEM_PERMISSIONS.CRM_AI_REPORT_REVIEW),
  AIReportsController.reviewReport
);

// 6. Approve report
aiReportsRouter.post(
  '/:id/approve',
  requirePermission(SYSTEM_PERMISSIONS.CRM_AI_REPORT_APPROVE),
  AIReportsController.approveReport
);

// 7. Reject report
aiReportsRouter.post(
  '/:id/reject',
  requirePermission(SYSTEM_PERMISSIONS.CRM_AI_REPORT_APPROVE), // Rejecting is part of review/approval flow
  AIReportsController.rejectReport
);

// 8. Publish report
aiReportsRouter.post(
  '/:id/publish',
  requirePermission(SYSTEM_PERMISSIONS.CRM_AI_REPORT_PUBLISH),
  AIReportsController.publishReport
);

// 9. Archive report
aiReportsRouter.post(
  '/:id/archive',
  requirePermission(SYSTEM_PERMISSIONS.CRM_AI_REPORT_ARCHIVE),
  AIReportsController.archiveReport
);

// 10. Get report evidence
aiReportsRouter.get(
  '/:id/evidence',
  requirePermission(SYSTEM_PERMISSIONS.CRM_AI_REPORT_VIEW),
  AIReportsController.getReportEvidence
);

// 11. Export report
aiReportsRouter.post(
  '/:id/export',
  requirePermission(SYSTEM_PERMISSIONS.CRM_AI_REPORT_VIEW),
  AIReportsController.exportReport
);
