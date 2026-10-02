/**
 * BCIP CRM API Request Validation Schemas
 * Type-safe Zod definitions for route params, query strings, and mutation bodies.
 * Phase 2 — Prompt 002C: CRM API Layer
 */

import { z } from 'zod';
import {
  LeadStatus,
  LeadSource,
  QualificationStatus,
  ExpectedTimeline,
  OrganisationType,
  OrganisationStatus,
  ContactStatus,
  PreferredContactMethod,
  OpportunityStage,
  ActivityType,
  TaskStatus,
  TaskPriority,
  CampaignType,
  CampaignStatus,
  ProposalStatus,
  ContractStatus,
} from '@bcip/database';

// Helper for 2-decimal financial values
const financialAmountSchema = z.number().min(0, 'Financial amounts must be non-negative').refine(
  (val) => Number.isFinite(val) && Number(val.toFixed(2)) === val,
  { message: 'Financial amounts must not exceed 2 decimal places precision' }
);

// Common ID Param
export const idParamSchema = z.object({
  id: z.string().min(1, 'Entity identifier is required'),
});

// Common Pagination & Sorting Query Schema
export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1, 'Page must be at least 1').default(1),
  pageSize: z.coerce.number().int().min(1).max(100, 'Page size cannot exceed 100').default(20),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  search: z.string().optional(),
});

// ----------------------------------------------------------------------
// Organisations
// ----------------------------------------------------------------------
export const createOrganisationSchema = z.object({
  name: z.string().min(2, 'Organisation name must have at least 2 characters').max(200),
  legalName: z.string().max(200).optional(),
  organisationType: z.nativeEnum(OrganisationType),
  registrationNumber: z.string().max(50).optional(),
  email: z.string().email('Invalid organisation email format').optional(),
  phone: z.string().max(50).optional(),
  website: z.string().max(255).optional(),
  address: z.union([z.string(), z.record(z.string(), z.unknown())]).optional(),
  status: z.nativeEnum(OrganisationStatus).default(OrganisationStatus.PROSPECT),
  ownerUserId: z.string().optional(),
  notes: z.string().optional(),
});

export const updateOrganisationSchema = createOrganisationSchema.partial();

export const listOrganisationQuerySchema = paginationQuerySchema.extend({
  status: z.nativeEnum(OrganisationStatus).optional(),
  organisationType: z.nativeEnum(OrganisationType).optional(),
});

// ----------------------------------------------------------------------
// Contacts
// ----------------------------------------------------------------------
export const createContactSchema = z.object({
  firstName: z.string().min(1, 'First name is required').max(100),
  lastName: z.string().min(1, 'Last name is required').max(100),
  organisationId: z.string().optional(),
  jobTitle: z.string().max(100).optional(),
  email: z.string().email('Invalid email address format').optional(),
  phone: z.string().max(50).optional(),
  mobile: z.string().max(50).optional(),
  preferredContactMethod: z.nativeEnum(PreferredContactMethod).default(PreferredContactMethod.EMAIL),
  status: z.nativeEnum(ContactStatus).default(ContactStatus.ACTIVE),
  notes: z.string().optional(),
});

export const updateContactSchema = createContactSchema.partial();

export const listContactQuerySchema = paginationQuerySchema.extend({
  organisationId: z.string().optional(),
  status: z.nativeEnum(ContactStatus).optional(),
});

// ----------------------------------------------------------------------
// Leads
// ----------------------------------------------------------------------
export const createLeadSchema = z.object({
  title: z.string().min(2, 'Lead title is required').max(200),
  source: z.nativeEnum(LeadSource),
  sourceDetail: z.string().max(200).optional(),
  email: z.string().email('Invalid email format').optional(),
  phone: z.string().max(50).optional(),
  website: z.string().max(255).optional(),
  schemeName: z.string().max(200).optional(),
  estimatedUnits: z.number().int().min(0, 'Estimated units must be non-negative').optional(),
  managingAgent: z.string().max(200).optional(),
  currentSystem: z.string().max(100).optional(),
  painPoints: z.array(z.string()).optional(),
  requiredModules: z.array(z.string()).optional(),
  expectedTimeline: z.nativeEnum(ExpectedTimeline).optional(),
  campaignId: z.string().optional(),
  leadOwnerId: z.string().optional(),
  description: z.string().optional(),
});

