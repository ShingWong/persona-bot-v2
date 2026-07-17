/**
 * Built-in Tools
 * Default tools available to all personas
 */

import { ToolContext } from './tool.types';
import { ToolRegistryService } from './tool.registry';

export class BuiltinTools {
  /**
   * Register all built-in tools
   */
  static registerAll(): void {
    const registry = ToolRegistryService.getInstance();

    // Web Search Tool
    registry.registerTool(
      {
        id: 'web_search',
        name: 'web_search',
        description: 'Search the web for current information',
        parameters: [
          {
            name: 'query',
            type: 'string',
            description: 'Search query',
            required: true,
          },
          {
            name: 'max_results',
            type: 'number',
            description: 'Maximum number of results to return (1-10)',
            required: false,
            default: 5,
          },
        ],
        returns: {
          type: 'array',
          description: 'Array of search results with title, snippet, and URL',
        },
        handler: 'webSearchHandler',
        category: 'information',
        isActive: true,
      },
      this.webSearchHandler
    );

    // Calculator Tool
    registry.registerTool(
      {
        id: 'calculator',
        name: 'calculator',
        description: 'Perform mathematical calculations',
        parameters: [
          {
            name: 'expression',
            type: 'string',
            description: 'Mathematical expression to evaluate',
            required: true,
          },
        ],
        returns: {
          type: 'object',
          description: 'Calculation result with value and expression',
        },
        handler: 'calculatorHandler',
        category: 'utility',
        isActive: true,
      },
      this.calculatorHandler
    );

    // Current Time Tool
    registry.registerTool(
      {
        id: 'current_time',
        name: 'current_time',
        description: 'Get current date and time',
        parameters: [
          {
            name: 'timezone',
            type: 'string',
            description: 'Timezone (e.g., "UTC", "America/New_York")',
            required: false,
            default: 'UTC',
          },
          {
            name: 'format',
            type: 'string',
            description: 'Output format (e.g., "iso", "human", "timestamp")',
            required: false,
            default: 'human',
            enum: ['iso', 'human', 'timestamp'],
          },
        ],
        returns: {
          type: 'object',
          description: 'Current time information',
        },
        handler: 'currentTimeHandler',
        category: 'utility',
        isActive: true,
      },
      this.currentTimeHandler
    );

    // Memory Store Tool
    registry.registerTool(
      {
        id: 'memory_store',
        name: 'memory_store',
        description: 'Store information in persona memory',
        parameters: [
          {
            name: 'key',
            type: 'string',
            description: 'Memory key/identifier',
            required: true,
          },
          {
            name: 'value',
            type: 'string',
            description: 'Information to store',
            required: true,
          },
          {
            name: 'tags',
            type: 'array',
            description: 'Tags for categorization',
            required: false,
            default: [],
            schema: {
              items: { type: 'string' },
            },
          },
        ],
        returns: {
          type: 'object',
          description: 'Storage confirmation with memory ID',
        },
        handler: 'memoryStoreHandler',
        category: 'memory',
        isActive: true,
      },
      this.memoryStoreHandler
    );

    // Memory Retrieve Tool
    registry.registerTool(
      {
        id: 'memory_retrieve',
        name: 'memory_retrieve',
        description: 'Retrieve information from persona memory',
        parameters: [
          {
            name: 'key',
            type: 'string',
            description: 'Memory key/identifier to retrieve',
            required: false,
          },
          {
            name: 'query',
            type: 'string',
            description: 'Semantic search query',
            required: false,
          },
          {
            name: 'limit',
            type: 'number',
            description: 'Maximum number of results (1-20)',
            required: false,
            default: 5,
          },
        ],
        returns: {
          type: 'array',
          description: 'Array of memory items matching the query',
        },
        handler: 'memoryRetrieveHandler',
        category: 'memory',
        isActive: true,
      },
      this.memoryRetrieveHandler
    );

    // Session Context Tool
    registry.registerTool(
      {
        id: 'session_context',
        name: 'session_context',
        description: 'Get context from current session',
        parameters: [
          {
            name: 'type',
            type: 'string',
            description: 'Type of context to retrieve',
            required: false,
            default: 'summary',
            enum: ['summary', 'recent', 'full'],
          },
          {
            name: 'limit',
            type: 'number',
            description: 'Number of messages to include (for recent type)',
            required: false,
            default: 10,
          },
        ],
        returns: {
          type: 'object',
          description: 'Session context information',
        },
        handler: 'sessionContextHandler',
        category: 'session',
        isActive: true,
      },
      this.sessionContextHandler
    );
  }

  /**
   * Web Search Handler (mock implementation)
   */
  private static async webSearchHandler(
    parameters: Record<string, any>,
    _context: ToolContext
  ): Promise<any> {
    const { query, max_results = 5 } = parameters;
    
    // Mock implementation - in production, integrate with actual search API
    return [
      {
        title: `Search results for: ${query}`,
        snippet: `This is a mock search result for "${query}". In production, this would connect to a real search API.`,
        url: 'https://example.com/search',
        source: 'mock',
      },
      ...Array.from({ length: max_results - 1 }, (_, i) => ({
        title: `Result ${i + 2} for: ${query}`,
        snippet: `Additional mock result for "${query}".`,
        url: `https://example.com/result/${i + 2}`,
        source: 'mock',
      })),
    ];
  }

