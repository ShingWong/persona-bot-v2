/**
 * Prompt Assembler
 * Dynamic prompt assembly with token optimization
 */

import {
  PromptComponent,
  PromptAssemblyConfig,
  AssembledPrompt,
  ProgressiveDisclosureTier,
  TokenOptimizationResult,
} from './prompt.types';

export class PromptAssembler {
  private config: PromptAssemblyConfig;

  constructor(config?: Partial<PromptAssemblyConfig>) {
    this.config = {
      maxTokens: 4000,
      includeMemory: true,
      includeTools: true,
      includeExamples: true,
      memoryRelevanceThreshold: 0.7,
      toolLimit: 10,
      exampleLimit: 5,
      contextWindowSize: 20,
      ...config,
    };
  }

  /**
   * Assemble prompt from components
   */
  assemblePrompt(
    components: PromptComponent[],
    contextMessages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [],
    tier: 1 | 2 | 3 = 3
  ): AssembledPrompt {
    // Sort components by priority (descending)
    const sortedComponents = [...components].sort((a, b) => b.priority - a.priority);
    
    // Apply progressive disclosure based on tier
    const filteredComponents = this.applyProgressiveDisclosure(sortedComponents, tier);
    
    // Build system prompt from high-priority components
    const systemPrompt = this.buildSystemPrompt(filteredComponents);
    
    // Build context messages
    const contextPrompt = this.buildContextPrompt(filteredComponents, contextMessages);
    
    // Calculate token counts
    const systemTokens = this.estimateTokens(systemPrompt);
    const contextTokens = contextPrompt.reduce((sum, msg) => sum + this.estimateTokens(msg.content), 0);
    const totalTokens = systemTokens + contextTokens;
    
    // Optimize if needed
    let optimizedMessages = [...contextPrompt];
    
    if (totalTokens > this.config.maxTokens) {
      const optimizationResult = this.optimizeTokenUsage(systemPrompt, contextPrompt, this.config.maxTokens);
      optimizedMessages = optimizationResult.optimizedMessages;
    }
    
    // Assemble final messages
    const messages = [
      { role: 'system' as const, content: systemPrompt },
      ...optimizedMessages,
    ];
    
    return {
      messages,
      tokenCount: this.estimateTokens(systemPrompt) + 
                 optimizedMessages.reduce((sum, msg) => sum + this.estimateTokens(msg.content), 0),
      componentsUsed: filteredComponents.map(c => c.type),
      contextSummary: this.generateContextSummary(optimizedMessages),
    };
  }

  /**
   * Apply progressive disclosure based on tier
   */
  private applyProgressiveDisclosure(
    components: PromptComponent[],
    tier: 1 | 2 | 3
  ): PromptComponent[] {
    const tierConfigs: Record<1 | 2 | 3, ProgressiveDisclosureTier> = {
      1: {
        tier: 1,
        name: 'Basic',
        description: 'Essential components only',
        maxTokens: 1000,
        includeComponents: ['system', 'identity', 'constraints'],
      },
      2: {
        tier: 2,
        name: 'Enhanced',
        description: 'Add memory and basic tools',
        maxTokens: 2000,
        includeComponents: ['system', 'identity', 'constraints', 'memory', 'tools'],
      },
      3: {
        tier: 3,
        name: 'Full',
        description: 'All components including examples',
        maxTokens: 4000,
        includeComponents: ['system', 'identity', 'constraints', 'memory', 'tools', 'examples', 'context'],
      },
    };

    const config = tierConfigs[tier];
    return components.filter(component => 
      config.includeComponents.includes(component.type) || component.required
    );
  }

  /**
   * Build system prompt from components
   */
  private buildSystemPrompt(components: PromptComponent[]): string {
    const systemComponents = components.filter(c => 
      ['system', 'identity', 'constraints', 'instructions'].includes(c.type)
    );
    
    const groupedComponents: Record<string, string[]> = {};
    
    // Group components by type
    for (const component of systemComponents) {
      if (!groupedComponents[component.type]) {
        groupedComponents[component.type] = [];
      }
      groupedComponents[component.type].push(component.content);
    }
    
    // Build prompt sections
    const sections: string[] = [];
    
    // Identity/System first
    if (groupedComponents.identity?.length) {
      sections.push(...groupedComponents.identity);
    }
    if (groupedComponents.system?.length) {
      sections.push(...groupedComponents.system);
    }
    
    // Constraints
    if (groupedComponents.constraints?.length) {
      sections.push('\nConstraints:');
      sections.push(...groupedComponents.constraints.map(c => `- ${c}`));
    }
    
    // Instructions
    if (groupedComponents.instructions?.length) {
      sections.push('\nInstructions:');
      sections.push(...groupedComponents.instructions.map(c => `- ${c}`));
    }
    
    return sections.join('\n');
  }