export const updateLeadSchema = createLeadSchema.partial().extend({
  status: z.nativeEnum(LeadStatus).optional(),
  qualificationStatus: z.nativeEnum(QualificationStatus).optional(),
});

export const convertLeadSchema = z.object({
  organisationName: z.string().min(2).max(200).optional(),
  organisationType: z.nativeEnum(OrganisationType).optional(),
  existingOrganisationId: z.string().optional(),
  contactFirstName: z.string().min(1).max(100).optional(),
  contactLastName: z.string().min(1).max(100).optional(),
  existingContactId: z.string().optional(),
  opportunityName: z.string().min(2).max(200).optional(),
  estimatedValue: financialAmountSchema.optional(),
  expectedCloseDate: z.string().optional(),
  createSchemeProspect: z.boolean().default(true),
});

export const listLeadQuerySchema = paginationQuerySchema.extend({
  status: z.nativeEnum(LeadStatus).optional(),
  qualificationStatus: z.nativeEnum(QualificationStatus).optional(),
  campaignId: z.string().optional(),
  leadOwnerId: z.string().optional(),
});

// ----------------------------------------------------------------------
// Scheme Prospects
// ----------------------------------------------------------------------
export const createSchemeProspectSchema = z.object({
  name: z.string().min(2, 'Scheme prospect name is required').max(200),
  organisationId: z.string().optional(),
  leadId: z.string().optional(),
  registrationNumber: z.string().max(50).optional(),
  sectionalTitleSchemeCode: z.string().max(50).optional(),
  estimatedUnitCount: z.number().int().min(0).default(0),
  location: z.string().max(200).optional(),
  managingAgentName: z.string().max(200).optional(),
  currentPropertySystem: z.string().max(100).optional(),
  currentAccountingSystem: z.string().max(100).optional(),
  requirementsSummary: z.string().optional(),
  painPoints: z.array(z.string()).optional(),
  notes: z.string().optional(),
});

export const updateSchemeProspectSchema = createSchemeProspectSchema.partial();

export const listSchemeProspectQuerySchema = paginationQuerySchema.extend({
  organisationId: z.string().optional(),
  leadId: z.string().optional(),
});

// ----------------------------------------------------------------------
// Opportunities
// ----------------------------------------------------------------------
export const createOpportunitySchema = z.object({
  name: z.string().min(2, 'Opportunity name is required').max(200),
  organisationId: z.string().optional(),
  leadId: z.string().optional(),
  primaryContactId: z.string().optional(),
  schemeProspectId: z.string().optional(),
  stage: z.nativeEnum(OpportunityStage).default(OpportunityStage.DISCOVERY),
  estimatedValue: financialAmountSchema.default(0),
  currency: z.string().length(3, 'Currency must be 3 ISO characters').default('ZAR'),
  probability: z.number().min(0).max(100, 'Probability must be 0-100').default(20),
  expectedCloseDate: z.string().optional(),
  ownerUserId: z.string().optional(),
  source: z.nativeEnum(LeadSource).optional(),
  description: z.string().optional(),
  nextAction: z.string().max(200).optional(),
  nextActionAt: z.string().optional(),
});

export const updateOpportunitySchema = createOpportunitySchema.partial();

export const stageTransitionSchema = z.object({
  stage: z.nativeEnum(OpportunityStage, { message: 'Invalid opportunity stage' }),
  reason: z.string().max(500).optional(),
});

export const listOpportunityQuerySchema = paginationQuerySchema.extend({
  stage: z.nativeEnum(OpportunityStage).optional(),
  organisationId: z.string().optional(),
  ownerUserId: z.string().optional(),
});

export const pipelineQuerySchema = z.object({
  stage: z.nativeEnum(OpportunityStage).optional(),
  owner: z.string().optional(),
  status: z.string().optional(),
  fromDate: z.string().optional(),
  toDate: z.string().optional(),
});

// ----------------------------------------------------------------------
// Activities
// ----------------------------------------------------------------------
export const createActivitySchema = z.object({
  activityType: z.nativeEnum(ActivityType),
  subject: z.string().min(1, 'Subject is required').max(200),
  description: z.string().optional(),
  activityAt: z.string().optional(),
  completedAt: z.string().optional(),
  leadId: z.string().optional(),
  contactId: z.string().optional(),
  organisationId: z.string().optional(),
  opportunityId: z.string().optional(),
});

