export const SUPPORTED_AI_MODELS = [
  'gemini-2.5-flash',
  'gemini-2.5-pro',
  'claude-3-7-sonnet',
  'gpt-4o',
] as const;

export type SupportedAIModel = (typeof SUPPORTED_AI_MODELS)[number];

export interface ModelGenerationRequest {
  prompt: string;
  systemInstruction?: string;
  temperature?: number;
  maxTokens?: number;
  tools?: unknown[];
  tenantId: string;
  correlationId: string;
}

export interface ModelGenerationResponse {
  content: string;
  finishReason?: string;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  durationMs: number;
  provider: string;
  model: string;
}

export interface IModelProvider {
  name: string;
  generateText(request: ModelGenerationRequest): Promise<ModelGenerationResponse>;
  embedText?(text: string): Promise<number[]>;
}
