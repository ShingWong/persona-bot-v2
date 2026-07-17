import { apiClient } from './client';

export interface Persona {
  id: string;
  name: string;
  description: string | null;
  avatarUrl: string | null;
  identity: string;
  constraints: string | null;
  examples: unknown;
  modelId: string | null;
  modelParams: unknown;
  capabilities: unknown;
  tools: unknown;
  memoryEnabled: boolean;
  memoryLimit: number;
  routingRules: unknown;
  isActive: boolean;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePersonaData {
  name: string;
  description?: string;
  avatarUrl?: string;
  identity: string;
  constraints?: string;
  examples?: unknown;
  modelId?: string;
  modelParams?: unknown;
  capabilities?: unknown;
  tools?: unknown;
  memoryEnabled?: boolean;
  memoryLimit?: number;
  routingRules?: unknown;
  isActive?: boolean;
  isDefault?: boolean;
}

export interface UpdatePersonaData {
  name?: string;
  description?: string;
  avatarUrl?: string;
  identity?: string;
  constraints?: string;
  examples?: unknown;
  modelId?: string;
  modelParams?: unknown;
  capabilities?: unknown;
  tools?: unknown;
  memoryEnabled?: boolean;
  memoryLimit?: number;
  routingRules?: unknown;
  isActive?: boolean;
  isDefault?: boolean;
}

export interface PersonaListResponse {
  success: boolean;
  data: Persona[];
  count: number;
}

export interface PersonaResponse {
  success: boolean;
  data: Persona;
}

export interface PersonaError {
  code: string;
  message: string;
}

export const personaApi = {
  // Get all personas
  getPersonas: async (): Promise<PersonaListResponse> => {
    const response = await apiClient.get('/api/personas');
    return response.data;
  },

  // Get persona by ID
  getPersona: async (id: string): Promise<PersonaResponse> => {
    const response = await apiClient.get(`/api/personas/${id}`);
    return response.data;
  },

  // Create new persona
  createPersona: async (data: CreatePersonaData): Promise<PersonaResponse> => {
    const response = await apiClient.post('/api/personas', data);
    return response.data;
  },

  // Update persona
  updatePersona: async (id: string, data: UpdatePersonaData): Promise<PersonaResponse> => {
    const response = await apiClient.put(`/api/personas/${id}`, data);
    return response.data;
  },

  // Delete persona (soft delete)
  deletePersona: async (id: string): Promise<PersonaResponse> => {
    const response = await apiClient.delete(`/api/personas/${id}`);
    return response.data;
  },

  // Seed default personas (admin only)
  seedDefaultPersonas: async (): Promise<PersonaListResponse> => {
    const response = await apiClient.post('/api/personas/seed');
    return response.data;
  },
};