  /**
   * Build context prompt from components and messages
   */
  private buildContextPrompt(
    components: PromptComponent[],
    contextMessages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>
  ): Array<{ role: 'system' | 'user' | 'assistant'; content: string }> {
    const context: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [];
    
    // Add memory components
    const memoryComponents = components.filter(c => c.type === 'memory');
    if (memoryComponents.length > 0) {
      context.push({
        role: 'system',
        content: 'Relevant memories:\n' + memoryComponents.map(c => `- ${c.content}`).join('\n'),
      });
    }
    
    // Add tool components
    const toolComponents = components.filter(c => c.type === 'tools');
    if (toolComponents.length > 0) {
      context.push({
        role: 'system',
        content: 'Available tools:\n' + toolComponents.map(c => c.content).join('\n'),
      });
    }
    
    // Add example components
    const exampleComponents = components.filter(c => c.type === 'examples');
    if (exampleComponents.length > 0 && this.config.includeExamples) {
      const examples = this.selectRelevantExamples(
        exampleComponents.map(c => ({ content: c.content })),
        contextMessages[contextMessages.length - 1]?.content || '',
        this.config.exampleLimit
      );
      
      if (examples.length > 0) {
        context.push({
          role: 'system',
          content: 'Examples:\n' + examples.join('\n'),
        });
      }
    }
    
    // Add conversation context
    const recentMessages = contextMessages.slice(-this.config.contextWindowSize);
    context.push(...recentMessages);
    
    return context;
  }

  /**
   * Select relevant few-shot examples
   */
  private selectRelevantExamples(
    examples: Array<{ content: string }>,
    currentQuery: string,
    limit: number
  ): string[] {
    if (examples.length <= limit) {
      return examples.map(e => e.content);
    }
    
    // Simple relevance scoring based on word overlap
    const queryWords = new Set(currentQuery.toLowerCase().split(/\W+/).filter(w => w.length > 2));
    
    const scoredExamples = examples.map(example => {
      const exampleWords = new Set(example.content.toLowerCase().split(/\W+/).filter(w => w.length > 2));
      const intersection = new Set([...queryWords].filter(x => exampleWords.has(x)));
      const relevance = intersection.size / Math.max(queryWords.size, 1);
      
      return { example: example.content, relevance };
    });
    
    // Sort by relevance and take top N
    return scoredExamples
      .sort((a, b) => b.relevance - a.relevance)
      .slice(0, limit)
      .map(item => item.example);
  }

  /**
   * Optimize token usage
   */
  private optimizeTokenUsage(
    systemPrompt: string,
    contextMessages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>,
    maxTokens: number
  ): TokenOptimizationResult & { optimizedMessages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> } {
    const techniquesUsed: string[] = [];
    let currentTokens = this.estimateTokens(systemPrompt);
    const optimizedMessages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [];
    
    // Process messages in reverse order (most recent first)
    const reversedMessages = [...contextMessages].reverse();
    
    for (const message of reversedMessages) {
      const messageTokens = this.estimateTokens(message.content);
      
      if (currentTokens + messageTokens <= maxTokens) {
        optimizedMessages.unshift(message); // Add to beginning to maintain order
        currentTokens += messageTokens;
      } else {
        // Try to truncate the message
        const truncated = this.truncateMessage(message.content, maxTokens - currentTokens);
        if (truncated) {
          optimizedMessages.unshift({ ...message, content: truncated });
          currentTokens += this.estimateTokens(truncated);
          techniquesUsed.push('truncation');
          break; // Stop after first truncation
        }
      }
    }
    
    const originalTokens = this.estimateTokens(systemPrompt) + 
                          contextMessages.reduce((sum, msg) => sum + this.estimateTokens(msg.content), 0);
    
    return {
      originalTokens,
      optimizedTokens: currentTokens,
      reductionPercent: ((originalTokens - currentTokens) / originalTokens) * 100,
      techniquesUsed,
      optimizedMessages,
    };
  }

