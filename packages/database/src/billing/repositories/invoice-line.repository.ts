/**
 * BCIP Invoice Line Repository
 * Phase 3 — Prompt 003-001
 */

import { BaseBillingRepository } from './base.repository.ts';
import type { InvoiceLine } from '../types.ts';

export class InvoiceLineRepository extends BaseBillingRepository<InvoiceLine> {
  constructor() {
    super('billing_invoice_lines');
  }

  public generateLineId(prefix: string = 'iline'): string {
    return this.generateId(prefix);
  }

  public async findByInvoiceId(tenantId: string, invoiceId: string): Promise<InvoiceLine[]> {
    const all = await this.findAll(tenantId);
    return all.filter((l) => l.invoiceId === invoiceId).sort((a, b) => a.sortOrder - b.sortOrder);
  }
}

export const invoiceLineRepository = new InvoiceLineRepository();
