/**
 * BCIP CRM Domain Entities & Data Transfer Objects
 * Phase 002 — Step 002B: CRM Domain Model & Database Schema
 */

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
  DataQualityState,
  CRMEventType,
} from './enums.ts';

/**
 * Data Lineage and Provenance metadata.
 * Ensures all CRM records imported from external systems can be audited and traced.
 */
export interface DataLineage {
  sourceSystem?: string;
  sourceRecordId?: string;
  importSyncId?: string;
  lastSyncAt?: string;
  sourceConfidence?: number; // 0.0 to 1.0
}

/**
 * Ainubis AI Intelligence Observation & Traceability Reference.
 * Prepares the CRM schema for Phase 003 intelligence without hardcoding opaque scores.
 */
export interface AinubisIntelligenceContext {
  observation?: string;
  evidenceReferences?: string[];
  recommendation?: string;
  confidence?: number; // 0.0 to 1.0
  generatedAt?: string;
  modelProviderReference?: string;
  promptVersion?: string;
  approvalStatus?: 'PENDING_REVIEW' | 'APPROVED' | 'REJECTED' | 'AUTO_APPLIED';
}

/**
 * Structured Address representation for CRM Organisations and Schemes.
 */
export interface CRMAddress {
  streetAddress?: string;
  suburb?: string;
  city?: string;
  province?: string;
  postalCode?: string;
  country?: string;
  latitude?: number;
  longitude?: number;
}

// ============================================================================
// 1. ORGANISATION
// ============================================================================
export interface Organisation {
  id: string;
  tenantId: string;
  name: string;
  legalName?: string;
  organisationType: OrganisationType;
  registrationNumber?: string;
  vatNumber?: string;
  email?: string;
  phone?: string;
  website?: string;
  address?: CRMAddress;
  status: OrganisationStatus;
  ownerUserId?: string;
  notes?: string;
  dataQualityState: DataQualityState;
  lineage?: DataLineage;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
}

export type CreateOrganisationDto = Omit<
  Organisation,
  'id' | 'tenantId' | 'createdAt' | 'updatedAt' | 'deletedAt' | 'dataQualityState' | 'status' | 'organisationType'
> & {
  organisationType?: OrganisationType;
  status?: OrganisationStatus;
  dataQualityState?: DataQualityState;
};

export type UpdateOrganisationDto = Partial<
  Omit<Organisation, 'id' | 'tenantId' | 'createdAt' | 'updatedAt'>
>;

// ============================================================================
// 2. CONTACT
// ============================================================================
export interface Contact {
  id: string;
  tenantId: string;
  organisationId?: string;
  firstName: string;
  lastName: string;
  displayName: string;
  jobTitle?: string;
  email?: string;
  phone?: string;
  mobile?: string;
  preferredContactMethod: PreferredContactMethod;
  status: ContactStatus;
  notes?: string;
  dataQualityState: DataQualityState;
  lineage?: DataLineage;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
}

export type CreateContactDto = Omit<
  Contact,
  | 'id'
  | 'tenantId'
  | 'displayName'
  | 'createdAt'
  | 'updatedAt'
  | 'deletedAt'
  | 'dataQualityState'
  | 'preferredContactMethod'
  | 'status'
> & {
  displayName?: string;
  preferredContactMethod?: PreferredContactMethod;
  status?: ContactStatus;
  dataQualityState?: DataQualityState;
};

export type UpdateContactDto = Partial<
  Omit<Contact, 'id' | 'tenantId' | 'createdAt' | 'updatedAt'>
>;

// ============================================================================
// 3. CAMPAIGN
// ============================================================================
export interface Campaign {
  id: string;
  tenantId: string;
  name: string;
  description?: string;
  campaignType: CampaignType;
  status: CampaignStatus;
  budget?: number;
  actualSpend?: number;
  startDate?: string;
  endDate?: string;
  ownerUserId?: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
}

export type CreateCampaignDto = Omit<
  Campaign,
  'id' | 'tenantId' | 'createdAt' | 'updatedAt' | 'deletedAt' | 'campaignType' | 'status'
> & {
  campaignType?: CampaignType;
  status?: CampaignStatus;
};

export type UpdateCampaignDto = Partial<
  Omit<Campaign, 'id' | 'tenantId' | 'createdAt' | 'updatedAt'>
>;

