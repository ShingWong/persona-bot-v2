'use client';

import { useState } from 'react';
import { AIModel, ProviderInfo } from '@/lib/api/model';
import { ModelCard } from './ModelCard';
import { ModelForm } from './ModelForm';

interface ModelListProps {
  models: AIModel[];
  providers: ProviderInfo[];
  onRefresh: () => void;
  onModelCreated: (model: AIModel) => void;
  onModelUpdated: (model: AIModel) => void;
  onModelDeleted: (modelId: string) => void;
}

export function ModelList({
  models,
  providers,
  onRefresh,
  onModelCreated,
  onModelUpdated,
  onModelDeleted,
}: ModelListProps) {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingModel, setEditingModel] = useState<AIModel | null>(null);
  const [filter, setFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [providerFilter, setProviderFilter] = useState<string>('all');

  const filteredModels = models.filter(model => {
    if (filter === 'active' && !model.isActive) return false;
    if (filter === 'inactive' && model.isActive) return false;
    if (providerFilter !== 'all' && model.provider !== providerFilter) return false;
    return true;
  });

  const activeModels = models.filter(m => m.isActive);
  const inactiveModels = models.filter(m => !m.isActive);
  const defaultModel = models.find(m => m.isDefault);

  const uniqueProviders = Array.from(new Set(models.map(m => m.provider)));

  const handleCreateSuccess = (model: AIModel) => {
    onModelCreated(model);
    setShowCreateForm(false);
  };

  const handleUpdateSuccess = (model: AIModel) => {
    onModelUpdated(model);
    setEditingModel(null);
  };

  return (
    <div className="space-y-6">
      <div className="rounded-lg border bg-card p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">AI Models</h2>
            <p className="text-sm text-muted-foreground">
              Configure and manage AI models for different providers
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={onRefresh}
              className="rounded-lg border px-4 py-2 text-sm font-medium transition-colors hover:bg-accent"
            >
              Refresh
            </button>
            <button
              onClick={() => setShowCreateForm(true)}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Add Model
            </button>
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <div className="rounded-lg border bg-background p-4">
            <div className="text-2xl font-bold">{models.length}</div>
            <div className="text-sm text-muted-foreground">Total Models</div>
          </div>
          <div className="rounded-lg border bg-background p-4">
            <div className="text-2xl font-bold">{activeModels.length}</div>
            <div className="text-sm text-muted-foreground">Active</div>
          </div>
          <div className="rounded-lg border bg-background p-4">
            <div className="text-2xl font-bold">{defaultModel ? 1 : 0}</div>
            <div className="text-sm text-muted-foreground">Default Model</div>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-4">
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium">Status:</label>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as any)}
              className="rounded-md border bg-background px-3 py-1 text-sm"
            >
              <option value="all">All ({models.length})</option>
              <option value="active">Active ({activeModels.length})</option>
              <option value="inactive">Inactive ({inactiveModels.length})</option>
            </select>
          </div>

          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium">Provider:</label>
            <select
              value={providerFilter}
              onChange={(e) => setProviderFilter(e.target.value)}
              className="rounded-md border bg-background px-3 py-1 text-sm"
            >
              <option value="all">All Providers</option>
              {uniqueProviders.map(provider => (
                <option key={provider} value={provider}>
                  {provider}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {(showCreateForm || editingModel) && (
        <div className="rounded-lg border bg-card p-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold">
              {editingModel ? 'Edit Model' : 'Add New Model'}
            </h3>
            <button
              onClick={() => {
                setShowCreateForm(false);
                setEditingModel(null);
              }}
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Cancel
            </button>
          </div>
          <ModelForm
            providers={providers}
            existingModel={editingModel || undefined}
            onSuccess={editingModel ? handleUpdateSuccess : handleCreateSuccess}
            onCancel={() => {
              setShowCreateForm(false);
              setEditingModel(null);
            }}
          />
        </div>
      )}

      {filteredModels.length === 0 ? (
        <div className="rounded-lg border border-dashed p-8 text-center">
          <p className="text-muted-foreground">No models found</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredModels.map(model => (
            <ModelCard
              key={model.id}
              model={model}
              onEdit={() => setEditingModel(model)}
              onUpdate={onModelUpdated}
              onDelete={onModelDeleted}
            />
          ))}
        </div>
      )}
    </div>
  );
}