  /**
   * Calculator Handler
   */
  private static async calculatorHandler(
    parameters: Record<string, any>,
    _context: ToolContext
  ): Promise<any> {
    const { expression } = parameters;
    
    try {
      // Safe evaluation - only basic math operations
      const safeExpression = expression
        .replace(/[^0-9+\-*/().\s]/g, '') // Remove unsafe characters
        .trim();
      
      // Use Function constructor in a safe way
      const result = new Function(`return ${safeExpression}`)();
      
      if (typeof result !== 'number' || isNaN(result)) {
        throw new Error('Invalid calculation result');
      }
      
      return {
        expression,
        result,
        formatted: `= ${result}`,
      };
    } catch (error) {
      throw new Error(`Failed to calculate expression: ${error}`);
    }
  }

  /**
   * Current Time Handler
   */
  private static async currentTimeHandler(
    parameters: Record<string, any>,
    _context: ToolContext
  ): Promise<any> {
    const { timezone = 'UTC', format = 'human' } = parameters;
    
    const now = new Date();
    
    let formattedTime: string;
    switch (format) {
      case 'iso':
        formattedTime = now.toISOString();
        break;
      case 'timestamp':
        formattedTime = now.getTime().toString();
        break;
      case 'human':
      default:
        formattedTime = now.toLocaleString('en-US', {
          timeZone: timezone,
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          timeZoneName: 'short',
        });
        break;
    }
    
    return {
      timestamp: now.getTime(),
      iso: now.toISOString(),
      formatted: formattedTime,
      timezone,
      format,
    };
  }

  /**
   * Memory Store Handler (connects to MemoryService)
   */
  private static async memoryStoreHandler(
    parameters: Record<string, any>,
    _context: ToolContext
  ): Promise<any> {
    const { key, tags = [] } = parameters;
    
    // This will be connected to MemoryService once implemented
    // For now, return mock response
    return {
      success: true,
      memoryId: `mem_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      key,
      storedAt: new Date().toISOString(),
      tags,
      note: 'Memory storage will be implemented in MemoryService',
    };
  }

  /**
   * Memory Retrieve Handler (connects to MemoryService)
   */
  private static async memoryRetrieveHandler(
    parameters: Record<string, any>,
    _context: ToolContext
  ): Promise<any> {
    const { key, limit = 5 } = parameters;
    
    // This will be connected to MemoryService once implemented
    // For now, return mock response
    const mockMemories = [
      {
        id: 'mem_1',
        key: key || 'example_key',
        value: 'Example memory content',
        tags: ['example', 'mock'],
        createdAt: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
        relevance: 0.95,
      },
      {
        id: 'mem_2',
        key: 'another_key',
        value: 'Another example memory',
        tags: ['example'],
        createdAt: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
        relevance: 0.85,
      },
    ];
    
    return mockMemories.slice(0, limit);
  }

  /**
   * Session Context Handler
   */
  private static async sessionContextHandler(
    parameters: Record<string, any>,
    _context: ToolContext
  ): Promise<any> {
    const { type = 'summary', limit = 10 } = parameters;
    
    // Use messages from context
    const messages = _context.messages || [];
    
    switch (type) {
      case 'summary':
        return {
          type: 'summary',
          totalMessages: messages.length,
          recentTopics: this.extractTopics(messages.slice(-5)),
          sessionId: _context.sessionId,
          personaId: _context.personaId,
        };
      
      case 'recent':
        return {
          type: 'recent',
          messages: messages.slice(-limit).map((msg: any, index: number) => ({
            index: messages.length - limit + index + 1,
            role: msg.role,
            content: msg.content.substring(0, 200) + (msg.content.length > 200 ? '...' : ''),
            timestamp: new Date().toISOString(), // Would be actual timestamp in production
          })),
          count: Math.min(limit, messages.length),
        };
      
      case 'full':
        return {
          type: 'full',
          messages: messages.map((msg: any, index: number) => ({
            index: index + 1,
            role: msg.role,
            content: msg.content,
          })),
          total: messages.length,
        };
      
      default:
        throw new Error(`Unknown context type: ${type}`);
    }
  }

  /**
   * Extract topics from messages (simple implementation)
   */
  private static extractTopics(messages: any[]): string[] {
    const topics = new Set<string>();
    
    // Simple keyword extraction
    const keywords = [
      'help', 'question', 'problem', 'issue', 'error',
      'how to', 'what is', 'why', 'when', 'where',
      'code', 'programming', 'debug', 'fix',
      'weather', 'time', 'date', 'schedule',
      'calculate', 'math', 'number',
    ];
    
    messages.forEach(msg => {
      const content = msg.content.toLowerCase();
      keywords.forEach(keyword => {
        if (content.includes(keyword)) {
          topics.add(keyword);
        }
      });
    });
    
    return Array.from(topics).slice(0, 5);
  }
}