import type { LLMProvider as LexProvider, Message as LexMessage, CompletionOptions as LexOptions, CompletionResponse as LexResponse, CompletionUsage as LexUsage } from 'lexagentic';

export type LLMMessage = LexMessage;
export type LLMCompletionOptions = LexOptions;
export type LLMCompletionResponse = LexResponse;
export type { LexUsage as CompletionUsage };

export type LLMProvider = LexProvider;

export interface PersonaLLMContext {
  personaId: string;
  identity: string;
  constraints?: string;
  examples?: any[];
  modelId?: string;
  modelParams?: Record<string, any>;
}

export interface SessionLLMContext {
  sessionId: string;
  messages: LexMessage[];
  personaContext?: PersonaLLMContext;
  modelOverride?: string;
  contextTokens: number;
}

export interface LLMServiceResponse {
  content: string;
  modelUsed: string;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  finishReason: string;
  latencyMs: number;
  toolResults?: Array<{ tool: string; result: any }>;
}
