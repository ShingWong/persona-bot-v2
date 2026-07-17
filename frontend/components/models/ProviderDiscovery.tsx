'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { modelApi, DiscoveredModel } from '@/lib/api/model';

const discoverySchema = z.object({
  apiKey: z.string().optional(),
  endpoint: z.string().url().optional(),
});

type DiscoveryFormData = z.infer<typeof discoverySchema>;

interface ProviderDiscoveryProps {
  providerName: string;
  onComplete: () => void;
  onCancel: () => void;
}

export function ProviderDiscovery({ providerName, onComplete, onCancel }: ProviderDiscoveryProps) {
  const [isDiscovering, setIsDiscovering] = useState(false);
  const [discoveredModels, setDiscoveredModels] = useState<DiscoveredModel[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [selectedModels, setSelectedModels] = useState<string[]>([]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<DiscoveryFormData>({
    resolver: zodResolver(discoverySchema),
    defaultValues: {
      apiKey: '',
      endpoint: providerName === 'ollama' ? 'http://localhost:11434' : '',
    },
  });

  const handleDiscover = async (data: DiscoveryFormData) => {
    try {
      setIsDiscovering(true);
      setError(null);
      setDiscoveredModels([]);
      setSelectedModels([]);

      const response = await modelApi.discoverModels({
        provider: providerName,
        apiKey: data.apiKey || undefined,
        endpoint: data.endpoint || undefined,
      });

      setDiscoveredModels(response.data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to discover models');
    } finally {
      setIsDiscovering(false);
    }
  };

  const handleModelToggle = (modelIdentifier: string) => {
    setSelectedModels(prev =>
      prev.includes(modelIdentifier)
        ? prev.filter(id => id !== modelIdentifier)
        : [...prev, modelIdentifier]
    );
  };

  const handleImportSelected = async () => {
    try {
      setIsDiscovering(true);
      setError(null);

      // TODO: Implement bulk import
      // For now, show success message
      alert(`Importing ${selectedModels.length} models... (Feature coming soon)`);
      
      // Simulate success
      setTimeout(() => {
        onComplete();
      }, 1000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to import models');
    } finally {
      setIsDiscovering(false);
    }
  };

  const getProviderDisplayName = () => {
    const names: Record<string, string> = {
      openai: 'OpenAI',
      anthropic: 'Anthropic',
      google: 'Google',
      ollama: 'Ollama',
      openrouter: 'OpenRouter',
    };
    return names[providerName] || providerName;
  };

  const getEndpointPlaceholder = () => {
    const placeholders: Record<string, string> = {
      openai: 'https://api.openai.com/v1',
      anthropic: 'https://api.anthropic.com',
      google: 'https://generativelanguage.googleapis.com',
      ollama: 'http://localhost:11434',
      openrouter: 'https://openrouter.ai/api/v1',
    };
    return placeholders[providerName] || 'https://api.example.com';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Discover Models from {getProviderDisplayName()}</h3>
          <p className="text-sm text-muted-foreground">
            Enter credentials to discover available models
          </p>
        </div>
        <button
          onClick={onCancel}
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          Cancel
        </button>
      </div>

      <form onSubmit={handleSubmit(handleDiscover)} className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium">API Key</label>
            <input
              type="password"
              {...register('apiKey')}
              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
              placeholder="sk-... or your API key"
            />
            {errors.apiKey && (
              <p className="mt-1 text-sm text-destructive">{errors.apiKey.message}</p>
            )}
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">Endpoint URL</label>
            <input
              type="url"
              {...register('endpoint')}
              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
              placeholder={getEndpointPlaceholder()}
            />
            {errors.endpoint && (
              <p className="mt-1 text-sm text-destructive">{errors.endpoint.message}</p>
            )}
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isDiscovering}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
          >
            {isDiscovering ? 'Discovering...' : 'Discover Models'}
          </button>
        </div>
      </form>

      {error && (
        <div className="rounded-md bg-destructive/10 p-3">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      {discoveredModels.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-medium">Discovered Models ({discoveredModels.length})</h4>
            <div className="text-sm text-muted-foreground">
              {selectedModels.length} selected
            </div>
          </div>

          <div className="max-h-64 overflow-y-auto rounded-md border">
            {discoveredModels.map(model => (
              <div
                key={model.modelIdentifier}
                className="flex items-center justify-between border-b p-3 last:border-b-0"
              >
                <div>
                  <div className="font-medium">{model.displayName}</div>
                  <div className="text-sm text-muted-foreground">
                    {model.modelIdentifier}
                  </div>
                </div>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={selectedModels.includes(model.modelIdentifier)}
                    onChange={() => handleModelToggle(model.modelIdentifier)}
                    className="h-4 w-4 rounded border"
                  />
                  <span className="text-sm">Import</span>
                </label>
              </div>
            ))}
          </div>

          <div className="flex justify-end space-x-3">
            <button
              onClick={() => setSelectedModels(discoveredModels.map(m => m.modelIdentifier))}
              className="rounded-md border px-3 py-1.5 text-sm font-medium transition-colors hover:bg-accent"
            >
              Select All
            </button>
            <button
              onClick={() => setSelectedModels([])}
              className="rounded-md border px-3 py-1.5 text-sm font-medium transition-colors hover:bg-accent"
            >
              Clear All
            </button>
            <button
              onClick={handleImportSelected}
              disabled={selectedModels.length === 0 || isDiscovering}
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
            >
              {isDiscovering ? 'Importing...' : `Import Selected (${selectedModels.length})`}
            </button>
          </div>
        </div>
      )}

      {discoveredModels.length === 0 && !error && !isDiscovering && (
        <div className="rounded-lg border border-dashed p-8 text-center">
          <p className="text-muted-foreground">
            Enter credentials and click "Discover Models" to find available models
          </p>
        </div>
      )}
    </div>
  );
}