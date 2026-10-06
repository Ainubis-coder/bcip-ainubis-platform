/**
 * BCIP Commercial Operations - Receivables API Controller
 * Phase 3 — Prompt 003-005
 */

import type { Request, Response } from 'express';
import {
  receivableRepository,
  paymentRepository,
  paymentAllocationRepository,
  ReceivableService,
} from '@bcip/database';
import { ApiResponse } from '../../crm/serializers/response.serializer.ts';

export class ReceivablesController {
  public static async listReceivables(req: Request, res: Response): Promise<void> {
    const tenantId = req.tenantId!;
    try {
      const { customerId, status } = req.query;
      const list = await receivableRepository.findAll(tenantId);
      
      let filtered = list;
      if (customerId) {
        filtered = filtered.filter((r) => r.customerId === customerId);
      }
      if (status) {
        filtered = filtered.filter((r) => r.status === status);
      }

      ApiResponse.success(res, filtered);
    } catch (err: any) {
      ApiResponse.error(res, 'INTERNAL_ERROR', err.message || 'Failed to list receivables', 500);
    }
  }

  public static async getReceivableById(req: Request, res: Response): Promise<void> {
    const tenantId = req.tenantId!;
    const { id } = req.params;
    try {
      const item = await receivableRepository.findById(tenantId, id);
      if (!item) {
        ApiResponse.error(res, 'NOT_FOUND', 'Receivable not found.', 404);
        return;
      }
      ApiResponse.success(res, item);
    } catch (err: any) {
      ApiResponse.error(res, 'INTERNAL_ERROR', err.message || 'Failed to get receivable', 500);
    }
  }

  public static async recalculate(req: Request, res: Response): Promise<void> {
    const tenantId = req.tenantId!;
    const { id } = req.params;
    const actor = req.user?.id || 'system';
    const correlationId = req.correlationId || `corr_rec_recalc_${Date.now()}`;

    try {
      const updated = await ReceivableService.recalculateReceivable(tenantId, id, actor, correlationId);
      ApiResponse.success(res, updated);
    } catch (err: any) {
      ApiResponse.error(res, 'RECALCULATE_ERROR', err.message || 'Failed to recalculate receivable', 422);
    }
  }
}

export class PaymentsController {
  public static async listPayments(req: Request, res: Response): Promise<void> {
    const tenantId = req.tenantId!;
    try {
      const { customerId, status } = req.query;
      const list = await paymentRepository.findAll(tenantId);
      
      let filtered = list;
      if (customerId) {
        filtered = filtered.filter((p) => p.customerId === customerId);
      }
      if (status) {
        filtered = filtered.filter((p) => p.status === status);
      }

      ApiResponse.success(res, filtered);
    } catch (err: any) {
      ApiResponse.error(res, 'INTERNAL_ERROR', err.message || 'Failed to list payments', 500);
    }
  }

  public static async getPaymentById(req: Request, res: Response): Promise<void> {
    const tenantId = req.tenantId!;
    const { id } = req.params;
    try {
      const item = await paymentRepository.findById(tenantId, id);
      if (!item) {
        ApiResponse.error(res, 'NOT_FOUND', 'Payment not found.', 404);
        return;
      }
      ApiResponse.success(res, item);
    } catch (err: any) {
      ApiResponse.error(res, 'INTERNAL_ERROR', err.message || 'Failed to get payment', 500);
    }
  }

