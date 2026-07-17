/**
 * Usage Tracker
 * Real-time usage tracking per user, persona, and session
 */

import { sql } from '../../lib/db';
import { CostCalculator } from './cost.calculator';
import {
  UsageMetrics,
  UsageAggregation,
  RealTimeUsage,
} from './usage.types';

export class UsageTracker {
  private static instance: UsageTracker;
  private costCalculator: CostCalculator;

  private constructor() {
    this.costCalculator = CostCalculator.getInstance();
  }

  static getInstance(): UsageTracker {
    if (!UsageTracker.instance) {
      UsageTracker.instance = new UsageTracker();
    }
    return UsageTracker.instance;
  }

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
    const messages = await sql`
      SELECT 
        "inputTokens", 
        "outputTokens", 
        "modelId", 
        "createdAt"
      FROM "Message" 
      WHERE id = ${messageId}
    `;

    const message = messages[0];
    if (!message) {
      throw new Error(`Message ${messageId} not found`);
    }

    const messageTotalTokens = message.inputTokens + message.outputTokens;

    // Calculate cost
    const cost = await this.costCalculator.calculateMessageCost(messageId);

    // Update session usage
    await sql`
      UPDATE "Session" 
      SET 
        "tokensUsed" = "tokensUsed" + ${messageTotalTokens},
        "cost" = "cost" + ${cost.totalCost},
        "lastActiveAt" = NOW()
      WHERE id = ${sessionId}
    `;

    // Update user usage (increment counters)
    await this.incrementUserUsage(userId, {
      inputTokens: message.inputTokens,
      outputTokens: message.outputTokens,
      totalTokens: messageTotalTokens,
      apiCalls: 1,
      cost: cost.totalCost,
    });

    // Update persona usage if applicable
    if (personaId) {
      await this.incrementPersonaUsage(personaId, {
        inputTokens: message.inputTokens,
        outputTokens: message.outputTokens,
        totalTokens: messageTotalTokens,
        apiCalls: 1,
        cost: cost.totalCost,
      });
    }

