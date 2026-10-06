/**
 * BCIP Commercial Operations - Receivable Repository
 * Phase 3 — Prompt 003-005
 */

import { BaseBillingRepository } from './base.repository.ts';
import type { Receivable } from '../types.ts';

export class ReceivableRepository extends BaseBillingRepository<Receivable> {
  constructor() {
    super('billing_receivables');
  }

  public async findByInvoiceId(tenantId: string, invoiceId: string): Promise<Receivable | null> {
    const all = await this.findAll(tenantId);
    return all.find((r) => r.invoiceId === invoiceId) || null;
  }

  public async findByCustomerId(tenantId: string, customerId: string): Promise<Receivable[]> {
    const all = await this.findAll(tenantId);
    return all.filter((r) => r.customerId === customerId);
  }
}

export const receivableRepository = new ReceivableRepository();
