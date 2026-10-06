/**
 * BCIP Ainubis Workflow Templates Router
 * Phase 2E — Prompt 002E-006: Ainubis Workflow Intelligence, Templates & Operational Control
 */

import express from 'express';
import { SYSTEM_PERMISSIONS } from '@bcip/auth';
import { AIWorkflowTemplatesController } from '../controllers/ai-workflow-templates.controller.ts';
import { authMiddleware } from '../middleware/auth.middleware.ts';
import { requirePermission } from '../middleware/rbac.middleware.ts';
import { idempotencyMiddleware } from '../middleware/idempotency.middleware.ts';

export const aiWorkflowTemplatesRouter = express.Router();

aiWorkflowTemplatesRouter.use(authMiddleware);

// List templates (including auto-seeding)
aiWorkflowTemplatesRouter.get(
  '/',
  requirePermission(SYSTEM_PERMISSIONS.CRM_AI_WORKFLOW_TEMPLATE_VIEW),
  AIWorkflowTemplatesController.listTemplates
);

// Create template
aiWorkflowTemplatesRouter.post(
  '/',
  requirePermission(SYSTEM_PERMISSIONS.CRM_AI_WORKFLOW_TEMPLATE_CREATE),
  idempotencyMiddleware,
  AIWorkflowTemplatesController.createTemplate
);

// Get template details
aiWorkflowTemplatesRouter.get(
  '/:id',
  requirePermission(SYSTEM_PERMISSIONS.CRM_AI_WORKFLOW_TEMPLATE_VIEW),
  AIWorkflowTemplatesController.getTemplateById
);

// Update template
aiWorkflowTemplatesRouter.put(
  '/:id',
  requirePermission(SYSTEM_PERMISSIONS.CRM_AI_WORKFLOW_TEMPLATE_EDIT),
  idempotencyMiddleware,
  AIWorkflowTemplatesController.updateTemplate
);

// Validate template
aiWorkflowTemplatesRouter.post(
  '/:id/validate',
  requirePermission(SYSTEM_PERMISSIONS.CRM_AI_WORKFLOW_TEMPLATE_VIEW),
  AIWorkflowTemplatesController.validateTemplate
);

// Publish template
aiWorkflowTemplatesRouter.post(
  '/:id/publish',
  requirePermission(SYSTEM_PERMISSIONS.CRM_AI_WORKFLOW_TEMPLATE_PUBLISH),
  idempotencyMiddleware,
  AIWorkflowTemplatesController.publishTemplate
);

// Deprecate template
aiWorkflowTemplatesRouter.post(
  '/:id/deprecate',
  requirePermission(SYSTEM_PERMISSIONS.CRM_AI_WORKFLOW_TEMPLATE_EDIT),
  idempotencyMiddleware,
  AIWorkflowTemplatesController.deprecateTemplate
);

// Archive template
aiWorkflowTemplatesRouter.post(
  '/:id/archive',
  requirePermission(SYSTEM_PERMISSIONS.CRM_AI_WORKFLOW_TEMPLATE_ARCHIVE),
  idempotencyMiddleware,
  AIWorkflowTemplatesController.archiveTemplate
);

// Clone template
aiWorkflowTemplatesRouter.post(
  '/:id/clone',
  requirePermission(SYSTEM_PERMISSIONS.CRM_AI_WORKFLOW_TEMPLATE_CREATE),
  idempotencyMiddleware,
  AIWorkflowTemplatesController.cloneTemplate
);

// Instantiate template into active workflow
aiWorkflowTemplatesRouter.post(
  '/:id/instantiate',
  requirePermission(SYSTEM_PERMISSIONS.CRM_AI_WORKFLOW_TEMPLATE_INSTANTIATE),
  idempotencyMiddleware,
  AIWorkflowTemplatesController.instantiateTemplate
);

// Get versions
aiWorkflowTemplatesRouter.get(
  '/:id/versions',
  requirePermission(SYSTEM_PERMISSIONS.CRM_AI_WORKFLOW_TEMPLATE_VIEW),
  AIWorkflowTemplatesController.listVersions
);

// Delete template
aiWorkflowTemplatesRouter.delete(
  '/:id',
  requirePermission(SYSTEM_PERMISSIONS.CRM_AI_WORKFLOW_TEMPLATE_ARCHIVE),
  idempotencyMiddleware,
  AIWorkflowTemplatesController.deleteTemplate
);
