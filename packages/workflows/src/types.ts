export type WorkflowTriggerType =
  | 'event'
  | 'schedule'
  | 'webhook'
  | 'ainubis_recommendation'
  | 'manual';

export interface WorkflowTrigger {
  type: WorkflowTriggerType;
  eventType?: string;
  cronExpression?: string;
}

export interface WorkflowCondition {
  field: string;
  operator: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'contains';
  value: unknown;
}

export interface WorkflowStep {
  id: string;
  name: string;
  actionType: string;
  parameters: Record<string, unknown>;
  conditions?: WorkflowCondition[];
  retryCount?: number;
}

export interface WorkflowDefinition {
  id: string;
  tenantId: string;
  name: string;
  description: string;
  trigger: WorkflowTrigger;
  steps: WorkflowStep[];
  isActive: boolean;
  version: number;
}

export interface WorkflowExecutionRecord {
  id: string;
  workflowId: string;
  tenantId: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  currentStepIndex: number;
  startedAt: string;
  completedAt?: string;
  error?: string;
}
