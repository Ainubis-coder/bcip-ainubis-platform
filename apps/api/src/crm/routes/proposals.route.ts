/**
 * BCIP CRM Proposals Route
 * Phase 2 — Prompt 002C: CRM API Layer
 */

import express from 'express';
import { SYSTEM_PERMISSIONS } from '@bcip/auth';
import { ProposalsController } from '../controllers/proposals.controller.ts';
import { authMiddleware } from '../middleware/auth.middleware.ts';
import { requirePermission } from '../middleware/rbac.middleware.ts';
import { validateRequest } from '../middleware/validation.middleware.ts';
import { idempotencyMiddleware } from '../middleware/idempotency.middleware.ts';
import {
  idParamSchema,
  createProposalSchema,
  updateProposalSchema,
  listProposalQuerySchema,
  sendProposalSchema,
  acceptProposalSchema,
  rejectProposalSchema,
} from '../schemas/crm.schemas.ts';

export const proposalsRouter = express.Router();

proposalsRouter.use(authMiddleware);

proposalsRouter.get(
  '/',
  requirePermission(SYSTEM_PERMISSIONS.CRM_PROPOSAL_VIEW),
  validateRequest({ query: listProposalQuerySchema }),
  ProposalsController.list
);

proposalsRouter.post(
  '/',
  requirePermission(SYSTEM_PERMISSIONS.CRM_PROPOSAL_CREATE),
  idempotencyMiddleware,
  validateRequest({ body: createProposalSchema }),
  ProposalsController.create
);

proposalsRouter.get(
  '/:id',
  requirePermission(SYSTEM_PERMISSIONS.CRM_PROPOSAL_VIEW),
  validateRequest({ params: idParamSchema }),
  ProposalsController.getById
);

proposalsRouter.patch(
  '/:id',
  requirePermission(SYSTEM_PERMISSIONS.CRM_PROPOSAL_EDIT),
  idempotencyMiddleware,
  validateRequest({ params: idParamSchema, body: updateProposalSchema }),
  ProposalsController.update
);

proposalsRouter.delete(
  '/:id',
  requirePermission(SYSTEM_PERMISSIONS.CRM_PROPOSAL_DELETE),
  validateRequest({ params: idParamSchema }),
  ProposalsController.softDelete
);

proposalsRouter.post(
  '/:id/send',
  requirePermission(SYSTEM_PERMISSIONS.CRM_PROPOSAL_SEND),
  idempotencyMiddleware,
  validateRequest({ params: idParamSchema, body: sendProposalSchema }),
  ProposalsController.send
);

proposalsRouter.post(
  '/:id/accept',
  requirePermission(SYSTEM_PERMISSIONS.CRM_PROPOSAL_ACCEPT),
  idempotencyMiddleware,
  validateRequest({ params: idParamSchema, body: acceptProposalSchema }),
  ProposalsController.accept
);

proposalsRouter.post(
  '/:id/reject',
  requirePermission(SYSTEM_PERMISSIONS.CRM_PROPOSAL_EDIT),
  idempotencyMiddleware,
  validateRequest({ params: idParamSchema, body: rejectProposalSchema }),
  ProposalsController.reject
);
