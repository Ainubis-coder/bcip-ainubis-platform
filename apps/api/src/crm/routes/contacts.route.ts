/**
 * BCIP CRM Contacts Route
 * Phase 2 — Prompt 002C: CRM API Layer
 */

import express from 'express';
import { SYSTEM_PERMISSIONS } from '@bcip/auth';
import { ContactsController } from '../controllers/contacts.controller.ts';
import { authMiddleware } from '../middleware/auth.middleware.ts';
import { requirePermission } from '../middleware/rbac.middleware.ts';
import { validateRequest } from '../middleware/validation.middleware.ts';
import { idempotencyMiddleware } from '../middleware/idempotency.middleware.ts';
import {
  idParamSchema,
  createContactSchema,
  updateContactSchema,
  listContactQuerySchema,
} from '../schemas/crm.schemas.ts';

export const contactsRouter = express.Router();

contactsRouter.use(authMiddleware);

contactsRouter.get(
  '/',
  requirePermission(SYSTEM_PERMISSIONS.CRM_CONTACT_VIEW),
  validateRequest({ query: listContactQuerySchema }),
  ContactsController.list
);

contactsRouter.post(
  '/',
  requirePermission(SYSTEM_PERMISSIONS.CRM_CONTACT_CREATE),
  idempotencyMiddleware,
  validateRequest({ body: createContactSchema }),
  ContactsController.create
);

contactsRouter.get(
  '/:id',
  requirePermission(SYSTEM_PERMISSIONS.CRM_CONTACT_VIEW),
  validateRequest({ params: idParamSchema }),
  ContactsController.getById
);

contactsRouter.patch(
  '/:id',
  requirePermission(SYSTEM_PERMISSIONS.CRM_CONTACT_EDIT),
  idempotencyMiddleware,
  validateRequest({ params: idParamSchema, body: updateContactSchema }),
  ContactsController.update
);

contactsRouter.delete(
  '/:id',
  requirePermission(SYSTEM_PERMISSIONS.CRM_CONTACT_DELETE),
  validateRequest({ params: idParamSchema }),
  ContactsController.softDelete
);
