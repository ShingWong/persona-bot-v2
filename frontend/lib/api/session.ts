import { apiClient } from './client';

export interface Session {
  id: string;
  userId: string;
  title: string;
  personaId: string | null;
  aiModelId: string | null;
  modelOverride: unknown;
  status: 'ACTIVE' | 'ARCHIVED' | 'DELETED';
  userAgent: string | null;
  ipAddress: string | null;
  createdAt: string;
  updatedAt: string;
  lastMessageAt: string | null;
  messageCount: number;
  totalTokens: number;
}

export interface Message {
  id: string;
  sessionId: string;
  role: 'USER' | 'ASSISTANT' | 'SYSTEM';
  content: string;
  contentJson: unknown;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  modelId: string | null;
  modelUsed: string | null;
  latencyMs: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSessionData {
  title: string;
  personaId?: string;
  aiModelId?: string;
  modelOverride?: unknown;
}

export interface UpdateSessionData {
  title?: string;
  personaId?: string;
  aiModelId?: string;
  modelOverride?: unknown;
  status?: 'ACTIVE' | 'ARCHIVED' | 'DELETED';
}

export interface SendMessageData {
  content: string;
  stream?: boolean;
  temperature?: number;
  maxTokens?: number;
}

export interface SessionListResponse {
  success: boolean;
  data: Session[];
  count: number;
}

export interface SessionResponse {
  success: boolean;
  data: Session;
}

export interface MessageListResponse {
  success: boolean;
  data: Message[];
  count: number;
}

export interface MessageResponse {
  success: boolean;
  data: Message;
}

export interface TokenUsageResponse {
  success: boolean;
  data: {
    totalTokens: number;
    inputTokens: number;
    outputTokens: number;
    averageTokensPerMessage: number;
  };
}

export interface LLMResponse {
  success: boolean;
  data: {
    message: {
      content: string;
      modelUsed: string;
      inputTokens: number;
      outputTokens: number;
      totalTokens: number;
      latencyMs: number;
    };
    usage: {
      inputTokens: number;
      outputTokens: number;
      totalTokens: number;
      latencyMs: number;
    };
  };
}

export const sessionApi = {
  // Get all sessions
  getSessions: async (params?: {
    status?: 'ACTIVE' | 'ARCHIVED' | 'DELETED';
    limit?: number;
    offset?: number;
  }): Promise<SessionListResponse> => {
    const response = await apiClient.get('/api/sessions', { params });
    return response.data;
  },

  // Get session by ID
  getSession: async (id: string): Promise<SessionResponse> => {
    const response = await apiClient.get(`/api/sessions/${id}`);
    return response.data;
  },

  // Create new session
  createSession: async (data: CreateSessionData): Promise<SessionResponse> => {
    const response = await apiClient.post('/api/sessions', data);
    return response.data;
  },

  // Update session
  updateSession: async (id: string, data: UpdateSessionData): Promise<SessionResponse> => {
    const response = await apiClient.put(`/api/sessions/${id}`, data);
    return response.data;
  },

  // Delete session
  deleteSession: async (id: string): Promise<SessionResponse> => {
    const response = await apiClient.delete(`/api/sessions/${id}`);
    return response.data;
  },

  // Get session messages
  getMessages: async (
    sessionId: string,
    params?: { limit?: number; offset?: number }
  ): Promise<MessageListResponse> => {
    const response = await apiClient.get(`/api/sessions/${sessionId}/messages`, { params });
    return response.data;
  },

  // Send message to LLM
  sendMessage: async (
    sessionId: string,
    data: SendMessageData
  ): Promise<LLMResponse> => {
    const response = await apiClient.post(`/api/sessions/${sessionId}/messages/llm`, data);
    return response.data;
  },

  // Get token usage for session
  getTokenUsage: async (sessionId: string): Promise<TokenUsageResponse> => {
    const response = await apiClient.get(`/api/sessions/${sessionId}/messages/usage/tokens`);
    return response.data;
  },
};