// ============================================================================
// 4. SCHEME PROSPECT
// ============================================================================
export interface SchemeProspect {
  id: string;
  tenantId: string;
  organisationId?: string;
  leadId?: string;
  name: string;
  registrationNumber?: string;
  sectionalTitleSchemeCode?: string;
  estimatedUnitCount: number;
  location?: CRMAddress;
  managingAgentName?: string;
  currentPropertySystem?: string;
  currentAccountingSystem?: string;
  requirementsSummary?: string;
  painPoints: string[];
  notes?: string;
  dataQualityState: DataQualityState;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
}

export type CreateSchemeProspectDto = Omit<
  SchemeProspect,
  'id' | 'tenantId' | 'createdAt' | 'updatedAt' | 'deletedAt' | 'dataQualityState' | 'estimatedUnitCount' | 'painPoints'
> & {
  estimatedUnitCount?: number;
  painPoints?: string[];
  dataQualityState?: DataQualityState;
};

export type UpdateSchemeProspectDto = Partial<
  Omit<SchemeProspect, 'id' | 'tenantId' | 'createdAt' | 'updatedAt'>
>;

// ============================================================================
// 5. LEAD
// ============================================================================
export interface Lead {
  id: string;
  tenantId: string;
  organisationId?: string;
  contactId?: string;
  source: LeadSource;
  sourceDetail?: string;
  status: LeadStatus;
  qualificationStatus: QualificationStatus;
  leadOwnerId?: string;
  title: string;
  description?: string;
  email?: string;
  phone?: string;
  website?: string;
  schemeName?: string;
  estimatedUnits?: number;
  managingAgent?: string;
  currentSystem?: string;
  painPoints: string[];
  requiredModules: string[];
  expectedTimeline: ExpectedTimeline;
  campaignId?: string;
  lastContactedAt?: string;
  nextActionAt?: string;
  dataQualityState: DataQualityState;
  aiContext?: AinubisIntelligenceContext;
  lineage?: DataLineage;
  convertedAt?: string;
  convertedOpportunityId?: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
}

export type CreateLeadDto = Omit<
  Lead,
  | 'id'
  | 'tenantId'
  | 'createdAt'
  | 'updatedAt'
  | 'deletedAt'
  | 'dataQualityState'
  | 'status'
  | 'qualificationStatus'
  | 'source'
  | 'painPoints'
  | 'requiredModules'
  | 'expectedTimeline'
> & {
  source?: LeadSource;
  status?: LeadStatus;
  qualificationStatus?: QualificationStatus;
  expectedTimeline?: ExpectedTimeline;
  painPoints?: string[];
  requiredModules?: string[];
  dataQualityState?: DataQualityState;
};

export type UpdateLeadDto = Partial<
  Omit<Lead, 'id' | 'tenantId' | 'createdAt' | 'updatedAt'>
>;

// ============================================================================
// 6. OPPORTUNITY & OPPORTUNITY STAGE HISTORY
// ============================================================================
export interface Opportunity {
  id: string;
  tenantId: string;
  organisationId?: string;
  leadId?: string;
  primaryContactId?: string;
  schemeProspectId?: string;
  name: string;
  description?: string;
  stage: OpportunityStage;
  estimatedValue: number; // Stored as decimal(14,2)
  currency: string; // ISO 4217, e.g., 'ZAR'
  probability: number; // 0 to 100
  expectedCloseDate?: string;
  ownerUserId?: string;
  source?: string;
  nextAction?: string;
  nextActionAt?: string;
  lossReason?: string;
  wonAt?: string;
  lostAt?: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
}

export interface OpportunityStageHistory {
  id: string;
  tenantId: string;
  opportunityId: string;
  fromStage?: OpportunityStage;
  toStage: OpportunityStage;
  changedBy: string; // User ID
  reason?: string;
  changedAt: string;
}

export type CreateOpportunityDto = Omit<
  Opportunity,
  'id' | 'tenantId' | 'createdAt' | 'updatedAt' | 'deletedAt' | 'stage' | 'estimatedValue' | 'currency' | 'probability'
> & {
  stage?: OpportunityStage;
  estimatedValue?: number;
  currency?: string;
  probability?: number;
};

export type UpdateOpportunityDto = Partial<
  Omit<Opportunity, 'id' | 'tenantId' | 'createdAt' | 'updatedAt'>
>;

// ============================================================================
// 7. ACTIVITY
// ============================================================================
export interface Activity {
  id: string;
  tenantId: string;
  activityType: ActivityType;
  subject: string;
  description?: string;
  activityAt: string;
  completedAt?: string;
  ownerUserId?: string;
  createdBy: string;
  leadId?: string;
  contactId?: string;
  organisationId?: string;
  opportunityId?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
}

