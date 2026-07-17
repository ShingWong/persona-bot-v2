'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { usePersonaStore } from '@/store/persona.store';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { PersonaModelOverride } from '@/components/models/PersonaModelOverride';

export default function PersonaDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { currentPersona, isLoading, error, fetchPersona, deletePersona } = usePersonaStore();
  const id = params.id as string;

  useEffect(() => {
    if (id) {
      fetchPersona(id);
    }
  }, [id, fetchPersona]);

  const handleDelete = async () => {
    if (confirm('Are you sure you want to delete this persona?')) {
      try {
        await deletePersona(id);
        router.push('/personas');
      } catch (error) {
        console.error('Failed to delete persona:', error);
      }
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
                The persona you&apos;re looking for doesn&apos;t exist or has been deleted.
              </p>
            <div className="mt-6">
              <Link
                href="/personas"
                className="inline-flex items-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
              >
                Back to Personas
              </Link>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="container mx-auto px-6 py-8">
        {/* Error Display */}
        {error && (
          <div className="mb-6 rounded-lg border border-destructive/20 bg-destructive/10 p-4">
            <p className="text-sm font-medium text-destructive">{error}</p>
          </div>
        )}

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3">
                {currentPersona?.avatarUrl ? (
                  <img
                    src={currentPersona.avatarUrl}
                    alt={currentPersona.name}
                    className="h-16 w-16 rounded-full object-cover"
                  />
                ) : (
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                    <span className="text-2xl font-semibold text-primary">
                      {currentPersona?.name?.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-3xl font-bold tracking-tight">{currentPersona?.name}</h1>
                    {currentPersona?.isDefault && (
                      <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-800">
                        Default
                      </span>
                    )}
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-medium ${
                        currentPersona?.isActive
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {currentPersona?.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <p className="mt-2 text-muted-foreground">
                    Created {currentPersona && new Date(currentPersona.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
            <div className="flex gap-3">
              <Link
                href={`/personas/${id}/edit`}
                className="rounded-lg border border-primary/20 bg-primary/10 px-4 py-2 text-sm font-medium text-primary transition-colors hover:bg-primary/20"
              >
                Edit
              </Link>
              <button
                onClick={handleDelete}
                disabled={isLoading}
                className="rounded-lg border border-destructive/20 px-4 py-2 text-sm font-medium text-destructive transition-colors hover:bg-destructive/10 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Delete
              </button>
              <Link
                href="/personas"
                className="rounded-lg border px-4 py-2 text-sm font-medium transition-colors hover:bg-accent"
              >
                Back to List
              </Link>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Left Column - Details */}
          <div className="lg:col-span-2 space-y-8">
            {/* Description */}
            {currentPersona?.description && (
              <div className="rounded-lg border bg-card p-6">
                <h3 className="mb-4 text-lg font-semibold">Description</h3>
                <p className="whitespace-pre-wrap text-muted-foreground">
                  {currentPersona.description}
                </p>
              </div>
            )}

            {/* Identity */}
            <div className="rounded-lg border bg-card p-6">
              <h3 className="mb-4 text-lg font-semibold">Identity</h3>
              <div className="whitespace-pre-wrap rounded bg-muted/50 p-4 font-mono text-sm">
                {currentPersona?.identity}
              </div>
            </div>

            {/* Constraints */}
            {currentPersona?.constraints && (
              <div className="rounded-lg border bg-card p-6">
                <h3 className="mb-4 text-lg font-semibold">Constraints</h3>
                <div className="whitespace-pre-wrap rounded bg-muted/50 p-4 font-mono text-sm">
                  {currentPersona.constraints}
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Configuration */}
          <div className="space-y-8">
            {/* Configuration Summary */}
            <div className="rounded-lg border bg-card p-6">
              <h3 className="mb-4 text-lg font-semibold">Configuration</h3>
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium">Model</h4>
                  <p className="mt-1 text-muted-foreground">
                    {currentPersona?.modelId || 'Default'}
                  </p>
                </div>
                <div>
                  <h4 className="text-sm font-medium">Memory</h4>
                  <p className="mt-1 text-muted-foreground">
                    {currentPersona?.memoryEnabled
                      ? `${currentPersona.memoryLimit} messages`
                      : 'Disabled'}
                  </p>
                </div>
                <div>
                  <h4 className="text-sm font-medium">Status</h4>
                  <p className="mt-1 text-muted-foreground">
                    {currentPersona?.isActive ? 'Active' : 'Inactive'}
                  </p>
                </div>
                <div>
                  <h4 className="text-sm font-medium">Created</h4>
                  <p className="mt-1 text-muted-foreground">
                    {currentPersona && new Date(currentPersona.createdAt).toLocaleString()}
                  </p>
                </div>
                <div>
                  <h4 className="text-sm font-medium">Last Updated</h4>
                  <p className="mt-1 text-muted-foreground">
                    {currentPersona && new Date(currentPersona.updatedAt).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>

            {/* Model Configuration */}
            <div className="rounded-lg border bg-card p-6">
              <PersonaModelOverride
                persona={currentPersona!}
                onUpdate={(updatedPersona) => {
                  // Update the current persona in the store
                  usePersonaStore.getState().setCurrentPersona(updatedPersona);
                }}
              />
            </div>

            {/* Quick Actions */}
            <div className="rounded-lg border bg-card p-6">
              <h3 className="mb-4 text-lg font-semibold">Quick Actions</h3>
              <div className="space-y-3">
                <Link
                  href={`/conversations?persona=${id}`}
                  className="block w-full rounded-lg border px-4 py-3 text-center text-sm font-medium transition-colors hover:bg-accent"
                >
                  Start Conversation
                </Link>
                <button
                  onClick={() => {
                    if (currentPersona) {
                      navigator.clipboard.writeText(JSON.stringify(currentPersona, null, 2));
                      alert('Persona configuration copied to clipboard!');
                    }
                  }}
                  className="block w-full rounded-lg border px-4 py-3 text-center text-sm font-medium transition-colors hover:bg-accent"
                >
                  Copy Configuration
                </button>
                <button
                  onClick={() => {
                    if (currentPersona) {
                      const jsonString = JSON.stringify(currentPersona, null, 2);
                      const blob = new Blob([jsonString], { type: 'application/json' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `${currentPersona.name.toLowerCase().replace(/\s+/g, '-')}-config.json`;
                      document.body.appendChild(a);
                      a.click();
                      document.body.removeChild(a);
                      URL.revokeObjectURL(url);
                    }
                  }}
                  className="block w-full rounded-lg border px-4 py-3 text-center text-sm font-medium transition-colors hover:bg-accent"
                >
                  Export as JSON
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}