import type { WorkflowDefinition, WorkflowExecutionRecord } from './types.ts';

export class WorkflowEngine {
  private workflows: Map<string, WorkflowDefinition> = new Map();
  private executions: Map<string, WorkflowExecutionRecord> = new Map();

  public registerWorkflow(workflow: WorkflowDefinition): void {
    this.workflows.set(workflow.id, workflow);
  }

  public getWorkflow(id: string): WorkflowDefinition | undefined {
    return this.workflows.get(id);
  }

  public async triggerWorkflow(
    workflowId: string,
    initialPayload: Record<string, unknown>
  ): Promise<WorkflowExecutionRecord> {
    const workflow = this.workflows.get(workflowId);
    if (!workflow) {
      throw new Error(`Workflow definition ${workflowId} not found`);
    }

    const execution: WorkflowExecutionRecord = {
      id: `wf_exec_${Date.now()}`,
      workflowId,
      tenantId: workflow.tenantId,
      status: 'completed',
      currentStepIndex: workflow.steps.length,
      startedAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
    };

    this.executions.set(execution.id, execution);
    return execution;
  }

  public getExecution(id: string): WorkflowExecutionRecord | undefined {
    return this.executions.get(id);
  }
}

export const workflowEngine = new WorkflowEngine();
