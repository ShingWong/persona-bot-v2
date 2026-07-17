'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { AIModel, ProviderInfo, modelApi, CreateModelData, UpdateModelData } from '@/lib/api/model';

const modelSchema = z.object({
  provider: z.string().min(1, 'Provider is required'),
  modelIdentifier: z.string().min(1, 'Model identifier is required'),
  displayName: z.string().min(1, 'Display name is required'),
  endpoint: z.string().optional(),
  apiKey: z.string().optional(),
  capabilities: z.array(z.string()).default([]),
  parameters: z.string().default('{}'),
  costPer1kInput: z.string().optional().transform(val => val ? parseFloat(val) : undefined),
  costPer1kOutput: z.string().optional().transform(val => val ? parseFloat(val) : undefined),
  isActive: z.boolean().default(true),
  isDefault: z.boolean().default(false),
});

type ModelFormData = z.infer<typeof modelSchema>;

interface ModelFormProps {
  providers: ProviderInfo[];
  existingModel?: AIModel;
  onSuccess: (model: AIModel) => void;
  onCancel: () => void;
}

export function ModelForm({ providers, existingModel, onSuccess, onCancel }: ModelFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const defaultCapabilities = ['chat', 'streaming', 'function_calling'];
  const defaultParameters = {
    temperature: 0.7,
    max_tokens: 1000,
    top_p: 1,
    frequency_penalty: 0,
    presence_penalty: 0,
  };

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    setValue,
  } = useForm<ModelFormData>({
    resolver: zodResolver(modelSchema),
    defaultValues: existingModel ? {
      provider: existingModel.provider,
      modelIdentifier: existingModel.modelIdentifier,
      displayName: existingModel.displayName,
      endpoint: existingModel.endpoint || '',
      apiKey: existingModel.apiKey || '',
      capabilities: existingModel.capabilities,
      parameters: JSON.stringify(existingModel.parameters, null, 2),
      costPer1kInput: existingModel.costPer1kInput?.toString() || '',
      costPer1kOutput: existingModel.costPer1kOutput?.toString() || '',
      isActive: existingModel.isActive,
      isDefault: existingModel.isDefault,
    } : {
      provider: '',
      modelIdentifier: '',
      displayName: '',
      endpoint: '',
      apiKey: '',
      capabilities: ['chat', 'streaming'],
      parameters: JSON.stringify(defaultParameters, null, 2),
      costPer1kInput: '',
      costPer1kOutput: '',
      isActive: true,
      isDefault: false,
    },
  });

  const selectedProvider = watch('provider');

  useEffect(() => {
    if (existingModel) {
      reset({
        provider: existingModel.provider,
        modelIdentifier: existingModel.modelIdentifier,
        displayName: existingModel.displayName,
        endpoint: existingModel.endpoint || '',
        apiKey: existingModel.apiKey || '',
        capabilities: existingModel.capabilities,
        parameters: JSON.stringify(existingModel.parameters, null, 2),
        costPer1kInput: existingModel.costPer1kInput?.toString() || '',
        costPer1kOutput: existingModel.costPer1kOutput?.toString() || '',
        isActive: existingModel.isActive,
        isDefault: existingModel.isDefault,
      });
    }
  }, [existingModel, reset]);

  const onSubmit = async (data: ModelFormData) => {
    try {
      setIsSubmitting(true);
      setError(null);

      // Parse parameters JSON
      let parameters = {};
      try {
        parameters = JSON.parse(data.parameters);
      } catch (err) {
        throw new Error('Invalid JSON in parameters field');
      }

      const modelData = {
        ...data,
        parameters,
        capabilities: data.capabilities || [],
      };

      let response;
      if (existingModel) {
        response = await modelApi.updateModel(existingModel.id, modelData as UpdateModelData);
      } else {
        response = await modelApi.createModel(modelData as CreateModelData);
      }

      onSuccess(response.data);
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Failed to save model');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCapabilityToggle = (capability: string) => {
    const current = watch('capabilities');
    const newCapabilities = current.includes(capability)
      ? current.filter(c => c !== capability)
      : [...current, capability];
    setValue('capabilities', newCapabilities);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {error && (
        <div className="rounded-md bg-destructive/10 p-3">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="mb-2 block text-sm font-medium">Provider *</label>
          <select
            {...register('provider')}
            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
          >
            <option value="">Select provider</option>
            {providers.map(provider => (
              <option key={provider.name} value={provider.name}>
                {provider.displayName}
              </option>
            ))}
          </select>
          {errors.provider && (
            <p className="mt-1 text-sm text-destructive">{errors.provider.message}</p>
          )}
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium">Model Identifier *</label>
          <input
            type="text"
            {...register('modelIdentifier')}
            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
            placeholder="gpt-4, claude-3, etc."
          />
          {errors.modelIdentifier && (
            <p className="mt-1 text-sm text-destructive">{errors.modelIdentifier.message}</p>
          )}
        </div>

        <div className="md:col-span-2">
          <label className="mb-2 block text-sm font-medium">Display Name *</label>
          <input
            type="text"
            {...register('displayName')}
            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
            placeholder="GPT-4, Claude 3, etc."
          />
          {errors.displayName && (
            <p className="mt-1 text-sm text-destructive">{errors.displayName.message}</p>
          )}
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium">Endpoint URL</label>
          <input
            type="url"
            {...register('endpoint')}
            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
            placeholder="https://api.openai.com/v1"
          />
          {errors.endpoint && (
            <p className="mt-1 text-sm text-destructive">{errors.endpoint.message}</p>
          )}
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium">API Key</label>
          <input
            type="password"
            {...register('apiKey')}
            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
            placeholder="sk-..."
          />
          {errors.apiKey && (
            <p className="mt-1 text-sm text-destructive">{errors.apiKey.message}</p>
          )}
        </div>

        <div className="md:col-span-2">
          <label className="mb-2 block text-sm font-medium">Capabilities</label>
          <div className="flex flex-wrap gap-2">
            {defaultCapabilities.map(capability => (
              <button
                key={capability}
                type="button"
                onClick={() => handleCapabilityToggle(capability)}
                className={`rounded-full px-3 py-1 text-sm font-medium transition-colors ${
                  watch('capabilities')?.includes(capability)
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
              >
                {capability.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium">Cost per 1k Input Tokens ($)</label>
          <input
            type="number"
            step="0.000001"
            {...register('costPer1kInput')}
            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
            placeholder="0.03"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium">Cost per 1k Output Tokens ($)</label>
          <input
            type="number"
            step="0.000001"
            {...register('costPer1kOutput')}
            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
            placeholder="0.06"
          />
        </div>
      </div>

      <div className="flex items-center space-x-4">
        <label className="flex items-center space-x-2">
          <input
            type="checkbox"
            {...register('isActive')}
            className="h-4 w-4 rounded border"
          />
          <span className="text-sm font-medium">Active</span>
        </label>

        <label className="flex items-center space-x-2">
          <input
            type="checkbox"
            {...register('isDefault')}
            className="h-4 w-4 rounded border"
          />
          <span className="text-sm font-medium">Set as default model</span>
        </label>
      </div>

      <div>
        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="mb-4 text-sm font-medium text-primary hover:underline"
        >
          {showAdvanced ? 'Hide Advanced Settings' : 'Show Advanced Settings'}
        </button>

        {showAdvanced && (
          <div>
            <label className="mb-2 block text-sm font-medium">Model Parameters (JSON)</label>
            <textarea
              {...register('parameters')}
              rows={8}
              className="w-full rounded-md border bg-background px-3 py-2 font-mono text-sm"
              placeholder='{"temperature": 0.7, "max_tokens": 1000, ...}'
            />
            {errors.parameters && (
              <p className="mt-1 text-sm text-destructive">{errors.parameters.message}</p>
            )}
          </div>
        )}
      </div>

      <div className="flex justify-end space-x-3">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-md border px-4 py-2 text-sm font-medium transition-colors hover:bg-accent"
          disabled={isSubmitting}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Saving...' : existingModel ? 'Update Model' : 'Create Model'}
        </button>
      </div>
    </form>
  );
}