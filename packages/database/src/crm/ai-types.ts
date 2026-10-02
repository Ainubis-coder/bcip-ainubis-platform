/**
 * BCIP Ainubis CRM Intelligence Types & Domain Models
 * Phase 2E — Prompt 002E-001: Ainubis CRM Intelligence Foundation & Governance
 */

export const IntelligenceType = {
  OBSERVATION: 'OBSERVATION',
  INSIGHT: 'INSIGHT',
  RECOMMENDATION: 'RECOMMENDATION',
  ALERT: 'ALERT',
  HUMAN_APPROVAL_REQUIRED: 'HUMAN_APPROVAL_REQUIRED',
} as const;

export type IntelligenceType = (typeof IntelligenceType)[keyof typeof IntelligenceType];

export const IntelligenceStatus = {
  DRAFT: 'DRAFT',
  GENERATED: 'GENERATED',
  REVIEWED: 'REVIEWED',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
  EXECUTED: 'EXECUTED',
  EXPIRED: 'EXPIRED',
  DISMISSED: 'DISMISSED',
  RESOLVED: 'RESOLVED',
  REOPENED: 'REOPENED',
} as const;

export type IntelligenceStatus = (typeof IntelligenceStatus)[keyof typeof IntelligenceStatus];

export const ConfidenceLevel = {
  VERY_LOW: 'VERY_LOW',
  LOW: 'LOW',
  MODERATE: 'MODERATE',
  HIGH: 'HIGH',
  VERY_HIGH: 'VERY_HIGH',
} as const;

export type ConfidenceLevel = (typeof ConfidenceLevel)[keyof typeof ConfidenceLevel];

export const ApprovalRequirement = {
  INFORMATIONAL: 'INFORMATIONAL',
  RECOMMENDATION: 'RECOMMENDATION',
  HUMAN_APPROVAL_REQUIRED: 'HUMAN_APPROVAL_REQUIRED',
  EXECUTABLE_ACTION: 'EXECUTABLE_ACTION',
} as const;

export type ApprovalRequirement = (typeof ApprovalRequirement)[keyof typeof ApprovalRequirement];

export const AICapability = {
  CRM_DATA_QUALITY: 'CRM_DATA_QUALITY',
  CRM_PIPELINE_HYGIENE: 'CRM_PIPELINE_HYGIENE',
  CRM_LEAD_QUALIFICATION: 'CRM_LEAD_QUALIFICATION',
  CRM_LEAD_HYGIENE: 'CRM_LEAD_HYGIENE',
  CRM_ORGANISATION_HYGIENE: 'CRM_ORGANISATION_HYGIENE',
  CRM_SCHEME_PROSPECT_HYGIENE: 'CRM_SCHEME_PROSPECT_HYGIENE',
  CRM_TASK_HYGIENE: 'CRM_TASK_HYGIENE',
  CRM_ACTIVITY_HYGIENE: 'CRM_ACTIVITY_HYGIENE',
  CRM_DUPLICATE_DETECTION: 'CRM_DUPLICATE_DETECTION',
  CRM_ACTIVITY_SUMMARY: 'CRM_ACTIVITY_SUMMARY',
  CRM_TASK_PRIORITISATION: 'CRM_TASK_PRIORITISATION',
  CRM_DEAL_RISK: 'CRM_DEAL_RISK',
  CRM_PROPOSAL_ASSISTANCE: 'CRM_PROPOSAL_ASSISTANCE',
  CRM_CLIENT_RELATIONSHIP_INTELLIGENCE: 'CRM_CLIENT_RELATIONSHIP_INTELLIGENCE',
  CRM_SCHEME_INTELLIGENCE: 'CRM_SCHEME_INTELLIGENCE',
} as const;

export type AICapability = (typeof AICapability)[keyof typeof AICapability];

export interface EvidenceReference {
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
    | 'campaign';
  entityId: string;
  field?: string;
  value?: unknown;
  source: string;
  evidenceType: string;
  relevance: number; // 0.0 to 1.0
  timestamp: string;
}

export interface SuggestedAction {
  actionType: string; // e.g. 'SCHEDULE_TASK', 'REVIEW_STAGE', 'UPDATE_EXPECTED_CLOSE'
  description: string;
  payload?: Record<string, unknown>;
}

export interface AIObservationRecord {
  id: string;
  tenantId: string;
  capability: AICapability;
  intelligenceType: IntelligenceType;
  title: string;
  summary: string;
  observation: string;
  confidenceScore: number; // 0 - 100
  confidenceLevel: ConfidenceLevel;
  evidence: EvidenceReference[];
  targetEntityType?: string;
  targetEntityId?: string;
  conditionKey?: string; // Deterministic condition key for deduplication and resolution tracking
  sourceMode?: 'AUTOMATED_MONITORING' | 'MANUAL_ANALYSIS' | 'EVENT_TRIGGERED';
  suggestedAction?: SuggestedAction;
  approvalRequirement: ApprovalRequirement;
  status: IntelligenceStatus;
  reviewedBy?: string;
  reviewedAt?: string;
  approvedBy?: string;
  approvedAt?: string;
  rejectedBy?: string;
  rejectedAt?: string;
  rejectedReason?: string;
  dismissedBy?: string;
  dismissedAt?: string;
  resolvedAt?: string;
  resolvedReason?: string;
  reopenedAt?: string;
  reopenedFromId?: string;
  modelProvider?: string;
  modelIdentifier?: string;
  triggerEvent?: string;
  correlationId?: string;
  expiresAt?: string;
  createdAt: string;
  updatedAt: string;
}

