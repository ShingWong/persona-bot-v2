import { sql } from '../../lib/db';
import { toolService } from '../tools';
import { promptService } from '../prompt';
import { memoryService } from '../memory';
import type { LLMMessage, LLMCompletionOptions, LLMProvider, LLMServiceResponse } from './llm.types';

export class EnhancedLLMService {
  private provider: LLMProvider | null = null;

  initialize(provider: LLMProvider, _providerName: string) {
    this.provider = provider;
  }

  async sendMessage(sessionId: string, userId: string, userMessage: string, options: Partial<LLMCompletionOptions> = {}, tier: 1 | 2 | 3 = 3): Promise<LLMServiceResponse> {
    if (!this.provider) throw new Error('LLM provider not initialized');
    const startTime = Date.now();
    const sessions = await sql`SELECT s.*, p.* FROM "Session" s LEFT JOIN "Persona" p ON s."personaId" = p.id WHERE s.id = ${sessionId} AND s."userId" = ${userId}`;
    const session = sessions[0];
    if (!session) throw new Error('Session not found or access denied');
    const personaId = session.personaId;
    if (!personaId) throw new Error('Session has no persona assigned');
    const assembledPrompt = await promptService.buildPersonaPrompt(sessionId, personaId, userMessage, tier);
    const completionOptions: LLMCompletionOptions = { model: await this.getSessionModel(sessionId), temperature: 0.7, maxTokens: 1000, ...options };
    let response;
    try {
      response = await this.provider.complete(assembledPrompt.messages, completionOptions);
    } catch (error) {
      const toolSchemas = await toolService.getToolSchemas(personaId);
      if (toolSchemas.length > 0) {
        console.warn('Tool-enhanced call failed, retrying without tools:', error);
        response = await this.provider.complete(assembledPrompt.messages, completionOptions);
      } else {
        throw error;
      }
    }
    const finalContent = response.content;
    await this.storeConversationMemory(sessionId, personaId, assembledPrompt.messages, finalContent);
    await promptService.addToContext(sessionId, 'user', userMessage);
    await promptService.addToContext(sessionId, 'assistant', finalContent);
    return {
      content: finalContent,
      modelUsed: response.model,
      inputTokens: response.usage?.promptTokens || 0,
      outputTokens: response.usage?.completionTokens || 0,
      totalTokens: response.usage?.totalTokens || 0,
      finishReason: response.finishReason || 'stop',
      latencyMs: Date.now() - startTime,
    };
  }

  async sendStreamingMessage(sessionId: string, userId: string, userMessage: string, onChunk: (chunk: string, isComplete: boolean, toolResults?: any[]) => void, options: Partial<LLMCompletionOptions> = {}, tier: 1 | 2 | 3 = 3): Promise<LLMServiceResponse> {
    if (!this.provider) throw new Error('LLM provider not initialized');
    const startTime = Date.now();
    let fullResponse = '';
    const sessions = await sql`SELECT s.*, p.* FROM "Session" s LEFT JOIN "Persona" p ON s."personaId" = p.id WHERE s.id = ${sessionId} AND s."userId" = ${userId}`;
    const session = sessions[0];
    if (!session) throw new Error('Session not found or access denied');
    const personaId = session.personaId;
    if (!personaId) throw new Error('Session has no persona assigned');
    const assembledPrompt = await promptService.buildPersonaPrompt(sessionId, personaId, userMessage, tier);
    const completionOptions: LLMCompletionOptions = { model: await this.getSessionModel(sessionId), temperature: 0.7, maxTokens: 1000, ...options };
    if (!this.provider.completeStream) throw new Error('Provider does not support streaming');
    const response = await this.provider.completeStream(assembledPrompt.messages, (chunk: string) => { fullResponse += chunk; onChunk(chunk, false); }, completionOptions);
    onChunk('', true);
    await this.storeConversationMemory(sessionId, personaId, assembledPrompt.messages, fullResponse);
    await promptService.addToContext(sessionId, 'user', userMessage);
    await promptService.addToContext(sessionId, 'assistant', fullResponse);
    const inputTokens = Math.ceil(assembledPrompt.messages.reduce((a: number, m: LLMMessage) => a + m.content.length, 0) / 4);
    const outputTokens = Math.ceil(fullResponse.length / 4);
    return {
      content: fullResponse,
      modelUsed: response.model,
      inputTokens: response.usage?.promptTokens || inputTokens,
      outputTokens: response.usage?.completionTokens || outputTokens,
      totalTokens: (response.usage?.promptTokens || inputTokens) + (response.usage?.completionTokens || outputTokens),
      finishReason: response.finishReason || 'stop',
      latencyMs: Date.now() - startTime,
    };
  }

