/**
 * Cost Calculator
 * Real-time cost calculation engine for LLM usage
 */

import { sql } from '../../lib/db';
import { CostCalculation, ProviderPricing } from './usage.types';

export class CostCalculator {
  private static instance: CostCalculator;
  private pricingCache: Map<string, ProviderPricing> = new Map();
  private cacheTTL = 5 * 60 * 1000; // 5 minutes
  private lastCacheUpdate = 0;

  private constructor() {}

  static getInstance(): CostCalculator {
    if (!CostCalculator.instance) {
      CostCalculator.instance = new CostCalculator();
    }
    return CostCalculator.instance;
  }

  /**
   * Get or refresh pricing cache
   */
  private async refreshPricingCache(): Promise<void> {
    const now = Date.now();
    if (now - this.lastCacheUpdate < this.cacheTTL && this.pricingCache.size > 0) {
      return;
    }

    const models = await sql`
      SELECT 
        id, 
        provider, 
        "modelIdentifier", 
        "costPer1kInput", 
        "costPer1kOutput", 
        "updatedAt"
      FROM "AIModel" 
      WHERE "isActive" = true 
        AND ("costPer1kInput" IS NOT NULL OR "costPer1kOutput" IS NOT NULL)
    `;

    this.pricingCache.clear();
    
    for (const model of models) {
      const key = `${model.provider}:${model.modelIdentifier}`;
      this.pricingCache.set(key, {
        provider: model.provider,
        modelIdentifier: model.modelIdentifier,
        costPer1kInput: model.costPer1kInput?.toNumber() || 0,
        costPer1kOutput: model.costPer1kOutput?.toNumber() || 0,
        currency: 'USD',
        updatedAt: model.updatedAt,
      });
    }

    this.lastCacheUpdate = now;
  }

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
    await this.refreshPricingCache();

    let pricing: ProviderPricing | undefined;
    
    // Try to find pricing by modelId first
    if (modelId) {
      const models = await sql`
        SELECT 
          provider, 
          "modelIdentifier", 
          "costPer1kInput", 
          "costPer1kOutput"
        FROM "AIModel" 
        WHERE id = ${modelId}
      `;

      const model = models[0];
      if (model) {
        pricing = {
          provider: model.provider,
          modelIdentifier: model.modelIdentifier,
          costPer1kInput: model.costPer1kInput || 0,
          costPer1kOutput: model.costPer1kOutput || 0,
          currency: 'USD',
          updatedAt: new Date(),
        };
      }
    }

    // If not found by modelId, try provider and modelIdentifier
    if (!pricing && provider && modelIdentifier) {
      const key = `${provider}:${modelIdentifier}`;
      pricing = this.pricingCache.get(key);
    }

    // Fallback to default pricing if still not found
    if (!pricing) {
      pricing = {
        provider: provider || 'unknown',
        modelIdentifier: modelIdentifier || 'unknown',
        costPer1kInput: 0.01, // Default $0.01 per 1K input tokens
        costPer1kOutput: 0.03, // Default $0.03 per 1K output tokens
        currency: 'USD',
        updatedAt: new Date(),
        notes: 'Using default pricing',
      };
    }

    // Calculate costs
    const inputCost = (inputTokens / 1000) * pricing.costPer1kInput;
    const outputCost = (outputTokens / 1000) * pricing.costPer1kOutput;
    const totalCost = inputCost + outputCost;
    const totalTokens = inputTokens + outputTokens;
    const costPerToken = totalTokens > 0 ? totalCost / totalTokens : 0;

