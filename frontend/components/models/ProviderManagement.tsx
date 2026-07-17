'use client';

import { useState } from 'react';
import { ProviderInfo, modelApi } from '@/lib/api/model';
import { ProviderDiscovery } from './ProviderDiscovery';

interface ProviderManagementProps {
  providers: ProviderInfo[];
  onRefresh: () => void;
}

export function ProviderManagement({ providers, onRefresh }: ProviderManagementProps) {
  const [discoveringProvider, setDiscoveringProvider] = useState<string | null>(null);
  const [discoveryError, setDiscoveryError] = useState<string | null>(null);

  const handleDiscoverModels = (providerName: string) => {
    setDiscoveringProvider(providerName);
    setDiscoveryError(null);
  };

  const handleDiscoveryComplete = () => {
    setDiscoveringProvider(null);
    onRefresh(); // Refresh the provider list
  };

  const getProviderIcon = (provider: string) => {
    const icons: Record<string, string> = {
      openai: '🤖',
      anthropic: '🧠',
      google: '🔍',
      ollama: '🦙',
      openrouter: '🌐',
    };
    return icons[provider] || '⚙️';
  };

  const getCapabilityBadge = (capability: string) => {
    const colors: Record<string, string> = {
      chat: 'bg-blue-100 text-blue-800',
      streaming: 'bg-green-100 text-green-800',
      'function_calling': 'bg-purple-100 text-purple-800',
    };
    return colors[capability] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="space-y-6">
      <div className="rounded-lg border bg-card p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">LLM Providers</h2>
            <p className="text-sm text-muted-foreground">
              Manage and configure LLM providers
            </p>
          </div>
          <button
            onClick={onRefresh}
            className="rounded-lg border px-4 py-2 text-sm font-medium transition-colors hover:bg-accent"
          >
            Refresh
          </button>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {providers.map(provider => (
            <div key={provider.name} className="rounded-lg border bg-background p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <div className="text-2xl">{getProviderIcon(provider.name)}</div>
                  <div>
                    <h3 className="font-semibold">{provider.displayName}</h3>
                    <p className="text-sm text-muted-foreground">{provider.description}</p>
                  </div>
                </div>
                <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium">
                  {provider.modelCount} models
                </span>
              </div>

              <div className="mt-4">
                <div className="mb-2 text-sm font-medium">Capabilities</div>
                <div className="flex flex-wrap gap-1">
                  {provider.capabilities.map(capability => (
                    <span
                      key={capability}
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${getCapabilityBadge(capability)}`}
                    >
                      {capability.replace('_', ' ')}
                    </span>
                  ))}
                </div>
              </div>

              <div className="mt-4 flex gap-2">
                <button
                  onClick={() => handleDiscoverModels(provider.name)}
                  className="flex-1 rounded-md border bg-background px-3 py-1.5 text-sm font-medium transition-colors hover:bg-accent"
                >
                  Discover Models
                </button>
                <button
                  onClick={() => {
                    // TODO: Implement provider configuration
                    alert('Provider configuration coming soon');
                  }}
                  className="flex-1 rounded-md bg-primary/10 px-3 py-1.5 text-sm font-medium text-primary transition-colors hover:bg-primary/20"
                >
                  Configure
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {discoveringProvider && (
        <div className="rounded-lg border bg-card p-6">
          <ProviderDiscovery
            providerName={discoveringProvider}
            onComplete={handleDiscoveryComplete}
            onCancel={() => setDiscoveringProvider(null)}
          />
        </div>
      )}

      {discoveryError && (
        <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-4">
          <p className="text-sm text-destructive">{discoveryError}</p>
        </div>
      )}

      <div className="rounded-lg border bg-card p-6">
        <h3 className="mb-4 text-lg font-semibold">Provider Configuration Notes</h3>
        <div className="space-y-3 text-sm text-muted-foreground">
          <div className="flex items-start space-x-2">
            <div className="mt-0.5 h-2 w-2 rounded-full bg-primary"></div>
            <p>
              <strong>OpenAI:</strong> Requires API key. Supports GPT-4, GPT-3.5, and other models.
            </p>
          </div>
          <div className="flex items-start space-x-2">
            <div className="mt-0.5 h-2 w-2 rounded-full bg-primary"></div>
            <p>
              <strong>Anthropic:</strong> Requires API key. Supports Claude 3 models.
            </p>
          </div>
          <div className="flex items-start space-x-2">
            <div className="mt-0.5 h-2 w-2 rounded-full bg-primary"></div>
            <p>
              <strong>Google:</strong> Requires API key. Supports Gemini models.
            </p>
          </div>
          <div className="flex items-start space-x-2">
            <div className="mt-0.5 h-2 w-2 rounded-full bg-primary"></div>
            <p>
              <strong>Ollama:</strong> Requires local Ollama installation. Endpoint defaults to http://localhost:11434.
            </p>
          </div>
          <div className="flex items-start space-x-2">
            <div className="mt-0.5 h-2 w-2 rounded-full bg-primary"></div>
            <p>
              <strong>OpenRouter:</strong> Aggregates multiple providers. Requires OpenRouter API key.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}