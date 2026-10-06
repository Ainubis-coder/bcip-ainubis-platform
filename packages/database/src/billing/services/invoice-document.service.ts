/**
 * BCIP Commercial Operations - Invoice Document Generation & Delivery Service
 * Phase 3 — Prompt 003-003
 */

import { invoiceRepository } from '../repositories/invoice.repository.ts';
import { invoiceLineRepository } from '../repositories/invoice-line.repository.ts';
import { billingCustomerRepository } from '../repositories/billing-customer.repository.ts';
import { invoiceDocumentRepository } from '../repositories/invoice-document.repository.ts';
import { billingAuditRepository } from '../repositories/billing-audit.repository.ts';
import { InvoiceDocument } from '../types.ts';
import { InvoiceStatus } from '../enums.ts';

export class InvoiceDocumentService {
  /**
   * Generates a formal invoice document from an APPROVED or ISSUED invoice.
   * Maintains versioning (superseding older versions) and strict auditability.
   */
  public static async generateDocument(
    tenantId: string,
    invoiceId: string,
    actor: string,
    correlationId: string,
    idempotencyKey?: string
  ): Promise<InvoiceDocument> {
    const invoice = await invoiceRepository.findById(tenantId, invoiceId);
    if (!invoice) {
      throw new Error('Invoice not found.');
    }

    if (invoice.status !== InvoiceStatus.APPROVED && invoice.status !== InvoiceStatus.ISSUED) {
      throw new Error(`Official invoice documents can only be generated for APPROVED or ISSUED invoices. Current status: ${invoice.status}`);
    }

    if (idempotencyKey) {
      const existingDocs = await invoiceDocumentRepository.findByInvoiceId(tenantId, invoiceId);
      const match = existingDocs.find((d) => d.metadata?.idempotencyKey === idempotencyKey);
      if (match) {
        return match;
      }
    }

    const lines = await invoiceLineRepository.findByInvoiceId(tenantId, invoiceId);
    const customer = await billingCustomerRepository.findById(tenantId, invoice.billingCustomerId);

    const existingDocs = await invoiceDocumentRepository.findByInvoiceId(tenantId, invoiceId);
    for (const doc of existingDocs) {
      if (doc.status === 'GENERATED') {
        await invoiceDocumentRepository.update(tenantId, doc.id, { status: 'SUPERSEDED' });
      }
    }
    const nextVersion = existingDocs.length > 0 ? Math.max(...existingDocs.map((d) => d.version)) + 1 : 1;

    const payloadForHash = JSON.stringify({
      invoiceNumber: invoice.invoiceNumber,
      issueDate: invoice.issueDate,
      dueDate: invoice.dueDate,
      subtotal: invoice.subtotal,
      taxTotal: invoice.taxTotal,
      discountTotal: invoice.discountTotal,
      grandTotal: invoice.grandTotal,
      currency: invoice.currency,
      lines: lines.map((l) => ({ desc: l.description, qty: l.quantity, price: l.unitPrice, total: l.lineTotal })),
      customerId: invoice.billingCustomerId,
    });
    const contentHash = `sha256_${Buffer.from(payloadForHash).toString('base64').slice(0, 32)}`;

    const documentId = `doc_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const fileName = `Invoice_${invoice.invoiceNumber}_v${nextVersion}.pdf`;

    const document: InvoiceDocument = {
      id: documentId,
      tenantId,
      invoiceId,
      documentType: 'INVOICE',
      documentNumber: `${invoice.invoiceNumber}-DOC-${nextVersion}`,
      version: nextVersion,
      status: 'GENERATED',
      generatedAt: new Date().toISOString(),
      generatedBy: actor,
      contentHash,
      storageReference: `store://tenant/${tenantId}/invoices/${invoiceId}/${fileName}`,
      fileName,
      mimeType: 'application/pdf',
      deliveryStatus: 'NOT_SENT',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      metadata: {
        idempotencyKey,
        customerName: customer?.legalName,
        grandTotal: invoice.grandTotal,
        currency: invoice.currency,
        lineCount: lines.length,
      },
    };

    const created = await invoiceDocumentRepository.create(document);

    await billingAuditRepository.record(
      tenantId,
      actor,
      'document_generated',
      'invoice_document',
      documentId,
      correlationId,
      undefined,
      created,
      `Generated official document version ${nextVersion} for invoice ${invoice.invoiceNumber}`
    );

    return created;
  }
}
