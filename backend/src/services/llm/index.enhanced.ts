/**
 * Enhanced LLM Module Index
 * Exports enhanced LLM service with tool, memory, and prompt integration
 */

export * from './llm.types';
export { EnhancedLLMService } from './llm.service.enhanced';

// Singleton instance
import { EnhancedLLMService } from './llm.service.enhanced';
export const enhancedLLMService = new EnhancedLLMService();