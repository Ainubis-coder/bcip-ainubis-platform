/**
 * BCIP Billing Audit Repository
 * Phase 3 — Prompt 003-001
 */

import { BaseBillingRepository } from './base.repository.ts';
import type { BillingAuditLog } from '../types.ts';

export class BillingAuditRepository extends BaseBillingRepository<BillingAuditLog> {
  constructor() {
    super('billing_audit_log');
  }

  public generateAuditId(prefix: string = 'baudit'): string {
    return this.generateId(prefix);
  }

  public async record(
    tenantId: string,
    actor: string,
    action: string,
    entity: string,
    entityId: string,
    correlationId: string,
    previousState?: any,
    newState?: any,
    reason?: string
  ): Promise<BillingAuditLog> {
    const logId = this.generateAuditId();
    return this.create({
      id: logId,
      tenantId,
      actor,
      action,
      entity,
      entityId,
      correlationId,
      previousState,
      newState,
      reason,
    });
  }
}

export const billingAuditRepository = new BillingAuditRepository();
