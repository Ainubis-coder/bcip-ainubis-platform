/**
 * BCIP Commercial Operations - Invoice Delivery Service
 * Phase 3 — Prompt 003-004
 */

import { invoiceRepository } from '../repositories/invoice.repository.ts';
import { invoiceDocumentRepository } from '../repositories/invoice-document.repository.ts';
import { billingCustomerRepository } from '../repositories/billing-customer.repository.ts';
import { invoiceDeliveryRepository } from '../repositories/invoice-delivery.repository.ts';
import { invoiceDeliveryAttemptRepository } from '../repositories/invoice-delivery-attempt.repository.ts';
import { invoiceDeliveryTemplateRepository } from '../repositories/invoice-delivery-template.repository.ts';
import { billingAuditRepository } from '../repositories/billing-audit.repository.ts';
import { InvoiceDelivery, InvoiceDeliveryAttempt, InvoiceDeliveryStatus, InvoiceDeliveryTemplate } from '../types.ts';
import { InvoiceStatus } from '../enums.ts';

// Recipient destination validation regex
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export interface EmailDeliveryPayload {
  recipient: string;
  subject: string;
  body: string;
  attachmentRef?: string;
  correlationId: string;
}

export interface EmailDeliveryResult {
  status: 'SENT' | 'FAILED';
  providerReference?: string;
  failureCode?: string;
  failureMessage?: string;
}

/**
 * Absracted Mock Email Delivery Provider
 */
