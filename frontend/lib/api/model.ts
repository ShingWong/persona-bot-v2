import { apiClient } from './client';

export interface AIModel {
  id: string;
  provider: string;
  modelIdentifier: string;
  displayName: string;
  endpoint: string | null;
  apiKey: string | null;
  capabilities: string[];
  parameters: Record<string, any>;
  costPer1kInput: number | null;
  costPer1kOutput: number | null;
  isActive: boolean;
  isDefault: boolean;
  discoveredAt: string | null;
  lastVerified: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ProviderInfo {
  name: string;
  displayName: string;
  description: string;
  capabilities: string[];
  modelCount: number;
}

export interface CreateModelData {
  provider: string;
  modelIdentifier: string;
  displayName: string;
  endpoint?: string;
  apiKey?: string;
  capabilities?: string[];
  parameters?: Record<string, any>;
  costPer1kInput?: number;
  costPer1kOutput?: number;
  isActive?: boolean;
  isDefault?: boolean;
}

export interface UpdateModelData {
  provider?: string;
  modelIdentifier?: string;
  displayName?: string;
  endpoint?: string;
  apiKey?: string;
  capabilities?: string[];
  parameters?: Record<string, any>;
  costPer1kInput?: number;
  costPer1kOutput?: number;
  isActive?: boolean;
  isDefault?: boolean;
}

export interface DiscoverModelRequest {
  provider: string;
  apiKey?: string;
  endpoint?: string;
}

export interface DiscoveredModel {
  modelIdentifier: string;
  displayName: string;
}

export interface ModelListResponse {
  success: boolean;
  data: AIModel[];
  count: number;
}

export interface ModelResponse {
  success: boolean;
  data: AIModel;
}

export interface ProviderListResponse {
  success: boolean;
  data: ProviderInfo[];
}

export interface DiscoverResponse {
  success: boolean;
  data: DiscoveredModel[];
}

export interface TestConnectionResponse {
  success: boolean;
  data: {
    status: string;
    verifiedAt: string;
  };
}

export const modelApi = {
  // Get all AI models
  getModels: async (): Promise<ModelListResponse> => {
    const response = await apiClient.get('/api/models');
    return response.data;
  },

  // Get model by ID
  getModel: async (id: string): Promise<ModelResponse> => {
    const response = await apiClient.get(`/api/models/${id}`);
    return response.data;
  },

  // Create new model
  createModel: async (data: CreateModelData): Promise<ModelResponse> => {
    const response = await apiClient.post('/api/models', data);
    return response.data;
  },

  // Update model
  updateModel: async (id: string, data: UpdateModelData): Promise<ModelResponse> => {
    const response = await apiClient.put(`/api/models/${id}`, data);
    return response.data;
  },

  // Delete model (soft delete)
  deleteModel: async (id: string): Promise<ModelResponse> => {
    const response = await apiClient.delete(`/api/models/${id}`);
    return response.data;
  },

  // Test model connection
  testModelConnection: async (id: string): Promise<TestConnectionResponse> => {
    const response = await apiClient.post(`/api/models/${id}/test`);
    return response.data;
  },

  // Get available providers
  getProviders: async (): Promise<ProviderListResponse> => {
    const response = await apiClient.get('/api/models/providers/available');
    return response.data;
  },

  // Discover models from provider
  discoverModels: async (data: DiscoverModelRequest): Promise<DiscoverResponse> => {
    const response = await apiClient.post('/api/models/providers/discover', data);
    return response.data;
  },
};