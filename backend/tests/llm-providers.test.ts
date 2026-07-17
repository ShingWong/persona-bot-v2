import { OpenAIProvider } from 'lexagentic';
import { AnthropicProvider } from 'lexagentic';
import { MockProvider } from 'lexagentic';
import { GeminiProvider } from '../src/services/llm/providers/gemini.service';
import { OpenRouterProvider } from '../src/services/llm/providers/openrouter.service';
import { OllamaProvider } from '../src/services/llm/providers/ollama.service';
import type { LLMMessage, LLMCompletionOptions } from '../src/services/llm/llm.types';
import type { LLMProvider, CompletionResponse } from 'lexagentic';

describe('LLM Providers', () => {
  const testMessages: LLMMessage[] = [
    { role: 'system', content: 'You are a helpful assistant.' },
    { role: 'user', content: 'Hello, how are you?' },
  ];

  const testOptions: LLMCompletionOptions = {
    model: 'test-model',
    temperature: 0.7,
    maxTokens: 100,
  };

  describe('Mock Provider', () => {
    let provider: MockProvider;

    beforeEach(() => {
      provider = new MockProvider();
    });

    test('should create completion', async () => {
      const response: CompletionResponse = await provider.complete(testMessages, testOptions);
      expect(response).toBeDefined();
      expect(response.content).toBeDefined();
      expect(response.model).toBe('mock-model');
    });

    test('should create streaming completion', async () => {
      const chunks: string[] = [];
      const response = await provider.completeStream(testMessages, (chunk) => chunks.push(chunk), testOptions);
      expect(response).toBeDefined();
      expect(chunks.length).toBeGreaterThan(0);
      expect(response.content).toBe(chunks.join(''));
    });

    test('should count tokens', async () => {
      const tokens = await provider.countTokens(testMessages);
      expect(tokens).toBeGreaterThan(0);
    });

    test('should get available models', async () => {
      const models = await provider.getAvailableModels();
      expect(models).toBeDefined();
      expect(models.length).toBeGreaterThan(0);
    });
  });

  describe('Lexagentic OpenAI Provider', () => {
    let provider: OpenAIProvider;

    beforeEach(() => {
      provider = new OpenAIProvider();
    });

    test('should throw error when no API key', async () => {
      await expect(provider.complete(testMessages, testOptions))
        .rejects.toThrow();
    });
  });

  describe('Lexagentic Anthropic Provider', () => {
    let provider: AnthropicProvider;

    beforeEach(() => {
      provider = new AnthropicProvider();
    });

    test('should throw error when no API key', async () => {
      await expect(provider.complete(testMessages, testOptions))
        .rejects.toThrow();
    });
  });

  describe('Google Gemini Provider', () => {
    let provider: GeminiProvider;

    beforeEach(() => {
      provider = new GeminiProvider();
    });

    test('should throw error when no API key', async () => {
      await expect(provider.complete(testMessages, testOptions))
        .rejects.toThrow('Gemini client not initialized');
    });
  });

  describe('OpenRouter Provider', () => {
    let provider: OpenRouterProvider;

    beforeEach(() => {
      provider = new OpenRouterProvider();
    });

    test('should throw error when no API key', async () => {
      await expect(provider.complete(testMessages, testOptions))
        .rejects.toThrow('OpenRouter client not initialized');
    });
  });

  describe('Ollama Provider', () => {
    let provider: OllamaProvider;

    beforeEach(() => {
      provider = new OllamaProvider();
    });

    test('should throw error when not running', async () => {
      await expect(provider.complete(testMessages, testOptions))
        .rejects.toThrow('Ollama client not initialized');
    });
  });

  describe('Provider Interface Compliance', () => {
    test('all providers should implement LLMProvider interface', () => {
      const providers: LLMProvider[] = [
        new OpenAIProvider(),
        new AnthropicProvider(),
        new MockProvider(),
        new GeminiProvider(),
        new OpenRouterProvider(),
        new OllamaProvider(),
      ];

      for (const p of providers) {
        expect(p.name).toBeDefined();
        expect(p.complete).toBeDefined();
        expect(p.countTokens).toBeDefined();
        expect(p.getAvailableModels).toBeDefined();
        expect(typeof p.name).toBe('string');
        expect(typeof p.complete).toBe('function');
        expect(typeof p.countTokens).toBe('function');
        expect(typeof p.getAvailableModels).toBe('function');
      }
    });
  });
});