export type CreateActivityDto = Omit<
  Activity,
  'id' | 'tenantId' | 'createdAt' | 'updatedAt' | 'activityAt' | 'activityType' | 'deletedAt'
> & {
  activityAt?: string;
  activityType?: ActivityType;
};

export type UpdateActivityDto = Partial<CreateActivityDto>;

// ============================================================================
// 8. TASK
// ============================================================================
export interface CRMTask {
  id: string;
  tenantId: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  assignedTo?: string; // User ID
  createdBy?: string; // User ID
  dueAt?: string;
  completedAt?: string;
  leadId?: string;
  contactId?: string;
  organisationId?: string;
  opportunityId?: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
}

export type CreateCRMTaskDto = Omit<
  CRMTask,
  'id' | 'tenantId' | 'createdAt' | 'updatedAt' | 'status' | 'priority'
> & {
  status?: TaskStatus;
  priority?: TaskPriority;
};

export type UpdateCRMTaskDto = Partial<
  Omit<CRMTask, 'id' | 'tenantId' | 'createdAt' | 'updatedAt'>
>;

// ============================================================================
// 9. PROPOSAL
// ============================================================================
export interface ProposalItem {
  id: string;
  description: string;
  units: number;
  unitPrice: number;
  totalPrice: number;
}

export interface Proposal {
  id: string;
  tenantId: string;
  organisationId?: string;
  opportunityId: string;
  proposalNumber: string; // E.g. 'PROP-2026-0001'
  title: string;
  status: ProposalStatus;
  version: number;
  items: ProposalItem[];
  subtotal: number; // decimal(14,2)
  tax: number; // decimal(14,2)
  total: number; // decimal(14,2)
  currency: string; // 'ZAR'
  validUntil?: string;
  issuedAt?: string;
  acceptedAt?: string;
  documentId?: string; // Reference to document storage
  createdBy: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
}

export type CreateProposalDto = Omit<
  Proposal,
  | 'id'
  | 'tenantId'
  | 'createdAt'
  | 'updatedAt'
  | 'deletedAt'
  | 'status'
  | 'version'
  | 'proposalNumber'
  | 'items'
  | 'subtotal'
  | 'tax'
  | 'total'
  | 'currency'
> & {
  proposalNumber?: string;
  status?: ProposalStatus;
  version?: number;
  items?: ProposalItem[];
  subtotal?: number;
  tax?: number;
  total?: number;
  currency?: string;
};

export type UpdateProposalDto = Partial<
  Omit<Proposal, 'id' | 'tenantId' | 'createdAt' | 'updatedAt'>
>;

// ============================================================================
// 10. CONTRACT
// ============================================================================
export interface Contract {
  id: string;
  tenantId: string;
  organisationId?: string;
  opportunityId?: string;
  proposalId?: string;
  contractNumber: string; // E.g. 'CTR-2026-0001'
  title: string;
  status: ContractStatus;
  effectiveDate?: string;
  expiryDate?: string;
  signedAt?: string;
  documentId?: string; // Reference to document storage
  createdBy: string;
  terms?: string;
  annualValue?: number;
  monthlyValue?: number;
  currency: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
}

export type CreateContractDto = Omit<
  Contract,
  'id' | 'tenantId' | 'createdAt' | 'updatedAt' | 'deletedAt' | 'status' | 'contractNumber' | 'currency'
> & {
  contractNumber?: string;
  status?: ContractStatus;
  currency?: string;
};

export type UpdateContractDto = Partial<
  Omit<Contract, 'id' | 'tenantId' | 'createdAt' | 'updatedAt'>
>;

// ============================================================================
// 11. AUDIT & EVENT RECORDS
// ============================================================================
export interface CRMAuditRecord {
  id: string;
  tenantId: string;
  entityType:
    | 'lead'
    | 'organisation'
    | 'contact'
    | 'scheme_prospect'
    | 'opportunity'
    | 'activity'
    | 'task'
    | 'proposal'
    | 'contract'
    | 'campaign'
    | 'workflow'
    | 'report';
  entityId: string;
  action: string;
  actorUserId: string;
  beforeState?: Record<string, unknown>;
  afterState?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  timestamp: string;
}

export interface CRMEvent<T = Record<string, unknown>> {
  id: string;
  eventType: CRMEventType;
  tenantId: string;
  timestamp: string;
  actorUserId?: string;
  payload: T;
  version: number;
}
