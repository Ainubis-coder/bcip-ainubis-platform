/**
 * BCIP Billing Customer Repository
 * Phase 3 — Prompt 003-001
 */

import { BaseBillingRepository } from './base.repository.ts';
import type { BillingCustomer } from '../types.ts';

export class BillingCustomerRepository extends BaseBillingRepository<BillingCustomer> {
  constructor() {
    super('billing_customers');
  }

  public generateCustomerId(prefix: string = 'cust'): string {
    return this.generateId(prefix);
  }

  public async findByCustomerNumber(tenantId: string, customerNumber: string): Promise<BillingCustomer | null> {
    const all = await this.findAll(tenantId);
    return all.find((c) => c.customerNumber === customerNumber) || null;
  }
}

export const billingCustomerRepository = new BillingCustomerRepository();
