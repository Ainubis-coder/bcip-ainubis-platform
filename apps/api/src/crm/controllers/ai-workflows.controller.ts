/**
 * BCIP Ainubis Workflow Orchestration API Controller
 * Phase 2E — Prompt 002E-005: Ainubis CRM Automation Orchestration & Workflow Intelligence
 */

import type { Request, Response } from 'express';
import {
  automationWorkflowRepository,
  workflowRunRepository,
  ainubisWorkflowOrchestrationService,
  WorkflowStatus,
  WorkflowRunStatus,
} from '@bcip/database';
import { ApiResponse } from '../serializers/response.serializer.ts';

export class AIWorkflowsController {
  // 1. List workflows
  public static async listWorkflows(req: Request, res: Response): Promise<void> {
    const tenantId = req.tenantId!;
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));
    const offset = (page - 1) * limit;

    try {
      const { data, total } = await automationWorkflowRepository.findMany(tenantId, {
        offset,
        limit,
        status: req.query.status as any,
        workflowKey: req.query.workflowKey as string,
      });

      ApiResponse.paginated(res, data, { page, pageSize: limit, total });
    } catch (err: any) {
      ApiResponse.error(res, 'INTERNAL_ERROR', err.message || 'Failed to list workflows', 500);
    }
  }

  // 2. Get workflow by ID
  public static async getWorkflowById(req: Request, res: Response): Promise<void> {
    const tenantId = req.tenantId!;
    const { id } = req.params;

    try {
      const workflow = await automationWorkflowRepository.findById(tenantId, id);
      if (!workflow) {
        ApiResponse.error(res, 'NOT_FOUND', `Workflow definition with ID ${id} not found`, 404);
        return;
      }
      ApiResponse.success(res, workflow);
    } catch (err: any) {
      ApiResponse.error(res, 'INTERNAL_ERROR', err.message || 'Failed to retrieve workflow', 500);
    }
  }

  // 3. Create workflow definition
  public static async createWorkflow(req: Request, res: Response): Promise<void> {
    const tenantId = req.tenantId!;
    const dto = req.body;

    if (!dto.name || !dto.workflowKey || !dto.trigger) {
      ApiResponse.error(res, 'BAD_REQUEST', 'Missing required fields: name, workflowKey, and trigger config are required.', 400);
      return;
    }

    try {
      const workflow = await automationWorkflowRepository.createWorkflow(tenantId, {
        name: dto.name,
        description: dto.description || '',
        workflowKey: dto.workflowKey,
        version: dto.version || 1,
        status: WorkflowStatus.DRAFT,
        trigger: dto.trigger,
        steps: dto.steps || [],
        createdBy: req.user?.id || 'system',
        updatedBy: req.user?.id || 'system',
      });
      ApiResponse.success(res, workflow, 201);
    } catch (err: any) {
      ApiResponse.error(res, 'BAD_REQUEST', err.message || 'Failed to create workflow definition', 400);
    }
  }

  // 4. Update workflow definition
  public static async updateWorkflow(req: Request, res: Response): Promise<void> {
    const tenantId = req.tenantId!;
    const { id } = req.params;
    const dto = req.body;

    try {
      const existing = await automationWorkflowRepository.findById(tenantId, id);
      if (!existing) {
        ApiResponse.error(res, 'NOT_FOUND', `Workflow definition ${id} not found`, 404);
        return;
      }

      const updated = await automationWorkflowRepository.update(tenantId, id, {
        name: dto.name || existing.name,
        description: dto.description !== undefined ? dto.description : existing.description,
        trigger: dto.trigger || existing.trigger,
        steps: dto.steps || existing.steps,
        status: dto.status || existing.status,
        updatedBy: req.user?.id || 'system',
      });

      ApiResponse.success(res, updated!);
    } catch (err: any) {
      ApiResponse.error(res, 'BAD_REQUEST', err.message || 'Failed to update workflow definition', 400);
    }
  }

  // 5. Change state: Activate
  public static async activateWorkflow(req: Request, res: Response): Promise<void> {
    const tenantId = req.tenantId!;
    const { id } = req.params;

    try {
      const updated = await automationWorkflowRepository.update(tenantId, id, {
        status: WorkflowStatus.ACTIVE,
        activatedAt: new Date().toISOString(),
      });
      if (!updated) {
        ApiResponse.error(res, 'NOT_FOUND', `Workflow definition ${id} not found`, 404);
        return;
      }
      ApiResponse.success(res, updated);
    } catch (err: any) {
      ApiResponse.error(res, 'BAD_REQUEST', err.message || 'Failed to activate workflow', 400);
    }
  }

  // 6. Change state: Pause
  public static async pauseWorkflow(req: Request, res: Response): Promise<void> {
    const tenantId = req.tenantId!;
    const { id } = req.params;

    try {
      const updated = await automationWorkflowRepository.update(tenantId, id, {
        status: WorkflowStatus.PAUSED,
        deactivatedAt: new Date().toISOString(),
      });
      if (!updated) {
        ApiResponse.error(res, 'NOT_FOUND', `Workflow definition ${id} not found`, 404);
        return;
      }
      ApiResponse.success(res, updated);
    } catch (err: any) {
      ApiResponse.error(res, 'BAD_REQUEST', err.message || 'Failed to pause workflow', 400);
    }
  }

  // 7. Change state: Disable
  public static async disableWorkflow(req: Request, res: Response): Promise<void> {
    const tenantId = req.tenantId!;
    const { id } = req.params;

    try {
      const updated = await automationWorkflowRepository.update(tenantId, id, {
        status: WorkflowStatus.DISABLED,
        deactivatedAt: new Date().toISOString(),
      });
      if (!updated) {
        ApiResponse.error(res, 'NOT_FOUND', `Workflow definition ${id} not found`, 404);
        return;
      }
      ApiResponse.success(res, updated);
    } catch (err: any) {
      ApiResponse.error(res, 'BAD_REQUEST', err.message || 'Failed to disable workflow', 400);
    }
  }

  // 8. Change state: Archive
  public static async archiveWorkflow(req: Request, res: Response): Promise<void> {
    const tenantId = req.tenantId!;
    const { id } = req.params;

    try {
      const updated = await automationWorkflowRepository.update(tenantId, id, {
        status: WorkflowStatus.ARCHIVED,
      });
      if (!updated) {
        ApiResponse.error(res, 'NOT_FOUND', `Workflow definition ${id} not found`, 404);
        return;
      }
      ApiResponse.success(res, updated);
    } catch (err: any) {
      ApiResponse.error(res, 'BAD_REQUEST', err.message || 'Failed to archive workflow', 400);
    }
  }

  // 9. List runs for a workflow definition
  public static async listWorkflowRuns(req: Request, res: Response): Promise<void> {
    const tenantId = req.tenantId!;
    const { id } = req.params; // workflow definition id
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));
    const offset = (page - 1) * limit;

    try {
      const { data, total } = await workflowRunRepository.findMany(tenantId, {
        offset,
        limit,
        workflowId: id,
        status: req.query.status as any,
      });
      ApiResponse.paginated(res, data, { page, pageSize: limit, total });
    } catch (err: any) {
      ApiResponse.error(res, 'INTERNAL_ERROR', err.message || 'Failed to list workflow runs', 500);
    }
  }

  // 10. Manually trigger workflow run
  public static async triggerWorkflowRun(req: Request, res: Response): Promise<void> {
    const tenantId = req.tenantId!;
    const { id } = req.params; // workflow id
    const { context } = req.body || {};

    try {
      const run = await ainubisWorkflowOrchestrationService.launchRun(tenantId, id, {
        triggerType: 'MANUAL',
        initialContext: context || {},
        actorUserId: req.user?.id || 'system',
      });
      ApiResponse.success(res, run, 201);
    } catch (err: any) {
      ApiResponse.error(res, 'BAD_REQUEST', err.message || 'Failed to manually trigger workflow', 400);
    }
  }

  // 11. Get single workflow run detail
  public static async getWorkflowRun(req: Request, res: Response): Promise<void> {
    const tenantId = req.tenantId!;
    const { id } = req.params;

    try {
      const run = await workflowRunRepository.findById(tenantId, id);
      if (!run) {
        ApiResponse.error(res, 'NOT_FOUND', `Workflow run with ID ${id} not found`, 404);
        return;
      }
      ApiResponse.success(res, run);
    } catch (err: any) {
      ApiResponse.error(res, 'INTERNAL_ERROR', err.message || 'Failed to retrieve workflow run', 500);
    }
  }

  // 12. Cancel workflow run
  public static async cancelWorkflowRun(req: Request, res: Response): Promise<void> {
    const tenantId = req.tenantId!;
    const { id } = req.params;

    try {
      const run = await workflowRunRepository.findById(tenantId, id);
      if (!run) {
        ApiResponse.error(res, 'NOT_FOUND', `Workflow run with ID ${id} not found`, 404);
        return;
      }

      if (run.status === WorkflowRunStatus.COMPLETED || run.status === WorkflowRunStatus.FAILED) {
        ApiResponse.error(res, 'BAD_REQUEST', 'Cannot cancel a completed or failed workflow run.', 400);
        return;
      }

      const updated = await workflowRunRepository.update(tenantId, id, {
        status: WorkflowRunStatus.CANCELLED,
        completedAt: new Date().toISOString(),
      });

      ApiResponse.success(res, updated!);
    } catch (err: any) {
      ApiResponse.error(res, 'BAD_REQUEST', err.message || 'Failed to cancel workflow run', 400);
    }
  }

  // 13. Retry workflow run
  public static async retryWorkflowRun(req: Request, res: Response): Promise<void> {
    const tenantId = req.tenantId!;
    const { id } = req.params;

    try {
      const run = await workflowRunRepository.findById(tenantId, id);
      if (!run) {
        ApiResponse.error(res, 'NOT_FOUND', `Workflow run with ID ${id} not found`, 404);
        return;
      }

      if (run.status !== WorkflowRunStatus.FAILED) {
        ApiResponse.error(res, 'BAD_REQUEST', 'Only failed workflow runs can be retried.', 400);
        return;
      }

      // Reset step index and relaunch
      const retriedRun = await workflowRunRepository.update(tenantId, id, {
        status: WorkflowRunStatus.RUNNING,
        currentStepIndex: 0,
        failureReason: undefined,
      });

      // Relaunch the execution loop asynchronously
      (ainubisWorkflowOrchestrationService as any).executeRunSteps(tenantId, id, req.user?.id || 'system');

      ApiResponse.success(res, retriedRun!);
    } catch (err: any) {
      ApiResponse.error(res, 'BAD_REQUEST', err.message || 'Failed to retry workflow run', 400);
    }
  }

  // 14. Get timeline (steps execution)
  public static async getWorkflowRunTimeline(req: Request, res: Response): Promise<void> {
    const tenantId = req.tenantId!;
    const { id } = req.params;

    try {
      const timeline = await workflowRunRepository.findStepExecutions(tenantId, id);
      ApiResponse.success(res, timeline);
    } catch (err: any) {
      ApiResponse.error(res, 'INTERNAL_ERROR', err.message || 'Failed to retrieve timeline', 500);
    }
  }

  // 15. Get outcome of workflow run
  public static async getWorkflowRunOutcome(req: Request, res: Response): Promise<void> {
    const tenantId = req.tenantId!;
    const { id } = req.params;

    try {
      const outcome = await workflowRunRepository.findOutcome(tenantId, id);
      if (!outcome) {
        ApiResponse.error(res, 'NOT_FOUND', `No outcome recorded yet for workflow run ${id}`, 404);
        return;
      }
      ApiResponse.success(res, outcome);
    } catch (err: any) {
      ApiResponse.error(res, 'INTERNAL_ERROR', err.message || 'Failed to retrieve outcome', 500);
    }
  }

  // 16. Get approvals of workflow run
  public static async getWorkflowRunApprovals(req: Request, res: Response): Promise<void> {
    const tenantId = req.tenantId!;
    const { id } = req.params;

    try {
      const approvals = await workflowRunRepository.findApprovals(tenantId, id);
      ApiResponse.success(res, approvals);
    } catch (err: any) {
      ApiResponse.error(res, 'INTERNAL_ERROR', err.message || 'Failed to retrieve approvals', 500);
    }
  }

  // 17. Get evidence of workflow run
  public static async getWorkflowRunEvidence(req: Request, res: Response): Promise<void> {
    const tenantId = req.tenantId!;
    const { id } = req.params;

    try {
      const outcome = await workflowRunRepository.findOutcome(tenantId, id);
      const evidenceReferences = outcome ? outcome.evidenceReferences : [];
      ApiResponse.success(res, evidenceReferences);
    } catch (err: any) {
      ApiResponse.error(res, 'INTERNAL_ERROR', err.message || 'Failed to retrieve evidence', 500);
    }
  }
}
