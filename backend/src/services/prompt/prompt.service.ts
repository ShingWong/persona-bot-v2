/**
 * Prompt Service
 * Main service for advanced prompt engineering and context management
 */

import { sql } from '../../lib/db';
import { PromptAssembler } from './prompt.assembler';
import { ContextManager } from './context.manager';
import { memoryService } from '../memory';
import { toolService } from '../tools';
import {
  AssembledPrompt,
  ContextWindow,
  ProgressiveDisclosureTier,
} from './prompt.types';

export class PromptService {
  private assembler: PromptAssembler;
  private contextManager: ContextManager;
  private personaAssemblers: Map<string, PromptAssembler> = new Map();

  constructor() {
    this.assembler = new PromptAssembler();
    this.contextManager = new ContextManager();
  }

  /**
   * Build prompt for persona conversation
   */
  async buildPersonaPrompt(
    sessionId: string,
    personaId: string,
    userMessage: string,
    tier: 1 | 2 | 3 = 3
  ): Promise<AssembledPrompt> {
    // Get persona data
    const personas = await sql`
      SELECT p.*, am.*
      FROM "Persona" p
      LEFT JOIN "AIModel" am ON p."modelId" = am.id
      WHERE p.id = ${personaId}
    `;

    const persona = personas[0];
    if (!persona) {
      throw new Error(`Persona ${personaId} not found`);
    }

    // Get session context
    const sessions = await sql`
      SELECT s.*, p.*
      FROM "Session" s
      LEFT JOIN "Persona" p ON s."personaId" = p.id
      WHERE s.id = ${sessionId}
    `;

    const sessionData = sessions[0];

    if (!persona) {
      throw new Error(`Persona ${personaId} not found`);
    }

    if (!sessionData) {
      throw new Error(`Session ${sessionId} not found`);
    }

    if (!sessionData) {
      throw new Error(`Session ${sessionId} not found`);
    }

    // Get relevant memories
    const memoryContext = await memoryService.getMemoryContext(
      'persona',
      personaId,
      userMessage,
      500
    );

    // Get available tools
    const tools = await toolService.getAvailableTools(personaId);
    // Note: toolSchemas would be used for LLM function calling
    // const toolSchemas = await toolService.getToolSchemas(personaId);

    // Create prompt components
    const components = this.assembler.createPersonaComponents(
      persona.identity,
      persona.constraints || undefined,
      persona.examples ? JSON.parse(JSON.stringify(persona.examples)) : undefined,
      tools,
      memoryContext.memories
    );

    // Get session messages
    const sessionMessages = await sql`
      SELECT * FROM "Message"
      WHERE "sessionId" = ${sessionId}
      ORDER BY "createdAt" ASC
      LIMIT 20
    `;

    // Convert session messages to prompt format
    const contextMessages = sessionMessages.map(msg => ({
      role: msg.role.toLowerCase() as 'system' | 'user' | 'assistant',
      content: msg.content,
    }));

    // Add current user message
    contextMessages.push({
      role: 'user',
      content: userMessage,
    });

    // Assemble prompt
    return this.assembler.assemblePrompt(components, contextMessages, tier);
  }

  /**
   * Build prompt with tool execution results
   */
  async buildToolEnhancedPrompt(
    sessionId: string,
    personaId: string,
    userMessage: string,
    toolResults: Array<{ tool: string; result: any }>,
    tier: 1 | 2 | 3 = 3
  ): Promise<AssembledPrompt> {
    // Get base prompt
    const basePrompt = await this.buildPersonaPrompt(sessionId, personaId, userMessage, tier);
    
    // Add tool results to context
    const toolResultsText = toolResults.map((tr, i) => 
      `Tool ${i + 1} (${tr.tool}): ${JSON.stringify(tr.result, null, 2)}`
    ).join('\n\n');

    const toolResultsMessage = {
      role: 'system' as const,
      content: `Tool execution results:\n${toolResultsText}`,
    };

    // Insert tool results before the last user message
    const messages = [...basePrompt.messages];
    const lastUserIndex = messages.map((m, i) => ({ role: m.role, index: i }))
      .filter(item => item.role === 'user')
      .pop()?.index;
    
    if (lastUserIndex !== undefined && lastUserIndex !== -1) {
      messages.splice(lastUserIndex, 0, toolResultsMessage);
    } else {
      messages.push(toolResultsMessage);
    }

    return {
      messages,
      tokenCount: basePrompt.tokenCount + this.estimateTokens(toolResultsText),
      componentsUsed: [...basePrompt.componentsUsed, 'tools_results'],
      contextSummary: basePrompt.contextSummary,
    };
  }

