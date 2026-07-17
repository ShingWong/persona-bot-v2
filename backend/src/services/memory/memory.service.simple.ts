/**
 * Simple Memory Service
 * Mock implementation for Phase 3 development
 */

import {
  MemoryItem,
  MemoryType,
  MemorySearchQuery,
  MemorySearchResult,
  MemoryStoreRequest,
  MemoryUpdateRequest,
  MemoryContext,
  MemoryConfig,
  MemoryStats,
} from './memory.types';

export class SimpleMemoryService {
  private config: MemoryConfig;
  private memories: Map<string, MemoryItem> = new Map();
  private entityMemories: Map<string, string[]> = new Map(); // entityId -> memoryIds

  constructor(config?: Partial<MemoryConfig>) {
    this.config = {
      embeddingModel: {
        name: 'text-embedding-3-small',
        dimensions: 1536,
        provider: 'openai',
      },
      maxMemoriesPerEntity: 100,
      defaultImportance: 0.5,
      relevanceThreshold: 0.7,
      summarizationEnabled: true,
      autoPruningEnabled: true,
      ...config,
    };
  }

  /**
   * Store a memory
   */
  async storeMemory(request: MemoryStoreRequest): Promise<MemoryItem> {
    const {
      entityType,
      entityId,
      content,
      memoryType = 'fact',
      tags = [],
      importance = this.config.defaultImportance,
      metadata = {},
    } = request;

    const memoryId = `mem_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const memory: MemoryItem = {
      id: memoryId,
      entityType,
      entityId,
      content,
      summary: this.generateSummary(content),
      memoryType,
      tags,
      importance,
      accessCount: 0,
      metadata,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.memories.set(memoryId, memory);
    
    // Track by entity
    const entityKey = `${entityType}:${entityId}`;
    if (!this.entityMemories.has(entityKey)) {
      this.entityMemories.set(entityKey, []);
    }
    this.entityMemories.get(entityKey)!.push(memoryId);

    // Auto-prune if needed
    if (this.config.autoPruningEnabled) {
      await this.autoPruneMemories(entityType, entityId);
    }

    return memory;
  }

  /**
   * Search memories
   */
  async searchMemories(query: MemorySearchQuery): Promise<MemorySearchResult[]> {
    const {
      entityType,
      entityId,
      query: searchQuery,
      tags = [],
      memoryType,
      minImportance = 0,
      limit = 10,
      offset = 0,
    } = query;

    // Get relevant memories
    let memories: MemoryItem[] = [];
    
    if (entityType && entityId) {
      const entityKey = `${entityType}:${entityId}`;
      const memoryIds = this.entityMemories.get(entityKey) || [];
      memories = memoryIds.map(id => this.memories.get(id)).filter(Boolean) as MemoryItem[];
    } else {
      memories = Array.from(this.memories.values());
    }

    // Apply filters
    let filteredMemories = memories.filter(memory => {
      if (memoryType && memory.memoryType !== memoryType) return false;
      if (minImportance > 0 && memory.importance < minImportance) return false;
      if (tags.length > 0 && !tags.some(tag => memory.tags.includes(tag))) return false;
      return true;
    });

    // Sort by importance and recency
    filteredMemories.sort((a, b) => {
      if (b.importance !== a.importance) return b.importance - a.importance;
      return b.createdAt.getTime() - a.createdAt.getTime();
    });

    // Apply offset and limit
    filteredMemories = filteredMemories.slice(offset, offset + limit);

    // If no search query, return with importance as relevance
    if (!searchQuery || searchQuery.trim() === '') {
      return filteredMemories.map(memory => ({
        memory,
        relevance: memory.importance,
      }));
    }

    // Simple keyword search
    return this.keywordSearch(searchQuery, filteredMemories);
  }

  /**
   * Get memory by ID
   */
  async getMemory(id: string): Promise<MemoryItem | null> {
    const memory = this.memories.get(id);
    if (!memory) return null;

    // Update access count
    memory.accessCount++;
    memory.lastAccessedAt = new Date();
    this.memories.set(id, memory);

    return memory;
  }

  /**
   * Update memory
   */
  async updateMemory(
    id: string,
    request: MemoryUpdateRequest
  ): Promise<MemoryItem> {
    const memory = this.memories.get(id);
    if (!memory) {
      throw new Error(`Memory ${id} not found`);
    }

    const {
      content,
      summary,
      tags,
      importance,
      metadata,
    } = request;

    if (content !== undefined) {
      memory.content = content;
      if (this.config.summarizationEnabled) {
        memory.summary = this.generateSummary(content);
      }
    }
    if (summary !== undefined) memory.summary = summary;
    if (tags !== undefined) memory.tags = tags;
    if (importance !== undefined) memory.importance = importance;
    if (metadata !== undefined) memory.metadata = metadata;
    
    memory.updatedAt = new Date();
    this.memories.set(id, memory);

    return memory;
  }

  /**
   * Delete memory
   */
  async deleteMemory(id: string): Promise<void> {
    const memory = this.memories.get(id);
    if (memory) {
      const entityKey = `${memory.entityType}:${memory.entityId}`;
      const memoryIds = this.entityMemories.get(entityKey) || [];
      const updatedIds = memoryIds.filter(mid => mid !== id);
      this.entityMemories.set(entityKey, updatedIds);
    }
    this.memories.delete(id);
  }

  /**
   * Get memory context for LLM prompt
   */
  async getMemoryContext(
    entityType: string,
    entityId: string,
    query?: string,
    maxTokens: number = 1000
  ): Promise<MemoryContext> {
    const searchQuery: MemorySearchQuery = {
      entityType,
      entityId,
      query,
      limit: 20,
    };

    const searchResults = await this.searchMemories(searchQuery);
    
    // Filter by relevance threshold
    const relevantMemories = searchResults.filter(
      result => result.relevance >= this.config.relevanceThreshold
    );

    // Build context within token limit
    const context = this.buildContextWithinTokenLimit(relevantMemories, maxTokens);

    return context;
  }

  /**
   * Get memory statistics
   */
  async getMemoryStats(entityType?: string, entityId?: string): Promise<MemoryStats> {
    let memories = Array.from(this.memories.values());
    
    if (entityType && entityId) {
      const entityKey = `${entityType}:${entityId}`;
      const memoryIds = this.entityMemories.get(entityKey) || [];
      memories = memoryIds.map(id => this.memories.get(id)).filter(Boolean) as MemoryItem[];
    }

    // Group by entity type
    const memoriesByEntityType: Record<string, number> = {};
    Array.from(this.entityMemories.entries()).forEach(([key, ids]) => {
      memoriesByEntityType[key] = ids.length;
    });

    // Group by memory type
    const memoriesByType: Record<MemoryType, number> = {
      fact: 0,
      preference: 0,
      conversation: 0,
      instruction: 0,
      capability: 0,
      relationship: 0,
    };
    
    memories.forEach(memory => {
      memoriesByType[memory.memoryType] = (memoriesByType[memory.memoryType] || 0) + 1;
    });

    // Calculate average importance
    const totalImportance = memories.reduce((sum, memory) => sum + memory.importance, 0);
    const averageImportance = memories.length > 0 ? totalImportance / memories.length : 0;

    // Get most accessed memories
    const mostAccessedMemories = [...memories]
      .sort((a, b) => b.accessCount - a.accessCount)
      .slice(0, 10);

    // Get recent memories
    const recentMemories = [...memories]
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, 10);

    return {
      totalMemories: memories.length,
      memoriesByEntityType,
      memoriesByType,
      averageImportance,
      mostAccessedMemories,
      recentMemories,
    };
  }

  /**
   * Prune old/unimportant memories
   */
  async pruneMemories(
    entityType: string,
    entityId: string,
    keepCount: number = this.config.maxMemoriesPerEntity
  ): Promise<number> {
    const entityKey = `${entityType}:${entityId}`;
    const memoryIds = this.entityMemories.get(entityKey) || [];
    
    if (memoryIds.length <= keepCount) {
      return 0;
    }

    // Get memories and sort by importance and recency
    const memories = memoryIds
      .map(id => this.memories.get(id))
      .filter(Boolean) as MemoryItem[];
    
    memories.sort((a, b) => {
      if (b.importance !== a.importance) return b.importance - a.importance;
      if (b.lastAccessedAt && a.lastAccessedAt) {
        return b.lastAccessedAt.getTime() - a.lastAccessedAt.getTime();
      }
      return b.createdAt.getTime() - a.createdAt.getTime();
    });

    // Determine which memories to delete
    const memoriesToKeep = memories.slice(0, keepCount);
    const memoriesToDelete = memories.slice(keepCount);
    
    // Update entity memory list
    const keptIds = memoriesToKeep.map(m => m.id);
    this.entityMemories.set(entityKey, keptIds);
    
    // Delete memories
    memoriesToDelete.forEach(memory => {
      this.memories.delete(memory.id);
    });

    return memoriesToDelete.length;
  }

  /**
   * Auto-prune memories based on configuration
   */
  private async autoPruneMemories(entityType: string, entityId: string): Promise<void> {
    const entityKey = `${entityType}:${entityId}`;
    const memoryIds = this.entityMemories.get(entityKey) || [];
    
    if (memoryIds.length >= this.config.maxMemoriesPerEntity) {
      await this.pruneMemories(entityType, entityId, this.config.maxMemoriesPerEntity);
    }
  }

  /**
   * Simple keyword search
   */
  private keywordSearch(query: string, memories: MemoryItem[]): MemorySearchResult[] {
    const queryWords = query.toLowerCase().split(/\s+/).filter(w => w.length > 2);
    
    return memories.map(memory => {
      const content = memory.content.toLowerCase();
      const summary = memory.summary?.toLowerCase() || '';
      
      let score = 0;
      for (const word of queryWords) {
        if (content.includes(word)) score += 2;
        if (summary.includes(word)) score += 1;
      }
      
      // Normalize score
      const relevance = Math.min(score / (queryWords.length * 2), 1);
      
      // Combine with importance
      const finalRelevance = (relevance + memory.importance) / 2;
      
      return {
        memory,
        relevance: finalRelevance,
      };
    }).sort((a, b) => b.relevance - a.relevance);
  }

  /**
   * Generate summary for content
   */
  private generateSummary(content: string): string {
    if (content.length <= 200) {
      return content;
    }
    
    // Try to find a sentence boundary
    const truncated = content.substring(0, 200);
    const lastPeriod = truncated.lastIndexOf('.');
    const lastQuestion = truncated.lastIndexOf('?');
    const lastExclamation = truncated.lastIndexOf('!');
    
    const lastBoundary = Math.max(lastPeriod, lastQuestion, lastExclamation);
    if (lastBoundary > 100) {
      return truncated.substring(0, lastBoundary + 1);
    }
    
    return truncated + '...';
  }

  /**
   * Build context within token limit
   */
  private buildContextWithinTokenLimit(
    memories: MemorySearchResult[],
    maxTokens: number
  ): MemoryContext {
    let currentTokens = 0;
    const includedMemories: MemorySearchResult[] = [];
    
    // Estimate tokens (roughly 4 chars per token)
    for (const result of memories) {
      const memory = result.memory;
      const content = memory.summary || memory.content;
      const tokenEstimate = Math.ceil(content.length / 4);
      
      if (currentTokens + tokenEstimate <= maxTokens) {
        includedMemories.push(result);
        currentTokens += tokenEstimate;
      } else {
        break;
      }
    }
    
    // Generate overall summary if we have multiple memories
    let summary: string | undefined;
    if (includedMemories.length > 1) {
      summary = `Relevant memories (${includedMemories.length} items): ` +
        includedMemories.map((r, i) => `[${i + 1}] ${r.memory.summary || r.memory.content.substring(0, 50)}...`).join(' ');
    }
    
    return {
      memories: includedMemories,
      summary,
      tokenCount: currentTokens,
      relevanceThreshold: this.config.relevanceThreshold,
    };
  }

  /**
   * Clear all memories (for testing)
   */
  clear(): void {
    this.memories.clear();
    this.entityMemories.clear();
  }
}