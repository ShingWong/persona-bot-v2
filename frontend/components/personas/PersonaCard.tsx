'use client';

import { Persona } from '@/lib/api/persona';
import Link from 'next/link';
import { useState } from 'react';
import { usePersonaStore } from '@/store/persona.store';

interface PersonaCardProps {
  persona: Persona;
  showActions?: boolean;
}

export default function PersonaCard({ persona, showActions = true }: PersonaCardProps) {
  const { deletePersona, isLoading } = usePersonaStore();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleDelete = async () => {
    try {
      await deletePersona(persona.id);
      setShowDeleteConfirm(false);
    } catch (error) {
      console.error('Failed to delete persona:', error);
    }
  };

  const getStatusColor = (isActive: boolean) => {
    return isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';
  };

  const getDefaultBadge = (isDefault: boolean) => {
    if (!isDefault) return null;
    return (
      <span className="inline-flex items-center rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-800">
        Default
      </span>
    );
  };

  return (
    <div className="rounded-lg border bg-card p-6 shadow-sm transition-all hover:shadow-md">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3">
            {persona.avatarUrl ? (
              <img
                src={persona.avatarUrl}
                alt={persona.name}
                className="h-12 w-12 rounded-full object-cover"
              />
            ) : (
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <span className="text-lg font-semibold text-primary">
                  {persona.name.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-semibold">{persona.name}</h3>
                {getDefaultBadge(persona.isDefault)}
              </div>
              <div className="mt-1 flex items-center gap-2">
                <span className={`rounded-full px-2 py-1 text-xs font-medium ${getStatusColor(persona.isActive)}`}>
                  {persona.isActive ? 'Active' : 'Inactive'}
                </span>
                <span className="text-xs text-muted-foreground">
                  Created {new Date(persona.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>

          {persona.description && (
            <p className="mt-4 line-clamp-2 text-sm text-muted-foreground">
              {persona.description}
            </p>
          )}

          <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium">Model:</span>
              <span className="ml-2 text-muted-foreground">
                {persona.modelId || 'Default'}
              </span>
            </div>
            <div>
              <span className="font-medium">Memory:</span>
              <span className="ml-2 text-muted-foreground">
                {persona.memoryEnabled ? `${persona.memoryLimit} messages` : 'Disabled'}
              </span>
            </div>
          </div>

          {persona.identity && (
            <div className="mt-4">
              <p className="text-xs font-medium text-muted-foreground">Identity Preview</p>
              <p className="mt-1 line-clamp-3 text-sm">
                {persona.identity.length > 150
                  ? `${persona.identity.substring(0, 150)}...`
                  : persona.identity}
              </p>
            </div>
          )}
        </div>

        {showActions && (
          <div className="ml-4 flex flex-col gap-2">
            <Link
              href={`/personas/${persona.id}`}
              className="rounded-lg border px-3 py-2 text-sm font-medium transition-colors hover:bg-accent"
            >
              View
            </Link>
            <Link
              href={`/personas/${persona.id}/edit`}
              className="rounded-lg border border-primary/20 bg-primary/10 px-3 py-2 text-sm font-medium text-primary transition-colors hover:bg-primary/20"
            >
              Edit
            </Link>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              disabled={isLoading}
              className="rounded-lg border border-destructive/20 px-3 py-2 text-sm font-medium text-destructive transition-colors hover:bg-destructive/10 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Delete
            </button>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-lg border bg-card p-6 shadow-lg">
            <h3 className="text-lg font-semibold">Delete Persona</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Are you sure you want to delete &quot;{persona.name}&quot;? This action cannot be undone.
                </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="rounded-lg border px-4 py-2 text-sm font-medium transition-colors hover:bg-accent"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={isLoading}
                className="rounded-lg bg-destructive px-4 py-2 text-sm font-medium text-destructive-foreground transition-colors hover:bg-destructive/90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isLoading ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}