  public static async recordPayment(req: Request, res: Response): Promise<void> {
    const tenantId = req.tenantId!;
    const dto = req.body;
    const actor = req.user?.id || 'system';
    const correlationId = req.correlationId || `corr_pmt_${Date.now()}`;
    const idempotencyKey = (req.headers['x-idempotency-key'] || req.headers['idempotency-key']) as string | undefined;

    try {
      if (!dto.customerId || !dto.amount || !dto.currency || !dto.paymentDate || !dto.paymentMethod) {
        ApiResponse.error(res, 'VALIDATION_ERROR', 'Missing required fields for payment', 422);
        return;
      }

      const payment = await ReceivableService.recordPayment({
        tenantId,
        customerId: dto.customerId,
        currency: dto.currency,
        amount: Number(dto.amount),
        paymentDate: dto.paymentDate,
        paymentMethod: dto.paymentMethod,
        externalReference: dto.externalReference,
        notes: dto.notes,
        recordedBy: actor,
        correlationId,
        idempotencyKey,
      });

      ApiResponse.success(res, payment, 201);
    } catch (err: any) {
      ApiResponse.error(res, 'RECORD_ERROR', err.message || 'Failed to record payment', 422);
    }
  }

  public static async reversePayment(req: Request, res: Response): Promise<void> {
    const tenantId = req.tenantId!;
    const { id } = req.params;
    const { reason } = req.body;
    const actor = req.user?.id || 'system';
    const correlationId = req.correlationId || `corr_pmt_rev_${Date.now()}`;

    try {
      if (!reason || !reason.trim()) {
        ApiResponse.error(res, 'VALIDATION_ERROR', 'Mandatory reversal reason is required.', 422);
        return;
      }

      const updated = await ReceivableService.reversePayment(tenantId, id, actor, correlationId, reason);
      ApiResponse.success(res, updated);
    } catch (err: any) {
      ApiResponse.error(res, 'REVERSAL_ERROR', err.message || 'Failed to reverse payment', 422);
    }
  }
}

export class PaymentAllocationsController {
  public static async listAllocations(req: Request, res: Response): Promise<void> {
    const tenantId = req.tenantId!;
    try {
      const { paymentId, receivableId } = req.query;
      const list = await paymentAllocationRepository.findAll(tenantId);
      
      let filtered = list;
      if (paymentId) {
        filtered = filtered.filter((a) => a.paymentId === paymentId);
      }
      if (receivableId) {
        filtered = filtered.filter((a) => a.receivableId === receivableId);
      }

      ApiResponse.success(res, filtered);
    } catch (err: any) {
      ApiResponse.error(res, 'INTERNAL_ERROR', err.message || 'Failed to list allocations', 500);
    }
  }

  public static async allocate(req: Request, res: Response): Promise<void> {
    const tenantId = req.tenantId!;
    const dto = req.body;
    const actor = req.user?.id || 'system';
    const correlationId = req.correlationId || `corr_alloc_${Date.now()}`;

    try {
      if (!dto.paymentId || !dto.receivableId || !dto.allocatedAmount) {
        ApiResponse.error(res, 'VALIDATION_ERROR', 'Missing required fields: paymentId, receivableId, allocatedAmount', 422);
        return;
      }

      const result = await ReceivableService.allocatePayment({
        tenantId,
        paymentId: dto.paymentId,
        receivableId: dto.receivableId,
        allocatedAmount: Number(dto.allocatedAmount),
        allocatedBy: actor,
        correlationId,
      });

      ApiResponse.success(res, result, 201);
    } catch (err: any) {
      ApiResponse.error(res, 'ALLOCATION_ERROR', err.message || 'Failed to allocate payment', 422);
    }
  }

  public static async reverseAllocation(req: Request, res: Response): Promise<void> {
    const tenantId = req.tenantId!;
    const { id } = req.params;
    const { reason } = req.body;
    const actor = req.user?.id || 'system';
    const correlationId = req.correlationId || `corr_alloc_rev_${Date.now()}`;

    try {
      if (!reason || !reason.trim()) {
        ApiResponse.error(res, 'VALIDATION_ERROR', 'Mandatory reversal reason is required.', 422);
        return;
      }

      const result = await ReceivableService.reverseAllocation(tenantId, id, actor, correlationId, reason);
      ApiResponse.success(res, result);
    } catch (err: any) {
      ApiResponse.error(res, 'REVERSAL_ERROR', err.message || 'Failed to reverse allocation', 422);
    }
  }
}
