import axios, { AxiosInstance } from 'axios';
import type { LLMProvider, Message, CompletionOptions, CompletionResponse } from 'lexagentic';

export class OpenRouterProvider implements LLMProvider {
  readonly name = 'openrouter';
  private client: AxiosInstance | null = null;

  constructor(apiKey?: string) {
    const key = apiKey || process.env.OPENROUTER_API_KEY;
    if (key) {
      this.client = axios.create({
        baseURL: process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1',
        timeout: parseInt(process.env.OPENROUTER_TIMEOUT || '30000'),
        headers: {
          'Authorization': `Bearer ${key}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://persona-bot-v2.local',
          'X-Title': 'Persona Bot v2',
        },
      });
    }
  }

  async complete(messages: Message[], options?: CompletionOptions): Promise<CompletionResponse> {
    if (!this.client) throw new Error('OpenRouter client not initialized');
    const response = await this.client.post('/chat/completions', {
      model: options?.model || 'openai/gpt-4',
      messages: messages.map(m => ({ role: m.role, content: m.content, ...(m.name && { name: m.name }) })),
      temperature: options?.temperature,
      max_tokens: options?.maxTokens,
      top_p: options?.topP,
      frequency_penalty: options?.frequencyPenalty,
      presence_penalty: options?.presencePenalty,
      stop: options?.stop,
      stream: false,
    });
    const data = response.data;
    return {
      content: data.choices[0].message.content || '',
      model: data.model,
      usage: { promptTokens: data.usage?.prompt_tokens || 0, completionTokens: data.usage?.completion_tokens || 0, totalTokens: data.usage?.total_tokens || 0 },
      finishReason: data.choices[0].finish_reason || 'stop',
      id: data.id,
      created: data.created,
    };
  }

  async completeStream(messages: Message[], onChunk: (chunk: string) => void, options?: CompletionOptions): Promise<CompletionResponse> {
    if (!this.client) throw new Error('OpenRouter client not initialized');
    const response = await this.client.post('/chat/completions', {
      model: options?.model || 'openai/gpt-4',
      messages: messages.map(m => ({ role: m.role, content: m.content, ...(m.name && { name: m.name }) })),
      temperature: options?.temperature,
      max_tokens: options?.maxTokens,
      top_p: options?.topP,
      frequency_penalty: options?.frequencyPenalty,
      presence_penalty: options?.presencePenalty,
      stop: options?.stop,
      stream: true,
    }, { responseType: 'stream' });
    const stream = response.data;
    let buffer = '';
    let fullResponse = '';
    let responseId = '';
    let responseModel = '';
    let finishReason = 'stop';
    for await (const chunk of stream) {
      buffer += chunk.toString();
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';
      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        const data = line.slice(6).trim();
        if (data === '[DONE]') continue;
        try {
          const parsed = JSON.parse(data);
          if (parsed.id) responseId = parsed.id;
          if (parsed.model) responseModel = parsed.model;
          const content = parsed.choices?.[0]?.delta?.content || '';
          if (content) { fullResponse += content; onChunk(content); }
          if (parsed.choices?.[0]?.finish_reason) finishReason = parsed.choices[0].finish_reason;
        } catch { /* skip unparseable chunks */ }
      }
    }
    return { content: fullResponse, model: responseModel || options?.model || 'unknown', finishReason, id: responseId };
  }

  async countTokens(messages: Message[]): Promise<number> {
    if (!this.client) throw new Error('OpenRouter client not initialized');
    try {
      const response = await this.client.post('/tokenize', {
        messages: messages.map(m => ({ role: m.role, content: m.content })),
      });
      return response.data.tokens || 0;
    } catch {
      return Math.ceil(messages.reduce((a, m) => a + m.content.length, 0) / 4);
    }
  }

  async getAvailableModels(): Promise<string[]> {
    if (!this.client) throw new Error('OpenRouter client not initialized');
    try {
      const response = await this.client.get('/models');
      return response.data.data.filter((m: any) => m.architecture?.modality === 'text').map((m: any) => m.id);
    } catch {
      return ['openai/gpt-4', 'openai/gpt-4-turbo', 'openai/gpt-3.5-turbo', 'anthropic/claude-3-opus', 'anthropic/claude-3-sonnet', 'anthropic/claude-3-haiku', 'google/gemini-pro', 'meta-llama/llama-3-70b-instruct', 'mistralai/mistral-7b-instruct'];
    }
  }

  async validateConfig(): Promise<boolean> {
    if (!this.client) return false;
    try { await this.client.get('/auth/key'); return true; } catch { return false; }
  }
}
