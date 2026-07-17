'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const configurationSchema = z.object({
  defaultModelId: z.string().optional(),
  enableModelDiscovery: z.boolean().default(true),
  autoTestConnections: z.boolean().default(false),
  costTrackingEnabled: z.boolean().default(true),
  maxTokensPerRequest: z.number().min(100).max(100000).default(4000),
  defaultTemperature: z.number().min(0).max(2).default(0.7),
  defaultTopP: z.number().min(0).max(1).default(1),
  defaultFrequencyPenalty: z.number().min(-2).max(2).default(0),
  defaultPresencePenalty: z.number().min(-2).max(2).default(0),
});

type ConfigurationFormData = z.infer<typeof configurationSchema>;

export function ModelConfiguration() {
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ConfigurationFormData>({
    resolver: zodResolver(configurationSchema),
    defaultValues: {
      defaultModelId: '',
      enableModelDiscovery: true,
      autoTestConnections: false,
      costTrackingEnabled: true,
      maxTokensPerRequest: 4000,
      defaultTemperature: 0.7,
      defaultTopP: 1,
      defaultFrequencyPenalty: 0,
      defaultPresencePenalty: 0,
    },
  });

  const onSubmit = async (data: ConfigurationFormData) => {
    try {
      setIsSaving(true);
      setSaveSuccess(false);

      // TODO: Implement API call to save configuration
      // For now, simulate success
      await new Promise(resolve => setTimeout(resolve, 1000));

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      alert('Failed to save configuration');
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    reset();
  };

  return (
    <div className="space-y-6">
      <div className="rounded-lg border bg-card p-6">
        <div className="mb-6">
          <h2 className="text-lg font-semibold">Global Model Configuration</h2>
          <p className="text-sm text-muted-foreground">
            Configure global settings for AI models and providers
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-4">
            <h3 className="font-medium">General Settings</h3>
            
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium">Default Model</label>
                <select
                  {...register('defaultModelId')}
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                >
                  <option value="">Select default model</option>
                  <option value="gpt-4">GPT-4 (OpenAI)</option>
                  <option value="claude-3">Claude 3 (Anthropic)</option>
                  <option value="gemini-pro">Gemini Pro (Google)</option>
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">Max Tokens per Request</label>
                <input
                  type="number"
                  {...register('maxTokensPerRequest', { valueAsNumber: true })}
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                />
                {errors.maxTokensPerRequest && (
                  <p className="mt-1 text-sm text-destructive">{errors.maxTokensPerRequest.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-3">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  {...register('enableModelDiscovery')}
                  className="h-4 w-4 rounded border"
                />
                <span className="text-sm font-medium">Enable automatic model discovery</span>
              </label>

              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  {...register('autoTestConnections')}
                  className="h-4 w-4 rounded border"
                />
                <span className="text-sm font-medium">Automatically test model connections</span>
              </label>

              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  {...register('costTrackingEnabled')}
                  className="h-4 w-4 rounded border"
                />
                <span className="text-sm font-medium">Enable cost tracking</span>
              </label>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-medium">Default Model Parameters</h3>
            
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <div>
                <label className="mb-2 block text-sm font-medium">Temperature</label>
                <input
                  type="number"
                  step="0.1"
                  {...register('defaultTemperature', { valueAsNumber: true })}
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                />
                {errors.defaultTemperature && (
                  <p className="mt-1 text-sm text-destructive">{errors.defaultTemperature.message}</p>
                )}
                <p className="mt-1 text-xs text-muted-foreground">0-2, higher = more creative</p>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">Top P</label>
                <input
                  type="number"
                  step="0.1"
                  {...register('defaultTopP', { valueAsNumber: true })}
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                />
                {errors.defaultTopP && (
                  <p className="mt-1 text-sm text-destructive">{errors.defaultTopP.message}</p>
                )}
                <p className="mt-1 text-xs text-muted-foreground">0-1, nucleus sampling</p>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">Frequency Penalty</label>
                <input
                  type="number"
                  step="0.1"
                  {...register('defaultFrequencyPenalty', { valueAsNumber: true })}
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                />
                {errors.defaultFrequencyPenalty && (
                  <p className="mt-1 text-sm text-destructive">{errors.defaultFrequencyPenalty.message}</p>
                )}
                <p className="mt-1 text-xs text-muted-foreground">-2 to 2, reduce repetition</p>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">Presence Penalty</label>
                <input
                  type="number"
                  step="0.1"
                  {...register('defaultPresencePenalty', { valueAsNumber: true })}
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                />
                {errors.defaultPresencePenalty && (
                  <p className="mt-1 text-sm text-destructive">{errors.defaultPresencePenalty.message}</p>
                )}
                <p className="mt-1 text-xs text-muted-foreground">-2 to 2, encourage new topics</p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-medium">Performance & Monitoring</h3>
            
            <div className="rounded-lg border bg-background p-4">
              <div className="grid gap-4 md:grid-cols-3">
                <div>
                  <div className="text-sm font-medium">Model Health</div>
                  <div className="mt-1 text-2xl font-bold text-green-600">98%</div>
                  <div className="text-xs text-muted-foreground">Last 24 hours</div>
                </div>
                <div>
                  <div className="text-sm font-medium">Avg Response Time</div>
                  <div className="mt-1 text-2xl font-bold">1.2s</div>
                  <div className="text-xs text-muted-foreground">Across all models</div>
                </div>
                <div>
                  <div className="text-sm font-medium">Total Cost</div>
                  <div className="mt-1 text-2xl font-bold">$12.45</div>
                  <div className="text-xs text-muted-foreground">This month</div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between border-t pt-6">
            <div>
              {saveSuccess && (
                <div className="rounded-md bg-green-50 p-2">
                  <p className="text-sm text-green-700">Configuration saved successfully!</p>
                </div>
              )}
            </div>
            <div className="flex space-x-3">
              <button
                type="button"
                onClick={handleReset}
                className="rounded-md border px-4 py-2 text-sm font-medium transition-colors hover:bg-accent"
                disabled={isSaving}
              >
                Reset
              </button>
              <button
                type="submit"
                className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
                disabled={isSaving}
              >
                {isSaving ? 'Saving...' : 'Save Configuration'}
              </button>
            </div>
          </div>
        </form>
      </div>

      <div className="rounded-lg border bg-card p-6">
        <h3 className="mb-4 text-lg font-semibold">Configuration Notes</h3>
        <div className="space-y-3 text-sm text-muted-foreground">
          <div className="flex items-start space-x-2">
            <div className="mt-0.5 h-2 w-2 rounded-full bg-primary"></div>
            <p>
              <strong>Model Discovery:</strong> When enabled, the system will periodically check for new models from configured providers.
            </p>
          </div>
          <div className="flex items-start space-x-2">
            <div className="mt-0.5 h-2 w-2 rounded-full bg-primary"></div>
            <p>
              <strong>Auto Test Connections:</strong> Automatically test model connections during discovery and periodically.
            </p>
          </div>
          <div className="flex items-start space-x-2">
            <div className="mt-0.5 h-2 w-2 rounded-full bg-primary"></div>
            <p>
              <strong>Cost Tracking:</strong> Track usage costs across all models. Requires cost per token to be configured for each model.
            </p>
          </div>
          <div className="flex items-start space-x-2">
            <div className="mt-0.5 h-2 w-2 rounded-full bg-primary"></div>
            <p>
              <strong>Default Parameters:</strong> These values will be used when no specific parameters are provided for a model or persona.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}