/**
 * BCIP Ainubis AI Monitoring Controller
 * Exposes continuous monitoring status, execution history, capability catalogue, and manual triggers.
 * Phase 2E — Prompt 002E-003: Ainubis Continuous CRM Intelligence & Automated Monitoring
 */

import type { Request, Response } from 'express';
import {
  ainubisContinuousMonitorService,
  aiMonitoringExecutionRepository,
  ainubisCapabilityRegistry,
  aiObservationRepository,
  AICapability,
  IntelligenceStatus,
} from '@bcip/database';
import { ApiResponse } from '../serializers/response.serializer.ts';

export class AIMonitoringController {
  /**
   * GET /api/v1/ai/monitoring/status
   * Returns current monitoring status, last run, observation statistics, and errors.
   */
  public static async getStatus(req: Request, res: Response): Promise<void> {
    const tenantId = req.tenantId!;
    try {
      const status = await ainubisContinuousMonitorService.getMonitoringStatus(tenantId);
      ApiResponse.success(res, status);
    } catch (err: unknown) {
      ApiResponse.error(res, 'INTERNAL_ERROR', (err as Error).message || 'Failed to retrieve monitoring status', 500);
    }
  }

  /**
   * GET /api/v1/ai/monitoring/capabilities
   * Returns registered intelligence capabilities catalogue with tenant-scoped observation counts.
   */
  public static async getCapabilities(req: Request, res: Response): Promise<void> {
    const tenantId = req.tenantId!;
    try {
      const capabilities = ainubisCapabilityRegistry.listCapabilities();

      // Augment each capability with active observation count for this tenant
      const augmented = await Promise.all(
        capabilities.map(async (cap) => {
          const { total } = await aiObservationRepository.findMany(tenantId, {
            capability: cap.capability,
            status: IntelligenceStatus.GENERATED,
          });
          return {
            ...cap,
            activeObservationsCount: total,
          };
        })
      );

      ApiResponse.success(res, augmented);
    } catch (err: unknown) {
      ApiResponse.error(res, 'INTERNAL_ERROR', (err as Error).message || 'Failed to list monitoring capabilities', 500);
    }
  }

  /**
   * GET /api/v1/ai/monitoring/executions
   * Returns paginated execution history of monitoring cycles for the active tenant.
   */
  public static async getExecutions(req: Request, res: Response): Promise<void> {
    const tenantId = req.tenantId!;
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));
    const offset = (page - 1) * limit;

    try {
      const { data, total } = await aiMonitoringExecutionRepository.findMany(tenantId, {
        offset,
        limit,
        capability: req.query.capability as string,
        status: req.query.status as any,
      });

      ApiResponse.paginated(res, data, { page, pageSize: limit, total });
    } catch (err: unknown) {
      ApiResponse.error(res, 'INTERNAL_ERROR', (err as Error).message || 'Failed to retrieve monitoring executions', 500);
    }
  }

  /**
   * POST /api/v1/ai/monitoring/run
   * Triggers an authorized manual monitoring run for the active tenant.
   */
  public static async runMonitoring(req: Request, res: Response): Promise<void> {
    const tenantId = req.tenantId!;
    const capability = req.body?.capability as AICapability | undefined;
    const actorUserId = req.user?.id || 'manual.user';

    try {
      const result = await ainubisContinuousMonitorService.runTenantMonitoring(tenantId, {
        capability,
        triggerType: 'MANUAL',
        actorUserId,
      });

      ApiResponse.success(res, result.execution, 200);
    } catch (err: unknown) {
      ApiResponse.error(res, 'INTERNAL_ERROR', (err as Error).message || 'Failed to execute monitoring run', 500);
    }
  }
}
