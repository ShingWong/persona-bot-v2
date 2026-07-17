/**
 * Usage Analytics Service
 * Aggregation, reporting, and forecasting for usage data
 */

import { sql } from '../../lib/db';
import { CostCalculator } from './cost.calculator';
import { UsageTracker } from './usage.tracker';
import {
  UsageReport,
  CostBreakdown,
  UsageTrend,
  UsageMetrics,
} from './usage.types';

export class UsageAnalytics {
  private static instance: UsageAnalytics;
  private costCalculator: CostCalculator;
  private usageTracker: UsageTracker;

  private constructor() {
    this.costCalculator = CostCalculator.getInstance();
    this.usageTracker = UsageTracker.getInstance();
  }

  static getInstance(): UsageAnalytics {
    if (!UsageAnalytics.instance) {
      UsageAnalytics.instance = new UsageAnalytics();
    }
    return UsageAnalytics.instance;
  }

  /**
   * Generate usage report
   */
  async generateUsageReport(
    userId?: string,
    organizationId?: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<UsageReport> {
    const now = new Date();
    const periodStart = startDate || new Date(now.getFullYear(), now.getMonth(), 1);
    const periodEnd = endDate || now;

    // Get usage metrics
    const summary = await this.usageTracker.getUsageMetrics(
      userId,
      undefined,
      undefined,
      periodStart,
      periodEnd
    );

    // Get cost breakdown
    const breakdown = await this.getCostBreakdown(userId, periodStart, periodEnd);

    // Get usage trends
    const trends = await this.getUsageTrends(userId);

    // Get alerts (from audit logs)
    const alerts = await this.getAlerts(userId, periodStart, periodEnd);

    // Generate recommendations
    const recommendations = await this.generateRecommendations(summary, breakdown, trends);

    return {
      periodStart,
      periodEnd,
      userId,
      organizationId,
      summary,
      breakdown,
      trends,
      alerts,
      recommendations,
    };
  }

  /**
   * Get cost breakdown
   */
  private async getCostBreakdown(
    userId?: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<CostBreakdown> {
    const whereClause: any = {};
    if (userId) {
      whereClause.session = { userId };
    }
    if (startDate || endDate) {
      whereClause.createdAt = {};
      if (startDate) whereClause.createdAt.gte = startDate;
      if (endDate) whereClause.createdAt.lte = endDate;
    }

    // Build SQL query with filters
    let query = sql`
      SELECT 
        m.*,
        am.provider as "modelProvider",
        am."modelIdentifier" as "modelModelIdentifier",
        s."personaId",
        s."userId"
      FROM "Message" m
      LEFT JOIN "AIModel" am ON m."aiModelId" = am.id
      LEFT JOIN "Session" s ON m."sessionId" = s.id
      WHERE 1=1
    `;
    
    if (userId) {
      query = sql`${query} AND s."userId" = ${userId}`;
    }
    
    if (startDate) {
      query = sql`${query} AND m."createdAt" >= ${startDate}`;
    }
    
    if (endDate) {
      query = sql`${query} AND m."createdAt" <= ${endDate}`;
    }
    
    const messages = await query;

    const breakdown: CostBreakdown = {
      byProvider: {},
      byModel: {},
      byPersona: {},
      byUser: {},
      totalCost: 0,
      periodStart: startDate || new Date(0),
      periodEnd: endDate || new Date(),
    };

    // Calculate costs and aggregate
    for (const message of messages) {
      const cost = await this.costCalculator.calculateCost(
        message.inputTokens,
        message.outputTokens,
        message.aiModelId || undefined,
        message.modelProvider,
        message.modelModelIdentifier
      );

      breakdown.totalCost += cost.totalCost;

      // Aggregate by provider
      const provider = cost.provider || 'unknown';
      breakdown.byProvider[provider] = (breakdown.byProvider[provider] || 0) + cost.totalCost;

      // Aggregate by model
      const modelKey = `${provider}/${cost.modelIdentifier}`;
      breakdown.byModel[modelKey] = (breakdown.byModel[modelKey] || 0) + cost.totalCost;

      // Aggregate by persona
      const personaId = message.personaId || 'default';
      breakdown.byPersona[personaId] = (breakdown.byPersona[personaId] || 0) + cost.totalCost;

      // Aggregate by user
      const userId = message.userId;
      breakdown.byUser[userId] = (breakdown.byUser[userId] || 0) + cost.totalCost;
    }

    return breakdown;
  }

  /**
   * Get usage trends
   */
  private async getUsageTrends(
    userId?: string
  ): Promise<UsageTrend[]> {
    const trends: UsageTrend[] = [];

    // Get daily trends for the last 30 days
    const dailyTrends = await this.usageTracker.getUsageTrends(
      userId || '',
      'daily',
      30
    );

    // Convert to UsageTrend format
    let previousTokens = 0;
    for (const trend of dailyTrends) {
      const changePercentage = previousTokens > 0 
        ? ((trend.tokens - previousTokens) / previousTokens) * 100 
        : 0;

      trends.push({
        timestamp: new Date(trend.date),
        metrics: {
          inputTokens: 0, // Would need to calculate from actual data
          outputTokens: 0,
          totalTokens: trend.tokens,
          apiCalls: 0,
          storageBytes: 0,
          cost: trend.cost,
        },
        changePercentage,
      });

      previousTokens = trend.tokens;
    }

    return trends;
  }

  /**
   * Get alerts for period
   */
  private async getAlerts(
    userId?: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<any[]> {
    const whereClause: any = {
      action: 'quota_alert',
    };

    if (userId) {
      whereClause.userId = userId;
    }
    if (startDate || endDate) {
      whereClause.createdAt = {};
      if (startDate) whereClause.createdAt.gte = startDate;
      if (endDate) whereClause.createdAt.lte = endDate;
    }

    // Build SQL query with filters
    let query = sql`
      SELECT * FROM "AuditLog" 
      WHERE "action" = 'quota_alert'
    `;
    
    if (userId) {
      query = sql`${query} AND "userId" = ${userId}`;
    }
    
    if (startDate) {
      query = sql`${query} AND "createdAt" >= ${startDate}`;
    }
    
    if (endDate) {
      query = sql`${query} AND "createdAt" <= ${endDate}`;
    }
    
    query = sql`${query} ORDER BY "createdAt" DESC LIMIT 50`;
    
    const alerts = await query;

    return alerts.map(alert => ({
      ...(alert.metadata as any),
      id: alert.id,
      createdAt: alert.createdAt,
    }));
  }

  /**
   * Generate recommendations based on usage patterns
   */
  private async generateRecommendations(
    summary: UsageMetrics,
    breakdown: CostBreakdown,
    trends: UsageTrend[]
  ): Promise<string[]> {
    const recommendations: string[] = [];

    // Check for high-cost providers
    const providers = Object.entries(breakdown.byProvider);
    if (providers.length > 1) {
      const sortedProviders = providers.sort((a, b) => b[1] - a[1]);
      const mostExpensive = sortedProviders[0];
      const cheapest = sortedProviders[sortedProviders.length - 1];

      if (mostExpensive[1] > cheapest[1] * 2) {
        recommendations.push(
          `Consider switching from ${mostExpensive[0]} to ${cheapest[0]} to reduce costs by approximately $${(mostExpensive[1] - cheapest[1]).toFixed(2)}`
        );
      }
    }

    // Check for token efficiency
    const costPerToken = summary.totalTokens > 0 ? summary.cost / summary.totalTokens : 0;
    if (costPerToken > 0.0001) { // More than $0.0001 per token
      recommendations.push(
        `Average cost per token is $${costPerToken.toFixed(6)}. Consider using more efficient models or optimizing prompts.`
      );
    }

    // Check for usage patterns
    if (trends.length >= 7) {
      const recentTrends = trends.slice(-7);
      const averageDailyTokens = recentTrends.reduce((sum, t) => sum + t.metrics.totalTokens, 0) / 7;
      
      if (averageDailyTokens > 10000) {
        recommendations.push(
          `High daily usage detected (${averageDailyTokens.toFixed(0)} tokens/day). Consider implementing caching or optimizing conversation flow.`
        );
      }
    }

    // Check for cost vs budget
    if (summary.cost > 50) {
      recommendations.push(
        `Monthly cost is $${summary.cost.toFixed(2)}. Consider setting up budget alerts to monitor spending.`
      );
    }

    // Add general recommendations
    recommendations.push(
      'Review persona usage patterns to identify optimization opportunities.',
      'Consider implementing response caching for frequently asked questions.',
      'Monitor token usage by persona to identify cost-saving opportunities.'
    );

    return recommendations;
  }

  /**
   * Forecast future usage based on historical data
   */
  async forecastUsage(
    userId?: string,
    days: number = 30
  ): Promise<{
    forecast: Array<{ date: Date; predictedTokens: number; predictedCost: number }>;
    confidence: number;
    factors: string[];
  }> {
    // Get historical data
    const historicalTrends = await this.usageTracker.getUsageTrends(
      userId || '',
      'daily',
      90 // Last 90 days
    );

    if (historicalTrends.length < 7) {
      return {
        forecast: [],
        confidence: 0,
        factors: ['Insufficient historical data for forecasting'],
      };
    }

    // Simple moving average forecast
    const windowSize = 7;
    const forecast = [];
    let totalTokens = 0;
    let totalCost = 0;

    for (let i = 0; i < days; i++) {
      // Calculate moving average
      const startIdx = Math.max(0, historicalTrends.length - windowSize);
      const window = historicalTrends.slice(startIdx);
      
      const avgTokens = window.reduce((sum, t) => sum + t.tokens, 0) / window.length;
      const avgCost = window.reduce((sum, t) => sum + t.cost, 0) / window.length;

      const forecastDate = new Date();
      forecastDate.setDate(forecastDate.getDate() + i + 1);

      forecast.push({
        date: forecastDate,
        predictedTokens: Math.max(0, avgTokens),
        predictedCost: Math.max(0, avgCost),
      });

      totalTokens += avgTokens;
      totalCost += avgCost;
    }

    // Calculate confidence based on data consistency
    const tokenValues = historicalTrends.map(t => t.tokens);
    const mean = tokenValues.reduce((a, b) => a + b) / tokenValues.length;
    const variance = tokenValues.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / tokenValues.length;
    const stdDev = Math.sqrt(variance);
    const coefficientOfVariation = stdDev / mean;
    
    // Confidence is inverse of coefficient of variation (more consistent data = higher confidence)
    const confidence = Math.max(0, Math.min(1, 1 - coefficientOfVariation));

    const factors = [
      `Based on ${historicalTrends.length} days of historical data`,
      `Using ${windowSize}-day moving average`,
      confidence > 0.7 ? 'High data consistency' : 'Moderate data variability',
    ];

    return {
      forecast,
      confidence,
      factors,
    };
  }

  /**
   * Get top users by usage
   */
  async getTopUsers(
    limit: number = 10,
    startDate?: Date,
    endDate?: Date
  ): Promise<Array<{ userId: string; tokens: number; cost: number; messageCount: number }>> {
    const whereClause: any = {};
    if (startDate || endDate) {
      whereClause.createdAt = {};
      if (startDate) whereClause.createdAt.gte = startDate;
      if (endDate) whereClause.createdAt.lte = endDate;
    }

    // Build SQL query with filters
    let query = sql<Array<{ user_id: string; tokens: number; cost: number; message_count: number }>>`
      SELECT 
        s."userId" as user_id,
        SUM(m."inputTokens" + m."outputTokens") as tokens,
        COALESCE(SUM(s."cost"), 0) as cost,
        COUNT(m.id) as message_count
      FROM "Message" m
      JOIN "Session" s ON m."sessionId" = s.id
      WHERE 1=1
    `;
    
    if (startDate) {
      query = sql`${query} AND m."createdAt" >= ${startDate}`;
    }
    
    if (endDate) {
      query = sql`${query} AND m."createdAt" <= ${endDate}`;
    }
    
    query = sql`${query} GROUP BY s."userId" ORDER BY tokens DESC LIMIT ${limit}`;
    
    const results = await query;

    return results.map(r => ({
      userId: r.user_id,
      tokens: Number(r.tokens),
      cost: Number(r.cost),
      messageCount: Number(r.message_count),
    }));
  }

  /**
   * Get top personas by usage
   */
  async getTopPersonas(
    limit: number = 10,
    startDate?: Date,
    endDate?: Date
  ): Promise<Array<{ personaId: string; name: string; tokens: number; cost: number; sessionCount: number }>> {
    const whereClause: any = {
      personaId: { not: null },
    };
    
    if (startDate || endDate) {
      whereClause.createdAt = {};
      if (startDate) whereClause.createdAt.gte = startDate;
      if (endDate) whereClause.createdAt.lte = endDate;
    }

    // Build SQL query with filters
    let query = sql<Array<{ persona_id: string; name: string; tokens: number; cost: number; session_count: number }>>`
      SELECT 
        s."personaId" as persona_id,
        p.name,
        SUM(m."inputTokens" + m."outputTokens") as tokens,
        COALESCE(SUM(s."cost"), 0) as cost,
        COUNT(DISTINCT s.id) as session_count
      FROM "Message" m
      JOIN "Session" s ON m."sessionId" = s.id
      JOIN "Persona" p ON s."personaId" = p.id
      WHERE s."personaId" IS NOT NULL
    `;
    
    if (startDate) {
      query = sql`${query} AND m."createdAt" >= ${startDate}`;
    }
    
    if (endDate) {
      query = sql`${query} AND m."createdAt" <= ${endDate}`;
    }
    
    query = sql`${query} GROUP BY s."personaId", p.name ORDER BY tokens DESC LIMIT ${limit}`;
    
    const results = await query;

    return results.map(r => ({
      personaId: r.persona_id,
      name: r.name,
      tokens: Number(r.tokens),
      cost: Number(r.cost),
      sessionCount: Number(r.session_count),
    }));
  }

  /**
   * Export usage data to CSV format
   */
  async exportUsageData(
    userId?: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<string> {
    const whereClause: any = {};
    if (userId) {
      whereClause.session = { userId };
    }
    if (startDate || endDate) {
      whereClause.createdAt = {};
      if (startDate) whereClause.createdAt.gte = startDate;
      if (endDate) whereClause.createdAt.lte = endDate;
    }

    // Build SQL query with filters
    let query = sql`
      SELECT 
        m.*,
        am.provider as "modelProvider",
        am."modelIdentifier" as "modelModelIdentifier",
        s."personaId",
        s."userId"
      FROM "Message" m
      LEFT JOIN "AIModel" am ON m."aiModelId" = am.id
      LEFT JOIN "Session" s ON m."sessionId" = s.id
      WHERE 1=1
    `;
    
    if (userId) {
      query = sql`${query} AND s."userId" = ${userId}`;
    }
    
    if (startDate) {
      query = sql`${query} AND m."createdAt" >= ${startDate}`;
    }
    
    if (endDate) {
      query = sql`${query} AND m."createdAt" <= ${endDate}`;
    }
    
    query = sql`${query} ORDER BY m."createdAt" DESC`;
    
    const messages = await query;

    // Generate CSV
    let csv = 'Timestamp,User ID,Persona ID,Provider,Model,Input Tokens,Output Tokens,Total Tokens,Cost\n';
    
    for (const message of messages) {
      const cost = await this.costCalculator.calculateCost(
        message.inputTokens,
        message.outputTokens,
        message.aiModelId || undefined,
        message.modelProvider,
        message.modelModelIdentifier
      );

      csv += `"${message.createdAt.toISOString()}","${message.userId}","${message.personaId || ''}","${message.modelProvider || 'unknown'}","${message.modelModelIdentifier || 'unknown'}","${message.inputTokens}","${message.outputTokens}","${message.inputTokens + message.outputTokens}","${cost.totalCost.toFixed(6)}"\n`;
    }

    return csv;
  }
}