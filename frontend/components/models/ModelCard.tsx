'use client';

import { useState } from 'react';
import { AIModel, modelApi } from '@/lib/api/model';

interface ModelCardProps {
  model: AIModel;
  onEdit: () => void;
  onUpdate: (model: AIModel) => void;
  onDelete: (modelId: string) => void;
}

export function ModelCard({ model, onEdit, onUpdate, onDelete }: ModelCardProps) {
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ status: string; verifiedAt: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleTestConnection = async () => {
    try {
      setIsTesting(true);
      setTestResult(null);
      const response = await modelApi.testModelConnection(model.id);
      setTestResult(response.data);
      onUpdate({ ...model, lastVerified: response.data.verifiedAt });
    } catch (error) {
      setTestResult({ status: 'failed', verifiedAt: new Date().toISOString() });
    } finally {
      setIsTesting(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this model?')) return;

    try {
      setIsDeleting(true);
      await modelApi.deleteModel(model.id);
      onDelete(model.id);
    } catch (error) {
      alert('Failed to delete model');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleToggleActive = async () => {
    try {
      const updated = await modelApi.updateModel(model.id, {
        isActive: !model.isActive,
      });
      onUpdate(updated.data);
    } catch (error) {
      alert('Failed to update model');
    }
  };

  const handleSetDefault = async () => {
    if (model.isDefault) return;

    try {
      const updated = await modelApi.updateModel(model.id, {
        isDefault: true,
      });
      onUpdate(updated.data);
    } catch (error) {
      alert('Failed to set as default');
    }
  };

  const getProviderColor = (provider: string) => {
    const colors: Record<string, string> = {
      openai: 'bg-green-100 text-green-800',
      anthropic: 'bg-purple-100 text-purple-800',
      google: 'bg-blue-100 text-blue-800',
      ollama: 'bg-orange-100 text-orange-800',
      openrouter: 'bg-indigo-100 text-indigo-800',
    };
    return colors[provider] || 'bg-gray-100 text-gray-800';
  };

  const getStatusColor = (isActive: boolean) => {
    return isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';
  };

  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center space-x-2">
            <h3 className="font-semibold">{model.displayName}</h3>
            {model.isDefault && (
              <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                Default
              </span>
            )}
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {model.provider}/{model.modelIdentifier}
          </p>
        </div>
        <div className="flex items-center space-x-1">
          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${getProviderColor(model.provider)}`}>
            {model.provider}
          </span>
          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${getStatusColor(model.isActive)}`}>
            {model.isActive ? 'Active' : 'Inactive'}
          </span>
        </div>
      </div>

      <div className="mt-4 space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Capabilities:</span>
          <span className="font-medium">
            {model.capabilities.length > 0 ? model.capabilities.join(', ') : 'None'}
          </span>
        </div>

        {model.costPer1kInput && model.costPer1kOutput && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Cost:</span>
            <span className="font-medium">
              ${model.costPer1kInput}/1k in, ${model.costPer1kOutput}/1k out
            </span>
          </div>
        )}

        {model.lastVerified && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Last verified:</span>
            <span className="font-medium">
              {new Date(model.lastVerified).toLocaleDateString()}
            </span>
          </div>
        )}

        {testResult && (
          <div className={`mt-2 rounded-md p-2 text-sm ${
            testResult.status === 'connected' 
              ? 'bg-green-50 text-green-700' 
              : 'bg-red-50 text-red-700'
          }`}>
            Test: {testResult.status} at {new Date(testResult.verifiedAt).toLocaleTimeString()}
          </div>
        )}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          onClick={handleTestConnection}
          disabled={isTesting}
          className="flex-1 rounded-md border bg-background px-3 py-1.5 text-sm font-medium transition-colors hover:bg-accent disabled:opacity-50"
        >
          {isTesting ? 'Testing...' : 'Test Connection'}
        </button>

        {!model.isDefault && (
          <button
            onClick={handleSetDefault}
            className="flex-1 rounded-md bg-primary/10 px-3 py-1.5 text-sm font-medium text-primary transition-colors hover:bg-primary/20"
          >
            Set Default
          </button>
        )}

        <button
          onClick={onEdit}
          className="flex-1 rounded-md border bg-background px-3 py-1.5 text-sm font-medium transition-colors hover:bg-accent"
        >
          Edit
        </button>

        <button
          onClick={handleToggleActive}
          className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
            model.isActive
              ? 'bg-red-50 text-red-700 hover:bg-red-100'
              : 'bg-green-50 text-green-700 hover:bg-green-100'
          }`}
        >
          {model.isActive ? 'Deactivate' : 'Activate'}
        </button>

        <button
          onClick={handleDelete}
          disabled={isDeleting}
          className="flex-1 rounded-md bg-destructive/10 px-3 py-1.5 text-sm font-medium text-destructive transition-colors hover:bg-destructive/20 disabled:opacity-50"
        >
          {isDeleting ? 'Deleting...' : 'Delete'}
        </button>
      </div>
    </div>
  );
}