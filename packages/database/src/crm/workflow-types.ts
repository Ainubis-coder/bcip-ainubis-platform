/**
 * BCIP Ainubis Workflow Intelligence & Automation Orchestration Types
 * Phase 2E — Prompt 002E-005: Ainubis CRM Automation Orchestration & Workflow Intelligence
 */

export const WorkflowStatus = {
  DRAFT: 'DRAFT',
  ACTIVE: 'ACTIVE',
  PAUSED: 'PAUSED',
  DISABLED: 'DISABLED',
  ARCHIVED: 'ARCHIVED',
} as const;

export type WorkflowStatus = (typeof WorkflowStatus)[keyof typeof WorkflowStatus];

export const WorkflowTriggerType = {
  CRM_EVENT: 'CRM_EVENT',
  SCHEDULED_CONDITION: 'SCHEDULED_CONDITION',
  AI_OBSERVATION: 'AI_OBSERVATION',
  MANUAL: 'MANUAL',
} as const;

export type WorkflowTriggerType = (typeof WorkflowTriggerType)[keyof typeof WorkflowTriggerType];

export const WorkflowStepType = {
  OBSERVE: 'OBSERVE',
  EVALUATE: 'EVALUATE',
  PROPOSE_ACTION: 'PROPOSE_ACTION',
  REQUEST_APPROVAL: 'REQUEST_APPROVAL',
  EXECUTE_ACTION: 'EXECUTE_ACTION',
  WAIT: 'WAIT',
  VERIFY: 'VERIFY',
  BRANCH: 'BRANCH',
  NOTIFY: 'NOTIFY',
  COMPLETE: 'COMPLETE',
} as const;

export type WorkflowStepType = (typeof WorkflowStepType)[keyof typeof WorkflowStepType];

export const WorkflowRunStatus = {
  QUEUED: 'QUEUED',
  RUNNING: 'RUNNING',
  WAITING_APPROVAL: 'WAITING_APPROVAL',
  WAITING: 'WAITING',
  COMPLETED: 'COMPLETED',
  FAILED: 'FAILED',
  CANCELLED: 'CANCELLED',
  EXPIRED: 'EXPIRED',
} as const;

export type WorkflowRunStatus = (typeof WorkflowRunStatus)[keyof typeof WorkflowRunStatus];

export const WorkflowApprovalStatus = {
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
  EXPIRED: 'EXPIRED',
  CANCELLED: 'CANCELLED',
} as const;

export type WorkflowApprovalStatus = (typeof WorkflowApprovalStatus)[keyof typeof WorkflowApprovalStatus];

export const WorkflowOutcomeType = {
  SUCCESS: 'SUCCESS',
  PARTIAL_SUCCESS: 'PARTIAL_SUCCESS',
  NO_ACTION_REQUIRED: 'NO_ACTION_REQUIRED',
  APPROVAL_REJECTED: 'APPROVAL_REJECTED',
  FAILED: 'FAILED',
  EXPIRED: 'EXPIRED',
  CANCELLED: 'CANCELLED',
} as const;

export type WorkflowOutcomeType = (typeof WorkflowOutcomeType)[keyof typeof WorkflowOutcomeType];

export interface WorkflowTriggerConfig {
  type: WorkflowTriggerType;
  eventType?: string; // e.g. 'crm.lead.created'
  conditionKey?: string; // e.g. 'pipeline.stalled_opportunity'
  capability?: string; // e.g. 'CRM_PIPELINE_HYGIENE'
  cronExpression?: string;
}

export interface WorkflowRetryPolicy {
  maxAttempts: number;
  retryDelay: number; // in seconds
}

export interface WorkflowStepConfig {
  id: string;
  stepKey: string;
  name: string;
  type: WorkflowStepType;
  order: number;
  configuration: Record<string, any>;
  timeout?: number; // in seconds
  retryPolicy?: WorkflowRetryPolicy;
  enabled: boolean;
}

export interface AutomationWorkflow {
  id: string;
  tenantId: string;
  name: string;
  description: string;
  workflowKey: string;
  version: number;
  status: WorkflowStatus;
  trigger: WorkflowTriggerConfig;
  steps: WorkflowStepConfig[];
  createdBy: string;
  updatedBy: string;
  createdAt: string;
  updatedAt: string;
  activatedAt?: string;
  deactivatedAt?: string;
}

export interface WorkflowRun {
  id: string;
  tenantId: string;
  workflowId: string;
  workflowVersion: number;
  triggerType: WorkflowTriggerType;
  triggerEventId?: string;
  correlationId: string;
  idempotencyKey?: string;
  status: WorkflowRunStatus;
  context: Record<string, any>;
  currentStepIndex: number;
  startedAt: string;
  completedAt?: string;
  failureReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface WorkflowStepExecution {
  id: string;
  tenantId: string;
  workflowRunId: string;
  stepId: string;
  status: 'QUEUED' | 'RUNNING' | 'COMPLETED' | 'FAILED';
  attemptNumber: number;
  inputContext: Record<string, any>;
  outputContext: Record<string, any>;
  startedAt: string;
  completedAt?: string;
  failureReason?: string;
  correlationId: string;
  createdAt: string;
  updatedAt: string;
}

export interface WorkflowApproval {
  id: string;
  tenantId: string;
  workflowRunId: string;
  stepExecutionId: string;
  actionId?: string; // optional Phase 2E-004 AI Action reference
  requiredPermission: string;
  status: WorkflowApprovalStatus;
  requestedAt: string;
  reviewedBy?: string;
  reviewedAt?: string;
  decision?: 'APPROVED' | 'REJECTED';
  reason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface WorkflowOutcome {
  id: string;
  tenantId: string;
  workflowRunId: string;
  outcomeType: WorkflowOutcomeType;
  summary: string;
  affectedEntities: Array<{ entityType: string; entityId: string }>;
  actionsExecuted: string[]; // Phase 2E-004 Action IDs
  verificationResults: Record<string, any>;
  evidenceReferences: string[];
  completionStatus: string;
  createdAt: string;
  updatedAt: string;
}
