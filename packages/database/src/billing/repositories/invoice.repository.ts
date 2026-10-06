/**
 * BCIP Invoice Repository
 * Phase 3 — Prompt 003-001
 */

import { BaseBillingRepository } from './base.repository.ts';
import type { Invoice } from '../types.ts';

export class InvoiceRepository extends BaseBillingRepository<Invoice> {
  constructor() {
    super('billing_invoices');
  }

  public generateInvoiceId(prefix: string = 'inv'): string {
    return this.generateId(prefix);
  }

  public async findByInvoiceNumber(tenantId: string, invoiceNumber: string): Promise<Invoice | null> {
    const all = await this.findAll(tenantId, { includeDeleted: true });
    return all.find((i) => i.invoiceNumber === invoiceNumber) || null;
  }
}

export const invoiceRepository = new InvoiceRepository();
