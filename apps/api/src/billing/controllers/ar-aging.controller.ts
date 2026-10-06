/**
 * BCIP Accounts Receivable Aging, Customer Statements, Collection Priority & Reconciliation Controller
 * Phase 3 — Prompt 003-006
 */

import type { Request, Response } from 'express';
import { ArAgingService } from '@bcip/database';
import { ApiResponse } from '../../crm/serializers/response.serializer.ts';

export class ArAgingController {
  /**
   * GET /api/v1/billing/receivables/aging
   * Retrieves portfolio-wide or customer-filtered AR aging breakdown
   */
  public static async getAging(req: Request, res: Response): Promise<void> {
    const tenantId = req.tenantId!;
    try {
      const { customerId, asOfDate } = req.query;
      const result = await ArAgingService.getAgingPortfolio(tenantId, {
        customerId: customerId ? String(customerId) : undefined,
        asOfDate: asOfDate ? String(asOfDate) : undefined,
      });

      ApiResponse.success(res, result);
    } catch (err: any) {
      ApiResponse.error(res, 'INTERNAL_ERROR', err.message || 'Failed to calculate AR aging', 500);
    }
  }

  /**
   * GET /api/v1/billing/receivables/overdue
   * Retrieves overdue receivables sorted by days overdue descending
   */
  public static async getOverdue(req: Request, res: Response): Promise<void> {
    const tenantId = req.tenantId!;
    try {
      const { customerId, asOfDate } = req.query;
      const result = await ArAgingService.getOverdueReceivables(tenantId, {
        customerId: customerId ? String(customerId) : undefined,
        asOfDate: asOfDate ? String(asOfDate) : undefined,
      });

      ApiResponse.success(res, result);
    } catch (err: any) {
      ApiResponse.error(res, 'INTERNAL_ERROR', err.message || 'Failed to list overdue receivables', 500);
    }
  }

  /**
   * GET /api/v1/billing/receivables/summary
   * Retrieves aggregated receivables metrics and portfolio status
   */
  public static async getSummary(req: Request, res: Response): Promise<void> {
    const tenantId = req.tenantId!;
    try {
      const { asOfDate } = req.query;
      const result = await ArAgingService.getReceivablesSummary(tenantId, asOfDate ? String(asOfDate) : undefined);
      ApiResponse.success(res, result);
    } catch (err: any) {
      ApiResponse.error(res, 'INTERNAL_ERROR', err.message || 'Failed to get receivables summary', 500);
    }
  }

  /**
   * GET /api/v1/billing/customers/:customerId/balance
   * Retrieves authoritative customer AR balance with 404 concealment for cross-tenant access
   */
  public static async getCustomerBalance(req: Request, res: Response): Promise<void> {
    const tenantId = req.tenantId!;
    const customerId = req.params.customerId || req.params.id;
    try {
      const { asOfDate } = req.query;
      const balance = await ArAgingService.getCustomerBalance(
        tenantId,
        customerId,
        asOfDate ? String(asOfDate) : undefined
      );
      ApiResponse.success(res, balance);
    } catch (err: any) {
      const status = err.message?.includes('not found') ? 404 : 500;
      ApiResponse.error(res, 'CUSTOMER_BALANCE_ERROR', err.message || 'Customer balance not found', status);
    }
  }


  /**
   * GET /api/v1/billing/customers/:id/statement
   * GET /api/v1/billing/statements/:customerId
   * Generates a deterministic customer statement covering invoices, payments and aging
   */
  public static async getCustomerStatement(req: Request, res: Response): Promise<void> {
    const tenantId = req.tenantId!;
    const customerId = req.params.id || req.params.customerId;
    try {
      const { startDate, endDate, asOfDate } = req.query;
      const statement = await ArAgingService.getCustomerStatement(tenantId, customerId, {
        startDate: startDate ? String(startDate) : undefined,
        endDate: endDate ? String(endDate) : undefined,
        asOfDate: asOfDate ? String(asOfDate) : undefined,
      });

      ApiResponse.success(res, statement);
    } catch (err: any) {
      const status = err.message?.includes('not found') ? 404 : 500;
      ApiResponse.error(res, 'STATEMENT_ERROR', err.message || 'Failed to generate customer statement', status);
    }
  }

  /**
   * GET /api/v1/billing/receivables/collection-priority
   * Retrieves deterministic prioritized collection queue and actionable recommendations
   */
  public static async getCollectionPriority(req: Request, res: Response): Promise<void> {
    const tenantId = req.tenantId!;
    try {
      const { asOfDate } = req.query;
      const priorities = await ArAgingService.getCollectionPriorities(tenantId, {
        asOfDate: asOfDate ? String(asOfDate) : undefined,
      });

      ApiResponse.success(res, priorities);
    } catch (err: any) {
      ApiResponse.error(res, 'INTERNAL_ERROR', err.message || 'Failed to compute collection priorities', 500);
    }
  }

  /**
   * GET /api/v1/billing/reconciliation
   * Retrieves deterministic cross-entity commercial ledger reconciliation report
   */
  public static async getReconciliation(req: Request, res: Response): Promise<void> {
    const tenantId = req.tenantId!;
    try {
      const { asOfDate } = req.query;
      const report = await ArAgingService.getReconciliationReport(tenantId, {
        asOfDate: asOfDate ? String(asOfDate) : undefined,
      });

      ApiResponse.success(res, report);
    } catch (err: any) {
      ApiResponse.error(res, 'INTERNAL_ERROR', err.message || 'Failed to generate reconciliation report', 500);
    }
  }
}
