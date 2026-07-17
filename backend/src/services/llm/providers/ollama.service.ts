import axios, { AxiosInstance } from 'axios';
import type { LLMProvider, Message, CompletionOptions, CompletionResponse } from 'lexagentic';

export class OllamaProvider implements LLMProvider {
  readonly name = 'ollama';
  private client: AxiosInstance | null = null;

  constructor(baseURL?: string) {
    const url = baseURL || process.env.OLLAMA_BASE_URL;
    if (url) {
      this.client = axios.create({
        baseURL: url,
        timeout: parseInt(process.env.OLLAMA_TIMEOUT || '60000'),
        headers: { 'Content-Type': 'application/json' },
      });
    }
  }

  async complete(messages: Message[], options?: CompletionOptions): Promise<CompletionResponse> {
    if (!this.client) throw new Error('Ollama client not initialized');
    const response = await this.client.post('/api/chat', {
      model: options?.model || 'llama3.2',
      messages: messages.map(m => ({ role: m.role, content: m.content })),
      stream: false,
      options: { temperature: options?.temperature, top_p: options?.topP, num_predict: options?.maxTokens, stop: options?.stop },
    });
    const data = response.data;
    return {
      content: data.message?.content || '',
      model: data.model,
      usage: { promptTokens: this.estimateTokens(messages), completionTokens: this.estimateTokens([{ role: 'assistant' as const, content: data.message?.content || '' }]), totalTokens: this.estimateTokens(messages) + this.estimateTokens([{ role: 'assistant' as const, content: data.message?.content || '' }]) },
      finishReason: data.done ? 'stop' : undefined,
    };
  }

  async completeStream(messages: Message[], onChunk: (chunk: string) => void, options?: CompletionOptions): Promise<CompletionResponse> {
    if (!this.client) throw new Error('Ollama client not initialized');
    const response = await this.client.post('/api/chat', {
      model: options?.model || 'llama3.2',
      messages: messages.map(m => ({ role: m.role, content: m.content })),
      stream: true,
      options: { temperature: options?.temperature, top_p: options?.topP, num_predict: options?.maxTokens, stop: options?.stop },
    }, { responseType: 'stream' });
    const stream = response.data;
    let buffer = '';
    let fullResponse = '';
    let responseModel = '';
    for await (const chunk of stream) {
      buffer += chunk.toString();
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';
      for (const line of lines) {
        if (!line.trim()) continue;
        try {
          const data = JSON.parse(line);
          if (data.model) responseModel = data.model;
          if (data.message?.content) { fullResponse += data.message.content; onChunk(data.message.content); }
        } catch { /* skip unparseable */ }
      }
    }
    return {
      content: fullResponse,
      model: responseModel || options?.model || 'unknown',
      usage: { promptTokens: this.estimateTokens(messages), completionTokens: this.estimateTokens([{ role: 'assistant' as const, content: fullResponse }]), totalTokens: this.estimateTokens(messages) + this.estimateTokens([{ role: 'assistant' as const, content: fullResponse }]) },
      finishReason: 'stop',
    };
  }

  async countTokens(messages: Message[]): Promise<number> { return this.estimateTokens(messages); }

  async getAvailableModels(): Promise<string[]> {
    if (!this.client) return [];
    try {
      const response = await this.client.get('/api/tags');
      return response.data.models?.map((m: any) => m.name) || [];
    } catch {
      return ['llama3.2:3b', 'llama3.2:1b', 'mistral', 'mixtral', 'codellama', 'phi', 'gemma'];
    }
  }

  async validateConfig(): Promise<boolean> {
    if (!this.client) return false;
    try { await this.client.get('/api/tags'); return true; } catch { return false; }
  }

  private estimateTokens(messages: Message[]): number {
    return Math.ceil(messages.reduce((a, m) => a + m.content.length, 0) / 4);
  }
}
