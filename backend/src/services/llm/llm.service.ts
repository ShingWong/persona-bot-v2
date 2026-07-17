import { sql } from '../../lib/db';
import type { LLMMessage, LLMCompletionOptions, LLMProvider, PersonaLLMContext, LLMServiceResponse } from './llm.types';

export class LLMService {
  private provider: LLMProvider | null = null;

  initialize(provider: LLMProvider, _providerName: string) {
    this.provider = provider;
  }

  private async getPersonaContext(personaId: string): Promise<PersonaLLMContext | null> {
    if (!personaId) return null;
    const personas = await sql`
      SELECT p.*, m."displayName" as "modelDisplayName"
      FROM "Persona" p
      LEFT JOIN "AIModel" m ON p."modelId" = m.id
      WHERE p.id = ${personaId}
    `;
    const persona = personas[0];
    if (!persona) return null;
    return {
      personaId: persona.id,
      identity: persona.name,
      constraints: persona.systemPrompt || undefined,
      examples: undefined,
      modelId: persona.modelId || undefined,
      modelParams: { temperature: persona.temperature, maxTokens: persona.maxTokens },
    };
  }

  private buildPersonaAwareMessages(userMessage: string, personaContext: PersonaLLMContext | null, sessionMessages: LLMMessage[] = []): LLMMessage[] {
    const messages: LLMMessage[] = [];
    if (personaContext?.identity) {
      let systemPrompt = personaContext.identity;
      if (personaContext.constraints) systemPrompt += `\n\nConstraints:\n${personaContext.constraints}`;
      messages.push({ role: 'system', content: systemPrompt });
    }
    if (personaContext?.examples && Array.isArray(personaContext.examples)) {
      for (const ex of personaContext.examples) {
        if (ex.user && ex.assistant) {
          messages.push({ role: 'user', content: ex.user });
          messages.push({ role: 'assistant', content: ex.assistant });
        }
      }
    }
    messages.push(...sessionMessages);
    messages.push({ role: 'user', content: userMessage });
    return messages;
  }

  private async getSessionModel(sessionId: string): Promise<{ modelId: string; modelName: string }> {
    const sessions = await sql`
      SELECT s.*, p."modelId" as "personaModelId",
             m.id as "aiModelId", m.provider, m."modelIdentifier", m."displayName"
      FROM "Session" s
      LEFT JOIN "Persona" p ON s."personaId" = p.id
      LEFT JOIN "AIModel" m ON s."aiModelId" = m.id OR p."modelId" = m.id
      WHERE s.id = ${sessionId}
    `;
    const session = sessions[0];
    if (!session) throw new Error(`Session ${sessionId} not found`);
    if (session.modelOverride) return { modelId: session.modelOverride, modelName: session.modelOverride };
    if (session.aiModelId) return { modelId: session.aiModelId, modelName: `${session.provider}/${session.modelIdentifier}` };
    if (session.personaModelId) {
      const personaModels = await sql`SELECT * FROM "AIModel" WHERE id = ${session.personaModelId}`;
      const personaModel = personaModels[0];
      if (personaModel) return { modelId: personaModel.id, modelName: `${personaModel.provider}/${personaModel.modelIdentifier}` };
    }
    const defaultModels = await sql`SELECT * FROM "AIModel" WHERE "isActive" = true LIMIT 1`;
    const defaultModel = defaultModels[0];
    if (!defaultModel) throw new Error('No default AI model configured');
    return { modelId: defaultModel.id, modelName: `${defaultModel.provider}/${defaultModel.modelIdentifier}` };
  }

  async sendMessage(sessionId: string, userId: string, userMessage: string, options: Partial<LLMCompletionOptions> = {}): Promise<LLMServiceResponse> {
    if (!this.provider) throw new Error('LLM provider not initialized');
    const startTime = Date.now();
    const sessions = await sql`SELECT * FROM "Session" WHERE id = ${sessionId} AND "userId" = ${userId}`;
    const session = sessions[0];
    if (!session) throw new Error('Session not found or access denied');
    const personaContext = session.personaId ? await this.getPersonaContext(session.personaId) : null;
    const sessionMessages = await sql`SELECT * FROM "Message" WHERE "sessionId" = ${sessionId} ORDER BY "createdAt" ASC LIMIT 20`;
    const llmSessionMessages: LLMMessage[] = sessionMessages.map((msg: any) => ({ role: msg.role.toLowerCase() as 'system' | 'user' | 'assistant', content: msg.content }));
    const messages = this.buildPersonaAwareMessages(userMessage, personaContext, llmSessionMessages);
    const { modelName } = await this.getSessionModel(sessionId);
    const completionOptions: LLMCompletionOptions = { model: modelName, temperature: 0.7, maxTokens: 1000, ...options, ...(personaContext?.modelParams || {}) };
    const response = await this.provider.complete(messages, completionOptions);
    return {
      content: response.content,
      modelUsed: response.model,
      inputTokens: response.usage?.promptTokens || 0,
      outputTokens: response.usage?.completionTokens || 0,
      totalTokens: response.usage?.totalTokens || 0,
      finishReason: response.finishReason || 'stop',
      latencyMs: Date.now() - startTime,
    };
  }

  async sendStreamingMessage(sessionId: string, userId: string, userMessage: string, onChunk: (chunk: string, isComplete: boolean) => void, options: Partial<LLMCompletionOptions> = {}): Promise<LLMServiceResponse> {
    if (!this.provider) throw new Error('LLM provider not initialized');
    const startTime = Date.now();
    let fullResponse = '';
    const sessions = await sql`SELECT * FROM "Session" WHERE id = ${sessionId} AND "userId" = ${userId}`;
    const session = sessions[0];
    if (!session) throw new Error('Session not found or access denied');
    const personaContext = session.personaId ? await this.getPersonaContext(session.personaId) : null;
    const sessionMessages = await sql`SELECT * FROM "Message" WHERE "sessionId" = ${sessionId} ORDER BY "createdAt" ASC LIMIT 20`;
    const llmSessionMessages: LLMMessage[] = sessionMessages.map((msg: any) => ({ role: msg.role.toLowerCase() as 'system' | 'user' | 'assistant', content: msg.content }));
    const messages = this.buildPersonaAwareMessages(userMessage, personaContext, llmSessionMessages);
    const { modelName } = await this.getSessionModel(sessionId);
    const completionOptions: LLMCompletionOptions = { model: modelName, temperature: 0.7, maxTokens: 1000, ...options };
    if (!this.provider.completeStream) throw new Error('Provider does not support streaming');
    const response = await this.provider.completeStream(messages, (chunk: string) => { fullResponse += chunk; onChunk(chunk, false); }, completionOptions);
    const inputTokens = Math.ceil(messages.reduce((a: number, m: LLMMessage) => a + m.content.length, 0) / 4);
    const outputTokens = Math.ceil(fullResponse.length / 4);
    onChunk('', true);
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

  async countTokens(messages: LLMMessage[]): Promise<number> {
    if (!this.provider) throw new Error('LLM provider not initialized');
    return this.provider.countTokens(messages);
  }

  async getAvailableModels(): Promise<string[]> {
    if (!this.provider) throw new Error('LLM provider not initialized');
    return this.provider.getAvailableModels();
  }

  async validateProvider(): Promise<boolean> {
    if (!this.provider) throw new Error('LLM provider not initialized');
    return this.provider.validateConfig ? this.provider.validateConfig() : true;
  }
}
