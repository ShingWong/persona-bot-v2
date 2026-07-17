'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePersonaStore } from '@/store/persona.store';
import PersonaCard from '@/components/personas/PersonaCard';
import ProtectedRoute from '@/components/auth/ProtectedRoute';

export default function PersonasPage() {
  const { personas, isLoading, error, fetchPersonas, seedDefaultPersonas } = usePersonaStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterActive, setFilterActive] = useState(true);

  useEffect(() => {
    fetchPersonas();
  }, [fetchPersonas]);

  const filteredPersonas = personas.filter((persona) => {
    const matchesSearch = persona.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (persona.description?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false);
    const matchesFilter = filterActive ? persona.isActive : true;
    return matchesSearch && matchesFilter;
  });

  const activePersonas = personas.filter((p) => p.isActive);
  const inactivePersonas = personas.filter((p) => !p.isActive);

  const handleSeedDefault = async () => {
    if (confirm('This will create default personas. Continue?')) {
      try {
        await seedDefaultPersonas();
      } catch (error) {
        console.error('Failed to seed default personas:', error);
      }
    }
  };

  return (
    <ProtectedRoute>
      <div className="container mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Personas</h1>
              <p className="mt-2 text-muted-foreground">
                Manage your AI personas and their configurations
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleSeedDefault}
                className="rounded-lg border px-4 py-2 text-sm font-medium transition-colors hover:bg-accent"
              >
                Seed Default
              </button>
              <Link
                href="/personas/create"
                className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
              >
                Create Persona
              </Link>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="rounded-lg border bg-card p-6">
            <div className="text-2xl font-bold">{personas.length}</div>
            <div className="text-sm text-muted-foreground">Total Personas</div>
          </div>
          <div className="rounded-lg border bg-card p-6">
            <div className="text-2xl font-bold">{activePersonas.length}</div>
            <div className="text-sm text-muted-foreground">Active Personas</div>
          </div>
          <div className="rounded-lg border bg-card p-6">
            <div className="text-2xl font-bold">{inactivePersonas.length}</div>
            <div className="text-sm text-muted-foreground">Inactive Personas</div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="mb-6 rounded-lg border bg-card p-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex-1">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search personas by name or description..."
                  className="w-full rounded-lg border bg-background px-4 py-3 pl-10 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <svg
                    className="h-5 w-5 text-muted-foreground"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="filterActive"
                  checked={filterActive}
                  onChange={(e) => setFilterActive(e.target.checked)}
                  className="h-4 w-4 rounded border"
                />
                <label htmlFor="filterActive" className="text-sm">
                  Show active only
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-6 rounded-lg border border-destructive/20 bg-destructive/10 p-4">
            <p className="text-sm font-medium text-destructive">{error}</p>
          </div>
        )}

        {/* Loading State */}
        {isLoading && personas.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
              <p className="mt-4 text-sm text-muted-foreground">Loading personas...</p>
            </div>
          </div>
        ) : (
          <>
            {/* Personas Grid */}
            {filteredPersonas.length > 0 ? (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {filteredPersonas.map((persona) => (
                  <PersonaCard key={persona.id} persona={persona} />
                ))}
              </div>
            ) : (
              <div className="rounded-lg border border-dashed p-12 text-center">
                <div className="mx-auto max-w-md">
                  <svg
                    className="mx-auto h-12 w-12 text-muted-foreground"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  <h3 className="mt-4 text-lg font-semibold">No personas found</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {searchQuery
                      ? 'No personas match your search criteria.'
                      : 'Get started by creating your first persona.'}
                  </p>
                  <div className="mt-6">
                    <Link
                      href="/personas/create"
                      className="inline-flex items-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                    >
                      Create Persona
                    </Link>
                  </div>
                </div>
              </div>
            )}

            {/* Pagination (simplified for now) */}
            {filteredPersonas.length > 0 && (
              <div className="mt-8 flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  Showing {filteredPersonas.length} of {personas.length} personas
                </div>
                <div className="flex gap-2">
                  <button className="rounded-lg border px-3 py-2 text-sm font-medium transition-colors hover:bg-accent disabled:cursor-not-allowed disabled:opacity-50">
                    Previous
                  </button>
                  <button className="rounded-lg border px-3 py-2 text-sm font-medium transition-colors hover:bg-accent">
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </ProtectedRoute>
  );
}