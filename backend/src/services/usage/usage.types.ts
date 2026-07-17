/**
 * Usage Tracking Types
 * Types for usage tracking, cost calculation, and quota management
 */

export interface UsageMetrics {
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  apiCalls: number;
  storageBytes: number;
  cost: number;
}

export interface CostCalculation {
  inputTokens: number;
  outputTokens: number;
  inputCost: number;
  outputCost: number;
  totalCost: number;
  costPerToken: number;
  modelId?: string;
  provider: string;
  modelIdentifier: string;
}

export interface QuotaDefinition {
  maxTokensPerMonth?: number;
  maxApiCallsPerMonth?: number;
  maxStorageBytes?: number;
  maxCostPerMonth?: number;
  maxSessionsPerMonth?: number;
  maxMessagesPerMonth?: number;
  maxPersonas?: number;
}

export interface QuotaUsage {
  tokensUsed: number;
  apiCallsUsed: number;
  storageBytesUsed: number;
  costUsed: number;
  sessionsUsed: number;
  messagesUsed: number;
  personasUsed: number;
  quotaRemaining: QuotaDefinition;
  quotaPercentage: QuotaDefinition;
  isExceeded: boolean;
  exceededFields: string[];
}

export interface UsageAggregation {
  period: 'hourly' | 'daily' | 'weekly' | 'monthly';
  timestamp: Date;
  userId?: string;
  personaId?: string;
  sessionId?: string;
  modelId?: string;
  provider?: string;
  metrics: UsageMetrics;
}

export interface CostBreakdown {
  byProvider: Record<string, number>;
  byModel: Record<string, number>;
  byPersona: Record<string, number>;
  byUser: Record<string, number>;
  totalCost: number;
  periodStart: Date;
  periodEnd: Date;
}

export interface UsageAlert {
  type: 'quota_warning' | 'quota_exceeded' | 'cost_warning' | 'cost_exceeded';
  userId: string;
  field: string;
  threshold: number;
  currentValue: number;
  message: string;
  timestamp: Date;
  acknowledged: boolean;
}

export interface UsageReport {
  periodStart: Date;
  periodEnd: Date;
  userId?: string;
  organizationId?: string;
  summary: UsageMetrics;
  breakdown: CostBreakdown;
  trends: UsageTrend[];
  alerts: UsageAlert[];
  recommendations: string[];
}

export interface UsageTrend {
  timestamp: Date;
  metrics: UsageMetrics;
  changePercentage: number;
}

export interface BudgetTracking {
  userId: string;
  budgetAmount: number;
  budgetPeriod: 'daily' | 'weekly' | 'monthly' | 'yearly';
  spentAmount: number;
  remainingAmount: number;
  percentageUsed: number;
  resetDate: Date;
  alertsEnabled: boolean;
  alertThresholds: number[]; // e.g., [50, 80, 90, 100]
}

export interface ProviderPricing {
  provider: string;
  modelIdentifier: string;
  costPer1kInput: number;
  costPer1kOutput: number;
  currency: string;
  updatedAt: Date;
  notes?: string;
}

export interface RealTimeUsage {
  userId: string;
  sessionId?: string;
  personaId?: string;
  currentTokens: number;
  currentCost: number;
  rateLimit: number;
  rateLimitRemaining: number;
  rateLimitReset: Date;
}