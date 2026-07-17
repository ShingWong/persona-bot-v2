/**
 * Context Manager
 * Manages conversation context with token optimization and summarization
 */

import { ContextWindow, TokenOptimizationResult, PromptOptimizationConfig } from './prompt.types';

export class ContextManager {
  private config: PromptOptimizationConfig;
  private contextWindows: Map<string, ContextWindow> = new Map();

  constructor(config?: Partial<PromptOptimizationConfig>) {
    this.config = {
      summarizeLongMessages: true,
      truncateStrategy: 'smart',
      removeRedundantExamples: true,
      compressSystemPrompt: true,
      maxMessageLength: 1000,
      ...config,
    };
  }

  /**
   * Create or update context window for session
   */
  createContextWindow(
    sessionId: string,
    messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>,
    maxTokens: number = 4000
  ): ContextWindow {
    const optimizedMessages = this.optimizeContext(messages, maxTokens);
    const totalTokens = optimizedMessages.reduce((sum, msg) => sum + msg.tokens, 0);
    
    const contextWindow: ContextWindow = {
      messages: optimizedMessages,
      totalTokens,
      maxTokens,
    };
    
    this.contextWindows.set(sessionId, contextWindow);
    return contextWindow;
  }

  /**
   * Get context window for session
   */
  getContextWindow(sessionId: string): ContextWindow | null {
    return this.contextWindows.get(sessionId) || null;
  }

  /**
   * Add message to context window
   */
  addMessage(
    sessionId: string,
    role: 'system' | 'user' | 'assistant',
    content: string
  ): ContextWindow {
    let contextWindow = this.getContextWindow(sessionId);
    
    if (!contextWindow) {
      contextWindow = {
        messages: [],
        totalTokens: 0,
        maxTokens: 4000,
      };
    }
    
    const tokens = this.estimateTokens(content);
    const newMessage = { role, content, tokens };
    
    // Add new message
    contextWindow.messages.push(newMessage);
    contextWindow.totalTokens += tokens;
    
    // Optimize if over limit
    if (contextWindow.totalTokens > contextWindow.maxTokens) {
      this.optimizeContextWindow(contextWindow);
    }
    
    this.contextWindows.set(sessionId, contextWindow);
    return contextWindow;
  }

  /**
   * Summarize context window
   */
  summarizeContext(sessionId: string, maxSummaryTokens: number = 500): string {
    const contextWindow = this.getContextWindow(sessionId);
    if (!contextWindow || contextWindow.messages.length === 0) {
      return 'No conversation context available.';
    }
    
    const userMessages = contextWindow.messages.filter(m => m.role === 'user');
    const assistantMessages = contextWindow.messages.filter(m => m.role === 'assistant');
    
    // Simple summarization
    const summaryParts: string[] = [];
    
    if (userMessages.length > 0) {
      const recentUserMessages = userMessages.slice(-3);
      summaryParts.push(`User discussed: ${recentUserMessages.map(m => this.summarizeMessage(m.content)).join('; ')}`);
    }
    
    if (assistantMessages.length > 0) {
      summaryParts.push(`Assistant provided ${assistantMessages.length} responses.`);
    }
    
    const summary = summaryParts.join(' ');
    
    // Truncate if needed
    if (this.estimateTokens(summary) > maxSummaryTokens) {
      return this.truncateText(summary, maxSummaryTokens * 4) + ' [summary truncated]';
    }
    
    return summary;
  }

  /**
   * Clear context window
   */
  clearContext(sessionId: string): void {
    this.contextWindows.delete(sessionId);
  }

  /**
   * Get all session IDs with active context
   */
  getActiveSessions(): string[] {
    return Array.from(this.contextWindows.keys());
  }

  /**
   * Optimize context to fit within token limit
   */
  private optimizeContext(
    messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>,
    maxTokens: number
  ): Array<{ role: 'system' | 'user' | 'assistant'; content: string; tokens: number }> {
    const techniquesUsed: string[] = [];
    const optimizedMessages: Array<{ role: 'system' | 'user' | 'assistant'; content: string; tokens: number }> = [];
    let currentTokens = 0;
    
    // Process messages in chronological order
    for (const message of messages) {
      let content = message.content;
      let tokens = this.estimateTokens(content);
      
      // Apply optimizations
      if (this.config.summarizeLongMessages && tokens > this.config.maxMessageLength / 4) {
        content = this.summarizeMessage(content);
        tokens = this.estimateTokens(content);
        techniquesUsed.push('summarization');
      }
      
      if (currentTokens + tokens > maxTokens) {
        // Try to truncate
        const truncated = this.truncateMessage(content, maxTokens - currentTokens);
        if (truncated) {
          content = truncated;
          tokens = this.estimateTokens(content);
          techniquesUsed.push('truncation');
        } else {
          // Can't fit this message, stop
          break;
        }
      }
      
      if (currentTokens + tokens <= maxTokens) {
        optimizedMessages.push({ ...message, content, tokens });
        currentTokens += tokens;
      } else {
        break;
      }
    }
    
    // Remove redundant examples if enabled
    if (this.config.removeRedundantExamples && optimizedMessages.length > 5) {
      const deduped = this.removeRedundantExamples(optimizedMessages);
      if (deduped.length < optimizedMessages.length) {
        techniquesUsed.push('deduplication');
        return deduped;
      }
    }
    
    return optimizedMessages;
  }

