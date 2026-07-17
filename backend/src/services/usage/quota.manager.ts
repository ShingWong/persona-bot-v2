/**
 * Quota Manager
 * Quota management and enforcement system
 */

import { sql } from '../../lib/db';
import { UsageTracker } from './usage.tracker';
import { CostCalculator } from './cost.calculator';
import {
  QuotaDefinition,
  QuotaUsage,
  UsageAlert,
  BudgetTracking,
} from './usage.types';

export class QuotaManager {
  private static instance: QuotaManager;
  private usageTracker: UsageTracker;
  private costCalculator: CostCalculator;

  private constructor() {
    this.usageTracker = UsageTracker.getInstance();
    this.costCalculator = CostCalculator.getInstance();
  }

  static getInstance(): QuotaManager {
    if (!QuotaManager.instance) {
      QuotaManager.instance = new QuotaManager();
    }
    return QuotaManager.instance;
  }

  /**
   * Get quota definition for user
   */
  async getUserQuota(userId: string): Promise<QuotaDefinition> {
    const users = await sql`
      SELECT 
        u.*,
        json_agg(
          json_build_object(
            'organization', o.*
          )
        ) as "organizationUsers"
      FROM "User" u
      LEFT JOIN "OrganizationUser" ou ON u.id = ou."userId"
      LEFT JOIN "Organization" o ON ou."organizationId" = o.id
      WHERE u.id = ${userId}
      GROUP BY u.id
    `;

    const user = users[0];
    if (!user) {
      throw new Error(`User ${userId} not found`);
    }

    // Default quotas (free tier)
    const defaultQuota: QuotaDefinition = {
      maxTokensPerMonth: 100000, // 100K tokens
      maxApiCallsPerMonth: 1000, // 1K API calls
      maxStorageBytes: 100 * 1024 * 1024, // 100MB
      maxCostPerMonth: 10, // $10
      maxSessionsPerMonth: 100,
      maxMessagesPerMonth: 1000,
      maxPersonas: 5,
    };

    // Check if user has organization with custom quotas
    if (user.organizationUsers.length > 0) {
      const org = user.organizationUsers[0].organization;
      if (org.quota) {
        const orgQuota = org.quota as any;
        return {
          ...defaultQuota,
          ...orgQuota,
        };
      }
    }

    // Check user role for increased quotas
    if (user.role === 'ADMIN' || user.role === 'DEVELOPER') {
      return {
        ...defaultQuota,
        maxTokensPerMonth: 1000000, // 1M tokens
        maxApiCallsPerMonth: 10000, // 10K API calls
        maxStorageBytes: 1 * 1024 * 1024 * 1024, // 1GB
        maxCostPerMonth: 100, // $100
        maxSessionsPerMonth: 1000,
        maxMessagesPerMonth: 10000,
        maxPersonas: 50,
      };
    }

    return defaultQuota;
  }

