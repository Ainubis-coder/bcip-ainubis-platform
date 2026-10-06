/**
 * BCIP Ainubis CRM Portfolio Intelligence Domain Types
 * Phase 2E — Prompt 002E-007
 */

export interface PortfolioSnapshot {
  id: string;
  tenantId: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
  metrics: {
    // Pipeline
    totalLeads: number;
    qualifiedLeads: number;
    nurtureLeads: number;
    reEngagementLeads: number;
    convertedLeads: number;
    lostLeads: number;
    totalOpportunities: number;
    opportunitiesByStage: Record<string, number>;
    stalledOpportunities: number;
    opportunitiesNoActivity: number;
    proposalsOutstanding: number;
    contractsExpiring60d: number;

    // Activity
    activitiesCreated: number;
    activitiesCompleted: number;
    overdueTasks: number;
    highPriorityOverdueTasks: number;
    uncontactedLeads: number;
    opportunitiesNoTouchpoints: number;

    // Organisation Health
    totalOrganisations: number;
    activeOrganisations: number;
    organisationsAttention: number;
    organisationsIncompleteInfo: number;
    organisationsDecliningEngagement: number;

    // Scheme Prospects
    totalSchemeProspects: number;
    activeSchemeProspects: number;
    incompleteSchemeData: number;
    staleSchemeProspects: number;

    // Ainubis
    activeWorkflows: number;
    pausedWorkflows: number;
    failedWorkflows: number;
    workflowsAwaitingApproval: number;
    verificationFailures: number;
    repeatedWorkflowFailures: number;
    workflowHealthDistribution: Record<string, number>;
    unresolvedObservations: number;
    proposedActionsAwaitingApproval: number;
  };
}

export interface PortfolioSignal {
  id: string; // BaseEntity required ID
  signalId: string; // Internal domain ID
  tenantId: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
  signalType:
    | 'PORTFOLIO_PIPELINE_CONCENTRATION'
    | 'PORTFOLIO_STALLED_OPPORTUNITIES'
    | 'PORTFOLIO_LEAD_RESPONSE_GAP'
    | 'PORTFOLIO_OVERDUE_TASK_PRESSURE'
    | 'PORTFOLIO_PROPOSAL_BACKLOG'
    | 'PORTFOLIO_CONTRACT_RENEWAL_PRESSURE'
    | 'PORTFOLIO_ORGANISATION_HEALTH_DECLINE'
    | 'PORTFOLIO_SCHEME_DATA_GAPS'
    | 'PORTFOLIO_WORKFLOW_FAILURE_PRESSURE'
    | 'PORTFOLIO_APPROVAL_BACKLOG';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: 'ACTIVE' | 'RESOLVED' | 'ACKNOWLEDGED';
  score: number; // 0 - 100
  detectedAt: string;
  metricValue: number;
  threshold: number;
  previousValue: number;
  trend: 'UP' | 'DOWN' | 'STABLE' | 'INSUFFICIENT_DATA';
  evidence: string[];
  correlationId: string;
}

export interface PortfolioRisk {
  id: string;
  tenantId: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
  affectedDomain: string; // e.g. 'Leads', 'Opportunities', 'Workflows'
  affectedEntityCount: number;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  triggeringCondition: string;
  supportingEvidence: string[];
  currentState: string;
  trend: 'UP' | 'DOWN' | 'STABLE' | 'INSUFFICIENT_DATA';
  recommendedOperationalResponse: string;
}

export interface PortfolioTrend {
  id: string;
  tenantId: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
  metricName: string;
  period: '7 DAYS' | '30 DAYS' | '90 DAYS';
  direction: 'UP' | 'DOWN' | 'STABLE' | 'INSUFFICIENT_DATA';
  history: Array<{ date: string; value: number }>;
}

export interface PortfolioInsight {
  id: string;
  tenantId: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
  insight: string;
  whyItMatters: string;
  evidence: string[];
  affectedRecords: Array<{ entityType: string; entityId: string; name?: string }>;
  trend: 'UP' | 'DOWN' | 'STABLE' | 'INSUFFICIENT_DATA';
  confidence: number; // 0 - 100
  recommendedNextStep: string;
  correlationId: string;
}

export interface PortfolioAnalysisRun {
  id: string;
  tenantId: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
  status: 'PENDING' | 'SUCCESS' | 'FAILED';
  startedAt: string;
  completedAt?: string;
  failureReason?: string;
  correlationId: string;
  triggeredBy: string;
}
