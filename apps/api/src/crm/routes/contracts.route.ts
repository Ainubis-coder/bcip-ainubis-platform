/**
 * BCIP CRM Contracts Route
 * Phase 2 — Prompt 002C: CRM API Layer
 */

import express from 'express';
import { SYSTEM_PERMISSIONS } from '@bcip/auth';
import { ContractsController } from '../controllers/contracts.controller.ts';
import { authMiddleware } from '../middleware/auth.middleware.ts';
import { requirePermission } from '../middleware/rbac.middleware.ts';
import { validateRequest } from '../middleware/validation.middleware.ts';
import { idempotencyMiddleware } from '../middleware/idempotency.middleware.ts';
import {
  idParamSchema,
  createContractSchema,
  updateContractSchema,
  listContractQuerySchema,
  signContractSchema,
  activateContractSchema,
  terminateContractSchema,
} from '../schemas/crm.schemas.ts';

export const contractsRouter = express.Router();

contractsRouter.use(authMiddleware);

contractsRouter.get(
  '/',
  requirePermission(SYSTEM_PERMISSIONS.CRM_CONTRACT_VIEW),
  validateRequest({ query: listContractQuerySchema }),
  ContractsController.list
);

contractsRouter.post(
  '/',
  requirePermission(SYSTEM_PERMISSIONS.CRM_CONTRACT_CREATE),
  idempotencyMiddleware,
  validateRequest({ body: createContractSchema }),
  ContractsController.create
);

contractsRouter.get(
  '/:id',
  requirePermission(SYSTEM_PERMISSIONS.CRM_CONTRACT_VIEW),
  validateRequest({ params: idParamSchema }),
  ContractsController.getById
);

contractsRouter.patch(
  '/:id',
  requirePermission(SYSTEM_PERMISSIONS.CRM_CONTRACT_EDIT),
  idempotencyMiddleware,
  validateRequest({ params: idParamSchema, body: updateContractSchema }),
  ContractsController.update
);

contractsRouter.delete(
  '/:id',
  requirePermission(SYSTEM_PERMISSIONS.CRM_CONTRACT_DELETE),
  validateRequest({ params: idParamSchema }),
  ContractsController.softDelete
);

contractsRouter.post(
  '/:id/sign',
  requirePermission(SYSTEM_PERMISSIONS.CRM_CONTRACT_SIGN),
  idempotencyMiddleware,
  validateRequest({ params: idParamSchema, body: signContractSchema }),
  ContractsController.sign
);

contractsRouter.post(
  '/:id/activate',
  requirePermission(SYSTEM_PERMISSIONS.CRM_CONTRACT_ACTIVATE),
  idempotencyMiddleware,
  validateRequest({ params: idParamSchema, body: activateContractSchema }),
  ContractsController.activate
);

contractsRouter.post(
  '/:id/terminate',
  requirePermission(SYSTEM_PERMISSIONS.CRM_CONTRACT_EDIT),
  idempotencyMiddleware,
  validateRequest({ params: idParamSchema, body: terminateContractSchema }),
  ContractsController.terminate
);
