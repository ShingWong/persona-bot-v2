'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { PersonaFormData, personaSchema } from '@/lib/validation/persona.schema';
import { Persona } from '@/lib/api/persona';
import { useState } from 'react';

interface PersonaFormProps {
  initialData?: Persona;
  onSubmit: (data: PersonaFormData) => Promise<void>;
  isLoading?: boolean;
  submitLabel?: string;
}

export default function PersonaForm({
  initialData,
  onSubmit,
  isLoading = false,
  submitLabel = 'Create Persona',
}: PersonaFormProps) {
  const [previewMode, setPreviewMode] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<PersonaFormData>({
    resolver: zodResolver(personaSchema),
    defaultValues: initialData
      ? {
          name: initialData.name,
          description: initialData.description || '',
          avatarUrl: initialData.avatarUrl || '',
          identity: initialData.identity,
          constraints: initialData.constraints || '',
          modelId: initialData.modelId || '',
          memoryEnabled: initialData.memoryEnabled,
          memoryLimit: initialData.memoryLimit,
          isActive: initialData.isActive,
          isDefault: initialData.isDefault,
        }
      : {
          name: '',
          description: '',
          avatarUrl: '',
          identity: '',
          constraints: '',
          modelId: '',
          memoryEnabled: true,
          memoryLimit: 10,
          isActive: true,
          isDefault: false,
        },
  });

  const formData = watch();

  const handleFormSubmit = async (data: PersonaFormData) => {
    await onSubmit(data);
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Persona Details</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Configure your AI persona&apos;s identity, behavior, and capabilities
          </p>
        </div>
        <button
          type="button"
          onClick={() => setPreviewMode(!previewMode)}
          className="rounded-lg border px-4 py-2 text-sm font-medium transition-colors hover:bg-accent"
        >
          {previewMode ? 'Edit Mode' : 'Preview Mode'}
        </button>
      </div>

      {previewMode ? (
        <div className="rounded-lg border bg-card p-6">
          <h3 className="text-lg font-semibold">Preview</h3>
          <div className="mt-4 space-y-4">
            <div>
              <h4 className="font-medium">Name</h4>
              <p className="text-muted-foreground">{formData.name || 'Not set'}</p>
            </div>
            <div>
              <h4 className="font-medium">Description</h4>
              <p className="text-muted-foreground">{formData.description || 'Not set'}</p>
            </div>
            <div>
              <h4 className="font-medium">Identity</h4>
              <p className="whitespace-pre-wrap text-muted-foreground">
                {formData.identity || 'Not set'}
              </p>
            </div>
            <div>
              <h4 className="font-medium">Constraints</h4>
              <p className="whitespace-pre-wrap text-muted-foreground">
                {formData.constraints || 'Not set'}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium">Model</h4>
                <p className="text-muted-foreground">{formData.modelId || 'Default'}</p>
              </div>
              <div>
                <h4 className="font-medium">Memory</h4>
                <p className="text-muted-foreground">
                  {formData.memoryEnabled
                    ? `${formData.memoryLimit} messages`
                    : 'Disabled'}
                </p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
          {/* Basic Information */}
          <div className="rounded-lg border bg-card p-6">
            <h3 className="mb-4 text-lg font-semibold">Basic Information</h3>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label htmlFor="name" className="mb-2 block text-sm font-medium">
                  Name *
                </label>
                <input
                  id="name"
                  type="text"
                  className="w-full rounded-lg border bg-background px-4 py-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  placeholder="e.g., Customer Support Agent"
                  {...register('name')}
                />
                {errors.name && (
                  <p className="mt-2 text-sm text-destructive">{errors.name.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="avatarUrl" className="mb-2 block text-sm font-medium">
                  Avatar URL
                </label>
                <input
                  id="avatarUrl"
                  type="url"
                  className="w-full rounded-lg border bg-background px-4 py-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  placeholder="https://example.com/avatar.jpg"
                  {...register('avatarUrl')}
                />
                {errors.avatarUrl && (
                  <p className="mt-2 text-sm text-destructive">{errors.avatarUrl.message}</p>
                )}
              </div>

              <div className="md:col-span-2">
                <label htmlFor="description" className="mb-2 block text-sm font-medium">
                  Description
                </label>
                <textarea
                  id="description"
                  rows={2}
                  className="w-full rounded-lg border bg-background px-4 py-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  placeholder="Brief description of this persona's purpose..."
                  {...register('description')}
                />
                {errors.description && (
                  <p className="mt-2 text-sm text-destructive">{errors.description.message}</p>
                )}
              </div>
            </div>
          </div>

          {/* Identity & Behavior */}
          <div className="rounded-lg border bg-card p-6">
            <h3 className="mb-4 text-lg font-semibold">Identity & Behavior</h3>
            <div className="space-y-4">
              <div>
                <label htmlFor="identity" className="mb-2 block text-sm font-medium">
                  Identity *
                </label>
                <textarea
                  id="identity"
                  rows={6}
                  className="w-full rounded-lg border bg-background px-4 py-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  placeholder="Describe who this persona is, their personality, tone, expertise, etc..."
                  {...register('identity')}
                />
                {errors.identity && (
                  <p className="mt-2 text-sm text-destructive">{errors.identity.message}</p>
                )}
                <p className="mt-2 text-xs text-muted-foreground">
                  This defines the core identity and personality of the AI persona.
                </p>
              </div>

              <div>
                <label htmlFor="constraints" className="mb-2 block text-sm font-medium">
                  Constraints
                </label>
                <textarea
                  id="constraints"
                  rows={4}
                  className="w-full rounded-lg border bg-background px-4 py-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  placeholder="List any constraints or boundaries for this persona..."
                  {...register('constraints')}
                />
                {errors.constraints && (
                  <p className="mt-2 text-sm text-destructive">{errors.constraints.message}</p>
                )}
                <p className="mt-2 text-xs text-muted-foreground">
                  Define what this persona should NOT do or say.
                </p>
              </div>
            </div>
          </div>

          {/* Configuration */}
          <div className="rounded-lg border bg-card p-6">
            <h3 className="mb-4 text-lg font-semibold">Configuration</h3>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label htmlFor="modelId" className="mb-2 block text-sm font-medium">
                  Model ID
                </label>
                <input
                  id="modelId"
                  type="text"
                  className="w-full rounded-lg border bg-background px-4 py-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  placeholder="e.g., gpt-4, claude-3"
                  {...register('modelId')}
                />
                {errors.modelId && (
                  <p className="mt-2 text-sm text-destructive">{errors.modelId.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="memoryLimit" className="mb-2 block text-sm font-medium">
                  Memory Limit
                </label>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="memoryEnabled"
                      className="h-4 w-4 rounded border"
                      {...register('memoryEnabled')}
                    />
                    <label htmlFor="memoryEnabled" className="text-sm">
                      Enable Memory
                    </label>
                  </div>
                  {watch('memoryEnabled') && (
                    <input
                      id="memoryLimit"
                      type="number"
                      min="1"
                      max="100"
                      className="w-24 rounded-lg border bg-background px-4 py-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                      {...register('memoryLimit', { valueAsNumber: true })}
                    />
                  )}
                </div>
                {errors.memoryLimit && (
                  <p className="mt-2 text-sm text-destructive">{errors.memoryLimit.message}</p>
                )}
              </div>

              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="isActive"
                    className="h-4 w-4 rounded border"
                    {...register('isActive')}
                  />
                  <label htmlFor="isActive" className="text-sm font-medium">
                    Active
                  </label>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="isDefault"
                    className="h-4 w-4 rounded border"
                    {...register('isDefault')}
                  />
                  <label htmlFor="isDefault" className="text-sm font-medium">
                    Default Persona
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => window.history.back()}
              className="rounded-lg border px-4 py-2 text-sm font-medium transition-colors hover:bg-accent"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="rounded-lg bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isLoading ? (
                <span className="flex items-center justify-center">
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  {submitLabel}...
                </span>
              ) : (
                submitLabel
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}