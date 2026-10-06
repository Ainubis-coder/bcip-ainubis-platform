/**
 * BCIP Commercial Operations - Invoice Document Repository
 * Phase 3 — Prompt 003-003
 */

import { BaseBillingRepository } from './base.repository.ts';
import type { InvoiceDocument } from '../types.ts';

export class InvoiceDocumentRepository extends BaseBillingRepository<InvoiceDocument> {
  constructor() {
    super('invoice_documents');
  }

  public async findByInvoiceId(tenantId: string, invoiceId: string): Promise<InvoiceDocument[]> {
    const all = await this.findAll(tenantId);
    return all
      .filter((d) => d.invoiceId === invoiceId)
      .sort((a, b) => b.version - a.version);
  }

  public async findLatestByInvoiceId(tenantId: string, invoiceId: string): Promise<InvoiceDocument | null> {
    const docs = await this.findByInvoiceId(tenantId, invoiceId);
    return docs.length > 0 ? docs[0] : null;
  }
}

export const invoiceDocumentRepository = new InvoiceDocumentRepository();
