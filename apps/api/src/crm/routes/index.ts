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
import { aiObservationsRouter } from './ai-observations.route.ts';
import { aiActionsRouter } from './ai-actions.route.ts';
import { aiWorkflowsRouter, aiWorkflowRunsRouter } from './ai-workflows.route.ts';
import { aiWorkflowTemplatesRouter } from './ai-workflow-templates.route.ts';
import { aiPortfolioRouter } from './ai-portfolio.route.ts';
import { aiReportsRouter } from './ai-reports.route.ts';

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
crmRouter.use('/ai/workflow-templates', aiWorkflowTemplatesRouter);
crmRouter.use('/ai/portfolio', aiPortfolioRouter);
crmRouter.use('/ai/reports', aiReportsRouter);
crmRouter.use('/ai/actions', aiActionsRouter);
crmRouter.use('/ai/workflows', aiWorkflowsRouter);
crmRouter.use('/ai/workflow-runs', aiWorkflowRunsRouter);
crmRouter.use('/ai/observations', aiObservationsRouter);
crmRouter.use('/ai', aiObservationsRouter);