export type CreateAIObservationDto = Omit<
  AIObservationRecord,
  | 'id'
  | 'tenantId'
  | 'createdAt'
  | 'updatedAt'
  | 'status'
  | 'reviewedBy'
  | 'reviewedAt'
  | 'approvedBy'
  | 'approvedAt'
  | 'rejectedBy'
  | 'rejectedAt'
  | 'rejectedReason'
  | 'dismissedBy'
  | 'dismissedAt'
> & {
  status?: IntelligenceStatus;
};

export type ReviewAIObservationDto = {
  reviewedBy: string;
};

export type ApproveAIObservationDto = {
  approvedBy: string;
};

export type RejectAIObservationDto = {
  rejectedBy: string;
  reason: string;
};

export type DismissAIObservationDto = {
  dismissedBy: string;
};

// ============================================================================
// DASHBOARD & CRM HEALTH SUMMARY TYPES (Phase 2E-002)
// ============================================================================

export const HealthStatus = {
  HEALTHY: 'HEALTHY',
  WARNING: 'WARNING',
  ATTENTION_REQUIRED: 'ATTENTION_REQUIRED',
} as const;

export type HealthStatus = (typeof HealthStatus)[keyof typeof HealthStatus];

export const CRMHealthCategoryKey = {
  PIPELINE: 'pipeline',
  LEADS: 'leads',
  ORGANISATIONS: 'organisations',
  SCHEME_PROSPECTS: 'schemeProspects',
  TASKS_AND_ACTIVITIES: 'tasksAndActivities',
} as const;

export type CRMHealthCategoryKey = (typeof CRMHealthCategoryKey)[keyof typeof CRMHealthCategoryKey];

export interface CRMHealthMetricItem {
  id: string;
  label: string;
  count: number;
  status: HealthStatus;
  description: string;
}

export interface CRMHealthCategorySummary {
  key: CRMHealthCategoryKey;
  title: string;
  status: HealthStatus;
  score: number; // 0 - 100
  totalEntities: number;
  issueCount: number;
  metrics: CRMHealthMetricItem[];
  topObservations: AIObservationRecord[];
  lastEvaluatedAt: string;
}

export interface AinubisDashboardSummary {
  tenantId: string;
  totalActive: number;
  requiringAttention: number;
  highPriority: number;
  underReview: number;
  approved: number;
  dismissed: number;
  rejected: number;
  executed: number;
  recentObservations: AIObservationRecord[];
  byCapability: Record<string, number>;
  byType: Record<string, number>;
  byStatus: Record<string, number>;
  healthCategories: Record<CRMHealthCategoryKey, CRMHealthCategorySummary>;
  overallHealthScore: number;
  overallHealthStatus: HealthStatus;
  generatedAt: string;
}

export interface ContextualIntelligenceResponse {
  tenantId: string;
  targetEntityType: string;
  targetEntityId: string;
  observations: AIObservationRecord[];
  totalObservations: number;
  issueCount: number;
  status: HealthStatus;
  lastAnalyzedAt: string;
}

// ============================================================================
// CONTINUOUS MONITORING & AUTOMATED EXECUTION TYPES (Phase 2E-003)
// ============================================================================

export const MonitoringTriggerType = {
  SCHEDULED: 'SCHEDULED',
  EVENT: 'EVENT',
  MANUAL: 'MANUAL',
} as const;

export type MonitoringTriggerType = (typeof MonitoringTriggerType)[keyof typeof MonitoringTriggerType];

export const MonitoringExecutionStatus = {
  RUNNING: 'RUNNING',
  COMPLETED: 'COMPLETED',
  FAILED: 'FAILED',
} as const;

export type MonitoringExecutionStatus = (typeof MonitoringExecutionStatus)[keyof typeof MonitoringExecutionStatus];

export interface AIMonitoringExecutionRecord {
  id: string;
  tenantId: string;
  capability: string; // Specific AICapability or 'ALL_CAPABILITIES'
  triggerType: MonitoringTriggerType;
  status: MonitoringExecutionStatus;
  startedAt: string;
  completedAt?: string;
  durationMs?: number;
  observationsGenerated: number;
  observationsUpdated: number;
  observationsResolved: number;
  error?: string;
  correlationId: string;
  details?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface AIMonitoringCapabilityMetadata {
  capability: AICapability;
  name: string;
  description: string;
  category: 'pipeline' | 'leads' | 'organisations' | 'schemes' | 'tasks';
  mode: 'DETERMINISTIC' | 'HYBRID_AI';
  requiredPermissions: string[];
  supportedEntityTypes: string[];
  monitoringAvailable: boolean;
  version: string;
  activeObservationsCount?: number;
  lastRunAt?: string;
  lastStatus?: string;
}

export interface AIMonitoringStatusSummary {
  tenantId: string;
  monitoringActive: boolean;
  status: 'IDLE' | 'RUNNING' | 'ERROR';
  lastRunAt: string | null;
  nextScheduledRunAt: string | null;
  totalActiveObservations: number;
  totalResolvedObservations: number;
  activeCapabilitiesCount: number;
  recentExecutions: AIMonitoringExecutionRecord[];
  recentErrors: Array<{ timestamp: string; message: string; capability?: string }>;
}
