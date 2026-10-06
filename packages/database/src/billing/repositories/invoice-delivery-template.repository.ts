/**
 * BCIP Commercial Operations - Invoice Delivery Template Repository
 * Phase 3 — Prompt 003-004
 */

import { BaseBillingRepository } from './base.repository.ts';
import type { InvoiceDeliveryTemplate } from '../types.ts';

export class InvoiceDeliveryTemplateRepository extends BaseBillingRepository<InvoiceDeliveryTemplate> {
  constructor() {
    super('invoice_delivery_templates');
  }

  public async findAllForTenant(tenantId: string): Promise<InvoiceDeliveryTemplate[]> {
    // Both system templates (tenantId === null) and tenant-specific active templates
    let results: InvoiceDeliveryTemplate[] = [];
    for (const item of this.items.values()) {
      if (item.deletedAt) continue;
      if (item.tenantId === null || item.tenantId === tenantId) {
        results.push(JSON.parse(JSON.stringify(item)));
      }
    }
    return results;
  }

  public async findByTemplateId(tenantId: string, templateId: string): Promise<InvoiceDeliveryTemplate | null> {
    const item = this.items.get(templateId);
    if (!item || item.deletedAt) return null;
    if (item.tenantId !== null && item.tenantId !== tenantId) {
      return null;
    }
    return JSON.parse(JSON.stringify(item));
  }
}

export const invoiceDeliveryTemplateRepository = new InvoiceDeliveryTemplateRepository();
