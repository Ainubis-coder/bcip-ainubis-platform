/**
 * BCIP Commercial Operations - Invoice Delivery Repository
 * Phase 3 — Prompt 003-004
 */

import { BaseBillingRepository } from './base.repository.ts';
import { InvoiceDelivery } from '../types.ts';

export class InvoiceDeliveryRepository extends BaseBillingRepository<InvoiceDelivery> {
  constructor() {
    super('invoice_deliveries');
  }

  public async findByInvoiceId(tenantId: string, invoiceId: string): Promise<InvoiceDelivery[]> {
    const all = await this.findAll(tenantId);
    return all
      .filter((d) => d.invoiceId === invoiceId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }
}

export const invoiceDeliveryRepository = new InvoiceDeliveryRepository();