export const updateActivitySchema = createActivitySchema.partial();

export const listActivityQuerySchema = paginationQuerySchema.extend({
  activityType: z.nativeEnum(ActivityType).optional(),
  leadId: z.string().optional(),
  contactId: z.string().optional(),
  organisationId: z.string().optional(),
  opportunityId: z.string().optional(),
});

// ----------------------------------------------------------------------
// Tasks
// ----------------------------------------------------------------------
export const createTaskSchema = z.object({
  title: z.string().min(1, 'Task title is required').max(200),
  description: z.string().optional(),
  status: z.nativeEnum(TaskStatus).default(TaskStatus.OPEN),
  priority: z.nativeEnum(TaskPriority).default(TaskPriority.MEDIUM),
  assignedTo: z.string().optional(),
  dueAt: z.string().optional(),
  leadId: z.string().optional(),
  contactId: z.string().optional(),
  organisationId: z.string().optional(),
  opportunityId: z.string().optional(),
});

export const updateTaskSchema = createTaskSchema.partial();

export const listTaskQuerySchema = paginationQuerySchema.extend({
  status: z.nativeEnum(TaskStatus).optional(),
  priority: z.nativeEnum(TaskPriority).optional(),
  assignedTo: z.string().optional(),
  leadId: z.string().optional(),
  opportunityId: z.string().optional(),
});

// ----------------------------------------------------------------------
// Campaigns
// ----------------------------------------------------------------------
export const createCampaignSchema = z.object({
  name: z.string().min(2, 'Campaign name is required').max(200),
  description: z.string().optional(),
  campaignType: z.nativeEnum(CampaignType),
  status: z.nativeEnum(CampaignStatus).default(CampaignStatus.PLANNING),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  ownerUserId: z.string().optional(),
});

export const updateCampaignSchema = createCampaignSchema.partial();

export const listCampaignQuerySchema = paginationQuerySchema.extend({
  status: z.nativeEnum(CampaignStatus).optional(),
  campaignType: z.nativeEnum(CampaignType).optional(),
});

// ----------------------------------------------------------------------
// Proposals
// ----------------------------------------------------------------------
export const createProposalSchema = z.object({
  opportunityId: z.string().min(1, 'Opportunity ID is required'),
  title: z.string().min(2, 'Proposal title is required').max(200),
  subtotal: financialAmountSchema,
  tax: financialAmountSchema.default(0),
  total: financialAmountSchema,
  currency: z.string().length(3).default('ZAR'),
  validUntil: z.string().optional(),
  documentId: z.string().optional(),
  items: z
    .array(
      z.object({
        description: z.string().min(1),
        quantity: z.number().int().min(1),
        unitPrice: financialAmountSchema,
        amount: financialAmountSchema,
      })
    )
    .optional(),
});

export const updateProposalSchema = createProposalSchema.partial().extend({
  status: z.nativeEnum(ProposalStatus).optional(),
});

export const sendProposalSchema = z.object({
  documentId: z.string().optional(),
});

export const acceptProposalSchema = z.object({
  acceptedAt: z.string().optional(),
});

export const rejectProposalSchema = z.object({
  reason: z.string().max(500).optional(),
});

export const listProposalQuerySchema = paginationQuerySchema.extend({
  status: z.nativeEnum(ProposalStatus).optional(),
  opportunityId: z.string().optional(),
});

// ----------------------------------------------------------------------
// Contracts
// ----------------------------------------------------------------------
export const createContractSchema = z.object({
  title: z.string().min(2, 'Contract title is required').max(200),
  opportunityId: z.string().optional(),
  proposalId: z.string().optional(),
  effectiveDate: z.string().optional(),
  expiryDate: z.string().optional(),
  documentId: z.string().optional(),
});

export const updateContractSchema = createContractSchema.partial().extend({
  status: z.nativeEnum(ContractStatus).optional(),
});

export const signContractSchema = z.object({
  signedAt: z.string().optional(),
  documentId: z.string().optional(),
});

export const activateContractSchema = z.object({
  effectiveDate: z.string().optional(),
});

export const terminateContractSchema = z.object({
  reason: z.string().max(500).optional(),
});

export const listContractQuerySchema = paginationQuerySchema.extend({
  status: z.nativeEnum(ContractStatus).optional(),
  opportunityId: z.string().optional(),
  proposalId: z.string().optional(),
});
