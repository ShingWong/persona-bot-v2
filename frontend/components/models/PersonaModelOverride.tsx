'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { modelApi, AIModel } from '@/lib/api/model';
import { personaApi, Persona } from '@/lib/api/persona';

const modelOverrideSchema = z.object({
  modelId: z.string().optional(),
  temperature: z.number().min(0).max(2).optional(),
  maxTokens: z.number().min(1).max(100000).optional(),
  topP: z.number().min(0).max(1).optional(),
  frequencyPenalty: z.number().min(-2).max(2).optional(),
  presencePenalty: z.number().min(-2).max(2).optional(),
});

type ModelOverrideFormData = z.infer<typeof modelOverrideSchema>;

interface PersonaModelOverrideProps {
  persona: Persona;
  onUpdate: (updatedPersona: Persona) => void;
}

export function PersonaModelOverride({ persona, onUpdate }: PersonaModelOverrideProps) {
  const [models, setModels] = useState<AIModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm<ModelOverrideFormData>({
    resolver: zodResolver(modelOverrideSchema),
    defaultValues: {
      modelId: persona.modelId || '',
      temperature: persona.modelParams?.temperature || 0.7,
      maxTokens: persona.modelParams?.max_tokens || 1000,
      topP: persona.modelParams?.top_p || 1,
      frequencyPenalty: persona.modelParams?.frequency_penalty || 0,
      presencePenalty: persona.modelParams?.presence_penalty || 0,
    },
  });

  useEffect(() => {
    loadModels();
  }, []);

  useEffect(() => {
    if (persona) {
      reset({
        modelId: persona.modelId || '',
        temperature: persona.modelParams?.temperature || 0.7,
        maxTokens: persona.modelParams?.max_tokens || 1000,
        topP: persona.modelParams?.top_p || 1,
        frequencyPenalty: persona.modelParams?.frequency_penalty || 0,
        presencePenalty: persona.modelParams?.presence_penalty || 0,
      });
    }
  }, [persona, reset]);

  const loadModels = async () => {
    try {
      setLoading(true);
      const response = await modelApi.getModels();
      setModels(response.data.filter(model => model.isActive));
    } catch (err: any) {
      setError('Failed to load models');
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: ModelOverrideFormData) => {
    try {
      setIsSaving(true);
      setError(null);
      setSaveSuccess(false);

      // Prepare model parameters
      const modelParams: Record<string, any> = {};
      if (data.temperature !== undefined) modelParams.temperature = data.temperature;
      if (data.maxTokens !== undefined) modelParams.max_tokens = data.maxTokens;
      if (data.topP !== undefined) modelParams.top_p = data.topP;
      if (data.frequencyPenalty !== undefined) modelParams.frequency_penalty = data.frequencyPenalty;
      if (data.presencePenalty !== undefined) modelParams.presence_penalty = data.presencePenalty;

      const updateData = {
        modelId: data.modelId || null,
        modelParams: Object.keys(modelParams).length > 0 ? modelParams : null,
      };

      const response = await personaApi.updatePersona(persona.id, updateData);
      onUpdate(response.data);

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to save model configuration');
    } finally {
      setIsSaving(false);
    }
  };

  const handleUseGlobalDefaults = () => {
    reset({
      modelId: '',
      temperature: 0.7,
      maxTokens: 1000,
      topP: 1,
      frequencyPenalty: 0,
      presencePenalty: 0,
    });
  };

  const selectedModelId = watch('modelId');
  const selectedModel = models.find(m => m.id === selectedModelId);

  const getModelDescription = (model: AIModel) => {
    return `${model.provider}/${model.modelIdentifier}${model.costPer1kInput ? ` - $${model.costPer1kInput}/1k in` : ''}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Model Configuration</h3>
          <p className="text-sm text-muted-foreground">
            Override global model settings for this persona
          </p>
        </div>
        <button
          onClick={handleUseGlobalDefaults}
          className="text-sm font-medium text-primary hover:underline"
        >
          Use Global Defaults
        </button>
      </div>

      {error && (
        <div className="rounded-md bg-destructive/10 p-3">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      {saveSuccess && (
        <div className="rounded-md bg-green-50 p-3">
          <p className="text-sm text-green-700">Model configuration saved successfully!</p>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div>
          <label className="mb-2 block text-sm font-medium">AI Model</label>
          <select
            {...register('modelId')}
            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
            disabled={loading}
          >
            <option value="">Use global default model</option>
            {models.map(model => (
              <option key={model.id} value={model.id}>
                {model.displayName} ({getModelDescription(model)})
              </option>
            ))}
          </select>
          <p className="mt-1 text-xs text-muted-foreground">
            Select a specific model for this persona, or use the global default
          </p>
        </div>

        {selectedModel && (
          <div className="rounded-lg border bg-background p-4">
            <div className="mb-2 text-sm font-medium">Selected Model Details</div>
            <div className="grid gap-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Provider:</span>
                <span className="font-medium">{selectedModel.provider}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Model:</span>
                <span className="font-medium">{selectedModel.modelIdentifier}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Capabilities:</span>
                <span className="font-medium">{selectedModel.capabilities.join(', ')}</span>
              </div>
              {selectedModel.costPer1kInput && selectedModel.costPer1kOutput && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Cost:</span>
                  <span className="font-medium">
                    ${selectedModel.costPer1kInput}/1k in, ${selectedModel.costPer1kOutput}/1k out
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="space-y-4">
          <h4 className="font-medium">Model Parameters</h4>
          <p className="text-sm text-muted-foreground">
            These parameters will override global defaults for this persona
          </p>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <div>
              <label className="mb-2 block text-sm font-medium">Temperature</label>
              <input
                type="number"
                step="0.1"
                {...register('temperature', { valueAsNumber: true })}
                className="w-full rounded-md border bg-background px-3 py-2 text-sm"
              />
              {errors.temperature && (
                <p className="mt-1 text-sm text-destructive">{errors.temperature.message}</p>
              )}
              <p className="mt-1 text-xs text-muted-foreground">0-2, higher = more creative</p>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">Max Tokens</label>
              <input
                type="number"
                {...register('maxTokens', { valueAsNumber: true })}
                className="w-full rounded-md border bg-background px-3 py-2 text-sm"
              />
              {errors.maxTokens && (
                <p className="mt-1 text-sm text-destructive">{errors.maxTokens.message}</p>
              )}
              <p className="mt-1 text-xs text-muted-foreground">Maximum response length</p>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">Top P</label>
              <input
                type="number"
                step="0.1"
                {...register('topP', { valueAsNumber: true })}
                className="w-full rounded-md border bg-background px-3 py-2 text-sm"
              />
              {errors.topP && (
                <p className="mt-1 text-sm text-destructive">{errors.topP.message}</p>
              )}
              <p className="mt-1 text-xs text-muted-foreground">0-1, nucleus sampling</p>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">Frequency Penalty</label>
              <input
                type="number"
                step="0.1"
                {...register('frequencyPenalty', { valueAsNumber: true })}
                className="w-full rounded-md border bg-background px-3 py-2 text-sm"
              />
              {errors.frequencyPenalty && (
                <p className="mt-1 text-sm text-destructive">{errors.frequencyPenalty.message}</p>
              )}
              <p className="mt-1 text-xs text-muted-foreground">-2 to 2, reduce repetition</p>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">Presence Penalty</label>
              <input
                type="number"
                step="0.1"
                {...register('presencePenalty', { valueAsNumber: true })}
                className="w-full rounded-md border bg-background px-3 py-2 text-sm"
              />
              {errors.presencePenalty && (
                <p className="mt-1 text-sm text-destructive">{errors.presencePenalty.message}</p>
              )}
              <p className="mt-1 text-xs text-muted-foreground">-2 to 2, encourage new topics</p>
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={handleUseGlobalDefaults}
            className="rounded-md border px-4 py-2 text-sm font-medium transition-colors hover:bg-accent"
            disabled={isSaving}
          >
            Reset to Defaults
          </button>
          <button
            type="submit"
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
            disabled={isSaving}
          >
            {isSaving ? 'Saving...' : 'Save Configuration'}
          </button>
        </div>
      </form>

      <div className="rounded-lg border bg-card p-4">
        <h4 className="mb-2 text-sm font-medium">Current Configuration</h4>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Model:</span>
            <span className="font-medium">
              {persona.modelId ? 'Custom model selected' : 'Using global default'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Temperature:</span>
            <span className="font-medium">
              {persona.modelParams?.temperature || 'Global default (0.7)'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Max Tokens:</span>
            <span className="font-medium">
              {persona.modelParams?.max_tokens || 'Global default (1000)'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}