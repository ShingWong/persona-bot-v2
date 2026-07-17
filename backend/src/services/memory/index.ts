/**
 * Memory Module Index
 * Exports all memory-related services and types
 */

export * from './memory.types';
export * from './embedding.service';
export * from './memory.service.simple';

// Singleton instance
import { SimpleMemoryService } from './memory.service.simple';
export const memoryService = new SimpleMemoryService();