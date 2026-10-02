/**
 * BCIP CRM Shared Types & Contracts
 * Phase 2D — Prompt 002D-001: CRM Frontend Foundation & Pipeline Kanban
 * Aligned strictly with backend schemas in packages/database and apps/api.
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

export const ALL_PIPELINE_STAGES: OpportunityStage[] = [
  OpportunityStage.DISCOVERY,
  OpportunityStage.SOLUTION_DESIGN,
  OpportunityStage.PROPOSAL,
  OpportunityStage.CONTRACT,
  OpportunityStage.WON,
  OpportunityStage.LOST,
];

export const STAGE_CONFIG: Record<
  OpportunityStage,
  {
    label: string;
    description: string;
    defaultProbability: number;
    colorClasses: {
      badge: string;
      columnBorder: string;
      headerBg: string;
      dot: string;
    };
  }
> = {
  [OpportunityStage.DISCOVERY]: {
    label: 'Discovery',
    description: 'Initial intake, portfolio discovery, and needs assessment',
    defaultProbability: 20,
    colorClasses: {
      badge: 'bg-sky-500/10 text-sky-400 border border-sky-500/30',
      columnBorder: 'border-t-sky-500',
      headerBg: 'bg-sky-950/20',
      dot: 'bg-sky-400',
    },
  },
  [OpportunityStage.SOLUTION_DESIGN]: {
    label: 'Solution Design',
    description: 'Technical architecture, integrations, and scheme unit sizing',
    defaultProbability: 40,
    colorClasses: {
      badge: 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/30',
      columnBorder: 'border-t-indigo-500',
      headerBg: 'bg-indigo-950/20',
      dot: 'bg-indigo-400',
    },
  },
  [OpportunityStage.PROPOSAL]: {
    label: 'Proposal',
    description: 'Formal commercial quotation and SLA presentation',
    defaultProbability: 60,
    colorClasses: {
      badge: 'bg-amber-500/10 text-amber-400 border border-amber-500/30',
      columnBorder: 'border-t-amber-500',
      headerBg: 'bg-amber-950/20',
      dot: 'bg-amber-400',
    },
  },
  [OpportunityStage.CONTRACT]: {
    label: 'Contract',
    description: 'Legal review and executive committee sign-off',
    defaultProbability: 80,
    colorClasses: {
      badge: 'bg-purple-500/10 text-purple-400 border border-purple-500/30',
      columnBorder: 'border-t-purple-500',
      headerBg: 'bg-purple-950/20',
      dot: 'bg-purple-400',
    },
  },
  [OpportunityStage.WON]: {
    label: 'Won',
    description: 'Active closed contract and scheme onboarding',
    defaultProbability: 100,
    colorClasses: {
      badge: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30',
      columnBorder: 'border-t-emerald-500',
      headerBg: 'bg-emerald-950/20',
      dot: 'bg-emerald-400',
    },
  },
  [OpportunityStage.LOST]: {
    label: 'Lost',
    description: 'Archived deal with documented loss reason',
    defaultProbability: 0,
    colorClasses: {
      badge: 'bg-rose-500/10 text-rose-400 border border-rose-500/30',
      columnBorder: 'border-t-rose-500',
      headerBg: 'bg-rose-950/20',
      dot: 'bg-rose-400',
    },
  },
};

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
  estimatedValue: number;
  currency: string;
  probability: number;
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
  changedBy: string;
  reason?: string;
  changedAt: string;
}

export interface PipelineStageSummary {
  stage: OpportunityStage;
  count: number;
  totalValue: number;
  weightedValue: number;
  averageProbability: number;
  opportunities: Opportunity[];
}

export interface PipelineSummary {
  totalOpportunities: number;
  totalPipelineValue: number;
  totalWeightedValue: number;
  stages: Record<OpportunityStage, PipelineStageSummary>;
}

export interface CreateOpportunityDto {
  name: string;
  organisationId?: string;
  leadId?: string;
  primaryContactId?: string;
  schemeProspectId?: string;
  stage?: OpportunityStage;
  estimatedValue?: number;
  currency?: string;
  probability?: number;
  expectedCloseDate?: string;
  ownerUserId?: string;
  source?: string;
  description?: string;
  nextAction?: string;
  nextActionAt?: string;
}

export interface UpdateOpportunityDto {
  name?: string;
  organisationId?: string;
  leadId?: string;
  primaryContactId?: string;
  schemeProspectId?: string;
  stage?: OpportunityStage;
  estimatedValue?: number;
  currency?: string;
  probability?: number;
  expectedCloseDate?: string;
  ownerUserId?: string;
  source?: string;
  description?: string;
  nextAction?: string;
  nextActionAt?: string;
  lossReason?: string;
}

export interface StageTransitionPayload {
  stage: OpportunityStage;
  reason?: string;
}

export interface StageTransitionResponse {
  opportunity: Opportunity;
  history: OpportunityStageHistory;
}

export interface ApiEnvelope<T> {
  success: boolean;
  data: T;
  meta?: {
    requestId: string;
    timestamp: string;
  };
  pagination?: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
  error?: {
    code: string;
    message: string;
    requestId?: string;
    details?: unknown;
  };
}

// ============================================================================
// LEAD DOMAIN TYPES & CONSTANTS (Phase 2D-002)
// ============================================================================

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

export const ALL_LEAD_STATUSES: LeadStatus[] = [
  LeadStatus.NEW,
  LeadStatus.ENRICHED,
  LeadStatus.QUALIFIED,
  LeadStatus.NURTURE,
  LeadStatus.RE_ENGAGEMENT,
  LeadStatus.LOST,
  LeadStatus.CONVERTED,
];

export const LEAD_STATUS_CONFIG: Record<
  LeadStatus,
  {
    label: string;
    description: string;
    colorClasses: {
      text: string;
      bg: string;
      dot: string;
      border: string;
    };
  }
> = {
  [LeadStatus.NEW]: {
    label: 'New',
    description: 'Fresh lead captured from direct outreach or inbound channels',
    colorClasses: {
      text: 'text-sky-400',
      bg: 'bg-sky-500/10',
      dot: 'bg-sky-400',
      border: 'border-sky-500/30',
    },
  },
  [LeadStatus.ENRICHED]: {
    label: 'Enriched',
    description: 'Sectional title scheme data and managing agent metadata verified',
    colorClasses: {
      text: 'text-indigo-400',
      bg: 'bg-indigo-500/10',
      dot: 'bg-indigo-400',
      border: 'border-indigo-500/30',
    },
  },
  [LeadStatus.QUALIFIED]: {
    label: 'Qualified',
    description: 'Verified decision maker and portfolio fit ready for opportunity conversion',
    colorClasses: {
      text: 'text-emerald-400',
      bg: 'bg-emerald-500/10',
      dot: 'bg-emerald-400',
      border: 'border-emerald-500/30',
    },
  },
  [LeadStatus.NURTURE]: {
    label: 'Nurture',
    description: 'Long-term prospect in automated educational sequence',
    colorClasses: {
      text: 'text-amber-400',
      bg: 'bg-amber-500/10',
      dot: 'bg-amber-400',
      border: 'border-amber-500/30',
    },
  },
  [LeadStatus.RE_ENGAGEMENT]: {
    label: 'Re-engagement',
    description: 'Previously stalled prospect re-entering active evaluation',
    colorClasses: {
      text: 'text-orange-400',
      bg: 'bg-orange-500/10',
      dot: 'bg-orange-400',
      border: 'border-orange-500/30',
    },
  },
  [LeadStatus.LOST]: {
    label: 'Lost',
    description: 'Unqualified or disqualified lead archived from active outreach',
    colorClasses: {
      text: 'text-rose-400',
      bg: 'bg-rose-500/10',
      dot: 'bg-rose-400',
      border: 'border-rose-500/30',
    },
  },
  [LeadStatus.CONVERTED]: {
    label: 'Converted',
    description: 'Successfully converted into an Organisation, Contact, Prospect, and Opportunity',
    colorClasses: {
      text: 'text-purple-400',
      bg: 'bg-purple-500/10',
      dot: 'bg-purple-400',
      border: 'border-purple-500/30',
    },
  },
};

export const QualificationStatus = {
  UNQUALIFIED: 'UNQUALIFIED',
  PRE_QUALIFIED: 'PRE_QUALIFIED',
  QUALIFIED: 'QUALIFIED',
  DISQUALIFIED: 'DISQUALIFIED',
} as const;

export type QualificationStatus = (typeof QualificationStatus)[keyof typeof QualificationStatus];

export const QUALIFICATION_STATUS_CONFIG: Record<
  QualificationStatus,
  { label: string; textClass: string; dotClass: string }
> = {
  [QualificationStatus.UNQUALIFIED]: {
    label: 'Unqualified',
    textClass: 'text-slate-400',
    dotClass: 'bg-slate-500',
  },
  [QualificationStatus.PRE_QUALIFIED]: {
    label: 'Pre-Qualified',
    textClass: 'text-sky-300',
    dotClass: 'bg-sky-400',
  },
  [QualificationStatus.QUALIFIED]: {
    label: 'Qualified',
    textClass: 'text-emerald-400',
    dotClass: 'bg-emerald-400',
  },
  [QualificationStatus.DISQUALIFIED]: {
    label: 'Disqualified',
    textClass: 'text-rose-400',
    dotClass: 'bg-rose-400',
  },
};

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

export const LEAD_SOURCE_LABELS: Record<LeadSource, string> = {
  [LeadSource.DIRECT_OUTREACH]: 'Direct Outreach',
  [LeadSource.WEBSITE]: 'Website',
  [LeadSource.REFERRAL]: 'Referral',
  [LeadSource.EVENT]: 'Event',
  [LeadSource.PARTNER]: 'Partner',
  [LeadSource.CAMPAIGN]: 'Campaign',
  [LeadSource.MANAGING_AGENT_NETWORK]: 'Managing Agent Network',
  [LeadSource.BODY_CORPORATE_PORTAL]: 'Body Corporate Portal',
  [LeadSource.OTHER]: 'Other',
};

export const ExpectedTimeline = {
  IMMEDIATE: 'IMMEDIATE',
  ONE_TO_THREE_MONTHS: '1_3_MONTHS',
  THREE_TO_SIX_MONTHS: '3_6_MONTHS',
  SIX_TO_TWELVE_MONTHS: '6_12_MONTHS',
  NEXT_BUDGET_CYCLE: 'NEXT_BUDGET_CYCLE',
  UNKNOWN: 'UNKNOWN',
} as const;

export type ExpectedTimeline = (typeof ExpectedTimeline)[keyof typeof ExpectedTimeline];

export const EXPECTED_TIMELINE_LABELS: Record<ExpectedTimeline, string> = {
  [ExpectedTimeline.IMMEDIATE]: 'Immediate (< 30 days)',
  [ExpectedTimeline.ONE_TO_THREE_MONTHS]: '1–3 Months',
  [ExpectedTimeline.THREE_TO_SIX_MONTHS]: '3–6 Months',
  [ExpectedTimeline.SIX_TO_TWELVE_MONTHS]: '6–12 Months',
  [ExpectedTimeline.NEXT_BUDGET_CYCLE]: 'Next Budget Cycle',
  [ExpectedTimeline.UNKNOWN]: 'Unknown',
};

export const DataQualityState = {
  COMPLETE: 'COMPLETE',
  PARTIAL: 'PARTIAL',
  STALE: 'STALE',
  CONFLICTED: 'CONFLICTED',
  UNVERIFIED: 'UNVERIFIED',
  ERROR: 'ERROR',
} as const;

export type DataQualityState = (typeof DataQualityState)[keyof typeof DataQualityState];

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
  convertedAt?: string;
  convertedOpportunityId?: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
}

export interface CreateLeadDto {
  title: string;
  source: LeadSource;
  sourceDetail?: string;
  email?: string;
  phone?: string;
  website?: string;
  schemeName?: string;
  estimatedUnits?: number;
  managingAgent?: string;
  currentSystem?: string;
  painPoints?: string[];
  requiredModules?: string[];
  expectedTimeline?: ExpectedTimeline;
  campaignId?: string;
  leadOwnerId?: string;
  description?: string;
}

export interface UpdateLeadDto {
  title?: string;
  source?: LeadSource;
  sourceDetail?: string;
  email?: string;
  phone?: string;
  website?: string;
  schemeName?: string;
  estimatedUnits?: number;
  managingAgent?: string;
  currentSystem?: string;
  painPoints?: string[];
  requiredModules?: string[];
  expectedTimeline?: ExpectedTimeline;
  campaignId?: string;
  leadOwnerId?: string;
  description?: string;
  status?: LeadStatus;
  qualificationStatus?: QualificationStatus;
}

export interface LeadsListResponse {
  leads: Lead[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

// ============================================================================
// LEAD CONVERSION DOMAIN TYPES & CONSTANTS (Phase 2D-003)
// ============================================================================

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

export const ORGANISATION_TYPE_LABELS: Record<OrganisationType, string> = {
  [OrganisationType.MANAGING_AGENT]: 'Managing Agent',
  [OrganisationType.BODY_CORPORATE]: 'Body Corporate (Sectional Title)',
  [OrganisationType.TRUSTEE_ORGANISATION]: 'Trustee Committee / Council',
  [OrganisationType.HOMEOWNERS_ASSOCIATION]: 'Homeowners Association (HOA)',
  [OrganisationType.PROPERTY_DEVELOPER]: 'Property Developer',
  [OrganisationType.FACILITIES_PROVIDER]: 'Facilities / Property Services',
  [OrganisationType.LEGAL_ADVISORY]: 'Legal Advisory',
  [OrganisationType.OTHER]: 'Other Organisation',
};

export interface ConvertLeadDto {
  organisationName?: string;
  organisationType?: OrganisationType;
  existingOrganisationId?: string;
  contactFirstName?: string;
  contactLastName?: string;
  existingContactId?: string;
  opportunityName?: string;
  estimatedValue?: number;
  expectedCloseDate?: string;
  createSchemeProspect?: boolean;
}

export interface ConvertedEntitySummary {
  id: string;
  name?: string;
  displayName?: string;
  email?: string;
  phone?: string;
  organisationType?: string;
  estimatedUnitCount?: number;
  managingAgentName?: string;
  status?: string;
  stage?: string;
  estimatedValue?: number;
  currency?: string;
}

export interface ConvertLeadResult {
  lead: Lead;
  organisation: ConvertedEntitySummary;
  contact: ConvertedEntitySummary;
  schemeProspect?: ConvertedEntitySummary;
  opportunity: Opportunity;
}

// ============================================================================
// ORGANISATION & SCHEME PROSPECT TYPES (Phase 2D-004)
// ============================================================================

export const OrganisationStatus = {
  PROSPECT: 'PROSPECT',
  ACTIVE_CLIENT: 'ACTIVE_CLIENT',
  PARTNER: 'PARTNER',
  CHURNED: 'CHURNED',
  INACTIVE: 'INACTIVE',
  SUSPENDED: 'SUSPENDED',
} as const;

export type OrganisationStatus = (typeof OrganisationStatus)[keyof typeof OrganisationStatus];

export const ORGANISATION_STATUS_CONFIG: Record<
  OrganisationStatus,
  {
    label: string;
    description: string;
    colorClasses: {
      text: string;
      bg: string;
      dot: string;
      border: string;
    };
  }
> = {
  [OrganisationStatus.PROSPECT]: {
    label: 'Prospect',
    description: 'Prospective client entity undergoing evaluation',
    colorClasses: {
      text: 'text-sky-400',
      bg: 'bg-sky-500/10',
      dot: 'bg-sky-400',
      border: 'border-sky-500/30',
    },
  },
  [OrganisationStatus.ACTIVE_CLIENT]: {
    label: 'Active Client',
    description: 'Onboarded operational client organisation',
    colorClasses: {
      text: 'text-emerald-400',
      bg: 'bg-emerald-500/10',
      dot: 'bg-emerald-400',
      border: 'border-emerald-500/30',
    },
  },
  [OrganisationStatus.PARTNER]: {
    label: 'Partner',
    description: 'Strategic software or services partner',
    colorClasses: {
      text: 'text-violet-400',
      bg: 'bg-violet-500/10',
      dot: 'bg-violet-400',
      border: 'border-violet-500/30',
    },
  },
  [OrganisationStatus.INACTIVE]: {
    label: 'Inactive',
    description: 'Dormant organisation record',
    colorClasses: {
      text: 'text-slate-400',
      bg: 'bg-slate-500/10',
      dot: 'bg-slate-400',
      border: 'border-slate-500/30',
    },
  },
  [OrganisationStatus.CHURNED]: {
    label: 'Churned',
    description: 'Offboarded client organisation',
    colorClasses: {
      text: 'text-rose-400',
      bg: 'bg-rose-500/10',
      dot: 'bg-rose-400',
      border: 'border-rose-500/30',
    },
  },
  [OrganisationStatus.SUSPENDED]: {
    label: 'Suspended',
    description: 'Temporarily suspended due to billing or compliance review',
    colorClasses: {
      text: 'text-amber-400',
      bg: 'bg-amber-500/10',
      dot: 'bg-amber-400',
      border: 'border-amber-500/30',
    },
  },
};

export interface CRMAddress {
  streetAddress?: string;
  suburb?: string;
  city?: string;
  province?: string;
  postalCode?: string;
  country?: string;
}

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
  address?: CRMAddress | string;
  status: OrganisationStatus;
  ownerUserId?: string;
  notes?: string;
  dataQualityState: DataQualityState;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
}

export interface CreateOrganisationDto {
  name: string;
  legalName?: string;
  organisationType: OrganisationType;
  registrationNumber?: string;
  email?: string;
  phone?: string;
  website?: string;
  address?: CRMAddress | string;
  status?: OrganisationStatus;
  notes?: string;
  ownerUserId?: string;
}

export interface UpdateOrganisationDto {
  name?: string;
  legalName?: string;
  organisationType?: OrganisationType;
  registrationNumber?: string;
  email?: string;
  phone?: string;
  website?: string;
  address?: CRMAddress | string;
  status?: OrganisationStatus;
  notes?: string;
  ownerUserId?: string;
}

export interface OrganisationsListResponse {
  organisations: Organisation[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

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
  status: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SchemeProspect {
  id: string;
  tenantId: string;
  organisationId?: string;
  leadId?: string;
  name: string;
  registrationNumber?: string;
  sectionalTitleSchemeCode?: string;
  estimatedUnitCount: number;
  location?: CRMAddress | string;
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

export interface CreateSchemeProspectDto {
  name: string;
  organisationId?: string;
  leadId?: string;
  registrationNumber?: string;
  sectionalTitleSchemeCode?: string;
  estimatedUnitCount?: number;
  location?: string;
  managingAgentName?: string;
  currentPropertySystem?: string;
  currentAccountingSystem?: string;
  requirementsSummary?: string;
  painPoints?: string[];
  notes?: string;
}

export interface UpdateSchemeProspectDto {
  name?: string;
  organisationId?: string;
  leadId?: string;
  registrationNumber?: string;
  sectionalTitleSchemeCode?: string;
  estimatedUnitCount?: number;
  location?: string;
  managingAgentName?: string;
  currentPropertySystem?: string;
  currentAccountingSystem?: string;
  requirementsSummary?: string;
  painPoints?: string[];
  notes?: string;
}

export interface SchemeProspectsListResponse {
  schemeProspects: SchemeProspect[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}