  /**
   * Optimize existing context window
   */
  private optimizeContextWindow(contextWindow: ContextWindow): void {
    while (contextWindow.totalTokens > contextWindow.maxTokens && contextWindow.messages.length > 1) {
      // Remove oldest non-system message
      const nonSystemIndex = contextWindow.messages.findIndex(m => m.role !== 'system');
      if (nonSystemIndex === -1) {
        // Only system messages left, can't optimize further
        break;
      }
      
      const removed = contextWindow.messages.splice(nonSystemIndex, 1)[0];
      contextWindow.totalTokens -= removed.tokens;
      
      // Try to summarize remaining context
      if (contextWindow.messages.length > 3) {
        const summary = this.summarizeContextFromMessages(contextWindow.messages.slice(0, -2));
        const summaryTokens = this.estimateTokens(summary);
        
        if (summaryTokens < contextWindow.totalTokens * 0.3) {
          // Replace early messages with summary
          const keptMessages = contextWindow.messages.slice(-2);
          const summaryMessage = {
            role: 'system' as const,
            content: `Previous conversation summary: ${summary}`,
            tokens: summaryTokens,
          };
          
          contextWindow.messages = [summaryMessage, ...keptMessages];
          contextWindow.totalTokens = summaryTokens + keptMessages.reduce((sum, m) => sum + m.tokens, 0);
        }
      }
    }
  }

  /**
   * Summarize a single message
   */
  private summarizeMessage(content: string): string {
    if (content.length <= this.config.maxMessageLength) {
      return content;
    }
    
    // Simple summarization: take beginning and end
    const start = content.substring(0, this.config.maxMessageLength * 0.3);
    const end = content.substring(content.length - this.config.maxMessageLength * 0.3);
    
    return `${start}... [summarized] ...${end}`;
  }

  /**
   * Summarize multiple messages
   */
  private summarizeContextFromMessages(
    messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string; tokens: number }>
  ): string {
    const userMessages = messages.filter(m => m.role === 'user');
    const assistantMessages = messages.filter(m => m.role === 'assistant');
    
    const summaries: string[] = [];
    
    if (userMessages.length > 0) {
      const userTopics = userMessages.map(m => this.extractTopics(m.content)).flat();
      const uniqueTopics = [...new Set(userTopics)].slice(0, 5);
      if (uniqueTopics.length > 0) {
        summaries.push(`Topics discussed: ${uniqueTopics.join(', ')}`);
      }
    }
    
    if (assistantMessages.length > 0) {
      summaries.push(`Assistant provided ${assistantMessages.length} responses`);
    }
    
    return summaries.join('. ');
  }

  /**
   * Extract topics from message
   */
  private extractTopics(content: string): string[] {
    // Simple keyword extraction
    const words = content.toLowerCase().split(/\W+/).filter(w => w.length > 3);
    const commonWords = new Set(['what', 'when', 'where', 'why', 'how', 'can', 'could', 'would', 'should', 'have', 'has', 'had', 'with', 'from', 'this', 'that', 'the', 'and', 'but', 'for', 'not', 'you', 'your']);
    
    const wordCounts: Record<string, number> = {};
    for (const word of words) {
      if (!commonWords.has(word)) {
        wordCounts[word] = (wordCounts[word] || 0) + 1;
      }
    }
    
    // Get top 3 words
    return Object.entries(wordCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([word]) => word);
  }

  /**
   * Truncate message
   */
  private truncateMessage(content: string, tokenBudget: number): string | null {
    const charBudget = tokenBudget * 4;
    
    if (content.length <= charBudget) {
      return content;
    }
    
    switch (this.config.truncateStrategy) {
      case 'end':
        return content.substring(0, charBudget) + '... [truncated]';
      
      case 'middle':
        const start = content.substring(0, charBudget * 0.4);
        const end = content.substring(content.length - charBudget * 0.4);
        return `${start}... [truncated] ...${end}`;
      
      case 'smart':
      default:
        // Try to find sentence boundary
        const truncated = content.substring(0, charBudget);
        const lastPeriod = truncated.lastIndexOf('.');
        const lastQuestion = truncated.lastIndexOf('?');
        const lastExclamation = truncated.lastIndexOf('!');
        const lastBoundary = Math.max(lastPeriod, lastQuestion, lastExclamation);
        
        if (lastBoundary > charBudget * 0.5) {
          return truncated.substring(0, lastBoundary + 1) + ' [truncated]';
        }
        return truncated.substring(0, charBudget * 0.9) + '... [truncated]';
    }
  }

  /**
   * Remove redundant examples
   */
  private removeRedundantExamples(
    messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string; tokens: number }>
  ): Array<{ role: 'system' | 'user' | 'assistant'; content: string; tokens: number }> {
    const seenContent = new Set<string>();
    const deduped: Array<{ role: 'system' | 'user' | 'assistant'; content: string; tokens: number }> = [];
    
    for (const message of messages) {
      // Create a signature for the message (simplified for demo)
      const signature = `${message.role}:${message.content.substring(0, 50)}`;
      
      if (!seenContent.has(signature)) {
        seenContent.add(signature);
        deduped.push(message);
      }
    }
    
    return deduped;
  }

  /**
   * Truncate text
   */
  private truncateText(text: string, maxChars: number): string {
    if (text.length <= maxChars) {
      return text;
    }
    return text.substring(0, maxChars) + '...';
  }

  /**
   * Estimate tokens (rough approximation)
   */
  private estimateTokens(text: string): number {
    return Math.ceil(text.length / 4);
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<PromptOptimizationConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Get optimization statistics
   */
  getOptimizationStats(sessionId: string): TokenOptimizationResult | null {
    const contextWindow = this.getContextWindow(sessionId);
    if (!contextWindow) {
      return null;
    }
    
    // This would track actual optimizations in production
    return {
      originalTokens: contextWindow.totalTokens * 1.2, // Estimated original
      optimizedTokens: contextWindow.totalTokens,
      reductionPercent: 16.7, // Estimated reduction
      techniquesUsed: ['summarization', 'truncation'],
    };
  }
}