    // Create usage record
    await this.createUsageRecord({
      period: 'hourly',
      timestamp: new Date(),
      userId,
      personaId,
      sessionId,
      modelId,
      metrics: {
        inputTokens: message.inputTokens,
        outputTokens: message.outputTokens,
        totalTokens: messageTotalTokens,
        apiCalls: 1,
        storageBytes: 0,
        cost: cost.totalCost,
      },
    });
  }

  /**
   * Track API call (for non-message operations)
   */
  async trackApiCall(
    userId: string,
    endpoint: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    await this.incrementUserUsage(userId, {
      inputTokens: 0,
      outputTokens: 0,
      totalTokens: 0,
      apiCalls: 1,
      cost: 0,
    });

    // Log API call for analytics
    await sql`
      INSERT INTO "AuditLog" (
        "userId", 
        "action", 
        "resource", 
        "metadata", 
        "success", 
        "createdAt"
      ) VALUES (
        ${userId},
        'api_call',
        ${endpoint},
        ${JSON.stringify(metadata || {})},
        true,
        NOW()
      )
    `;
  }

  /**
   * Track storage usage
   */
  async trackStorage(
    userId: string,
    bytes: number,
    _resourceType: string,
    _resourceId: string
  ): Promise<void> {
    await this.incrementUserUsage(userId, {
      inputTokens: 0,
      outputTokens: 0,
      totalTokens: 0,
      apiCalls: 0,
      storageBytes: bytes,
      cost: 0,
    });

    // Create storage usage record
    await this.createUsageRecord({
      period: 'hourly',
      timestamp: new Date(),
      userId,
      metrics: {
        inputTokens: 0,
        outputTokens: 0,
        totalTokens: 0,
        apiCalls: 0,
        storageBytes: bytes,
        cost: 0,
      },
    });
  }

  /**
   * Get real-time usage for user
   */
  async getRealTimeUsage(userId: string): Promise<RealTimeUsage> {
    const now = new Date();
    const startOfHour = new Date(now);
    startOfHour.setMinutes(0, 0, 0);

    // Get current hour usage
    const hourlyUsage = await sql<Array<{ total_tokens: number; total_cost: number }>>`
      SELECT 
        COALESCE(SUM("inputTokens" + "outputTokens"), 0) as total_tokens,
        COALESCE(SUM("cost"), 0) as total_cost
      FROM "Message" m
      JOIN "Session" s ON m."sessionId" = s.id
      WHERE s."userId" = ${userId}
        AND m."createdAt" >= ${startOfHour}
    `;

    // Get rate limit info (simplified - would come from API key or plan)
    // Note: API key query removed as it wasn't being used

    const rateLimit = 1000; // Default rate limit
    const rateLimitUsed = 0; // Would need to track per-minute/hour calls
    const rateLimitRemaining = rateLimit - rateLimitUsed;
    const rateLimitReset = new Date(now.getTime() + 3600000); // Reset in 1 hour

    return {
      userId,
      currentTokens: hourlyUsage[0]?.total_tokens || 0,
      currentCost: hourlyUsage[0]?.total_cost || 0,
      rateLimit,
      rateLimitRemaining,
      rateLimitReset,
    };
  }

  /**
   * Get usage metrics for time period
   */
  async getUsageMetrics(
    userId?: string,
    personaId?: string,
    sessionId?: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<UsageMetrics> {
    const whereClause: any = {};

    if (userId) {
      whereClause.session = { userId };
    }
    if (personaId) {
      whereClause.session = { ...whereClause.session, personaId };
    }
    if (sessionId) {
      whereClause.sessionId = sessionId;
    }
    if (startDate || endDate) {
      whereClause.createdAt = {};
      if (startDate) whereClause.createdAt.gte = startDate;
      if (endDate) whereClause.createdAt.lte = endDate;
    }

    // Build SQL query with filters
    let query;
    if (userId) {
      query = sql`
        SELECT "inputTokens", "outputTokens"
        FROM "Message" m
        JOIN "Session" s ON m."sessionId" = s.id
        WHERE s."userId" = ${userId}
      `;
    } else {
      query = sql`
        SELECT "inputTokens", "outputTokens"
        FROM "Message" m
        JOIN "Session" s ON m."sessionId" = s.id
        WHERE 1=1
      `;
    }
    
    if (startDate) {
      const safeStartDate: Date = startDate;
      query = sql`${query} AND m."createdAt" >= ${safeStartDate}`;
    }
    
    if (endDate) {
      const safeEndDate: Date = endDate;
      query = sql`${query} AND m."createdAt" <= ${safeEndDate}`;
    }
    
    if (personaId) {
      query = sql`${query} AND s."personaId" = ${personaId}`;
    }
    
    if (sessionId) {
      query = sql`${query} AND m."sessionId" = ${sessionId}`;
    }
    
    const messages = await query;

    // Calculate totals
    const inputTokens = messages.reduce((sum, msg) => sum + msg.inputTokens, 0);
    const outputTokens = messages.reduce((sum, msg) => sum + msg.outputTokens, 0);
    const totalTokens = inputTokens + outputTokens;
    const apiCalls = messages.length;

    // Calculate cost
    let cost = 0;
    if (messages.length > 0 && userId) {
      const costResult = await this.costCalculator.calculateUserCost(
        userId,
        startDate,
        endDate
      );
      cost = costResult.totalCost;
    }

    return {
      inputTokens,
      outputTokens,
      totalTokens,
      apiCalls,
      storageBytes: 0,
      cost,
    };
  }

  /**
   * Get usage trends
   */
  async getUsageTrends(
    userId: string,
    _period: 'daily' | 'weekly' | 'monthly' = 'daily',
    days: number = 30
  ): Promise<Array<{ date: string; tokens: number; cost: number }>> {
    const endDate = new Date();
    const startDate = new Date(endDate);
    startDate.setDate(startDate.getDate() - days);

    const trends = await sql<Array<{ date: string; tokens: number; cost: number }>>`
      SELECT 
        DATE(m."createdAt") as date,
        SUM(m."inputTokens" + m."outputTokens") as tokens,
        COALESCE(SUM(s."cost"), 0) as cost
      FROM "Message" m
      JOIN "Session" s ON m."sessionId" = s.id
      WHERE s."userId" = ${userId}
        AND m."createdAt" >= ${startDate}
        AND m."createdAt" <= ${endDate}
      GROUP BY DATE(m."createdAt")
      ORDER BY date ASC
    `;

    return trends;
  }

  /**
   * Reset usage counters (for testing or monthly reset)
   */
  async resetUsageCounters(userId: string): Promise<void> {
    // This would reset user-level usage counters
    // In a production system, you'd have a separate table for monthly usage
    console.log(`Resetting usage counters for user ${userId}`);
    // Implementation would depend on your counter storage strategy
  }

  /**
   * Private helper: Increment user usage counters
   */
  private async incrementUserUsage(userId: string, metrics: Partial<UsageMetrics>): Promise<void> {
    // In a real implementation, you'd update counters in a user_usage table
    // For now, we skip updating the user record since there's no settingsJson field
    console.log(`Incrementing usage for user ${userId}:`, metrics);
  }

  /**
   * Private helper: Increment persona usage counters
   */
  private async incrementPersonaUsage(personaId: string, metrics: Partial<UsageMetrics>): Promise<void> {
    // Similar to user usage, but for personas
    // This would be stored in persona metadata or a separate table
    console.log(`Incrementing usage for persona ${personaId}:`, metrics);
  }

  /**
   * Private helper: Create usage record
   */
  private async createUsageRecord(aggregation: UsageAggregation): Promise<void> {
    // In a production system, you'd write to a usage_aggregations table
    // For now, we'll log to audit log
    await sql`
      INSERT INTO "AuditLog" (
        "userId", 
        "action", 
        "resource", 
        "resourceId", 
        "metadata", 
        "success", 
        "createdAt"
      ) VALUES (
         ${aggregation.userId || null},
        'usage_tracked',
        'usage',
         ${(aggregation.sessionId || aggregation.personaId || 'system') as string},
        ${JSON.stringify({
          period: aggregation.period,
          timestamp: aggregation.timestamp,
          metrics: {
            inputTokens: aggregation.metrics.inputTokens,
            outputTokens: aggregation.metrics.outputTokens,
            totalTokens: aggregation.metrics.totalTokens,
            apiCalls: aggregation.metrics.apiCalls,
            storageBytes: aggregation.metrics.storageBytes,
            cost: aggregation.metrics.cost,
          },
        })},
        true,
        NOW()
      )
    `;
  }
}