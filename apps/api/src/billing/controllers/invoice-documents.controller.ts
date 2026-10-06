/**
 * BCIP Commercial Operations - Invoice Documents Controller
 * Phase 3 — Prompt 003-003
 */

import type { Request, Response } from 'express';
import {
  invoiceDocumentRepository,
  invoiceRepository,
  InvoiceDocumentService,
} from '@bcip/database';
import { ApiResponse } from '../../crm/serializers/response.serializer.ts';

export class InvoiceDocumentsController {
  public static async generateDocument(req: Request, res: Response): Promise<void> {
    const tenantId = req.tenantId!;
    const { invoiceId } = req.params;
    const actor = req.user?.id || 'system';
    const correlationId = req.correlationId || `corr_doc_${Date.now()}`;
    const idempotencyKey = (req.headers['x-idempotency-key'] || req.headers['idempotency-key']) as string | undefined;

    try {
      const document = await InvoiceDocumentService.generateDocument(
        tenantId,
        invoiceId,
        actor,
        correlationId,
        idempotencyKey
      );
      ApiResponse.success(res, document, 201);
    } catch (err: any) {
      const statusCode = err.message.includes('not found') ? 404 : err.message.includes('only be generated for') ? 422 : 500;
      ApiResponse.error(res, 'DOCUMENT_GENERATION_ERROR', err.message || 'Failed to generate invoice document', statusCode);
    }
  }

  public static async listDocumentsForInvoice(req: Request, res: Response): Promise<void> {
    const tenantId = req.tenantId!;
    const { invoiceId } = req.params;

    try {
      const invoice = await invoiceRepository.findById(tenantId, invoiceId);
      if (!invoice) {
        ApiResponse.error(res, 'NOT_FOUND', 'Invoice not found.', 404);
        return;
      }

      const docs = await invoiceDocumentRepository.findByInvoiceId(tenantId, invoiceId);
      ApiResponse.success(res, docs);
    } catch (err: any) {
      ApiResponse.error(res, 'INTERNAL_ERROR', err.message || 'Failed to list invoice documents', 500);
    }
  }

  public static async getDocumentById(req: Request, res: Response): Promise<void> {
    const tenantId = req.tenantId!;
    const { documentId } = req.params;

    try {
      const allDocs = await invoiceDocumentRepository.findAll(tenantId);
      const doc = allDocs.find((d) => d.id === documentId);
      if (!doc) {
        ApiResponse.error(res, 'NOT_FOUND', 'Invoice document not found.', 404);
        return;
      }

      ApiResponse.success(res, doc);
    } catch (err: any) {
      ApiResponse.error(res, 'INTERNAL_ERROR', err.message || 'Failed to get invoice document', 500);
    }
  }
}
