/**
 * BCIP CRM Controlled Enums & Domain Value Sets
 * Phase 002 — Step 002B: CRM Domain Model & Database Schema
 */

/**
 * Controlled Lead lifecycle status.
 * Uncontrolled free-text status values are strictly forbidden.
 */
export const LeadStatus = {
  NEW: 'NEW',
  ENRICHED: 'ENRICHED',
  QUALIFIED: 'QUALIFIED',
  NURTURE: 'NURTURE',
  RE_ENGAGEMENT: 'RE_ENGAGEMENT',
  LOST: 'LOST',
  CONVERTED: 'CONVERTED',
} as const;

export type LeadStatus = (typeof LeadStatus)[keyof typeof LeadStatus];

/**
 * Lead qualification assessment status.
 */
export const QualificationStatus = {
  UNQUALIFIED: 'UNQUALIFIED',
  PRE_QUALIFIED: 'PRE_QUALIFIED',
  QUALIFIED: 'QUALIFIED',
  DISQUALIFIED: 'DISQUALIFIED',
} as const;

export type QualificationStatus = (typeof QualificationStatus)[keyof typeof QualificationStatus];

/**
 * Lead source channels for provenance and campaign attribution.
 */
export const LeadSource = {
  DIRECT_OUTREACH: 'DIRECT_OUTREACH',
  WEBSITE: 'WEBSITE',
  REFERRAL: 'REFERRAL',
  EVENT: 'EVENT',
  PARTNER: 'PARTNER',
  CAMPAIGN: 'CAMPAIGN',
  MANAGING_AGENT_NETWORK: 'MANAGING_AGENT_NETWORK',
  BODY_CORPORATE_PORTAL: 'BODY_CORPORATE_PORTAL',
  OTHER: 'OTHER',
} as const;

export type LeadSource = (typeof LeadSource)[keyof typeof LeadSource];

/**
 * Expected procurement / adoption timeline.
 */
export const ExpectedTimeline = {
  IMMEDIATE: 'IMMEDIATE',
  ONE_TO_THREE_MONTHS: '1_3_MONTHS',
  THREE_TO_SIX_MONTHS: '3_6_MONTHS',
  SIX_TO_TWELVE_MONTHS: '6_12_MONTHS',
  NEXT_BUDGET_CYCLE: 'NEXT_BUDGET_CYCLE',
  UNKNOWN: 'UNKNOWN',
} as const;

export type ExpectedTimeline = (typeof ExpectedTimeline)[keyof typeof ExpectedTimeline];

/**
 * Controlled Organisation types in South African and global sectional-title ecosystems.
 */
export const OrganisationType = {
  MANAGING_AGENT: 'MANAGING_AGENT',
  BODY_CORPORATE: 'BODY_CORPORATE',
  TRUSTEE_ORGANISATION: 'TRUSTEE_ORGANISATION',
  HOMEOWNERS_ASSOCIATION: 'HOMEOWNERS_ASSOCIATION',
  PROPERTY_DEVELOPER: 'PROPERTY_DEVELOPER',
  FACILITIES_PROVIDER: 'FACILITIES_PROVIDER',
  LEGAL_ADVISORY: 'LEGAL_ADVISORY',
  OTHER: 'OTHER',
} as const;

export type OrganisationType = (typeof OrganisationType)[keyof typeof OrganisationType];

/**
 * Organisation relationship status.
 */
export const OrganisationStatus = {
  PROSPECT: 'PROSPECT',
  ACTIVE_CLIENT: 'ACTIVE_CLIENT',
  PARTNER: 'PARTNER',
  CHURNED: 'CHURNED',
  INACTIVE: 'INACTIVE',
  SUSPENDED: 'SUSPENDED',
} as const;

export type OrganisationStatus = (typeof OrganisationStatus)[keyof typeof OrganisationStatus];

/**
 * Individual contact relationship status.
 */
export const ContactStatus = {
  ACTIVE: 'ACTIVE',
  INACTIVE: 'INACTIVE',
  UNRESPONSIVE: 'UNRESPONSIVE',
  DO_NOT_CONTACT: 'DO_NOT_CONTACT',
} as const;

export type ContactStatus = (typeof ContactStatus)[keyof typeof ContactStatus];

/**
 * Preferred communication channels.
 */
export const PreferredContactMethod = {
  EMAIL: 'EMAIL',
  PHONE: 'PHONE',
  MOBILE: 'MOBILE',
  WHATSAPP: 'WHATSAPP',
  ANY: 'ANY',
} as const;

export type PreferredContactMethod = (typeof PreferredContactMethod)[keyof typeof PreferredContactMethod];

/**
 * Sales Opportunity Stage Pipeline.
 * Progression: DISCOVERY -> SOLUTION_DESIGN -> PROPOSAL -> CONTRACT -> WON / LOST
 */
export const OpportunityStage = {
  DISCOVERY: 'DISCOVERY',
  SOLUTION_DESIGN: 'SOLUTION_DESIGN',
  PROPOSAL: 'PROPOSAL',
  CONTRACT: 'CONTRACT',
  WON: 'WON',
  LOST: 'LOST',
} as const;

export type OpportunityStage = (typeof OpportunityStage)[keyof typeof OpportunityStage];

/**
 * Polymorphic Activity Types across CRM entities.
 */
export const ActivityType = {
  CALL: 'CALL',
  EMAIL: 'EMAIL',
  MEETING: 'MEETING',
  NOTE: 'NOTE',
  DEMO: 'DEMO',
  DISCOVERY: 'DISCOVERY',
  PROPOSAL: 'PROPOSAL',
  CONTRACT: 'CONTRACT',
  OTHER: 'OTHER',
} as const;

