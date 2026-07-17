'use client';

import { useRouter } from 'next/navigation';
import { usePersonaStore } from '@/store/persona.store';
import PersonaForm from '@/components/personas/PersonaForm';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { PersonaFormData } from '@/lib/validation/persona.schema';

export default function CreatePersonaPage() {
  const router = useRouter();
  const { createPersona, isLoading, error } = usePersonaStore();

  const handleSubmit = async (data: PersonaFormData) => {
    try {
      const persona = await createPersona(data);
      router.push(`/personas/${persona.id}`);
    } catch (error) {
      console.error('Failed to create persona:', error);
    }
  };

  return (
    <ProtectedRoute>
      <div className="container mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Create New Persona</h1>
              <p className="mt-2 text-muted-foreground">
                Define a new AI persona with custom identity and behavior
              </p>
            </div>
            <button
              onClick={() => router.back()}
              className="rounded-lg border px-4 py-2 text-sm font-medium transition-colors hover:bg-accent"
            >
              Back to List
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
          onSubmit={handleSubmit}
          isLoading={isLoading}
          submitLabel="Create Persona"
        />
      </div>
    </ProtectedRoute>
  );
}