    return {
      inputTokens,
      outputTokens,
      inputCost,
      outputCost,
      totalCost,
      costPerToken,
      modelId,
      provider: pricing.provider,
      modelIdentifier: pricing.modelIdentifier,
    };
  }

  /**
   * Calculate cost for a message
   */
  async calculateMessageCost(messageId: string): Promise<CostCalculation> {
    const messages = await sql`
      SELECT 
        m.*,
        am.provider as "modelProvider",
        am."modelIdentifier" as "modelModelIdentifier",
        am."costPer1kInput" as "modelCostPer1kInput",
        am."costPer1kOutput" as "modelCostPer1kOutput"
      FROM "Message" m
      LEFT JOIN "AIModel" am ON m."aiModelId" = am.id
      WHERE m.id = ${messageId}
    `;

    const message = messages[0];
    if (!message) {
      throw new Error(`Message ${messageId} not found`);
    }

    return this.calculateCost(
      message.inputTokens,
      message.outputTokens,
      message.aiModelId || undefined,
      message.modelProvider,
      message.modelModelIdentifier
    );
  }

  /**
   * Calculate cost for a session
   */
  async calculateSessionCost(sessionId: string): Promise<{
    totalCost: number;
    breakdown: CostCalculation[];
    messageCount: number;
  }> {
    const messages = await sql`
      SELECT 
        m.*,
        am.provider as "modelProvider",
        am."modelIdentifier" as "modelModelIdentifier",
        am."costPer1kInput" as "modelCostPer1kInput",
        am."costPer1kOutput" as "modelCostPer1kOutput"
      FROM "Message" m
      LEFT JOIN "AIModel" am ON m."aiModelId" = am.id
      WHERE m."sessionId" = ${sessionId}
    `;

    const breakdown: CostCalculation[] = [];
    let totalCost = 0;

    for (const message of messages) {
      const cost = await this.calculateCost(
        message.inputTokens,
        message.outputTokens,
        message.aiModelId || undefined,
        message.modelProvider,
        message.modelModelIdentifier
      );
      totalCost += cost.totalCost;


    }

    return {
      totalCost,
      breakdown,
      messageCount: messages.length,
    };
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
    const whereClause: any = {
      session: {
        userId,
      },
    };

    if (startDate || endDate) {
      whereClause.createdAt = {};
      if (startDate) whereClause.createdAt.gte = startDate;
      if (endDate) whereClause.createdAt.lte = endDate;
    }

    // Build SQL query with date filters
    let query = sql`
      SELECT 
        m.*,
        am.provider as "modelProvider",
        am."modelIdentifier" as "modelModelIdentifier",
        am."costPer1kInput" as "modelCostPer1kInput",
        am."costPer1kOutput" as "modelCostPer1kOutput",
        s."personaId"
      FROM "Message" m
      LEFT JOIN "AIModel" am ON m."aiModelId" = am.id
      LEFT JOIN "Session" s ON m."sessionId" = s.id
      WHERE s."userId" = ${userId}
    `;
    
    if (startDate) {
      query = sql`${query} AND m."createdAt" >= ${startDate}`;
    }
    
    if (endDate) {
      query = sql`${query} AND m."createdAt" <= ${endDate}`;
    }
    
    const messages = await query;

    const breakdownByModel: Record<string, number> = {};
    const breakdownByPersona: Record<string, number> = {};
    let totalCost = 0;

    for (const message of messages) {
      const cost = await this.calculateCost(
        message.inputTokens,
        message.outputTokens,
        message.modelId || undefined,
        message.aiModel?.provider,
        message.aiModel?.modelIdentifier
      );

      totalCost += cost.totalCost;

      // Aggregate by model
      const modelKey = `${cost.provider}/${cost.modelIdentifier}`;
      breakdownByModel[modelKey] = (breakdownByModel[modelKey] || 0) + cost.totalCost;

      // Aggregate by persona
      const personaId = message.session.personaId || 'default';
      breakdownByPersona[personaId] = (breakdownByPersona[personaId] || 0) + cost.totalCost;
    }

    // Get session count
    const sessionWhere: any = { userId };
    if (startDate || endDate) {
      sessionWhere.createdAt = {};
      if (startDate) sessionWhere.createdAt.gte = startDate;
      if (endDate) sessionWhere.createdAt.lte = endDate;
    }

    // Build session count query
    let sessionQuery = sql`SELECT COUNT(*) as count FROM "Session" WHERE "userId" = ${userId}`;
    
    if (startDate) {
      sessionQuery = sql`${sessionQuery} AND "createdAt" >= ${startDate}`;
    }
    
    if (endDate) {
      sessionQuery = sql`${sessionQuery} AND "createdAt" <= ${endDate}`;
    }
    
    const sessionCountResult = await sessionQuery;
    const sessionCount = parseInt(sessionCountResult[0]?.count || '0');

    return {
      totalCost,
      breakdownByModel,
      breakdownByPersona,
      messageCount: messages.length,
      sessionCount,
    };
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
    return this.calculateCost(
      estimatedInputTokens,
      estimatedOutputTokens,
      modelId,
      provider,
      modelIdentifier
    );
  }

  /**
   * Get pricing for all models
   */
  async getAllPricing(): Promise<ProviderPricing[]> {
    await this.refreshPricingCache();
    return Array.from(this.pricingCache.values());
  }

  /**
   * Update pricing for a model
   */
  async updatePricing(
    modelId: string,
    costPer1kInput: number,
    costPer1kOutput: number
  ): Promise<void> {
    await sql`
      UPDATE "AIModel" 
      SET 
        "costPer1kInput" = ${costPer1kInput},
        "costPer1kOutput" = ${costPer1kOutput},
        "updatedAt" = NOW()
      WHERE id = ${modelId}
    `;

    // Invalidate cache
    this.lastCacheUpdate = 0;
  }
}