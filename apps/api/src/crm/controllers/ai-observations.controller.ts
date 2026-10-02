/**
 * BCIP Ainubis AI Observations Controller
 * Thin HTTP controller exposing Ainubis CRM Intelligence APIs.
 * Phase 2E — Prompt 002E-001: Ainubis CRM Intelligence Foundation & Governance
 */

import type { Request, Response } from 'express';
import {
  aiObservationRepository,
  ainubisPipelineHygieneService,
  ainubisSummaryService,
  ainubisCrmHealthService,
  IntelligenceStatus,
  IntelligenceType,
  AICapability,
} from '@bcip/database';
import { ApiResponse } from '../serializers/response.serializer.ts';

export class AIObservationsController {
  public static async summary(req: Request, res: Response): Promise<void> {
    const tenantId = req.tenantId!;
    try {
      const summary = await ainubisSummaryService.getDashboardSummary(tenantId);
      ApiResponse.success(res, summary);
    } catch (err: unknown) {
      ApiResponse.error(res, 'INTERNAL_ERROR', (err as Error).message || 'Failed to retrieve AI dashboard summary', 500);
    }
  }

  public static async getContext(req: Request, res: Response): Promise<void> {
    const tenantId = req.tenantId!;
    const { entityType, entityId } = req.params;

    if (!entityType || !entityId) {
      ApiResponse.error(res, 'BAD_REQUEST', 'Both entityType and entityId are required');
      return;
    }

    try {
      const context = await ainubisSummaryService.getContextualIntelligence(tenantId, entityType, entityId);
      ApiResponse.success(res, context);
    } catch (err: unknown) {
      ApiResponse.error(res, 'INTERNAL_ERROR', (err as Error).message || 'Failed to retrieve contextual intelligence', 500);
    }
  }

  public static async list(req: Request, res: Response): Promise<void> {
    const tenantId = req.tenantId!;
    const page = Number(req.query.page) || 1;
    const pageSize = Number(req.query.pageSize) || 20;
    const offset = (page - 1) * pageSize;
    const sortBy = (req.query.sortBy as string) || 'createdAt';
    const sortOrder = (req.query.sortOrder as 'asc' | 'desc') || 'desc';
    const search = req.query.search as string | undefined;

    const capability = req.query.capability as AICapability | undefined;
    const intelligenceType = req.query.intelligenceType as IntelligenceType | undefined;
    const status = req.query.status as IntelligenceStatus | undefined;
    const targetEntityType = req.query.targetEntityType as string | undefined;
    const targetEntityId = req.query.targetEntityId as string | undefined;

    const result = await aiObservationRepository.findMany(tenantId, {
      offset,
      limit: pageSize,
      sortBy,
      sortOrder,
      search,
      capability,
      intelligenceType,
      status,
      targetEntityType,
      targetEntityId,
    });

    ApiResponse.paginated(res, result.data, {
      page,
      pageSize,
      total: result.total,
    });
  }

  public static async getById(req: Request, res: Response): Promise<void> {
    const tenantId = req.tenantId!;
    const { id } = req.params;

    const observation = await aiObservationRepository.findById(tenantId, id);
    if (!observation) {
      ApiResponse.notFound(res, `AI Observation with ID '${id}' not found`);
      return;
    }

    ApiResponse.success(res, observation);
  }

  public static async analyze(req: Request, res: Response): Promise<void> {
    const tenantId = req.tenantId!;
    const { capability, targetEntityId, correlationId } = req.body;

    // 1. Single Entity Pipeline Hygiene
    if (capability === AICapability.CRM_PIPELINE_HYGIENE && targetEntityId) {
      try {
        const analysisResult = await ainubisPipelineHygieneService.analyzeOpportunity(
          tenantId,
          targetEntityId,
          correlationId
        );
        ApiResponse.success(res, analysisResult, 201);
      } catch (err: unknown) {
        ApiResponse.error(res, 'BAD_REQUEST', (err as Error).message || 'Pipeline hygiene analysis failed.');
      }
      return;
    }

    // 2. Portfolio-Wide CRM Health Evaluation (or default analysis if targetEntityId omitted)
    if (!targetEntityId || capability === 'CRM_HEALTH_EVALUATION' || capability === AICapability.CRM_PIPELINE_HYGIENE) {
      try {
        const evaluated = await ainubisCrmHealthService.evaluateTenantCrmHealth(tenantId);
        ApiResponse.success(
          res,
          {
            tenantId,
            message: `Evaluated CRM health: ${evaluated.length} new observation(s) generated.`,
            count: evaluated.length,
            observations: evaluated,
          },
          201
        );
      } catch (err: unknown) {
        ApiResponse.error(res, 'INTERNAL_ERROR', (err as Error).message || 'CRM health evaluation failed.', 500);
      }
      return;
    }

    ApiResponse.error(res, 'BAD_REQUEST', `Capability '${capability}' is registered but not active for direct synchronous execution.`);
  }

  public static async review(req: Request, res: Response): Promise<void> {
    const tenantId = req.tenantId!;
    const { id } = req.params;
    const userId = req.user?.id || 'usr_unknown';

    const updated = await aiObservationRepository.update(tenantId, id, {
      status: IntelligenceStatus.REVIEWED,
      reviewedBy: userId,
      reviewedAt: new Date().toISOString(),
    });

    if (!updated) {
      ApiResponse.notFound(res, `AI Observation with ID '${id}' not found`);
      return;
    }

    ApiResponse.success(res, updated);
  }

  public static async approve(req: Request, res: Response): Promise<void> {
    const tenantId = req.tenantId!;
    const { id } = req.params;
    const userId = req.user?.id || 'usr_unknown';

    const obs = await aiObservationRepository.findById(tenantId, id);
    if (!obs) {
      ApiResponse.notFound(res, `AI Observation with ID '${id}' not found`);
      return;
    }

    const updated = await aiObservationRepository.update(tenantId, id, {
      status: IntelligenceStatus.APPROVED,
      approvedBy: userId,
      approvedAt: new Date().toISOString(),
    });

    ApiResponse.success(res, updated);
  }

  public static async reject(req: Request, res: Response): Promise<void> {
    const tenantId = req.tenantId!;
    const { id } = req.params;
    const { reason } = req.body;
    const userId = req.user?.id || 'usr_unknown';

    const obs = await aiObservationRepository.findById(tenantId, id);
    if (!obs) {
      ApiResponse.notFound(res, `AI Observation with ID '${id}' not found`);
      return;
    }

    const updated = await aiObservationRepository.update(tenantId, id, {
      status: IntelligenceStatus.REJECTED,
      rejectedBy: userId,
      rejectedAt: new Date().toISOString(),
      rejectedReason: reason || 'Rejected by human reviewer',
    });

    ApiResponse.success(res, updated);
  }

  public static async dismiss(req: Request, res: Response): Promise<void> {
    const tenantId = req.tenantId!;
    const { id } = req.params;
    const userId = req.user?.id || 'usr_unknown';

    const obs = await aiObservationRepository.findById(tenantId, id);
    if (!obs) {
      ApiResponse.notFound(res, `AI Observation with ID '${id}' not found`);
      return;
    }

    const updated = await aiObservationRepository.update(tenantId, id, {
      status: IntelligenceStatus.DISMISSED,
      dismissedBy: userId,
      dismissedAt: new Date().toISOString(),
    });

    ApiResponse.success(res, updated);
  }
}
