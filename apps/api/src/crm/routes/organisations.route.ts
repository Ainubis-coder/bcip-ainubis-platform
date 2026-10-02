/**
 * BCIP CRM Organisations Route
 * Phase 2 — Prompt 002C: CRM API Layer
 */

import express from 'express';
import { SYSTEM_PERMISSIONS } from '@bcip/auth';
import { OrganisationsController } from '../controllers/organisations.controller.ts';
import { authMiddleware } from '../middleware/auth.middleware.ts';
import { requirePermission } from '../middleware/rbac.middleware.ts';
import { validateRequest } from '../middleware/validation.middleware.ts';
import { idempotencyMiddleware } from '../middleware/idempotency.middleware.ts';
import {
  idParamSchema,
  createOrganisationSchema,
  updateOrganisationSchema,
  listOrganisationQuerySchema,
} from '../schemas/crm.schemas.ts';

export const organisationsRouter = express.Router();

organisationsRouter.use(authMiddleware);

organisationsRouter.get(
  '/',
  requirePermission(SYSTEM_PERMISSIONS.CRM_ORGANISATION_VIEW),
  validateRequest({ query: listOrganisationQuerySchema }),
  OrganisationsController.list
);

organisationsRouter.post(
  '/',
  requirePermission(SYSTEM_PERMISSIONS.CRM_ORGANISATION_CREATE),
  idempotencyMiddleware,
  validateRequest({ body: createOrganisationSchema }),
  OrganisationsController.create
);

organisationsRouter.get(
  '/:id',
  requirePermission(SYSTEM_PERMISSIONS.CRM_ORGANISATION_VIEW),
  validateRequest({ params: idParamSchema }),
  OrganisationsController.getById
);

organisationsRouter.patch(
  '/:id',
  requirePermission(SYSTEM_PERMISSIONS.CRM_ORGANISATION_EDIT),
  idempotencyMiddleware,
  validateRequest({ params: idParamSchema, body: updateOrganisationSchema }),
  OrganisationsController.update
);

organisationsRouter.delete(
  '/:id',
  requirePermission(SYSTEM_PERMISSIONS.CRM_ORGANISATION_DELETE),
  validateRequest({ params: idParamSchema }),
  OrganisationsController.softDelete
);

organisationsRouter.get(
  '/:id/contacts',
  requirePermission(SYSTEM_PERMISSIONS.CRM_CONTACT_VIEW),
  validateRequest({ params: idParamSchema }),
  OrganisationsController.getContacts
);

organisationsRouter.get(
  '/:id/opportunities',
  requirePermission(SYSTEM_PERMISSIONS.CRM_OPPORTUNITY_VIEW),
  validateRequest({ params: idParamSchema }),
  OrganisationsController.getOpportunities
);

organisationsRouter.get(
  '/:id/scheme-prospects',
  requirePermission(SYSTEM_PERMISSIONS.CRM_SCHEME_PROSPECT_VIEW),
  validateRequest({ params: idParamSchema }),
  OrganisationsController.getSchemeProspects
);