  /**
   * Manage conversation context
   */
  async manageConversationContext(
    sessionId: string,
    messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>,
    maxTokens: number = 4000
  ): Promise<ContextWindow> {
    return this.contextManager.createContextWindow(sessionId, messages, maxTokens);
  }

  /**
   * Add message to context
   */
  async addToContext(
    sessionId: string,
    role: 'system' | 'user' | 'assistant',
    content: string
  ): Promise<ContextWindow> {
    return this.contextManager.addMessage(sessionId, role, content);
  }

  /**
   * Get context summary
   */
  async getContextSummary(sessionId: string, maxTokens: number = 500): Promise<string> {
    return this.contextManager.summarizeContext(sessionId, maxTokens);
  }

  /**
   * Clear context
   */
  async clearContext(sessionId: string): Promise<void> {
    this.contextManager.clearContext(sessionId);
  }

  /**
   * Store relevant information from conversation as memory
   */
  async storeConversationMemory(
    sessionId: string,
    personaId: string,
    messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>
  ): Promise<void> {
    // Extract key information from conversation
    const userMessages = messages.filter(m => m.role === 'user');
    
    if (userMessages.length === 0) {
      return;
    }

    // Store last user message as memory
    const lastUserMessage = userMessages[userMessages.length - 1];
    
    await memoryService.storeMemory({
      entityType: 'persona',
      entityId: personaId,
      content: lastUserMessage.content,
      memoryType: 'conversation',
      tags: ['session:' + sessionId, 'conversation'],
      importance: 0.7,
      metadata: {
        sessionId,
        timestamp: new Date().toISOString(),
        messageCount: messages.length,
      },
    });

    // If there's a pattern or repeated topic, store it with higher importance
    if (userMessages.length >= 3) {
      const topics = this.extractCommonTopics(userMessages.map(m => m.content));
      if (topics.length > 0) {
        await memoryService.storeMemory({
          entityType: 'persona',
          entityId: personaId,
          content: `User frequently asks about: ${topics.join(', ')}`,
          memoryType: 'preference',
          tags: ['pattern', 'frequent_topic'],
          importance: 0.9,
          metadata: {
            sessionId,
            topics,
            occurrenceCount: userMessages.length,
          },
        });
      }
    }
  }

  /**
   * Configure progressive disclosure for persona
   */
  configurePersonaProgressiveDisclosure(
    personaId: string,
    tierConfig: Partial<ProgressiveDisclosureTier>
  ): void {
    const assembler = this.personaAssemblers.get(personaId) || new PromptAssembler();
    
    // Update configuration based on tier
    if (tierConfig.tier) {
      const tierConfigs = {
        1: { maxTokens: 1000, includeExamples: false, includeTools: false },
        2: { maxTokens: 2000, includeExamples: false, includeTools: true },
        3: { maxTokens: 4000, includeExamples: true, includeTools: true },
      };
      
      assembler.updateConfig(tierConfigs[tierConfig.tier]);
    }
    
    this.personaAssemblers.set(personaId, assembler);
  }

  /**
   * Get prompt assembler for persona
   */
  getPersonaAssembler(personaId: string): PromptAssembler {
    return this.personaAssemblers.get(personaId) || this.assembler;
  }

  /**
   * Extract common topics from messages
   */
  private extractCommonTopics(messages: string[]): string[] {
    const wordCounts: Record<string, number> = {};
    const commonWords = new Set(['what', 'when', 'where', 'why', 'how', 'can', 'could', 'would', 'should', 'the', 'and', 'but', 'for', 'not', 'you', 'your', 'this', 'that', 'with', 'from', 'have', 'has', 'had']);
    
    messages.forEach(message => {
      const words = message.toLowerCase().split(/\W+/).filter(w => w.length > 3 && !commonWords.has(w));
      words.forEach(word => {
        wordCounts[word] = (wordCounts[word] || 0) + 1;
      });
    });
    
    // Return words that appear in at least 2 messages
    return Object.entries(wordCounts)
      .filter(([_, count]) => count >= 2)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([word]) => word);
  }

  /**
   * Estimate tokens (rough approximation)
   */
  private estimateTokens(text: string): number {
    return Math.ceil(text.length / 4);
  }

  /**
   * Get context manager
   */
  getContextManager(): ContextManager {
    return this.contextManager;
  }

  /**
   * Get active sessions
   */
  getActiveSessions(): string[] {
    return this.contextManager.getActiveSessions();
  }

  /**
   * Update global prompt configuration
   */
  updatePromptConfig(config: any): void {
    this.assembler.updateConfig(config);
  }

  /**
   * Update context configuration
   */
  updateContextConfig(config: any): void {
    this.contextManager.updateConfig(config);
  }
}