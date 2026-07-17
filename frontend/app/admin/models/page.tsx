'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuthStore } from '@/store/auth.store';
import { modelApi, AIModel, ProviderInfo } from '@/lib/api/model';
import { ModelList } from '@/components/models/ModelList';
import { ProviderManagement } from '@/components/models/ProviderManagement';
import { ModelConfiguration } from '@/components/models/ModelConfiguration';

export default function AdminModelsPage() {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'models' | 'providers' | 'configuration'>('models');
  const [models, setModels] = useState<AIModel[]>([]);
  const [providers, setProviders] = useState<ProviderInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user?.role !== 'ADMIN') {
      setError('Admin access required');
      return;
    }

    loadData();
  }, [user]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [modelsResponse, providersResponse] = await Promise.all([
        modelApi.getModels(),
        modelApi.getProviders(),
      ]);

      setModels(modelsResponse.data);
      setProviders(providersResponse.data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleModelCreated = (newModel: AIModel) => {
    setModels(prev => [...prev, newModel]);
  };

  const handleModelUpdated = (updatedModel: AIModel) => {
    setModels(prev => prev.map(model => 
      model.id === updatedModel.id ? updatedModel : model
    ));
  };

  const handleModelDeleted = (modelId: string) => {
    setModels(prev => prev.filter(model => model.id !== modelId));
  };

  const handleProviderRefresh = async () => {
    try {
      const response = await modelApi.getProviders();
      setProviders(response.data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to refresh providers');
    }
  };

  if (user?.role !== 'ADMIN') {
    return (
      <div className="container mx-auto px-6 py-8">
        <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-6">
          <h2 className="text-lg font-semibold text-destructive">Access Denied</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Admin access is required to view model configuration.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-6 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Model Configuration</h1>
        <p className="mt-2 text-muted-foreground">
          Configure AI models, providers, and global settings
        </p>
      </div>

      {error && (
        <div className="mb-6 rounded-lg border border-destructive/20 bg-destructive/5 p-4">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      <div className="mb-6">
        <div className="border-b">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('models')}
              className={`border-b-2 px-1 py-4 text-sm font-medium transition-colors ${
                activeTab === 'models'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:border-border hover:text-foreground'
              }`}
            >
              AI Models
              <span className="ml-2 rounded-full bg-muted px-2 py-0.5 text-xs">
                {models.length}
              </span>
            </button>
            <button
              onClick={() => setActiveTab('providers')}
              className={`border-b-2 px-1 py-4 text-sm font-medium transition-colors ${
                activeTab === 'providers'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:border-border hover:text-foreground'
              }`}
            >
              Providers
              <span className="ml-2 rounded-full bg-muted px-2 py-0.5 text-xs">
                {providers.length}
              </span>
            </button>
            <button
              onClick={() => setActiveTab('configuration')}
              className={`border-b-2 px-1 py-4 text-sm font-medium transition-colors ${
                activeTab === 'configuration'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:border-border hover:text-foreground'
              }`}
            >
              Configuration
            </button>
          </nav>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
        </div>
      ) : (
        <>
          {activeTab === 'models' && (
            <ModelList
              models={models}
              providers={providers}
              onRefresh={loadData}
              onModelCreated={handleModelCreated}
              onModelUpdated={handleModelUpdated}
              onModelDeleted={handleModelDeleted}
            />
          )}

          {activeTab === 'providers' && (
            <ProviderManagement
              providers={providers}
              onRefresh={handleProviderRefresh}
            />
          )}

          {activeTab === 'configuration' && (
            <ModelConfiguration />
          )}
        </>
      )}
    </div>
  );
}