export class MockEmailDeliveryProvider {
  public static async sendEmail(payload: EmailDeliveryPayload): Promise<EmailDeliveryResult> {
    // Simulates provider latency
    await new Promise((resolve) => setTimeout(resolve, 50));

    if (payload.recipient.includes('tempfail')) {
      return {
        status: 'FAILED',
        failureCode: 'TEMPORARY_SMTP_TIMEOUT',
        failureMessage: 'Temporary SMTP connection timeout. Please retry.',
      };
    }

    if (payload.recipient.includes('permfail')) {
      return {
        status: 'FAILED',
        failureCode: 'PERMANENT_REJECTED_RECIPIENT',
        failureMessage: 'The email address is permanently blacklisted or invalid.',
      };
    }

    return {
      status: 'SENT',
      providerReference: `mock_ref_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    };
  }
}

export class InvoiceDeliveryService {
  /**
   * Safe string resolution for controlled template variables
   */
  public static resolveTemplate(template: string, variables: Record<string, string>): string {
    let result = template;
    for (const [key, val] of Object.entries(variables)) {
      result = result.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), val);
    }
    return result;
  }

  /**
   * Prepares and initiates delivery of an APPROVED or ISSUED invoice document.
   */
  public static async initiateDelivery(params: {
    tenantId: string;
    invoiceId: string;
    documentId: string;
    recipientEmail: string;
    templateId: string;
    actor: string;
    correlationId: string;
    idempotencyKey?: string;
  }): Promise<{ delivery: InvoiceDelivery; attempt: InvoiceDeliveryAttempt }> {
    const { tenantId, invoiceId, documentId, recipientEmail, templateId, actor, correlationId, idempotencyKey } = params;

    // 1. Validate recipient syntactic rules
    if (!recipientEmail || !EMAIL_REGEX.test(recipientEmail)) {
      throw new Error('Invalid email destination format.');
    }

    // 2. Resolve invoice & verify tenant isolation
    const invoice = await invoiceRepository.findById(tenantId, invoiceId);
    if (!invoice) {
      throw new Error('Invoice not found.');
    }

    // 3. State Check: Must be APPROVED or ISSUED to deliver
    if (invoice.status !== InvoiceStatus.APPROVED && invoice.status !== InvoiceStatus.ISSUED) {
      throw new Error(`Invoice must be APPROVED or ISSUED before delivery. Current status: ${invoice.status}`);
    }

    // 4. Resolve InvoiceDocument & verify ownership
    const doc = await invoiceDocumentRepository.findById(tenantId, documentId);
    if (!doc || doc.invoiceId !== invoiceId) {
      throw new Error('Invoice document not found or mismatch.');
    }

    // 5. Resolve Customer Communication preferences and verify
    const customer = await billingCustomerRepository.findById(tenantId, invoice.billingCustomerId);
    if (!customer) {
      throw new Error('Billing customer not found.');
    }

    // Verify preferences if set
    if (customer.metadata?.emailDeliveryDisabled === true) {
      throw new Error('Customer has disabled invoice delivery via email.');
    }

    // 6. Resolve Template & Tenant scope
    const template = await invoiceDeliveryTemplateRepository.findByTemplateId(tenantId, templateId);
    if (!template) {
      throw new Error('Delivery template not found.');
    }

    // 7. Check idempotency if provided
    if (idempotencyKey) {
      const existingDeliveries = await invoiceDeliveryRepository.findByInvoiceId(tenantId, invoiceId);
      const matched = existingDeliveries.find((d) => d.idempotencyKey === idempotencyKey);
      if (matched) {
        // Return matching delivery and its latest attempt
        const attempts = await invoiceDeliveryAttemptRepository.findByDeliveryId(tenantId, matched.id);
        return { delivery: matched, attempt: attempts[attempts.length - 1] };
      }
    }

    // 8. Resolve variables and render
    const variables = {
      customer_name: customer.legalName,
      invoice_number: invoice.invoiceNumber,
      invoice_date: new Date(invoice.issueDate).toLocaleDateString(),
      due_date: new Date(invoice.dueDate).toLocaleDateString(),
      invoice_total: invoice.grandTotal.toLocaleString(),
      currency: invoice.currency,
    };

    const resolvedSubject = this.resolveTemplate(template.subject, variables);
    const resolvedBody = this.resolveTemplate(template.body, variables);

    // 9. Persist InvoiceDelivery request record (Initially PENDING)
    const deliveryId = `del_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const delivery: InvoiceDelivery = {
      id: deliveryId,
      tenantId,
      invoiceId,
      invoiceDocumentId: documentId,
      customerId: invoice.billingCustomerId,
      deliveryChannel: 'EMAIL',
      destination: recipientEmail,
      templateId,
      status: 'PENDING',
      requestedBy: actor,
      requestedAt: new Date().toISOString(),
      correlationId,
      idempotencyKey,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await invoiceDeliveryRepository.create(delivery);

    // 10. Record audit entry
    await billingAuditRepository.record(
      tenantId,
      actor,
      'delivery_requested',
      'invoice_delivery',
      deliveryId,
      correlationId,
      undefined,
      delivery,
      `Requested email delivery of invoice ${invoice.invoiceNumber} to ${recipientEmail}`
    );

    // 11. Execute delivery flow
    return this.executeDelivery(tenantId, deliveryId, resolvedSubject, resolvedBody, doc.storageReference, actor, correlationId);
  }

  /**
   * Internal sending process mapping to provider attempt logic
   */
  private static async executeDelivery(
    tenantId: string,
    deliveryId: string,
    subject: string,
    body: string,
    attachmentRef: string,
    actor: string,
    correlationId: string
  ): Promise<{ delivery: InvoiceDelivery; attempt: InvoiceDeliveryAttempt }> {
    const delivery = await invoiceDeliveryRepository.findById(tenantId, deliveryId);
    if (!delivery) {
      throw new Error('Delivery record not found.');
    }

    // Update status to QUEUED and then SENDING
    await invoiceDeliveryRepository.update(tenantId, deliveryId, { status: 'SENDING' });

    // Load attempts to determine attempt number
    const attempts = await invoiceDeliveryAttemptRepository.findByDeliveryId(tenantId, deliveryId);
    const attemptNumber = attempts.length + 1;

    const attemptId = `att_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const attempt: InvoiceDeliveryAttempt = {
      id: attemptId,
      tenantId,
      deliveryId,
      attemptNumber,
      startedAt: new Date().toISOString(),
      status: 'SENDING',
      correlationId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await invoiceDeliveryAttemptRepository.create(attempt);

    // Invoke abstract Provider
    const result = await MockEmailDeliveryProvider.sendEmail({
      recipient: delivery.destination,
      subject,
      body,
      attachmentRef,
      correlationId,
    });

    const completedAt = new Date().toISOString();
    const finalStatus: InvoiceDeliveryStatus = result.status === 'SENT' ? 'SENT' : 'FAILED';

    // Update attempt record
    const updatedAttempt = await invoiceDeliveryAttemptRepository.update(tenantId, attemptId, {
      status: finalStatus,
      completedAt,
      providerReference: result.providerReference,
      failureCode: result.failureCode,
      failureMessage: result.failureMessage,
    });

    // Update delivery record
    const updatedDelivery = await invoiceDeliveryRepository.update(tenantId, deliveryId, {
      status: finalStatus,
      completedAt: finalStatus === 'SENT' ? completedAt : undefined,
    });

    // Audit outcome
    await billingAuditRepository.record(
      tenantId,
      actor,
      finalStatus === 'SENT' ? 'delivery_sent' : 'delivery_failed',
      'invoice_delivery',
      deliveryId,
      correlationId,
      delivery,
      updatedDelivery,
      finalStatus === 'SENT'
        ? `Successfully sent invoice email. Reference: ${result.providerReference}`
        : `Invoice email delivery failed. Code: ${result.failureCode}`
    );

    // Also update deliveryStatus on InvoiceDocument itself to reflect outcomes
    await invoiceDocumentRepository.update(tenantId, delivery.invoiceDocumentId, {
      deliveryStatus: finalStatus === 'SENT' ? 'SENT' : 'FAILED',
    });

    return { delivery: updatedDelivery!, attempt: updatedAttempt! };
  }

  /**
   * Safe manual retry of a failed delivery
   */
  public static async retryDelivery(
    tenantId: string,
    deliveryId: string,
    actor: string,
    correlationId: string
  ): Promise<{ delivery: InvoiceDelivery; attempt: InvoiceDeliveryAttempt }> {
    const delivery = await invoiceDeliveryRepository.findById(tenantId, deliveryId);
    if (!delivery) {
      throw new Error('Delivery record not found.');
    }

    if (delivery.status !== 'FAILED') {
      throw new Error('Only failed deliveries can be retried.');
    }

    const doc = await invoiceDocumentRepository.findById(tenantId, delivery.invoiceDocumentId);
    if (!doc) {
      throw new Error('Invoice document associated with delivery no longer exists.');
    }

    const customer = await billingCustomerRepository.findById(tenantId, delivery.customerId);
    const invoice = await invoiceRepository.findById(tenantId, delivery.invoiceId);
    const template = await invoiceDeliveryTemplateRepository.findByTemplateId(tenantId, delivery.templateId);

    if (!customer || !invoice || !template) {
      throw new Error('Required billing records for delivery are missing.');
    }

    const variables = {
      customer_name: customer.legalName,
      invoice_number: invoice.invoiceNumber,
      invoice_date: new Date(invoice.issueDate).toLocaleDateString(),
      due_date: new Date(invoice.dueDate).toLocaleDateString(),
      invoice_total: invoice.grandTotal.toLocaleString(),
      currency: invoice.currency,
    };

    const resolvedSubject = this.resolveTemplate(template.subject, variables);
    const resolvedBody = this.resolveTemplate(template.body, variables);

    // Audit retry request
    await billingAuditRepository.record(
      tenantId,
      actor,
      'delivery_retried',
      'invoice_delivery',
      deliveryId,
      correlationId,
      delivery,
      undefined,
      `Initiated manual retry of failed delivery request to ${delivery.destination}`
    );

    return this.executeDelivery(tenantId, deliveryId, resolvedSubject, resolvedBody, doc.storageReference, actor, correlationId);
  }
}
