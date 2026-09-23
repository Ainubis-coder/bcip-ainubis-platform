export interface AIAuditRecord {
  id: string;
  timestamp: string;
  tenantId: string;
  correlationId: string;
  model: string;
  promptTokens: number;
  completionTokens: number;
  durationMs: number;
  status: 'success' | 'failure' | 'blocked_by_policy';
  policyViolations?: string[];
}

export class AIAuditLogger {
  private inMemoryLogs: AIAuditRecord[] = [];

  public logInvocation(record: AIAuditRecord): void {
    this.inMemoryLogs.push(record);
    // In production, this pushes to cold storage or security analytics sink
  }

  public getRecentLogs(tenantId?: string): AIAuditRecord[] {
    if (!tenantId) return [...this.inMemoryLogs];
    return this.inMemoryLogs.filter((r) => r.tenantId === tenantId);
  }
}

export const aiAuditLogger = new AIAuditLogger();
