/**
 * BCIP Billing Profile Repository
 * Phase 3 — Prompt 003-001
 */

import { BaseBillingRepository } from './base.repository.ts';
import type { BillingProfile } from '../types.ts';

export class BillingProfileRepository extends BaseBillingRepository<BillingProfile> {
  constructor() {
    super('billing_profiles');
  }

  public generateProfileId(prefix: string = 'bprof'): string {
    return this.generateId(prefix);
  }

  public async findByCustomerId(tenantId: string, billingCustomerId: string): Promise<BillingProfile | null> {
    const all = await this.findAll(tenantId);
    return all.find((p) => p.billingCustomerId === billingCustomerId) || null;
  }
}

export const billingProfileRepository = new BillingProfileRepository();
