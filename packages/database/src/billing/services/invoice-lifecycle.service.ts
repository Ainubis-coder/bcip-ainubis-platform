/**
 * BCIP Invoice Lifecycle & Immutability Service
 * Phase 3 — Prompt 003-001
 */

import { invoiceRepository } from '../repositories/invoice.repository.ts';
import { invoiceLineRepository } from '../repositories/invoice-line.repository.ts';
import { billingAuditRepository } from '../repositories/billing-audit.repository.ts';
import { InvoiceStatus } from '../enums.ts';
import type { Invoice } from '../types.ts';
import { InvoiceNumberingService } from './invoice-numbering.service.ts';
import { ReceivableService } from './receivable.service.ts';

export class InvoiceLifecycleService {
  public static async submitForReview(tenantId: string, invoiceId: string, actor: string, correlationId: string): Promise<Invoice> {
    const inv = await invoiceRepository.findById(tenantId, invoiceId);
    if (!inv) throw new Error('Invoice not found.');

    if (inv.status !== InvoiceStatus.DRAFT) {
      throw new Error(`Cannot submit invoice for review from status ${inv.status}. Must be DRAFT.`);
    }

    const updated = await invoiceRepository.update(tenantId, invoiceId, {
      status: InvoiceStatus.REVIEW_REQUIRED,
    });

    await billingAuditRepository.record(
      tenantId,
      actor,
      'invoice_submitted',
      'invoice',
      invoiceId,
      correlationId,
      { status: inv.status },
      { status: InvoiceStatus.REVIEW_REQUIRED }
    );

    return updated!;
  }

  public static async approveInvoice(
    tenantId: string,
    invoiceId: string,
    actor: string,
    correlationId: string,
    reason?: string
  ): Promise<Invoice> {
    const inv = await invoiceRepository.findById(tenantId, invoiceId);
    if (!inv) throw new Error('Invoice not found.');

    if (inv.status !== InvoiceStatus.REVIEW_REQUIRED) {
      throw new Error(`Cannot approve invoice from status ${inv.status}. Must be REVIEW_REQUIRED.`);
    }

    const updated = await invoiceRepository.update(tenantId, invoiceId, {
      status: InvoiceStatus.APPROVED,
    });

    await billingAuditRepository.record(
      tenantId,
      actor,
      'invoice_approved',
      'invoice',
      invoiceId,
      correlationId,
      { status: inv.status },
      { status: InvoiceStatus.APPROVED },
      reason
    );

    return updated!;
  }

  public static async issueInvoice(
    tenantId: string,
    invoiceId: string,
    actor: string,
    actorEmail: string,
    correlationId: string
  ): Promise<Invoice> {
    const inv = await invoiceRepository.findById(tenantId, invoiceId);
    if (!inv) throw new Error('Invoice not found.');

    if (inv.status !== InvoiceStatus.APPROVED) {
      throw new Error(`Cannot issue invoice from status ${inv.status}. Must be APPROVED first.`);
    }

    // Ensure invoice number is assigned
    let invoiceNumber = inv.invoiceNumber;
    if (!invoiceNumber || invoiceNumber.trim() === '') {
      invoiceNumber = await InvoiceNumberingService.generateNextInvoiceNumber(tenantId, inv.billingProfileId);
    }

    const now = new Date().toISOString();
    const updated = await invoiceRepository.update(tenantId, invoiceId, {
      status: InvoiceStatus.ISSUED,
      invoiceNumber,
      issuedBy: actorEmail,
      issuedAt: now,
    });

    await billingAuditRepository.record(
      tenantId,
      actor,
      'invoice_issued',
      'invoice',
      invoiceId,
      correlationId,
      { status: inv.status },
      { status: InvoiceStatus.ISSUED, invoiceNumber, issuedBy: actorEmail }
    );

    // Automatically open a receivable record for this issued invoice
    await ReceivableService.createReceivable(tenantId, invoiceId, actor, correlationId);

    return updated!;
  }

  public static async voidInvoice(
    tenantId: string,
    invoiceId: string,
    actor: string,
    correlationId: string,
    reason: string
  ): Promise<Invoice> {
    const inv = await invoiceRepository.findById(tenantId, invoiceId);
    if (!inv) throw new Error('Invoice not found.');

    if (inv.status !== InvoiceStatus.ISSUED) {
      throw new Error('Only ISSUED invoices can be voided.');
    }
    if (!reason || reason.trim() === '') {
      throw new Error('Void reason is mandatory when voiding an issued invoice.');
    }

    const now = new Date().toISOString();
    const updated = await invoiceRepository.update(tenantId, invoiceId, {
      status: InvoiceStatus.VOIDED,
      voidedAt: now,
      voidReason: reason,
    });

    await billingAuditRepository.record(
      tenantId,
      actor,
      'invoice_voided',
      'invoice',
      invoiceId,
      correlationId,
      { status: inv.status },
      { status: InvoiceStatus.VOIDED, voidReason: reason },
      reason
    );

    // Automatically transition matching receivable to VOIDED
    await ReceivableService.voidReceivable(tenantId, invoiceId, actor, correlationId);

    return updated!;
  }

  /**
   * Enforces immutability: once ISSUED, financial fields cannot be modified directly.
   */
  public static assertCanEditInvoice(invoice: Invoice): void {
    if (invoice.status === InvoiceStatus.ISSUED || invoice.status === InvoiceStatus.VOIDED) {
      throw new Error(`Cannot modify invoice in ${invoice.status} state. Issued and voided invoices are immutable.`);
    }
  }
}
