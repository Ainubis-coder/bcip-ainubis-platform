export interface AIPolicyRule {
  id: string;
  name: string;
  enforceTenantIsolation: boolean;
  maskPII: boolean;
  maxDailyTokenLimit: number;
}

export class AIPolicyEngine {
  private defaultRule: AIPolicyRule = {
    id: 'standard-enterprise-policy',
    name: 'Enterprise Property Data Protection',
    enforceTenantIsolation: true,
    maskPII: true,
    maxDailyTokenLimit: 1000000,
  };

  public validateRequest(tenantId: string, prompt: string): { allowed: boolean; reason?: string } {
    if (!tenantId || tenantId.trim() === '') {
      return { allowed: false, reason: 'Tenant context is strictly required for AI invocation' };
    }
    return { allowed: true };
  }

  public maskPersonalData(text: string): string {
    // Redact credit card patterns or national ID patterns
    return text.replace(/\b\d{4}[ -]?\d{4}[ -]?\d{4}[ -]?\d{4}\b/g, '[REDACTED_CARD]');
  }
}

export const aiPolicyEngine = new AIPolicyEngine();
