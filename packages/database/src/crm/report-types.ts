/**
 * BCIP Ainubis CRM Executive Reporting Domain Types
 * Phase 2E — Prompt 002E-008
 */

export type ReportType =
  | 'EXECUTIVE_PORTFOLIO_BRIEF'
  | 'OPERATIONAL_HEALTH_REPORT'
  | 'RISK_AND_PRIORITY_REPORT'
  | 'TREND_ANALYSIS_REPORT'
  | 'WORKFLOW_PERFORMANCE_REPORT'
  | 'CRM_PIPELINE_REPORT';

export type ReportingPeriod =
  | 'CURRENT'
  | 'DAILY'
  | 'WEEKLY'
  | 'MONTHLY'
  | 'QUARTERLY'
  | 'CUSTOM';

export type ReportStatus =
  | 'DRAFT'
  | 'GENERATED'
  | 'REVIEW_REQUIRED'
  | 'APPROVED'
  | 'PUBLISHED'
  | 'ARCHIVED'
  | 'FAILED';

export type ReportConfidence = 'HIGH' | 'MEDIUM' | 'LOW';

export type ReportQualityState = 'COMPLETE' | 'PARTIAL' | 'INSUFFICIENT_DATA' | 'FAILED';

export interface ReportEvidence {
  sourceType: string;
  sourceId: string;
  tenantId: string;
  field?: string;
  description: string;
  capturedAt: string;
  correlationId: string;
}

export interface ExecutiveReportSection {
  id: string;
  title: string;
  content: string;
  metrics?: Record<string, any>;
  findings?: string[];
  evidenceIds?: string[];
}

export interface ExecutiveReport {
  id: string;
  tenantId: string;
  reportType: ReportType;
  reportingPeriod: ReportingPeriod;
  periodStart: string;
  periodEnd: string;
  status: ReportStatus;
  title: string;
  executiveSummary: string;
  sections: ExecutiveReportSection[];
  version: number;
  confidence: ReportConfidence;
  qualityState: ReportQualityState;
  generatedAt: string;
  generatedBy: string;
  approvedAt?: string;
  approvedBy?: string;
  publishedAt?: string;
  publishedBy?: string;
  correlationId: string;
  sourceAnalysisRunId: string;
  evidence: ReportEvidence[];
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
}

export interface ReportApprovalRecord {
  id: string;
  tenantId: string;
  reportId: string;
  version: number;
  decision: 'APPROVED' | 'REJECTED';
  reviewerId: string;
  reviewerEmail: string;
  reviewedAt: string;
  reason?: string;
  evidenceSnapshotHash?: string;
  correlationId: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
}
