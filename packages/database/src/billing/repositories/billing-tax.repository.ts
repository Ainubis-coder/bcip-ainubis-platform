/**
 * BCIP Billing Tax Configuration Repository
 * Phase 3 — Prompt 003-001
 */

import { BaseBillingRepository } from './base.repository.ts';
import type { BillingTaxConfiguration } from '../types.ts';

export class BillingTaxRepository extends BaseBillingRepository<BillingTaxConfiguration> {
  constructor() {
    super('billing_tax_configurations');
  }

  public generateTaxId(prefix: string = 'tax'): string {
    return this.generateId(prefix);
  }

  public async findByCode(tenantId: string, taxCode: string): Promise<BillingTaxConfiguration | null> {
    const all = await this.findAll(tenantId);
    return all.find((t) => t.taxCode === taxCode) || null;
  }
}

export const billingTaxRepository = new BillingTaxRepository();
