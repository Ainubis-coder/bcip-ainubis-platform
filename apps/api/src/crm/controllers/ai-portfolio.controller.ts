/**
 * BCIP Ainubis CRM Portfolio Intelligence Controller
 * Phase 2E — Prompt 002E-007
 */

import type { Request, Response } from 'express';
import {
  portfolioSnapshotRepository,
  portfolioSignalRepository,
  portfolioRiskRepository,
  portfolioTrendRepository,
  portfolioInsightRepository,
  portfolioAnalysisRunRepository,
  ainubisPortfolioIntelligenceService,
} from '@bcip/database';
import { ApiResponse } from '../serializers/response.serializer.ts';

export class AIPortfolioController {
  // 1. POST /api/v1/ai/portfolio/analyze
  public static async analyze(req: Request, res: Response): Promise<void> {
    const tenantId = req.tenantId!;
    try {
      const run = await ainubisPortfolioIntelligenceService.analyzePortfolio(
        tenantId,
        req.user?.id || 'system'
      );
      ApiResponse.success(res, run, 201);
    } catch (err: any) {
      ApiResponse.error(res, 'INTERNAL_ERROR', err.message || 'Failed to analyze portfolio', 500);
    }
  }

  // 2. GET /api/v1/ai/portfolio/snapshot
  public static async getSnapshot(req: Request, res: Response): Promise<void> {
    const tenantId = req.tenantId!;
    try {
      let snapshot = await portfolioSnapshotRepository.getLatest(tenantId);
      if (!snapshot) {
        // If no snapshot exists yet, run analysis to seed initial portfolio snapshot
        await ainubisPortfolioIntelligenceService.analyzePortfolio(tenantId, 'init_snapshot');
        snapshot = await portfolioSnapshotRepository.getLatest(tenantId);
      }
      ApiResponse.success(res, snapshot);
    } catch (err: any) {
      ApiResponse.error(res, 'INTERNAL_ERROR', err.message || 'Failed to get portfolio snapshot', 500);
    }
  }

  // 3. GET /api/v1/ai/portfolio/metrics
  public static async getMetrics(req: Request, res: Response): Promise<void> {
    const tenantId = req.tenantId!;
    try {
      let snapshot = await portfolioSnapshotRepository.getLatest(tenantId);
      if (!snapshot) {
        await ainubisPortfolioIntelligenceService.analyzePortfolio(tenantId, 'init_metrics');
        snapshot = await portfolioSnapshotRepository.getLatest(tenantId);
      }
      ApiResponse.success(res, snapshot ? snapshot.metrics : {});
    } catch (err: any) {
      ApiResponse.error(res, 'INTERNAL_ERROR', err.message || 'Failed to get portfolio metrics', 500);
    }
  }

  // 4. GET /api/v1/ai/portfolio/signals
  public static async getSignals(req: Request, res: Response): Promise<void> {
    const tenantId = req.tenantId!;
    try {
      const signals = await portfolioSignalRepository.findAll(tenantId);
      ApiResponse.success(res, signals);
    } catch (err: any) {
      ApiResponse.error(res, 'INTERNAL_ERROR', err.message || 'Failed to get portfolio signals', 500);
    }
  }

  // 5. GET /api/v1/ai/portfolio/risks
  public static async getRisks(req: Request, res: Response): Promise<void> {
    const tenantId = req.tenantId!;
    try {
      const risks = await portfolioRiskRepository.findAll(tenantId);
      ApiResponse.success(res, risks);
    } catch (err: any) {
      ApiResponse.error(res, 'INTERNAL_ERROR', err.message || 'Failed to get portfolio risks', 500);
    }
  }

  // 6. GET /api/v1/ai/portfolio/trends
  public static async getTrends(req: Request, res: Response): Promise<void> {
    const tenantId = req.tenantId!;
    try {
      const trends = await portfolioTrendRepository.findAll(tenantId);
      ApiResponse.success(res, trends);
    } catch (err: any) {
      ApiResponse.error(res, 'INTERNAL_ERROR', err.message || 'Failed to get portfolio trends', 500);
    }
  }

  // 7. GET /api/v1/ai/portfolio/insights
  public static async getInsights(req: Request, res: Response): Promise<void> {
    const tenantId = req.tenantId!;
    try {
      const insights = await portfolioInsightRepository.findAll(tenantId);
      ApiResponse.success(res, insights);
    } catch (err: any) {
      ApiResponse.error(res, 'INTERNAL_ERROR', err.message || 'Failed to get portfolio insights', 500);
    }
  }

  // 8. GET /api/v1/ai/portfolio/priorities
  public static async getPriorities(req: Request, res: Response): Promise<void> {
    const tenantId = req.tenantId!;
    try {
      const [signals, risks] = await Promise.all([
        portfolioSignalRepository.findAll(tenantId),
        portfolioRiskRepository.findAll(tenantId),
      ]);

      const priorities: any[] = [];

      // Convert signals into priority items
      signals.forEach((sig) => {
        let score = sig.score;
        if (sig.severity === 'CRITICAL') score += 40;
        else if (sig.severity === 'HIGH') score += 20;
        else if (sig.severity === 'MEDIUM') score += 10;

        priorities.push({
          id: sig.signalId,
          title: `Critical Alert: ${sig.signalType.replace(/_/g, ' ')}`,
          description: sig.evidence[0] || 'Critical threshold breached in operational CRM flow.',
          sourceType: 'SIGNAL',
          severity: sig.severity,
          score,
          affectedEntityCount: sig.metricValue,
          evidence: sig.evidence,
          recommendedNextStep: `Launch appropriate automated monitoring and follow up processes.`,
        });
      });

      // Convert risks into priority items
      risks.forEach((risk) => {
        let score = 50;
        if (risk.severity === 'CRITICAL') score += 40;
        else if (risk.severity === 'HIGH') score += 30;
        else if (risk.severity === 'MEDIUM') score += 15;

        priorities.push({
          id: risk.id,
          title: `Operational Risk: ${risk.affectedDomain}`,
          description: risk.triggeringCondition,
          sourceType: 'RISK',
          severity: risk.severity,
          score,
          affectedEntityCount: risk.affectedEntityCount,
          evidence: risk.supportingEvidence,
          recommendedNextStep: risk.recommendedOperationalResponse,
        });
      });

      // Sort by score descending
      priorities.sort((a, b) => b.score - a.score);

      ApiResponse.success(res, priorities);
    } catch (err: any) {
      ApiResponse.error(res, 'INTERNAL_ERROR', err.message || 'Failed to get portfolio priorities', 500);
    }
  }

  // 9. GET /api/v1/ai/portfolio/health
  public static async getHealth(req: Request, res: Response): Promise<void> {
    const tenantId = req.tenantId!;
    try {
      const health = await ainubisPortfolioIntelligenceService.calculatePortfolioHealth(tenantId);
      ApiResponse.success(res, health);
    } catch (err: any) {
      ApiResponse.error(res, 'INTERNAL_ERROR', err.message || 'Failed to compute portfolio health', 500);
    }
  }
}
