import { LLMProviderFactory as LexFactory } from 'lexagentic';
import type { LLMProvider } from './llm.types';
import { GeminiProvider } from './providers/gemini.service';
import { OpenRouterProvider } from './providers/openrouter.service';
import { OllamaProvider } from './providers/ollama.service';

export type ProviderType = 'openai' | 'anthropic' | 'google' | 'ollama' | 'openrouter' | 'mock';

interface ProviderRegistry {
  type: ProviderType;
  provider: LLMProvider;
}

export class LLMProviderFactory {
  private lexFactory = LexFactory.getInstance();
  private localProviders = new Map<ProviderType, LLMProvider>();

  registerProvider(type: ProviderType, provider: LLMProvider): void {
    this.localProviders.set(type, provider);
  }

  getProvider(type: ProviderType): LLMProvider | null {
    if (this.localProviders.has(type)) return this.localProviders.get(type) || null;
    const lexProvider = this.lexFactory.getProvider(type);
    if (lexProvider) return lexProvider;
    return null;
  }

  getAllProviders(): ProviderRegistry[] {
    const result: ProviderRegistry[] = [];
    for (const [type, provider] of this.localProviders) {
      result.push({ type, provider });
    }
    for (const provider of this.lexFactory.getAvailableProviders()) {
      if (!this.localProviders.has(provider.name as ProviderType)) {
        result.push({ type: provider.name as ProviderType, provider });
      }
    }
    return result;
  }

  initializeFromEnv(): { openai: boolean; anthropic: boolean; google: boolean; ollama: boolean; openrouter: boolean; mock: boolean } {
    const results = { openai: false, anthropic: false, google: false, ollama: false, openrouter: false, mock: false };

    const { registered } = this.lexFactory.initializeFromEnv();
    for (const name of registered) {
      if (name === 'openai') results.openai = true;
      if (name === 'anthropic') results.anthropic = true;
      if (name === 'mock') results.mock = true;
    }

    if (process.env.GOOGLE_GEMINI_API_KEY) {
      try {
        this.registerProvider('google', new GeminiProvider());
        results.google = true;
        console.log('Gemini provider initialized successfully');
      } catch (err) {
        console.error('Failed to initialize Gemini provider:', err);
      }
    }

    if (process.env.OPENROUTER_API_KEY) {
      try {
        this.registerProvider('openrouter', new OpenRouterProvider());
        results.openrouter = true;
        console.log('OpenRouter provider initialized successfully');
      } catch (err) {
        console.error('Failed to initialize OpenRouter provider:', err);
      }
    }

    if (process.env.OLLAMA_ENABLED === 'true') {
      try {
        const baseURL = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
        this.registerProvider('ollama', new OllamaProvider(baseURL));
        results.ollama = true;
        console.log(`Ollama provider initialized with base URL: ${baseURL}`);
      } catch (err) {
        console.error('Failed to initialize Ollama provider:', err);
      }
    }

    if (!results.openai && !results.anthropic && !results.google && !results.openrouter && !results.ollama && process.env.NODE_ENV !== 'production') {
      results.mock = true;
    }

    return results;
  }

  async validateProviders(): Promise<Record<ProviderType, boolean>> {
    const validations: Record<string, boolean> = {};
    for (const [type, provider] of this.localProviders) {
      try {
        validations[type] = provider.validateConfig ? await provider.validateConfig() : true;
      } catch {
        validations[type] = false;
      }
    }
    for (const p of this.lexFactory.getAvailableProviders()) {
      if (!this.localProviders.has(p.name as ProviderType)) {
        try {
          validations[p.name] = p.validateConfig ? await p.validateConfig() : true;
        } catch {
          validations[p.name] = false;
        }
      }
    }
    return validations as Record<ProviderType, boolean>;
  }

  getDefaultProvider(): LLMProvider | null {
    const priority: ProviderType[] = ['openai', 'anthropic', 'google', 'openrouter', 'ollama', 'mock'];
    for (const type of priority) {
      const p = this.getProvider(type);
      if (p) return p;
    }
    return null;
  }

  getDefaultProviderType(): ProviderType | null {
    const provider = this.getDefaultProvider();
    if (!provider) return null;
    for (const type of this.getAllProviders()) {
      if (type.provider === provider) return type.type;
    }
    return null;
  }
}

export const llmProviderFactory = new LLMProviderFactory();
