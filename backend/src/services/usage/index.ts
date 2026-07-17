/**
 * Usage Service
 * Main entry point for usage tracking, cost calculation, quota management, and analytics
 */

import { sql } from '../../lib/db';
import { CostCalculator } from './cost.calculator';
import { UsageTracker } from './usage.tracker';
import { QuotaManager } from './quota.manager';
import { UsageAnalytics } from './usage.analytics';
import {
  UsageMetrics,
  CostCalculation,
  QuotaDefinition,
  QuotaUsage,
  UsageReport,
  RealTimeUsage,
  BudgetTracking,
  ProviderPricing
} from './usage.types';

export class UsageService {
  private static instance: UsageService;
  private costCalculator: CostCalculator;
  private usageTracker: UsageTracker;
  private quotaManager: QuotaManager;
  private usageAnalytics: UsageAnalytics;

  private constructor() {
    this.costCalculator = CostCalculator.getInstance();
    this.usageTracker = UsageTracker.getInstance();
    this.quotaManager = QuotaManager.getInstance();
    this.usageAnalytics = UsageAnalytics.getInstance();
  }

  static getInstance(): UsageService {
    if (!UsageService.instance) {
      UsageService.instance = new UsageService();
    }
    return UsageService.instance;
  }

  // ===========================================================================
  // Cost Calculation Methods
  // ===========================================================================

  /**
   * Calculate cost for token usage
   */
  async calculateCost(
    inputTokens: number,
    outputTokens: number,
    modelId?: string,
    provider?: string,
    modelIdentifier?: string
  ): Promise<CostCalculation> {
    return this.costCalculator.calculateCost(
      inputTokens,
      outputTokens,
      modelId,
      provider,
      modelIdentifier
    );
  }

  /**
   * Calculate cost for a message
   */
  async calculateMessageCost(messageId: string): Promise<CostCalculation> {
    return this.costCalculator.calculateMessageCost(messageId);
  }

  /**
   * Calculate cost for a session
   */
  async calculateSessionCost(sessionId: string): Promise<{
    totalCost: number;
    breakdown: CostCalculation[];
    messageCount: number;
  }> {
    return this.costCalculator.calculateSessionCost(sessionId);
  }

