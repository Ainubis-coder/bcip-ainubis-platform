/**
 * BCIP Commercial Operations - Invoice Delivery Attempt Repository
 * Phase 3 — Prompt 003-004
 */

import { BaseBillingRepository } from './base.repository.ts';
import { InvoiceDeliveryAttempt } from '../types.ts';

export class InvoiceDeliveryAttemptRepository extends BaseBillingRepository<InvoiceDeliveryAttempt> {
  constructor() {
    super('invoice_delivery_attempts');
  }

  public async findByDeliveryId(tenantId: string, deliveryId: string): Promise<InvoiceDeliveryAttempt[]> {
    const all = await this.findAll(tenantId);
    return all
      .filter((a) => a.deliveryId === deliveryId)
      .sort((a, b) => a.attemptNumber - b.attemptNumber);
  }
}

export const invoiceDeliveryAttemptRepository = new InvoiceDeliveryAttemptRepository();
