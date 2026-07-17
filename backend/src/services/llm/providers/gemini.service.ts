import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';
import type { LLMProvider, Message, CompletionOptions, CompletionResponse } from 'lexagentic';

export class GeminiProvider implements LLMProvider {
  readonly name = 'google';
  private client: GoogleGenerativeAI | null = null;
  private modelCache = new Map<string, GenerativeModel>();

  constructor(apiKey?: string) {
    const key = apiKey || process.env.GOOGLE_GEMINI_API_KEY;
    if (key) this.client = new GoogleGenerativeAI(key);
  }

  async complete(messages: Message[], options?: CompletionOptions): Promise<CompletionResponse> {
    if (!this.client) throw new Error('Gemini client not initialized');
    const model = this.getModel(options?.model || 'gemini-1.5-flash');
    const history = this.convertToGeminiHistory(messages.slice(0, -1));
    const lastMsg = messages[messages.length - 1];
    const result = await model.generateContent({
      contents: [...history, { role: lastMsg.role === 'assistant' ? 'model' : 'user', parts: [{ text: lastMsg.content }] }],
      generationConfig: { temperature: options?.temperature, topP: options?.topP, maxOutputTokens: options?.maxTokens, stopSequences: options?.stop },
    });
    const response = result.response;
    return {
      content: response.text(),
      model: options?.model || 'gemini-1.5-flash',
      usage: { promptTokens: response.usageMetadata?.promptTokenCount || 0, completionTokens: response.usageMetadata?.candidatesTokenCount || 0, totalTokens: response.usageMetadata?.totalTokenCount || 0 },
      finishReason: response.candidates?.[0]?.finishReason?.toLowerCase() || 'stop',
      id: `gemini-${Date.now()}`,
      created: Date.now(),
    };
  }

  async completeStream(messages: Message[], onChunk: (chunk: string) => void, options?: CompletionOptions): Promise<CompletionResponse> {
    if (!this.client) throw new Error('Gemini client not initialized');
    const model = this.getModel(options?.model || 'gemini-1.5-flash');
    const history = this.convertToGeminiHistory(messages.slice(0, -1));
    const lastMsg = messages[messages.length - 1];
    const result = await model.generateContentStream({
      contents: [...history, { role: lastMsg.role === 'assistant' ? 'model' : 'user', parts: [{ text: lastMsg.content }] }],
      generationConfig: { temperature: options?.temperature, topP: options?.topP, maxOutputTokens: options?.maxTokens, stopSequences: options?.stop },
    });
    let fullResponse = '';
    for await (const chunk of result.stream) {
      const text = chunk.text();
      if (text) { fullResponse += text; onChunk(text); }
    }
    const response = await result.response;
    return {
      content: fullResponse,
      model: options?.model || 'gemini-1.5-flash',
      usage: { promptTokens: response.usageMetadata?.promptTokenCount || 0, completionTokens: response.usageMetadata?.candidatesTokenCount || 0, totalTokens: response.usageMetadata?.totalTokenCount || 0 },
      finishReason: response.candidates?.[0]?.finishReason?.toLowerCase() || 'stop',
      id: `gemini-stream-${Date.now()}`,
      created: Date.now(),
    };
  }

  async countTokens(messages: Message[]): Promise<number> {
    if (!this.client) throw new Error('Gemini client not initialized');
    try {
      const model = this.getModel('gemini-pro');
      const result = await model.countTokens({ contents: this.convertToGeminiHistory(messages) });
      return result.totalTokens;
    } catch {
      return Math.ceil(messages.reduce((a, m) => a + m.content.length, 0) / 4);
    }
  }

  async getAvailableModels(): Promise<string[]> {
    return ['gemini-2.0-flash-exp', 'gemini-1.5-flash', 'gemini-1.5-pro', 'gemini-1.0-pro'];
  }

  async validateConfig(): Promise<boolean> {
    if (!this.client) return false;
    try {
      const model = this.getModel('gemini-1.5-flash');
      await model.generateContent({ contents: [{ role: 'user', parts: [{ text: 'test' }] }], generationConfig: { maxOutputTokens: 1 } });
      return true;
    } catch { return false; }
  }

  private getModel(modelName: string): GenerativeModel {
    if (!this.modelCache.has(modelName)) {
      if (!this.client) throw new Error('Gemini client not initialized');
      this.modelCache.set(modelName, this.client.getGenerativeModel({ model: modelName }));
    }
    return this.modelCache.get(modelName)!;
  }

  private convertToGeminiHistory(messages: Message[]): any[] {
    return messages.map(m => ({ role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: m.content }] }));
  }
}
