export * from './llm.types';
export * from './llm.service';
export * from './llm.factory';
export * from './providers/gemini.service';
export * from './providers/openrouter.service';
export * from './providers/ollama.service';

import { LLMService } from './llm.service';
import { llmProviderFactory } from './llm.factory';

export const llmService = new LLMService();

llmProviderFactory.initializeFromEnv();
const defaultProvider = llmProviderFactory.getDefaultProvider();
const defaultProviderType = llmProviderFactory.getDefaultProviderType();

if (defaultProvider && defaultProviderType) {
  llmService.initialize(defaultProvider, defaultProviderType);
  console.log(`LLM service initialized with ${defaultProviderType} provider`);
} else {
  console.warn('No LLM providers initialized. LLM functionality will be disabled.');
}

export default llmService;
