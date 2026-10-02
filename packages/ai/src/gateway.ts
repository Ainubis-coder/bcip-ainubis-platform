import type { IModelProvider, ModelGenerationRequest, ModelGenerationResponse } from './provider.ts';
import { aiPolicyEngine } from './policies.ts';
import { aiAuditLogger } from './audit.ts';

export class AIGateway {
  private providers: Map<string, IModelProvider> = new Map();
  private defaultProvider: string = 'gemini';

  public registerProvider(provider: IModelProvider): void {
    this.providers.set(provider.name, provider);
  }

  public async executePrompt(
    request: ModelGenerationRequest,
    providerName?: string
  ): Promise<ModelGenerationResponse> {
    const target = providerName || this.defaultProvider;
    const provider = this.providers.get(target);

    // Validate security and policy
    const policyCheck = aiPolicyEngine.validateRequest(request.tenantId, request.prompt);
    if (!policyCheck.allowed) {
      aiAuditLogger.logInvocation({
        id: `audit_${Date.now()}`,
        timestamp: new Date().toISOString(),
        tenantId: request.tenantId,
        correlationId: request.correlationId,
        model: target,
        promptTokens: 0,
        completionTokens: 0,
        durationMs: 0,
        status: 'blocked_by_policy',
        policyViolations: [policyCheck.reason || 'Policy constraint violation'],
      });
      throw new Error(`AI Policy Rejection: ${policyCheck.reason}`);
    }

    if (!provider) {
      // Return architectural abstraction mock response for bootstrap phase
      return {
        content: `[Ainubis Gateway Stub] Analysis ready for tenant ${request.tenantId}. Provider ${target} initialized.`,
        durationMs: 12,
        usage: { promptTokens: 42, completionTokens: 18, totalTokens: 60 },
        provider: target,
        model: 'gemini-2.5-flash',
      };
    }

    return provider.generateText(request);
  }
}

export const aiGateway = new AIGateway();