  /**
   * Get current quota usage for user
   */
  async getQuotaUsage(userId: string): Promise<QuotaUsage> {
    const quota = await this.getUserQuota(userId);
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Get usage metrics for current month
    const metrics = await this.usageTracker.getUsageMetrics(
      userId,
      undefined,
      undefined,
      startOfMonth,
      now
    );

    // Get additional counts
    const sessionCountResult = await sql`
      SELECT COUNT(*) as count 
      FROM "Session" 
      WHERE "userId" = ${userId} 
        AND "createdAt" >= ${startOfMonth}
    `;
    const sessionCount = parseInt(sessionCountResult[0]?.count || '0');

    const messageCountResult = await sql`
      SELECT COUNT(*) as count 
      FROM "Message" m
      JOIN "Session" s ON m."sessionId" = s.id
      WHERE s."userId" = ${userId} 
        AND m."createdAt" >= ${startOfMonth}
    `;
    const messageCount = parseInt(messageCountResult[0]?.count || '0');

    const personaCountResult = await sql`
      SELECT COUNT(*) as count 
      FROM "Persona" 
      WHERE "userId" = ${userId} 
        AND "createdAt" >= ${startOfMonth}
    `;
    const personaCount = parseInt(personaCountResult[0]?.count || '0');





    // Calculate usage
    const tokensUsed = metrics.totalTokens;
    const apiCallsUsed = metrics.apiCalls;
    const storageBytesUsed = metrics.storageBytes;
    const costUsed = metrics.cost;
    const sessionsUsed = sessionCount;
    const messagesUsed = messageCount;
    const personasUsed = personaCount;

    // Calculate remaining quotas
    const quotaRemaining: QuotaDefinition = {
      maxTokensPerMonth: Math.max(0, (quota.maxTokensPerMonth || 0) - tokensUsed),
      maxApiCallsPerMonth: Math.max(0, (quota.maxApiCallsPerMonth || 0) - apiCallsUsed),
      maxStorageBytes: Math.max(0, (quota.maxStorageBytes || 0) - storageBytesUsed),
      maxCostPerMonth: Math.max(0, (quota.maxCostPerMonth || 0) - costUsed),
      maxSessionsPerMonth: Math.max(0, (quota.maxSessionsPerMonth || 0) - sessionsUsed),
      maxMessagesPerMonth: Math.max(0, (quota.maxMessagesPerMonth || 0) - messagesUsed),
      maxPersonas: Math.max(0, (quota.maxPersonas || 0) - personasUsed),
    };

    // Calculate percentage used
    const quotaPercentage: QuotaDefinition = {
      maxTokensPerMonth: quota.maxTokensPerMonth ? (tokensUsed / quota.maxTokensPerMonth) * 100 : 0,
      maxApiCallsPerMonth: quota.maxApiCallsPerMonth ? (apiCallsUsed / quota.maxApiCallsPerMonth) * 100 : 0,
      maxStorageBytes: quota.maxStorageBytes ? (storageBytesUsed / quota.maxStorageBytes) * 100 : 0,
      maxCostPerMonth: quota.maxCostPerMonth ? (costUsed / quota.maxCostPerMonth) * 100 : 0,
      maxSessionsPerMonth: quota.maxSessionsPerMonth ? (sessionsUsed / quota.maxSessionsPerMonth) * 100 : 0,
      maxMessagesPerMonth: quota.maxMessagesPerMonth ? (messagesUsed / quota.maxMessagesPerMonth) * 100 : 0,
      maxPersonas: quota.maxPersonas ? (personasUsed / quota.maxPersonas) * 100 : 0,
    };

    // Check for exceeded quotas
    const exceededFields: string[] = [];
    if ((quotaPercentage.maxTokensPerMonth ?? 0) >= 100) exceededFields.push('maxTokensPerMonth');
    if ((quotaPercentage.maxApiCallsPerMonth ?? 0) >= 100) exceededFields.push('maxApiCallsPerMonth');
    if ((quotaPercentage.maxStorageBytes ?? 0) >= 100) exceededFields.push('maxStorageBytes');
    if ((quotaPercentage.maxCostPerMonth ?? 0) >= 100) exceededFields.push('maxCostPerMonth');
    if ((quotaPercentage.maxSessionsPerMonth ?? 0) >= 100) exceededFields.push('maxSessionsPerMonth');
    if ((quotaPercentage.maxMessagesPerMonth ?? 0) >= 100) exceededFields.push('maxMessagesPerMonth');
    if ((quotaPercentage.maxPersonas ?? 0) >= 100) exceededFields.push('maxPersonas');

    const isExceeded = exceededFields.length > 0;

    return {
      tokensUsed,
      apiCallsUsed,
      storageBytesUsed,
      costUsed,
      sessionsUsed,
      messagesUsed,
      personasUsed,
      quotaRemaining,
      quotaPercentage,
      isExceeded,
      exceededFields,
    };
  }

