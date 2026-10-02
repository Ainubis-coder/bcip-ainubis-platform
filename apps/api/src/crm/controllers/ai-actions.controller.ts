/**
 * BCIP Ainubis AI Actions Controller
 * Phase 2E — Prompt 002E-004: Ainubis Intelligence Actions & Human-Approved CRM Automation
 * REST controller implementing AI Actions list, read, propose, review, approve, reject, cancel, and execute operations.
 */

import type { Request, Response } from 'express';
import {
  aiActionRepository,
  ainubisActionExecutionService,
  AIActionStatus,
  AIActionType,
} from '@bcip/database';
import { ApiResponse } from '../serializers/response.serializer.ts';

export class AIActionsController {
  public static async list(req: Request, res: Response): Promise<void> {
    const tenantId = req.tenantId!;
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));
    const offset = (page - 1) * limit;

    try {
      const { data, total } = await aiActionRepository.findMany(tenantId, {
        offset,
        limit,
        status: req.query.status as any,
        actionType: req.query.actionType as string,
        targetEntityType: req.query.targetEntityType as string,
        targetEntityId: req.query.targetEntityId as string,
      });

      ApiResponse.paginated(res, data, { page, pageSize: limit, total });
    } catch (err: any) {
      ApiResponse.error(res, 'INTERNAL_ERROR', err.message || 'Failed to list AI Actions', 500);
    }
  }

  public static async getById(req: Request, res: Response): Promise<void> {
    const tenantId = req.tenantId!;
    const { id } = req.params;

    try {
      const action = await aiActionRepository.findById(tenantId, id);
      if (!action) {
        ApiResponse.error(res, 'NOT_FOUND', `AI Action with ID ${id} not found`, 404);
        return;
      }
      ApiResponse.success(res, action);
    } catch (err: any) {
      ApiResponse.error(res, 'INTERNAL_ERROR', err.message || 'Failed to retrieve AI Action', 500);
    }
  }

  public static async propose(req: Request, res: Response): Promise<void> {
    const tenantId = req.tenantId!;
    const dto = req.body;

    if (!dto.actionType && dto.observationId) {
      try {
        const action = await (ainubisActionExecutionService as any).proposeActionFromObservation(
          tenantId,
          dto.observationId,
          req.user?.id || 'system'
        );
        ApiResponse.success(res, action, 201);
      } catch (err: any) {
        ApiResponse.error(res, 'BAD_REQUEST', err.message || 'Failed to propose AI Action from Observation', 400);
      }
      return;
    }

    if (!dto.actionType || !dto.targetEntityType || !dto.targetEntityId) {
      ApiResponse.error(res, 'BAD_REQUEST', 'Missing required fields: actionType, targetEntityType, and targetEntityId are required.', 400);
      return;
    }

    try {
      const action = await ainubisActionExecutionService.proposeAction(tenantId, {
        ...dto,
        createdBy: req.user?.id || 'system',
      });
      ApiResponse.success(res, action, 201);
    } catch (err: any) {
      ApiResponse.error(res, 'BAD_REQUEST', err.message || 'Failed to propose AI Action', 400);
    }
  }

  public static async review(req: Request, res: Response): Promise<void> {
    const tenantId = req.tenantId!;
    const { id } = req.params;

    try {
      const action = await aiActionRepository.findById(tenantId, id);
      if (!action) {
        ApiResponse.error(res, 'NOT_FOUND', `AI Action with ID ${id} not found`, 404);
        return;
      }

      const updated = await aiActionRepository.update(tenantId, id, {
        status: AIActionStatus.REVIEW_REQUIRED,
      });

      ApiResponse.success(res, updated!);
    } catch (err: any) {
      ApiResponse.error(res, 'INTERNAL_ERROR', err.message || 'Failed to request review', 500);
    }
  }

  public static async approve(req: Request, res: Response): Promise<void> {
    const tenantId = req.tenantId!;
    const { id } = req.params;
    const { reason } = req.body || {};

    try {
      const action = await ainubisActionExecutionService.approveAction(
        tenantId,
        id,
        req.user?.id || 'reviewer',
        reason
      );
      ApiResponse.success(res, action);
    } catch (err: any) {
      ApiResponse.error(res, 'BAD_REQUEST', err.message || 'Failed to approve AI Action', 400);
    }
  }

  public static async reject(req: Request, res: Response): Promise<void> {
    const tenantId = req.tenantId!;
    const { id } = req.params;
    const { reason } = req.body || {};

    if (!reason) {
      ApiResponse.error(res, 'BAD_REQUEST', 'A reason is required to reject an AI Action', 400);
      return;
    }

    try {
      const action = await ainubisActionExecutionService.rejectAction(
        tenantId,
        id,
        req.user?.id || 'rejecter',
        reason
      );
      ApiResponse.success(res, action);
    } catch (err: any) {
      ApiResponse.error(res, 'BAD_REQUEST', err.message || 'Failed to reject AI Action', 400);
    }
  }

  public static async cancel(req: Request, res: Response): Promise<void> {
    const tenantId = req.tenantId!;
    const { id } = req.params;

    try {
      const action = await ainubisActionExecutionService.cancelAction(
        tenantId,
        id,
        req.user?.id || 'canceler'
      );
      ApiResponse.success(res, action);
    } catch (err: any) {
      ApiResponse.error(res, 'BAD_REQUEST', err.message || 'Failed to cancel AI Action', 400);
    }
  }

  public static async execute(req: Request, res: Response): Promise<void> {
    const tenantId = req.tenantId!;
    const { id } = req.params;
    const idempotencyKey = req.headers['x-idempotency-key'] as string | undefined;

    try {
      const action = await ainubisActionExecutionService.executeAction(
        tenantId,
        id,
        req.user?.id || 'executor',
        idempotencyKey
      );
      ApiResponse.success(res, action);
    } catch (err: any) {
      ApiResponse.error(res, 'BAD_REQUEST', err.message || 'Execution failed', 400);
    }
  }

  public static async evidence(req: Request, res: Response): Promise<void> {
    const tenantId = req.tenantId!;
    const { id } = req.params;

    try {
      const evidence = await aiActionRepository.findEvidenceByActionId(tenantId, id);
      ApiResponse.success(res, evidence);
    } catch (err: any) {
      ApiResponse.error(res, 'INTERNAL_ERROR', err.message || 'Failed to retrieve evidence', 500);
    }
  }

  public static async execution(req: Request, res: Response): Promise<void> {
    const tenantId = req.tenantId!;
    const { id } = req.params;

    try {
      const executions = await aiActionRepository.findExecutionsByActionId(tenantId, id);
      ApiResponse.success(res, executions);
    } catch (err: any) {
      ApiResponse.error(res, 'INTERNAL_ERROR', err.message || 'Failed to retrieve execution records', 500);
    }
  }

  public static async verification(req: Request, res: Response): Promise<void> {
    const tenantId = req.tenantId!;
    const { id } = req.params;

    try {
      const verifications = await aiActionRepository.findVerificationsByActionId(tenantId, id);
      ApiResponse.success(res, verifications);
    } catch (err: any) {
      ApiResponse.error(res, 'INTERNAL_ERROR', err.message || 'Failed to retrieve verification records', 500);
    }
  }
}
