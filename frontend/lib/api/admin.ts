import { apiClient } from './client';

export interface User {
  id: string;
  email: string;
  name: string | null;
  role: 'USER' | 'ADMIN' | 'BILLING_ADMIN';
  avatarUrl: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  lastLoginAt: string | null;
  failedLoginAttempts: number;
}

export interface UserSession {
  id: string;
  userId: string;
  userAgent: string;
  ipAddress: string;
  createdAt: string;
  lastActivityAt: string;
  expiresAt: string;
}

export interface UsageStat {
  date: string;
  totalTokens: number;
  totalCost: number;
  userCount: number;
  sessionCount: number;
}

export interface CostBreakdown {
  provider: string;
  model: string;
  totalCost: number;
  totalTokens: number;
  percentage: number;
}

export interface AuditLog {
  id: string;
  userId: string | null;
  userEmail: string | null;
  action: string;
  resourceType: string;
  resourceId: string | null;
  metadata: Record<string, any>;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
}

export interface SystemHealth {
  status: 'healthy' | 'degraded' | 'unhealthy';
  services: {
    database: boolean;
    redis: boolean;
    llmProviders: Record<string, boolean>;
  };
  metrics: {
    responseTime: number;
    errorRate: number;
    activeConnections: number;
  };
  lastUpdated: string;
}

export interface TopUser {
  userId: string;
  email: string;
  name: string | null;
  totalTokens: number;
  totalCost: number;
  sessionCount: number;
}

export interface TopPersona {
  personaId: string;
  name: string;
  description: string | null;
  totalTokens: number;
  totalCost: number;
  userCount: number;
}

export const adminApi = {
  // User Management
  getUsers: async (params?: {
    page?: number;
    limit?: number;
    search?: string;
    role?: string;
    isActive?: boolean;
  }) => {
    const response = await apiClient.get('/api/admin/users', { params });
    return response.data;
  },

  getUser: async (userId: string) => {
    const response = await apiClient.get(`/api/admin/users/${userId}`);
    return response.data;
  },

  updateUser: async (userId: string, data: {
    role?: string;
    isActive?: boolean;
    name?: string;
  }) => {
    const response = await apiClient.put(`/api/admin/users/${userId}`, data);
    return response.data;
  },

  getUserSessions: async (userId: string) => {
    const response = await apiClient.get(`/api/admin/users/${userId}/sessions`);
    return response.data;
  },

  // Analytics
  getSystemSummary: async () => {
    const response = await apiClient.get('/api/usage/admin/system-summary');
    return response.data;
  },

  getTopUsers: async (params?: { limit?: number; startDate?: string; endDate?: string }) => {
    const response = await apiClient.get('/api/usage/admin/top-users', { params });
    return response.data;
  },

  getTopPersonas: async (params?: { limit?: number; startDate?: string; endDate?: string }) => {
    const response = await apiClient.get('/api/usage/admin/top-personas', { params });
    return response.data;
  },

  getUsageTrends: async (params?: {
    period?: 'daily' | 'weekly' | 'monthly';
    days?: number;
  }) => {
    const response = await apiClient.get('/api/admin/analytics/trends', { params });
    return response.data;
  },

  getCostBreakdown: async (params?: { startDate?: string; endDate?: string }) => {
    const response = await apiClient.get('/api/admin/analytics/cost-breakdown', { params });
    return response.data;
  },

  // Audit Logs
  getAuditLogs: async (params?: {
    page?: number;
    limit?: number;
    userId?: string;
    action?: string;
    resourceType?: string;
    startDate?: string;
    endDate?: string;
    search?: string;
  }) => {
    const response = await apiClient.get('/api/admin/audit-logs', { params });
    return response.data;
  },

  exportAuditLogs: async (params?: {
    userId?: string;
    action?: string;
    resourceType?: string;
    startDate?: string;
    endDate?: string;
  }) => {
    const response = await apiClient.get('/api/admin/audit-logs/export', {
      params,
      responseType: 'blob',
    });
    return response.data;
  },

  // System Monitoring
  getSystemHealth: async () => {
    const response = await apiClient.get('/api/admin/monitoring/health');
    return response.data;
  },

  getPerformanceMetrics: async (params?: {
    timeframe?: '1h' | '24h' | '7d' | '30d';
  }) => {
    const response = await apiClient.get('/api/admin/monitoring/metrics', { params });
    return response.data;
  },

  getProviderStatus: async () => {
    const response = await apiClient.get('/api/admin/monitoring/providers');
    return response.data;
  },

  // Dashboard
  getDashboardStats: async () => {
    const response = await apiClient.get('/api/admin/dashboard/stats');
    return response.data;
  },

  getRecentActivity: async (limit?: number) => {
    const response = await apiClient.get('/api/admin/dashboard/activity', {
      params: { limit },
    });
    return response.data;
  },
};