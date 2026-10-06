/**
 * BCIP Commercial Operations - Payment Repository
 * Phase 3 — Prompt 003-005
 */

import { BaseBillingRepository } from './base.repository.ts';
import { PaymentRecord } from '../types.ts';

export class PaymentRepository extends BaseBillingRepository<PaymentRecord> {
  constructor() {
    super('billing_payments');
  }

  public async findByCustomerId(tenantId: string, customerId: string): Promise<PaymentRecord[]> {
    const all = await this.findAll(tenantId);
    return all.filter((p) => p.customerId === customerId);
  }
}

export const paymentRepository = new PaymentRepository();
