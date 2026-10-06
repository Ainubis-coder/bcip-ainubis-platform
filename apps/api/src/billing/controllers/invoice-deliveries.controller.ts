/**
 * BCIP Commercial Operations - Invoice Deliveries Controller
 * Phase 3 — Prompt 003-004
 */

import type { Request, Response } from 'express';
import {
  invoiceRepository,
  invoiceDeliveryRepository,
  invoiceDeliveryAttemptRepository,
  invoiceDeliveryTemplateRepository,
  InvoiceDeliveryService,
} from '@bcip/database';
import { ApiResponse } from '../../crm/serializers/response.serializer.ts';

export class InvoiceDeliveriesController {
  /**
   * Seeding helper to ensure a default system template is always present
   */
  private static async ensureDefaultTemplate(): Promise<void> {
    const templateId = 'temp_default';
    // Use tenantId null for system templates
    const all = await invoiceDeliveryTemplateRepository.findAll('SYSTEM');
    const existing = all.find((t) => t.id === templateId);
    if (!existing) {
      await invoiceDeliveryTemplateRepository.create({
        id: templateId,
        tenantId: null,
        name: 'Default Invoice Email Template',
        subject: 'Invoice {{invoice_number}} from BCIP Office',
        body: 'Dear {{customer_name}},\n\nPlease find attached invoice {{invoice_number}} for {{invoice_total}} {{currency}} due on {{due_date}}.\n\nBest regards,\nBCIP Team',
        isActive: true,
        version: 1,
        createdBy: 'system',
      });
    }
  }

  public static async listTemplates(req: Request, res: Response): Promise<void> {
    const tenantId = req.tenantId!;
    try {
      await InvoiceDeliveriesController.ensureDefaultTemplate();
      const templates = await invoiceDeliveryTemplateRepository.findAllForTenant(tenantId);
      ApiResponse.success(res, templates);
    } catch (err: any) {
      ApiResponse.error(res, 'INTERNAL_ERROR', err.message || 'Failed to list templates', 500);
    }
  }

  public static async initiateDelivery(req: Request, res: Response): Promise<void> {
    const tenantId = req.tenantId!;
    const { invoiceId } = req.params;
    const { documentId, recipientEmail, templateId } = req.body;
    const actor = req.user?.id || 'system';
    const correlationId = req.correlationId || `corr_del_${Date.now()}`;
    const idempotencyKey = (req.headers['x-idempotency-key'] || req.headers['idempotency-key']) as string | undefined;

    try {
      if (!documentId || !recipientEmail || !templateId) {
        ApiResponse.error(res, 'VALIDATION_ERROR', 'Missing required fields: documentId, recipientEmail, templateId', 422);
        return;
      }

      await InvoiceDeliveriesController.ensureDefaultTemplate();

      const result = await InvoiceDeliveryService.initiateDelivery({
        tenantId,
        invoiceId,
        documentId,
        recipientEmail,
        templateId,
        actor,
        correlationId,
        idempotencyKey,
      });

      ApiResponse.success(res, result, 201);
    } catch (err: any) {
      const statusCode = err.message.includes('not found') ? 404 : 422;
      ApiResponse.error(res, 'DELIVERY_ERROR', err.message || 'Failed to initiate invoice delivery', statusCode);
    }
  }

  public static async listDeliveriesForInvoice(req: Request, res: Response): Promise<void> {
    const tenantId = req.tenantId!;
    const { invoiceId } = req.params;

    try {
      const invoice = await invoiceRepository.findById(tenantId, invoiceId);
      if (!invoice) {
        ApiResponse.error(res, 'NOT_FOUND', 'Invoice not found.', 404);
        return;
      }

      const deliveries = await invoiceDeliveryRepository.findByInvoiceId(tenantId, invoiceId);
      ApiResponse.success(res, deliveries);
    } catch (err: any) {
      ApiResponse.error(res, 'INTERNAL_ERROR', err.message || 'Failed to list deliveries', 500);
    }
  }

  public static async retryDelivery(req: Request, res: Response): Promise<void> {
    const tenantId = req.tenantId!;
    const { deliveryId } = req.params;
    const actor = req.user?.id || 'system';
    const correlationId = req.correlationId || `corr_retry_${Date.now()}`;

    try {
      const result = await InvoiceDeliveryService.retryDelivery(
        tenantId,
        deliveryId,
        actor,
        correlationId
      );
      ApiResponse.success(res, result);
    } catch (err: any) {
      const statusCode = err.message.includes('not found') ? 404 : 422;
      ApiResponse.error(res, 'RETRY_ERROR', err.message || 'Failed to retry delivery', statusCode);
    }
  }

  public static async listAttempts(req: Request, res: Response): Promise<void> {
    const tenantId = req.tenantId!;
    const { deliveryId } = req.params;

    try {
      const delivery = await invoiceDeliveryRepository.findById(tenantId, deliveryId);
      if (!delivery) {
        ApiResponse.error(res, 'NOT_FOUND', 'Invoice delivery not found.', 404);
        return;
      }

      const attempts = await invoiceDeliveryAttemptRepository.findByDeliveryId(tenantId, deliveryId);
      ApiResponse.success(res, attempts);
    } catch (err: any) {
      ApiResponse.error(res, 'INTERNAL_ERROR', err.message || 'Failed to list attempts', 500);
    }
  }
}
