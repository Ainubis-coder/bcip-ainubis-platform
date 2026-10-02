/**
 * BCIP CRM API Routes Aggregator
 * Mounts all 10 CRM resource routers under /api/v1.
 * Phase 2 — Prompt 002C: CRM API Layer
 */

import express from 'express';
import { organisationsRouter } from './organisations.route.ts';
import { contactsRouter } from './contacts.route.ts';
import { leadsRouter } from './leads.route.ts';
import { schemeProspectsRouter } from './scheme-prospects.route.ts';
import { opportunitiesRouter } from './opportunities.route.ts';
import { activitiesRouter } from './activities.route.ts';
import { tasksRouter } from './tasks.route.ts';
import { campaignsRouter } from './campaigns.route.ts';
import { proposalsRouter } from './proposals.route.ts';
import { contractsRouter } from './contracts.route.ts';

export const crmRouter = express.Router();

crmRouter.use('/organisations', organisationsRouter);
crmRouter.use('/contacts', contactsRouter);
crmRouter.use('/leads', leadsRouter);
crmRouter.use('/scheme-prospects', schemeProspectsRouter);
crmRouter.use('/opportunities', opportunitiesRouter);
crmRouter.use('/activities', activitiesRouter);
crmRouter.use('/tasks', tasksRouter);
crmRouter.use('/campaigns', campaignsRouter);
crmRouter.use('/proposals', proposalsRouter);
crmRouter.use('/contracts', contractsRouter);
