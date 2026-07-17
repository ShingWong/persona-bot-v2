/**
 * Prompt Module Index
 * Exports all prompt engineering services and types
 */

export * from './prompt.types';
export * from './prompt.assembler';
export * from './context.manager';
export * from './prompt.service';

// Singleton instance
import { PromptService } from './prompt.service';
export const promptService = new PromptService();