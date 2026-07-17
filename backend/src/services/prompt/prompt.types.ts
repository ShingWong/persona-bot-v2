/**
 * Prompt Engineering Types
 * Types for dynamic prompt assembly and context management
 */

export interface PromptComponent {
  type: 'system' | 'identity' | 'constraints' | 'examples' | 'memory' | 'context' | 'tools' | 'instructions';
  content: string;
  priority: number; // 1-10, higher = more important
  tokenEstimate: number;
  required: boolean;
}

export interface PromptAssemblyConfig {
  maxTokens: number;
  includeMemory: boolean;
  includeTools: boolean;
  includeExamples: boolean;
  memoryRelevanceThreshold: number;
  toolLimit: number;
  exampleLimit: number;
  contextWindowSize: number;
}

export interface AssembledPrompt {
  messages: Array<{
    role: 'system' | 'user' | 'assistant';
    content: string;
  }>;
  tokenCount: number;
  componentsUsed: string[];
  contextSummary?: string;
}

export interface ContextWindow {
  messages: Array<{
    role: 'system' | 'user' | 'assistant';
    content: string;
    tokens: number;
  }>;
  totalTokens: number;
  maxTokens: number;
}

export interface ProgressiveDisclosureTier {
  tier: 1 | 2 | 3;
  name: string;
  description: string;
  maxTokens: number;
  includeComponents: PromptComponent['type'][];
}

export interface FewShotExample {
  user: string;
  assistant: string;
  tags?: string[];
  relevance?: number;
}

export interface ExampleSelector {
  query: string;
  examples: FewShotExample[];
  maxExamples: number;
  strategy: 'relevance' | 'diversity' | 'recency';
}

export interface TokenOptimizationResult {
  originalTokens: number;
  optimizedTokens: number;
  reductionPercent: number;
  techniquesUsed: string[];
}

export interface PromptOptimizationConfig {
  summarizeLongMessages: boolean;
  truncateStrategy: 'end' | 'middle' | 'smart';
  removeRedundantExamples: boolean;
  compressSystemPrompt: boolean;
  maxMessageLength: number;
}