  private async getSessionModel(sessionId: string): Promise<string> {
    const sessions = await sql`
      SELECT s.*, am.provider as "aiModelProvider", am."modelIdentifier" as "aiModelIdentifier",
             p."modelId" as "personaModelId", pm.provider as "personaModelProvider",
             pm."modelIdentifier" as "personaModelIdentifier", u."defaultModelId",
             dm.provider as "defaultModelProvider", dm."modelIdentifier" as "defaultModelIdentifier"
      FROM "Session" s
      LEFT JOIN "AIModel" am ON s."aiModelId" = am.id
      LEFT JOIN "Persona" p ON s."personaId" = p.id
      LEFT JOIN "AIModel" pm ON p."modelId" = pm.id
      LEFT JOIN "User" u ON s."userId" = u.id
      LEFT JOIN "AIModel" dm ON u."defaultModelId" = dm.id
      WHERE s.id = ${sessionId}
    `;
    const session = sessions[0];
    if (!session) throw new Error(`Session ${sessionId} not found`);
    if (session.modelOverride) return session.modelOverride;
    if (session.personaModelId && session.personaModelProvider && session.personaModelIdentifier) return `${session.personaModelProvider}/${session.personaModelIdentifier}`;
    if (session.defaultModelId && session.defaultModelProvider && session.defaultModelIdentifier) return `${session.defaultModelProvider}/${session.defaultModelIdentifier}`;
    const defaultModels = await sql`SELECT * FROM "AIModel" WHERE provider = 'openai' AND "modelIdentifier" = 'gpt-4' AND "isActive" = true LIMIT 1`;
    const defaultModel = defaultModels[0];
    if (!defaultModel) throw new Error('No default AI model configured');
    return `${defaultModel.provider}/${defaultModel.modelIdentifier}`;
  }

  private async storeConversationMemory(sessionId: string, personaId: string, messages: LLMMessage[], assistantResponse: string): Promise<void> {
    try {
      const lastUserMessage = [...messages].reverse().find(m => m.role === 'user');
      if (lastUserMessage) {
        await memoryService.storeMemory({
          entityType: 'persona',
          entityId: personaId,
          content: `User: ${lastUserMessage.content}\nAssistant: ${assistantResponse}`,
          memoryType: 'conversation',
          tags: ['session:' + sessionId, 'exchange'],
          importance: 0.6,
          metadata: { sessionId, timestamp: new Date().toISOString() },
        });
      }
      await promptService.storeConversationMemory(sessionId, personaId, messages);
    } catch (error) {
      console.warn('Failed to store conversation memory:', error);
    }
  }

  async getPersonaTools(personaId: string): Promise<any[]> { return toolService.getAvailableTools(personaId); }

  async getPersonaMemoryContext(personaId: string, query?: string, maxTokens: number = 500): Promise<any> {
    return memoryService.getMemoryContext('persona', personaId, query, maxTokens);
  }

  async getPromptConfig(personaId: string): Promise<any> {
    return promptService.getPersonaAssembler(personaId).getConfig();
  }

  async updatePromptConfig(personaId: string, config: any): Promise<void> {
    promptService.configurePersonaProgressiveDisclosure(personaId, config);
  }

  async clearSessionContext(sessionId: string): Promise<void> { await promptService.clearContext(sessionId); }

  async getSessionContextSummary(sessionId: string): Promise<string> { return promptService.getContextSummary(sessionId); }
}