export type ActivityType = (typeof ActivityType)[keyof typeof ActivityType];

/**
 * Task Execution Status.
 */
export const TaskStatus = {
  OPEN: 'OPEN',
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
} as const;

export type TaskStatus = (typeof TaskStatus)[keyof typeof TaskStatus];

/**
 * Task Urgency and Priority scale.
 */
export const TaskPriority = {
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH',
  URGENT: 'URGENT',
} as const;

export type TaskPriority = (typeof TaskPriority)[keyof typeof TaskPriority];

/**
 * Marketing & Sales Campaign Types.
 */
export const CampaignType = {
  MARKETING: 'MARKETING',
  REFERRAL: 'REFERRAL',
  EVENT: 'EVENT',
  DIGITAL: 'DIGITAL',
  PARTNER: 'PARTNER',
  SALES: 'SALES',
  OTHER: 'OTHER',
} as const;

export type CampaignType = (typeof CampaignType)[keyof typeof CampaignType];

/**
 * Campaign Lifecycle Status.
 */
export const CampaignStatus = {
  PLANNING: 'PLANNING',
  ACTIVE: 'ACTIVE',
  PAUSED: 'PAUSED',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
} as const;

export type CampaignStatus = (typeof CampaignStatus)[keyof typeof CampaignStatus];

/**
 * Commercial Proposal Status.
 */
export const ProposalStatus = {
  DRAFT: 'DRAFT',
  INTERNAL_REVIEW: 'INTERNAL_REVIEW',
  APPROVED: 'APPROVED',
  SENT: 'SENT',
  VIEWED: 'VIEWED',
  ACCEPTED: 'ACCEPTED',
  DECLINED: 'DECLINED',
  EXPIRED: 'EXPIRED',
  CANCELLED: 'CANCELLED',
} as const;

export type ProposalStatus = (typeof ProposalStatus)[keyof typeof ProposalStatus];

/**
 * Legal Contract Lifecycle Status.
 */
export const ContractStatus = {
  DRAFT: 'DRAFT',
  INTERNAL_REVIEW: 'INTERNAL_REVIEW',
  APPROVED: 'APPROVED',
  SENT: 'SENT',
  PARTIALLY_SIGNED: 'PARTIALLY_SIGNED',
  SIGNED: 'SIGNED',
  ACTIVE: 'ACTIVE',
  EXPIRED: 'EXPIRED',
  TERMINATED: 'TERMINATED',
  CANCELLED: 'CANCELLED',
} as const;

export type ContractStatus = (typeof ContractStatus)[keyof typeof ContractStatus];

/**
 * Data Quality Assessment States.
 * Ainubis is strictly forbidden from assuming unverified data is factual.
 */
export const DataQualityState = {
  COMPLETE: 'COMPLETE',
  PARTIAL: 'PARTIAL',
  STALE: 'STALE',
  CONFLICTED: 'CONFLICTED',
  UNVERIFIED: 'UNVERIFIED',
  ERROR: 'ERROR',
} as const;

export type DataQualityState = (typeof DataQualityState)[keyof typeof DataQualityState];

/**
 * Controlled Event Types for CRM Domain Workflow Automation.
 */
export const CRMEventType = {
  LEAD_CREATED: 'crm.lead.created',
  LEAD_UPDATED: 'crm.lead.updated',
  LEAD_QUALIFIED: 'crm.lead.qualified',
  LEAD_STATUS_CHANGED: 'crm.lead.status_changed',
  LEAD_ASSIGNED: 'crm.lead.assigned',
  LEAD_CONVERTED: 'crm.lead.converted',

  CONTACT_CREATED: 'crm.contact.created',
  CONTACT_UPDATED: 'crm.contact.updated',

  ORGANISATION_CREATED: 'crm.organisation.created',
  ORGANISATION_UPDATED: 'crm.organisation.updated',

  SCHEME_PROSPECT_CREATED: 'crm.scheme_prospect.created',
  SCHEME_PROSPECT_UPDATED: 'crm.scheme_prospect.updated',

  OPPORTUNITY_CREATED: 'crm.opportunity.created',
  OPPORTUNITY_UPDATED: 'crm.opportunity.updated',
  OPPORTUNITY_STAGE_CHANGED: 'crm.opportunity.stage_changed',

  ACTIVITY_CREATED: 'crm.activity.created',

  TASK_CREATED: 'crm.task.created',
  TASK_COMPLETED: 'crm.task.completed',

  PROPOSAL_CREATED: 'crm.proposal.created',
  PROPOSAL_APPROVED: 'crm.proposal.approved',
  PROPOSAL_SENT: 'crm.proposal.sent',
  PROPOSAL_ACCEPTED: 'crm.proposal.accepted',

  CONTRACT_CREATED: 'crm.contract.created',
  CONTRACT_SENT: 'crm.contract.sent',
  CONTRACT_SIGNED: 'crm.contract.signed',
  CONTRACT_ACTIVATED: 'crm.contract.activated',

  // Ainubis AI Intelligence Events (Prompt 002E-001)
  AI_OBSERVATION_CREATED: 'ai.observation.created',
  AI_OBSERVATION_REVIEWED: 'ai.observation.reviewed',
  AI_RECOMMENDATION_APPROVED: 'ai.recommendation.approved',
  AI_RECOMMENDATION_REJECTED: 'ai.recommendation.rejected',
  AI_RECOMMENDATION_DISMISSED: 'ai.recommendation.dismissed',
  AI_ACTION_REQUESTED: 'ai.action.requested',
  AI_ACTION_EXECUTED: 'ai.action.executed',
  AI_ACTION_FAILED: 'ai.action.failed',
} as const;

export type CRMEventType = (typeof CRMEventType)[keyof typeof CRMEventType];