  /**
   * Check if user can perform action (quota check)
   */
  async canPerformAction(
    userId: string,
    action: 'send_message' | 'create_session' | 'create_persona' | 'upload_file',
    estimatedTokens?: number,
    estimatedCost?: number
  ): Promise<{ allowed: boolean; reason?: string; quotaUsage?: QuotaUsage }> {
    const quotaUsage = await this.getQuotaUsage(userId);

    // Check if any quotas are already exceeded
    if (quotaUsage.isExceeded) {
      return {
        allowed: false,
        reason: `Quota exceeded for: ${quotaUsage.exceededFields.join(', ')}`,
        quotaUsage,
      };
    }

    // Action-specific checks
    switch (action) {
      case 'send_message':
        if (estimatedTokens && quotaUsage.quotaRemaining.maxTokensPerMonth !== undefined) {
          if (estimatedTokens > quotaUsage.quotaRemaining.maxTokensPerMonth) {
            return {
              allowed: false,
              reason: `Insufficient token quota. Remaining: ${quotaUsage.quotaRemaining.maxTokensPerMonth}, Needed: ${estimatedTokens}`,
              quotaUsage,
            };
          }
        }
        if (estimatedCost && quotaUsage.quotaRemaining.maxCostPerMonth !== undefined) {
          if (estimatedCost > quotaUsage.quotaRemaining.maxCostPerMonth) {
            return {
              allowed: false,
              reason: `Insufficient cost quota. Remaining: $${quotaUsage.quotaRemaining.maxCostPerMonth}, Needed: $${estimatedCost}`,
              quotaUsage,
            };
          }
        }
        if (quotaUsage.quotaRemaining.maxMessagesPerMonth !== undefined) {
          if (quotaUsage.quotaRemaining.maxMessagesPerMonth <= 0) {
            return {
              allowed: false,
              reason: 'Message quota exceeded',
              quotaUsage,
            };
          }
        }
        break;

      case 'create_session':
        if (quotaUsage.quotaRemaining.maxSessionsPerMonth !== undefined) {
          if (quotaUsage.quotaRemaining.maxSessionsPerMonth <= 0) {
            return {
              allowed: false,
              reason: 'Session quota exceeded',
              quotaUsage,
            };
          }
        }
        break;

      case 'create_persona':
        if (quotaUsage.quotaRemaining.maxPersonas !== undefined) {
          if (quotaUsage.quotaRemaining.maxPersonas <= 0) {
            return {
              allowed: false,
              reason: 'Persona quota exceeded',
              quotaUsage,
            };
          }
        }
        break;

      case 'upload_file':
        // File size would be checked separately
        break;
    }

    return {
      allowed: true,
      quotaUsage,
    };
  }

