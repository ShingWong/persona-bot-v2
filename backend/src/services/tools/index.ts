/**
 * Tools Module Index
 * Exports all tool-related services and types
 */

export * from './tool.types';
export * from './tool.validator';
export * from './tool.registry';
export * from './tool.executor';
export * from './tool.service';
export * from './builtin.tools';

// Singleton instance
import { ToolService } from './tool.service';
export const toolService = new ToolService();