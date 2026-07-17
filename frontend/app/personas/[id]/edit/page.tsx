'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { usePersonaStore } from '@/store/persona.store';
import PersonaForm from '@/components/personas/PersonaForm';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { PersonaFormData } from '@/lib/validation/persona.schema';

export default function EditPersonaPage() {
  const params = useParams();
  const router = useRouter();
  const { currentPersona, isLoading, error, fetchPersona, updatePersona } = usePersonaStore();
  const id = params.id as string;

  useEffect(() => {
    if (id) {
      fetchPersona(id);
    }
  }, [id, fetchPersona]);

  const handleSubmit = async (data: PersonaFormData) => {
    try {
      await updatePersona(id, data);
      router.push(`/personas/${id}`);
    } catch (error) {
      console.error('Failed to update persona:', error);
    }
  };

  if (isLoading && !currentPersona) {
    return (
      <ProtectedRoute>
        <div className="container mx-auto flex items-center justify-center px-6 py-12">
          <div className="text-center">
            <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            <p className="mt-4 text-sm text-muted-foreground">Loading persona...</p>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  if (!currentPersona && !isLoading) {
    return (
      <ProtectedRoute>
        <div className="container mx-auto px-6 py-12">
          <div className="text-center">
            <h2 className="text-2xl font-bold">Persona not found</h2>
              <p className="mt-2 text-muted-foreground">
                The persona you&apos;re trying to edit doesn&apos;t exist or has been deleted.
              </p>
            <div className="mt-6">
              <button
                onClick={() => router.push('/personas')}
                className="inline-flex items-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
              >
                Back to Personas
              </button>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="container mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Edit Persona</h1>
              <p className="mt-2 text-muted-foreground">
                Update the configuration for {currentPersona?.name}
              </p>
            </div>
            <button
              onClick={() => router.back()}
              className="rounded-lg border px-4 py-2 text-sm font-medium transition-colors hover:bg-accent"
            >
              Cancel
            </button>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-6 rounded-lg border border-destructive/20 bg-destructive/10 p-4">
            <p className="text-sm font-medium text-destructive">{error}</p>
          </div>
        )}

        {/* Persona Form */}
        <PersonaForm
          initialData={currentPersona!}
          onSubmit={handleSubmit}
          isLoading={isLoading}
          submitLabel="Update Persona"
        />
      </div>
    </ProtectedRoute>
  );
}