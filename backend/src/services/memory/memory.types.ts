/**
 * Memory Service Types
 * Types for entity-centric memory system with vector embeddings
 */

export interface MemoryItem {
  id: string;
  entityType: string;
  entityId: string;
  content: string;
  summary?: string;
  embedding?: number[];
  memoryType: MemoryType;
  tags: string[];
  importance: number;
  accessCount: number;
  lastAccessedAt?: Date;
  metadata: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export type MemoryType = 
  | 'fact' 
  | 'preference' 
  | 'conversation' 
  | 'instruction' 
  | 'capability' 
  | 'relationship';

export interface MemorySearchQuery {
  entityType?: string;
  entityId?: string;
  query?: string;
  tags?: string[];
  memoryType?: MemoryType;
  minImportance?: number;
  limit?: number;
  offset?: number;
}

export interface MemorySearchResult {
  memory: MemoryItem;
  relevance: number;
  similarity?: number;
}

export interface MemoryStoreRequest {
  entityType: string;
  entityId: string;
  content: string;
  memoryType?: MemoryType;
  tags?: string[];
  importance?: number;
  metadata?: Record<string, any>;
  generateEmbedding?: boolean;
  generateSummary?: boolean;
}

export interface MemoryUpdateRequest {
  content?: string;
  summary?: string;
  tags?: string[];
  importance?: number;
  metadata?: Record<string, any>;
  generateEmbedding?: boolean;
  generateSummary?: boolean;
}

export interface MemoryAssociation {
  memoryId: string;
  associatedMemoryId: string;
  associationType: AssociationType;
  strength: number;
}

export type AssociationType = 
  | 'related' 
  | 'contradicts' 
  | 'supports' 
  | 'context' 
  | 'prerequisite';

export interface EmbeddingModel {
  name: string;
  dimensions: number;
  provider: 'openai' | 'local' | 'huggingface';
}

export interface MemoryContext {
  memories: MemorySearchResult[];
  summary?: string;
  tokenCount: number;
  relevanceThreshold: number;
}

export interface MemoryConfig {
  embeddingModel: EmbeddingModel;
  maxMemoriesPerEntity: number;
  defaultImportance: number;
  relevanceThreshold: number;
  summarizationEnabled: boolean;
  autoPruningEnabled: boolean;
}

export interface MemoryStats {
  totalMemories: number;
  memoriesByEntityType: Record<string, number>;
  memoriesByType: Record<MemoryType, number>;
  averageImportance: number;
  mostAccessedMemories: MemoryItem[];
  recentMemories: MemoryItem[];
}