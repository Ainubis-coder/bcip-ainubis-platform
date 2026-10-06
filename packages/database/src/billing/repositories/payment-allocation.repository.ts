/**
 * BCIP Commercial Operations - Payment Allocation Repository
 * Phase 3 — Prompt 003-005
 */

import { BaseBillingRepository } from './base.repository.ts';
import { PaymentAllocation } from '../types.ts';

export class PaymentAllocationRepository extends BaseBillingRepository<PaymentAllocation> {
  constructor() {
    super('billing_payment_allocations');
  }

  public async findByPaymentId(tenantId: string, paymentId: string): Promise<PaymentAllocation[]> {
    const all = await this.findAll(tenantId);
    return all.filter((a) => a.paymentId === paymentId);
  }

  public async findByReceivableId(tenantId: string, receivableId: string): Promise<PaymentAllocation[]> {
    const all = await this.findAll(tenantId);
    return all.filter((a) => a.receivableId === receivableId);
  }
}

export const paymentAllocationRepository = new PaymentAllocationRepository();