  /**
   * Create quota alert
   */
  async createQuotaAlert(
    userId: string,
    type: 'quota_warning' | 'quota_exceeded' | 'cost_warning' | 'cost_exceeded',
    field: string,
    threshold: number,
    currentValue: number
  ): Promise<void> {
    const messages: Record<string, string> = {
      quota_warning: `Quota warning: ${field} is at ${currentValue.toFixed(2)}% of limit`,
      quota_exceeded: `Quota exceeded: ${field} has exceeded limit (${currentValue.toFixed(2)}%)`,
      cost_warning: `Cost warning: Current cost is at ${currentValue.toFixed(2)}% of budget`,
      cost_exceeded: `Cost exceeded: Current cost has exceeded budget (${currentValue.toFixed(2)}%)`,
    };

    const alert: UsageAlert = {
      type,
      userId,
      field,
      threshold,
      currentValue,
      message: messages[type] || 'Quota alert',
      timestamp: new Date(),
      acknowledged: false,
    };

    // Store alert (in a real system, you'd have an alerts table)
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
        ${userId},
        'quota_alert',
        'quota',
        ${field},
        ${JSON.stringify({
          type: alert.type,
          field: alert.field,
          threshold: alert.threshold,
          currentValue: alert.currentValue,
          message: alert.message,
          acknowledged: alert.acknowledged,
          timestamp: alert.timestamp,
        })},
        true,
        NOW()
      )
    `;

    // TODO: Send notification (email, webhook, etc.)
    console.log(`Quota alert for user ${userId}: ${alert.message}`);
  }

  /**
   * Check and create alerts for quota thresholds
   */
  async checkQuotaAlerts(userId: string): Promise<void> {
    const quotaUsage = await this.getQuotaUsage(userId);
    const thresholds = [50, 80, 90, 100];

    for (const [field, percentage] of Object.entries(quotaUsage.quotaPercentage)) {
      if (typeof percentage !== 'number') continue;
      const percentageValue = percentage as number;

      for (const threshold of thresholds) {
        if (percentageValue >= threshold && percentageValue < threshold + 10) {
          // Check if alert already exists for this threshold
          // Check if alert already exists for this threshold (simplified check)
          const existingAlerts = await sql`
            SELECT * FROM "AuditLog" 
            WHERE "userId" = ${userId}
              AND "action" = 'quota_alert'
              AND "resource" = 'quota'
              AND "resourceId" = ${field}
              AND "createdAt" >= NOW() - INTERVAL '24 hours'
          `;
          
          const existingAlert = existingAlerts[0]; // Simplified check

          if (!existingAlert) {
            const type = percentageValue >= 100 ? 'quota_exceeded' : 'quota_warning';
            await this.createQuotaAlert(userId, type, field, threshold, percentageValue);
          }
        }
      }
    }

    // Check cost alerts separately
    if (quotaUsage.quotaPercentage.maxCostPerMonth !== undefined) {
      const costPercentage = quotaUsage.quotaPercentage.maxCostPerMonth;
      for (const threshold of thresholds) {
        if (costPercentage >= threshold && costPercentage < threshold + 10) {
          // Check if alert already exists for this threshold (simplified check)
          const existingAlerts = await sql`
            SELECT * FROM "AuditLog" 
            WHERE "userId" = ${userId}
              AND "action" = 'quota_alert'
              AND "resource" = 'quota'
              AND "resourceId" = 'maxCostPerMonth'
              AND "createdAt" >= NOW() - INTERVAL '24 hours'
          `;
          
          const existingAlert = existingAlerts[0]; // Simplified check

          if (!existingAlert) {
            const type = costPercentage >= 100 ? 'cost_exceeded' : 'cost_warning';
            await this.createQuotaAlert(userId, type, 'maxCostPerMonth', threshold, costPercentage);
          }
        }
      }
    }
  }

  /**
   * Set budget for user
   */
  async setUserBudget(
    userId: string,
    budgetAmount: number,
    budgetPeriod: 'daily' | 'weekly' | 'monthly' | 'yearly' = 'monthly',
    alertsEnabled: boolean = true,
    alertThresholds: number[] = [50, 80, 90, 100]
  ): Promise<BudgetTracking> {
    const now = new Date();
    let resetDate: Date;

    switch (budgetPeriod) {
      case 'daily':
        resetDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
        break;
      case 'weekly':
        resetDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 7);
        break;
      case 'monthly':
        resetDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);
        break;
      case 'yearly':
        resetDate = new Date(now.getFullYear() + 1, 0, 1);
        break;
      default:
        resetDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    }

    // Calculate spent amount based on period
    let startDate: Date;
    switch (budgetPeriod) {
      case 'daily':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case 'weekly':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);
        break;
      case 'monthly':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'yearly':
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    const costResult = await this.costCalculator.calculateUserCost(userId, startDate, now);
    const spentAmount = costResult.totalCost;
    const remainingAmount = Math.max(0, budgetAmount - spentAmount);
    const percentageUsed = budgetAmount > 0 ? (spentAmount / budgetAmount) * 100 : 0;

    const budget: BudgetTracking = {
      userId,
      budgetAmount,
      budgetPeriod,
      spentAmount,
      remainingAmount,
      percentageUsed,
      resetDate,
      alertsEnabled,
      alertThresholds,
    };

    // Store budget in user preferences using PostgreSQL upsert
    await sql`
      INSERT INTO "UserPreference" (
        "userId", 
        "key", 
        "value", 
        "createdAt", 
        "updatedAt"
      ) VALUES (
        ${userId},
        'budget',
        ${JSON.stringify({
          budgetAmount: budget.budgetAmount,
          budgetPeriod: budget.budgetPeriod,
          spentAmount: budget.spentAmount,
          remainingAmount: budget.remainingAmount,
          percentageUsed: budget.percentageUsed,
          alertsEnabled: budget.alertsEnabled,
          alertThresholds: budget.alertThresholds,
          resetDate: budget.resetDate,
        })},
        NOW(),
        NOW()
      )
      ON CONFLICT ("userId", "key") 
      DO UPDATE SET 
        "value" = EXCLUDED."value",
        "updatedAt" = NOW()
    `;

    return budget;
  }

  /**
   * Get user budget
   */
  async getUserBudget(userId: string): Promise<BudgetTracking | null> {
    const preferences = await sql`
      SELECT * FROM "UserPreference" 
      WHERE "userId" = ${userId} AND "key" = 'budget'
    `;

    const preference = preferences[0];
    if (!preference) {
      return null;
    }

    const value = preference.value as any;
    return {
      userId: value.userId || '',
      budgetAmount: value.budgetAmount || 0,
      budgetPeriod: value.budgetPeriod || 'monthly',
      spentAmount: value.spentAmount || 0,
      remainingAmount: value.remainingAmount || 0,
      percentageUsed: value.percentageUsed || 0,
      resetDate: new Date(value.resetDate || Date.now()),
      alertsEnabled: value.alertsEnabled !== false,
      alertThresholds: value.alertThresholds || [50, 80, 90, 100],
    };
  }

  /**
   * Reset quotas (monthly reset)
   */
  async resetMonthlyQuotas(): Promise<void> {
    // This would be called by a cron job at the start of each month
    // In a production system, you'd reset counters in a usage table
    console.log('Resetting monthly quotas...');
    // Implementation would depend on your counter storage strategy
  }
}