  /**
   * Truncate message to fit token budget
   */
  private truncateMessage(content: string, tokenBudget: number): string | null {
    const charBudget = tokenBudget * 4; // Rough estimate: 4 chars per token
    
    if (content.length <= charBudget) {
      return content;
    }
    
    // Try to truncate at sentence boundary
    const truncated = content.substring(0, charBudget);
    const lastPeriod = truncated.lastIndexOf('.');
    const lastQuestion = truncated.lastIndexOf('?');
    const lastExclamation = truncated.lastIndexOf('!');
    
    const lastBoundary = Math.max(lastPeriod, lastQuestion, lastExclamation);
    
    if (lastBoundary > charBudget * 0.5) {
      // Found a reasonable sentence boundary
      return truncated.substring(0, lastBoundary + 1) + ' [truncated]';
    }
    
    // No good boundary, just truncate
    return truncated.substring(0, charBudget * 0.9) + '... [truncated]';
  }

  /**
   * Estimate tokens in text (rough approximation)
   */
  private estimateTokens(text: string): number {
    // Rough estimate: 4 characters per token for English text
    // In production, use tiktoken or similar
    return Math.ceil(text.length / 4);
  }

  /**
   * Generate context summary
   */
  private generateContextSummary(
    messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>
  ): string {
    const userMessages = messages.filter(m => m.role === 'user');
    const assistantMessages = messages.filter(m => m.role === 'assistant');
    
    return `Context: ${userMessages.length} user messages, ${assistantMessages.length} assistant responses`;
  }

  /**
   * Create prompt components from persona data
   */
  createPersonaComponents(
    identity: string,
    constraints?: string,
    examples?: any[],
    tools?: any[],
    memories?: any[]
  ): PromptComponent[] {
    const components: PromptComponent[] = [];
    
    // Identity component
    components.push({
      type: 'identity',
      content: identity,
      priority: 10,
      tokenEstimate: this.estimateTokens(identity),
      required: true,
    });
    
    // Constraints component
    if (constraints) {
      components.push({
        type: 'constraints',
        content: constraints,
        priority: 8,
        tokenEstimate: this.estimateTokens(constraints),
        required: true,
      });
    }
    
    // Examples component
    if (examples && examples.length > 0 && this.config.includeExamples) {
      const exampleText = examples.map((ex, i) => 
        `Example ${i + 1}:\nUser: ${ex.user}\nAssistant: ${ex.assistant}`
      ).join('\n\n');
      
      components.push({
        type: 'examples',
        content: exampleText,
        priority: 6,
        tokenEstimate: this.estimateTokens(exampleText),
        required: false,
      });
    }
    
    // Tools component
    if (tools && tools.length > 0 && this.config.includeTools) {
      const toolText = tools.slice(0, this.config.toolLimit).map(tool => 
        `Tool: ${tool.name}\nDescription: ${tool.description}\nParameters: ${JSON.stringify(tool.parameters)}`
      ).join('\n\n');
      
      components.push({
        type: 'tools',
        content: toolText,
        priority: 7,
        tokenEstimate: this.estimateTokens(toolText),
        required: false,
      });
    }
    
    // Memory component
    if (memories && memories.length > 0 && this.config.includeMemory) {
      const relevantMemories = memories
        .filter((m: any) => m.relevance >= this.config.memoryRelevanceThreshold)
        .slice(0, 5);
      
      if (relevantMemories.length > 0) {
        const memoryText = relevantMemories.map((memory: any, i: number) => 
          `Memory ${i + 1}: ${memory.content}`
        ).join('\n');
        
        components.push({
          type: 'memory',
          content: memoryText,
          priority: 5,
          tokenEstimate: this.estimateTokens(memoryText),
          required: false,
        });
      }
    }
    
    return components;
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<PromptAssemblyConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Get current configuration
   */
  getConfig(): PromptAssemblyConfig {
    return { ...this.config };
  }
}