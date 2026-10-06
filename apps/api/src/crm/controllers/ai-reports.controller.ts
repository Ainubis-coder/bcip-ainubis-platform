/**
 * BCIP Ainubis CRM Executive Reporting Controller
 * Phase 2E — Prompt 002E-008
 */

import type { Request, Response } from 'express';
import {
  executiveReportRepository,
  reportApprovalRecordRepository,
  ainubisExecutiveReportingService,
} from '@bcip/database';
import { ApiResponse } from '../serializers/response.serializer.ts';

export class AIReportsController {
  // 1. GET /api/v1/ai/reports
  public static async listReports(req: Request, res: Response): Promise<void> {
    const tenantId = req.tenantId!;
    try {
      const list = await executiveReportRepository.findAll(tenantId);
      ApiResponse.success(res, list);
    } catch (err: any) {
      ApiResponse.error(res, 'INTERNAL_ERROR', err.message || 'Failed to list reports', 500);
    }
  }

  // 2. GET /api/v1/ai/reports/:id
  public static async getReportById(req: Request, res: Response): Promise<void> {
    const tenantId = req.tenantId!;
    const { id } = req.params;
    try {
      const report = await executiveReportRepository.findById(tenantId, id);
      if (!report) {
        ApiResponse.error(res, 'NOT_FOUND', 'Executive report not found.', 404);
        return;
      }
      ApiResponse.success(res, report);
    } catch (err: any) {
      ApiResponse.error(res, 'INTERNAL_ERROR', err.message || 'Failed to get report', 500);
    }
  }

  // 3. GET /api/v1/ai/reports/:id/versions
  public static async listVersions(req: Request, res: Response): Promise<void> {
    const tenantId = req.tenantId!;
    const { id } = req.params;
    try {
      const report = await executiveReportRepository.findById(tenantId, id);
      if (!report) {
        ApiResponse.error(res, 'NOT_FOUND', 'Executive report not found.', 404);
        return;
      }
      const versions = await executiveReportRepository.findReportVersions(
        tenantId,
        report.reportType,
        report.reportingPeriod
      );
      ApiResponse.success(res, versions);
    } catch (err: any) {
      ApiResponse.error(res, 'INTERNAL_ERROR', err.message || 'Failed to list report versions', 500);
    }
  }

  // 4. POST /api/v1/ai/reports/generate
  public static async generateReport(req: Request, res: Response): Promise<void> {
    const tenantId = req.tenantId!;
    const dto = req.body;

    if (!dto.reportType || !dto.reportingPeriod || !dto.periodStart || !dto.periodEnd) {
      ApiResponse.error(
        res,
        'VALIDATION_ERROR',
        'Missing required parameters: reportType, reportingPeriod, periodStart, periodEnd',
        422
      );
      return;
    }

    try {
      const report = await ainubisExecutiveReportingService.generateReport(
        tenantId,
        dto,
        req.user?.id || 'system'
      );
      ApiResponse.success(res, report, 201);
    } catch (err: any) {
      ApiResponse.error(res, 'VALIDATION_ERROR', err.message || 'Failed to generate report', 422);
    }
  }

  // 5. POST /api/v1/ai/reports/:id/review
  public static async reviewReport(req: Request, res: Response): Promise<void> {
    const tenantId = req.tenantId!;
    const { id } = req.params;
    try {
      const report = await executiveReportRepository.findById(tenantId, id);
      if (!report) {
        ApiResponse.error(res, 'NOT_FOUND', 'Executive report not found.', 404);
        return;
      }
      const updated = await executiveReportRepository.update(tenantId, id, {
        status: 'REVIEW_REQUIRED',
        updatedAt: new Date().toISOString(),
      });
      ApiResponse.success(res, updated);
    } catch (err: any) {
      ApiResponse.error(res, 'INTERNAL_ERROR', err.message || 'Failed to review report', 500);
    }
  }

  // 6. POST /api/v1/ai/reports/:id/approve
  public static async approveReport(req: Request, res: Response): Promise<void> {
    const tenantId = req.tenantId!;
    const { id } = req.params;
    const { reason } = req.body;
    try {
      const updated = await ainubisExecutiveReportingService.approveReport(
        tenantId,
        id,
        req.user?.id || 'system',
        req.user?.email || 'admin@bcip.com',
        reason
      );
      ApiResponse.success(res, updated);
    } catch (err: any) {
      ApiResponse.error(res, 'VALIDATION_ERROR', err.message || 'Failed to approve report', 422);
    }
  }

  // 7. POST /api/v1/ai/reports/:id/reject
  public static async rejectReport(req: Request, res: Response): Promise<void> {
    const tenantId = req.tenantId!;
    const { id } = req.params;
    const { reason } = req.body;
    try {
      const updated = await ainubisExecutiveReportingService.rejectReport(
        tenantId,
        id,
        req.user?.id || 'system',
        req.user?.email || 'admin@bcip.com',
        reason
      );
      ApiResponse.success(res, updated);
    } catch (err: any) {
      ApiResponse.error(res, 'VALIDATION_ERROR', err.message || 'Failed to reject report', 422);
    }
  }

  // 8. POST /api/v1/ai/reports/:id/publish
  public static async publishReport(req: Request, res: Response): Promise<void> {
    const tenantId = req.tenantId!;
    const { id } = req.params;
    try {
      const updated = await ainubisExecutiveReportingService.publishReport(
        tenantId,
        id,
        req.user?.id || 'system',
        req.user?.email || 'admin@bcip.com'
      );
      ApiResponse.success(res, updated);
    } catch (err: any) {
      ApiResponse.error(res, 'VALIDATION_ERROR', err.message || 'Failed to publish report', 422);
    }
  }

  // 9. POST /api/v1/ai/reports/:id/archive
  public static async archiveReport(req: Request, res: Response): Promise<void> {
    const tenantId = req.tenantId!;
    const { id } = req.params;
    try {
      const updated = await ainubisExecutiveReportingService.archiveReport(
        tenantId,
        id,
        req.user?.id || 'system'
      );
      ApiResponse.success(res, updated);
    } catch (err: any) {
      ApiResponse.error(res, 'VALIDATION_ERROR', err.message || 'Failed to archive report', 422);
    }
  }

  // 10. GET /api/v1/ai/reports/:id/evidence
  public static async getReportEvidence(req: Request, res: Response): Promise<void> {
    const tenantId = req.tenantId!;
    const { id } = req.params;
    try {
      const report = await executiveReportRepository.findById(tenantId, id);
      if (!report) {
        ApiResponse.error(res, 'NOT_FOUND', 'Executive report not found.', 404);
        return;
      }
      ApiResponse.success(res, report.evidence || []);
    } catch (err: any) {
      ApiResponse.error(res, 'INTERNAL_ERROR', err.message || 'Failed to list report evidence', 500);
    }
  }

  // 11. POST /api/v1/ai/reports/:id/export
  public static async exportReport(req: Request, res: Response): Promise<void> {
    const tenantId = req.tenantId!;
    const { id } = req.params;
    try {
      const report = await executiveReportRepository.findById(tenantId, id);
      if (!report) {
        ApiResponse.error(res, 'NOT_FOUND', 'Executive report not found.', 404);
        return;
      }
      // Export preserves governance metadata as JSON (Prompt 22)
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="report_${report.id}_v${report.version}.json"`);
      res.send(JSON.stringify(report, null, 2));
    } catch (err: any) {
      ApiResponse.error(res, 'INTERNAL_ERROR', err.message || 'Failed to export report', 500);
    }
  }
}