  /**
   * Calculate cost for a user
   */
  async calculateUserCost(
    userId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<{
    totalCost: number;
    breakdownByModel: Record<string, number>;
    breakdownByPersona: Record<string, number>;
    messageCount: number;
    sessionCount: number;
  }> {
    return this.costCalculator.calculateUserCost(userId, startDate, endDate);
  }

  /**
   * Estimate cost before making API call
   */
  async estimateCost(
    estimatedInputTokens: number,
    estimatedOutputTokens: number,
    modelId?: string,
    provider?: string,
    modelIdentifier?: string
  ): Promise<CostCalculation> {
    return this.costCalculator.estimateCost(
      estimatedInputTokens,
      estimatedOutputTokens,
      modelId,
      provider,
      modelIdentifier
    );
  }

  /**
   * Get all pricing information
   */
  async getAllPricing(): Promise<ProviderPricing[]> {
    return this.costCalculator.getAllPricing();
  }

  /**
   * Update pricing for a model
   */
  async updatePricing(
    modelId: string,
    costPer1kInput: number,
    costPer1kOutput: number
  ): Promise<void> {
    return this.costCalculator.updatePricing(modelId, costPer1kInput, costPer1kOutput);
  }

  // ===========================================================================
  // Usage Tracking Methods
  // ===========================================================================

  /**
   * Track message usage
   */
  async trackMessage(
    messageId: string,
    sessionId: string,
    userId: string,
    personaId?: string,
    modelId?: string
  ): Promise<void> {
    return this.usageTracker.trackMessage(messageId, sessionId, userId, personaId, modelId);
  }

  /**
   * Track API call
   */
  async trackApiCall(
    userId: string,
    endpoint: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    return this.usageTracker.trackApiCall(userId, endpoint, metadata);
  }

  /**
   * Track storage usage
   */
  async trackStorage(
    userId: string,
    bytes: number,
    resourceType: string,
    resourceId: string
  ): Promise<void> {
    return this.usageTracker.trackStorage(userId, bytes, resourceType, resourceId);
  }

  /**
   * Get real-time usage
   */
  async getRealTimeUsage(userId: string): Promise<RealTimeUsage> {
    return this.usageTracker.getRealTimeUsage(userId);
  }

  /**
   * Get usage metrics
   */
  async getUsageMetrics(
    userId?: string,
    personaId?: string,
    sessionId?: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<UsageMetrics> {
    return this.usageTracker.getUsageMetrics(userId, personaId, sessionId, startDate, endDate);
  }

  /**
   * Get usage trends
   */
  async getUsageTrends(
    userId: string,
    period: 'daily' | 'weekly' | 'monthly' = 'daily',
    days: number = 30
  ): Promise<Array<{ date: string; tokens: number; cost: number }>> {
    return this.usageTracker.getUsageTrends(userId, period, days);
  }

  // ===========================================================================
  // Quota Management Methods
  // ===========================================================================

  /**
   * Get user quota definition
   */
  async getUserQuota(userId: string): Promise<QuotaDefinition> {
    return this.quotaManager.getUserQuota(userId);
  }

  /**
   * Get current quota usage
   */
  async getQuotaUsage(userId: string): Promise<QuotaUsage> {
    return this.quotaManager.getQuotaUsage(userId);
  }

  /**
   * Check if user can perform action
   */
  async canPerformAction(
    userId: string,
    action: 'send_message' | 'create_session' | 'create_persona' | 'upload_file',
    estimatedTokens?: number,
    estimatedCost?: number
  ): Promise<{ allowed: boolean; reason?: string; quotaUsage?: QuotaUsage }> {
    return this.quotaManager.canPerformAction(userId, action, estimatedTokens, estimatedCost);
  }

  /**
   * Check and create quota alerts
   */
  async checkQuotaAlerts(userId: string): Promise<void> {
    return this.quotaManager.checkQuotaAlerts(userId);
  }

  /**
   * Set user budget
   */
  async setUserBudget(
    userId: string,
    budgetAmount: number,
    budgetPeriod: 'daily' | 'weekly' | 'monthly' | 'yearly' = 'monthly',
    alertsEnabled: boolean = true,
    alertThresholds: number[] = [50, 80, 90, 100]
  ): Promise<BudgetTracking> {
    return this.quotaManager.setUserBudget(
      userId,
      budgetAmount,
      budgetPeriod,
      alertsEnabled,
      alertThresholds
    );
  }

  /**
   * Get user budget
   */
  async getUserBudget(userId: string): Promise<BudgetTracking | null> {
    return this.quotaManager.getUserBudget(userId);
  }

  // ===========================================================================
  // Analytics & Reporting Methods
  // ===========================================================================

  /**
   * Generate usage report
   */
  async generateUsageReport(
    userId?: string,
    organizationId?: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<UsageReport> {
    return this.usageAnalytics.generateUsageReport(userId, organizationId, startDate, endDate);
  }

  /**
   * Forecast future usage
   */
  async forecastUsage(
    userId?: string,
    days: number = 30
  ): Promise<{
    forecast: Array<{ date: Date; predictedTokens: number; predictedCost: number }>;
    confidence: number;
    factors: string[];
  }> {
    return this.usageAnalytics.forecastUsage(userId, days);
  }

  /**
   * Get top users by usage
   */
  async getTopUsers(
    limit: number = 10,
    startDate?: Date,
    endDate?: Date
  ): Promise<Array<{ userId: string; tokens: number; cost: number; messageCount: number }>> {
    return this.usageAnalytics.getTopUsers(limit, startDate, endDate);
  }

  /**
   * Get top personas by usage
   */
  async getTopPersonas(
    limit: number = 10,
    startDate?: Date,
    endDate?: Date
  ): Promise<Array<{ personaId: string; name: string; tokens: number; cost: number; sessionCount: number }>> {
    return this.usageAnalytics.getTopPersonas(limit, startDate, endDate);
  }

  /**
   * Export usage data to CSV
   */
  async exportUsageData(
    userId?: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<string> {
    return this.usageAnalytics.exportUsageData(userId, startDate, endDate);
  }

  // ===========================================================================
  // Utility Methods
  // ===========================================================================

  /**
   * Initialize usage tracking for a new user
   */
  async initializeUserUsage(userId: string): Promise<void> {
    // Set default budget
    await this.setUserBudget(userId, 10, 'monthly');
    
    // Create initial quota check
    await this.checkQuotaAlerts(userId);
    
    console.log(`Usage tracking initialized for user ${userId}`);
  }

  /**
   * Reset usage counters (for testing or monthly reset)
   */
  async resetUsageCounters(userId: string): Promise<void> {
    await this.usageTracker.resetUsageCounters(userId);
  }

  /**
   * Get system-wide usage summary
   */
  async getSystemUsageSummary(): Promise<{
    totalUsers: number;
    totalTokens: number;
    totalCost: number;
    totalMessages: number;
    totalSessions: number;
    activeUsers24h: number;
  }> {
    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const [
      totalUsers,
      totalMessages,
      totalSessions,
      activeUsers24h,
    ] = await Promise.all([
      sql`SELECT COUNT(*) as count FROM "User"`.then(result => parseInt(result[0]?.count || '0')),
      sql`SELECT COUNT(*) as count FROM "Message"`.then(result => parseInt(String(result[0]?.count || '0'))),
      sql`SELECT COUNT(*) as count FROM "Session"`.then(result => parseInt(String(result[0]?.count || '0'))),
      // Count distinct users with active sessions in last 24h
      sql<Array<{ count: number }>>`
        SELECT COUNT(DISTINCT "userId") as count
        FROM "Session"
        WHERE "lastActiveAt" >= ${yesterday}
      `.then(result => parseInt(String(result[0]?.count || '0'))),
    ]);

    // Get total tokens and cost
    const messages = await sql`
      SELECT "inputTokens", "outputTokens"
      FROM "Message"
    `;

    const totalTokens = messages.reduce(
      (sum, msg) => sum + msg.inputTokens + msg.outputTokens,
      0
    );

    // Estimate total cost (simplified)
    const totalCost = totalTokens * 0.00002; // Rough estimate

    return {
      totalUsers,
      totalTokens,
      totalCost,
      totalMessages,
      totalSessions,
      activeUsers24h,
    };
  }
}

// Export singleton instance
export const usageService = UsageService.getInstance();