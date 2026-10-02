/**
 * BCIP CRM Audit Service
 * Centralized audit logging for CRM entities and lifecycle transitions.
 */

import type { CRMAuditRecord } from '../types.ts';

export class CRMAuditService {
  private auditLogs: CRMAuditRecord[] = [];

  public async record(
    tenantId: string,
    entityType: CRMAuditRecord['entityType'],
    entityId: string,
    action: string,
    actorUserId: string,
    beforeState?: Record<string, unknown>,
    afterState?: Record<string, unknown>,
    metadata?: Record<string, unknown>
  ): Promise<CRMAuditRecord> {
    const record: CRMAuditRecord = {
      id: `audit_crm_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
      tenantId,
      entityType,
      entityId,
      action,
      actorUserId,
      beforeState: beforeState ? JSON.parse(JSON.stringify(beforeState)) : undefined,
      afterState: afterState ? JSON.parse(JSON.stringify(afterState)) : undefined,
      metadata: metadata ? JSON.parse(JSON.stringify(metadata)) : undefined,
      timestamp: new Date().toISOString(),
    };

    this.auditLogs.push(record);
    return record;
  }

  public getAuditTrail(tenantId: string, entityType?: CRMAuditRecord['entityType'], entityId?: string): CRMAuditRecord[] {
    return this.auditLogs.filter((log) => {
      if (log.tenantId !== tenantId) return false;
      if (entityType && log.entityType !== entityType) return false;
      if (entityId && log.entityId !== entityId) return false;
      return true;
    });
  }

  public getAllLogs(tenantId?: string): CRMAuditRecord[] {
    if (!tenantId) return [...this.auditLogs];
    return this.auditLogs.filter((log) => log.tenantId === tenantId);
  }

  public clear(): void {
    this.auditLogs = [];
  }
}

export const crmAuditService = new CRMAuditService();
