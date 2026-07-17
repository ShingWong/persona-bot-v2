/**
 * Usage API Routes
 * Endpoints for usage tracking, cost calculation, quota management, and analytics
 */

import { Router } from 'express';
import { authenticate, requireRole } from '../../middleware/auth.middleware';
import { usageService } from '../../services/usage';
import { usageLimiter } from '../../middleware/usage.middleware';
import { sql } from '../../lib/db';

// Helper function to get user ID from request
const getUserId = (req: any): string => {
  return req.user?.userId;
};

// Helper function to check authentication
const requireAuth = (req: any, res: any): string | null => {
  const userId = getUserId(req);
  if (!userId) {
    res.status(401).json({
      error: {
        code: 'UNAUTHORIZED',
        message: 'Authentication required',
      },
    });
    return null;
  }
  return userId;
};

const router = Router();

// Apply authentication to all routes
router.use(authenticate);
router.use(usageLimiter(100)); // 100 requests per minute per user

// =============================================================================
// Cost Calculation Endpoints
// =============================================================================

/**
 * @route GET /api/usage/cost/estimate
 * @desc Estimate cost for token usage
 * @access Private
 */
router.get('/cost/estimate', async (req, res) => {
  try {
    const { inputTokens, outputTokens, modelId, provider, modelIdentifier } = req.query;

    if (!inputTokens || !outputTokens) {
      return res.status(400).json({
        error: {
          code: 'MISSING_PARAMS',
          message: 'inputTokens and outputTokens are required',
        },
      });
    }

    const estimate = await usageService.estimateCost(
      parseInt(inputTokens as string),
      parseInt(outputTokens as string),
      modelId as string,
      provider as string,
      modelIdentifier as string
    );

    return res.json({ estimate });
  } catch (error) {
    console.error('Cost estimation error:', error);
    return res.status(500).json({
      error: {
        code: 'ESTIMATION_FAILED',
        message: 'Failed to estimate cost',
      },
    });
  }
});

/**
 * @route GET /api/usage/cost/message/:messageId
 * @desc Calculate cost for a specific message
 * @access Private
 */
router.get('/cost/message/:messageId', async (req, res) => {
  try {
    const { messageId } = req.params;
    const cost = await usageService.calculateMessageCost(messageId);
    return res.json({ cost });
  } catch (error) {
    console.error('Message cost calculation error:', error);
    return res.status(500).json({
      error: {
        code: 'CALCULATION_FAILED',
        message: 'Failed to calculate message cost',
      },
    });
  }
});

/**
 * @route GET /api/usage/cost/session/:sessionId
 * @desc Calculate cost for a session
 * @access Private
 */
router.get('/cost/session/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const userId = (req.user as any)?.id;
    
    if (!userId) {
      return res.status(401).json({
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
        },
      });
    }

    // Verify session belongs to user
    const sessions = await sql`
      SELECT * FROM "Session" 
      WHERE id = ${sessionId} AND "userId" = ${userId}
    `;

    const session = sessions[0];
    if (!session) {
      return res.status(404).json({
        error: {
          code: 'SESSION_NOT_FOUND',
          message: 'Session not found or access denied',
        },
      });
    }

    const cost = await usageService.calculateSessionCost(sessionId);
    return res.json(cost);
  } catch (error) {
    console.error('Session cost calculation error:', error);
    return res.status(500).json({
      error: {
        code: 'CALCULATION_FAILED',
        message: 'Failed to calculate session cost',
      },
    });
  }
});

/**
 * @route GET /api/usage/cost/user
 * @desc Calculate cost for current user
 * @access Private
 */
router.get('/cost/user', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const userId = (req.user as any)?.id;
    
    if (!userId) {
      return res.status(401).json({
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
        },
      });
    }
    
    const start = startDate ? new Date(startDate as string) : undefined;
    const end = endDate ? new Date(endDate as string) : undefined;

    const cost = await usageService.calculateUserCost(userId, start, end);
    return res.json(cost);
  } catch (error) {
    console.error('User cost calculation error:', error);
    return res.status(500).json({
      error: {
        code: 'CALCULATION_FAILED',
        message: 'Failed to calculate user cost',
      },
    });
  }
});

// =============================================================================
// Usage Tracking Endpoints
// =============================================================================

/**
 * @route GET /api/usage/metrics
 * @desc Get usage metrics for current user
 * @access Private
 */
router.get('/metrics', async (req, res) => {
  try {
    const { personaId, sessionId, startDate, endDate } = req.query;
    const userId = (req.user as any)?.id;
    
    if (!userId) {
      return res.status(401).json({
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
        },
      });
    }
    
    const start = startDate ? new Date(startDate as string) : undefined;
    const end = endDate ? new Date(endDate as string) : undefined;

    const metrics = await usageService.getUsageMetrics(
      userId,
      personaId as string,
      sessionId as string,
      start,
      end
    );

    return res.json({ metrics });
  } catch (error) {
    console.error('Usage metrics error:', error);
    return res.status(500).json({
      error: {
        code: 'METRICS_FAILED',
        message: 'Failed to get usage metrics',
      },
    });
  }
});

/**
 * @route GET /api/usage/realtime
 * @desc Get real-time usage for current user
 * @access Private
 */
router.get('/realtime', async (req, res) => {
  try {
    const userId = requireAuth(req, res);
    if (!userId) return;

    const realtimeUsage = await usageService.getRealTimeUsage(userId);
    return res.json({ usage: realtimeUsage });
  } catch (error) {
    console.error('Real-time usage error:', error);
    return res.status(500).json({
      error: {
        code: 'REALTIME_FAILED',
        message: 'Failed to get real-time usage',
      },
    });
  }
});

/**
 * @route GET /api/usage/trends
 * @desc Get usage trends for current user
 * @access Private
 */
router.get('/trends', async (req, res) => {
  try {
    const { period, days } = req.query;
    
    const userId = requireAuth(req, res);
    if (!userId) return;
    
    const trends = await usageService.getUsageTrends(
      userId,
      period as 'daily' | 'weekly' | 'monthly' || 'daily',
      parseInt(days as string) || 30
    );

    return res.json({ trends });
  } catch (error) {
    console.error('Usage trends error:', error);
    return res.status(500).json({
      error: {
        code: 'TRENDS_FAILED',
        message: 'Failed to get usage trends',
      },
    });
  }
});

// =============================================================================
// Quota Management Endpoints
// =============================================================================

/**
 * @route GET /api/usage/quota
 * @desc Get quota information for current user
 * @access Private
 */
router.get('/quota', async (req, res) => {
  try {
    const userId = requireAuth(req, res);
    if (!userId) return;
    
    const quota = await usageService.getUserQuota(userId);
    const quotaUsage = await usageService.getQuotaUsage(userId);
    
    return res.json({
      quota,
      quotaUsage,
    });
  } catch (error) {
    console.error('Quota error:', error);
    return res.status(500).json({
      error: {
        code: 'QUOTA_FAILED',
        message: 'Failed to get quota information',
      },
    });
  }
});

/**
 * @route POST /api/usage/quota/check
 * @desc Check if user can perform an action
 * @access Private
 */
router.post('/quota/check', async (req, res) => {
  try {
    const { action, estimatedTokens, estimatedCost } = req.body;

    if (!action) {
      return res.status(400).json({
        error: {
          code: 'MISSING_ACTION',
          message: 'Action is required',
        },
      });
    }

    const userId = requireAuth(req, res);
    if (!userId) return;
    
    const result = await usageService.canPerformAction(
      userId,
      action,
      estimatedTokens,
      estimatedCost
    );

    return res.json(result);
  } catch (error) {
    console.error('Quota check error:', error);
    return res.status(500).json({
      error: {
        code: 'QUOTA_CHECK_FAILED',
        message: 'Failed to check quota',
      },
    });
  }
});

/**
 * @route GET /api/usage/quota/alerts
 * @desc Get quota alerts for current user
 * @access Private
 */
router.get('/quota/alerts', async (req, res) => {
  try {
    const userId = requireAuth(req, res);
    if (!userId) return;

    // Check for new alerts
    await usageService.checkQuotaAlerts(userId);

    // Get alerts from audit logs
    const alerts = await sql`
      SELECT * FROM "AuditLog" 
      WHERE "userId" = ${userId} AND "action" = 'quota_alert'
      ORDER BY "createdAt" DESC
      LIMIT 50
    `;

    return res.json({
      alerts: alerts.map(alert => ({
        ...(alert.metadata as any),
        id: alert.id,
        createdAt: alert.createdAt,
      })),
    });
  } catch (error) {
    console.error('Quota alerts error:', error);
    return res.status(500).json({
      error: {
        code: 'ALERTS_FAILED',
        message: 'Failed to get quota alerts',
      },
    });
  }
});

// =============================================================================
// Budget Management Endpoints
// =============================================================================

/**
 * @route GET /api/usage/budget
 * @desc Get budget information for current user
 * @access Private
 */
router.get('/budget', async (req, res) => {
  try {
    const userId = requireAuth(req, res);
    if (!userId) return;
    
    const budget = await usageService.getUserBudget(userId);
    return res.json({ budget });
  } catch (error) {
    console.error('Budget error:', error);
    return res.status(500).json({
      error: {
        code: 'BUDGET_FAILED',
        message: 'Failed to get budget information',
      },
    });
  }
});

/**
 * @route POST /api/usage/budget
 * @desc Set or update budget for current user
 * @access Private
 */
router.post('/budget', async (req, res) => {
  try {
    const userId = requireAuth(req, res);
    if (!userId) return;
    
    const { budgetAmount, budgetPeriod, alertsEnabled, alertThresholds } = req.body;

    if (!budgetAmount || budgetAmount <= 0) {
      return res.status(400).json({
        error: {
          code: 'INVALID_BUDGET',
          message: 'Valid budgetAmount is required',
        },
      });
    }

    const budget = await usageService.setUserBudget(
      userId,
      parseFloat(budgetAmount),
      budgetPeriod || 'monthly',
      alertsEnabled !== false,
      alertThresholds || [50, 80, 90, 100]
    );

    return res.json({ budget });
  } catch (error) {
    console.error('Budget set error:', error);
    return res.status(500).json({
      error: {
        code: 'BUDGET_SET_FAILED',
        message: 'Failed to set budget',
      },
    });
  }
});

// =============================================================================
// Analytics & Reporting Endpoints
// =============================================================================

/**
 * @route GET /api/usage/report
 * @desc Generate usage report for current user
 * @access Private
 */
router.get('/report', async (req, res) => {
  try {
    const userId = requireAuth(req, res);
    if (!userId) return;
    
    const { startDate, endDate } = req.query;
    
    const start = startDate ? new Date(startDate as string) : undefined;
    const end = endDate ? new Date(endDate as string) : undefined;

    const report = await usageService.generateUsageReport(
      userId,
      undefined,
      start,
      end
    );

    return res.json({ report });
  } catch (error) {
    console.error('Report generation error:', error);
    return res.status(500).json({
      error: {
        code: 'REPORT_FAILED',
        message: 'Failed to generate usage report',
      },
    });
  }
});

/**
 * @route GET /api/usage/forecast
 * @desc Forecast future usage for current user
 * @access Private
 */
router.get('/forecast', async (req, res) => {
  try {
    const userId = requireAuth(req, res);
    if (!userId) return;
    
    const { days } = req.query;
    const forecast = await usageService.forecastUsage(
      userId,
      parseInt(days as string) || 30
    );

    return res.json({ forecast });
  } catch (error) {
    console.error('Forecast error:', error);
    return res.status(500).json({
      error: {
        code: 'FORECAST_FAILED',
        message: 'Failed to forecast usage',
      },
    });
  }
});

/**
 * @route GET /api/usage/export
 * @desc Export usage data as CSV
 * @access Private
 */
router.get('/export', async (req, res) => {
  try {
    const userId = requireAuth(req, res);
    if (!userId) return;
    
    const { startDate, endDate } = req.query;
    
    const start = startDate ? new Date(startDate as string) : undefined;
    const end = endDate ? new Date(endDate as string) : undefined;

    const csv = await usageService.exportUsageData(userId, start, end);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=usage-export.csv');
    return res.send(csv);
  } catch (error) {
    console.error('Export error:', error);
    return res.status(500).json({
      error: {
        code: 'EXPORT_FAILED',
        message: 'Failed to export usage data',
      },
    });
  }
});

// =============================================================================
// Admin Endpoints (Require ADMIN role)
// =============================================================================

/**
 * @route GET /api/usage/admin/pricing
 * @desc Get all pricing information (Admin only)
 * @access Private (Admin)
 */
router.get('/admin/pricing', requireRole(['ADMIN', 'BILLING_ADMIN']), async (_req, res) => {
  try {
    const pricing = await usageService.getAllPricing();
    return res.json({ pricing });
  } catch (error) {
    console.error('Pricing error:', error);
    return res.status(500).json({
      error: {
        code: 'PRICING_FAILED',
        message: 'Failed to get pricing information',
      },
    });
  }
});

/**
 * @route PUT /api/usage/admin/pricing/:modelId
 * @desc Update pricing for a model (Admin only)
 * @access Private (Admin)
 */
router.put('/admin/pricing/:modelId', requireRole(['ADMIN', 'BILLING_ADMIN']), async (req, res) => {
  try {
    const modelId = req.params.modelId as string;
    const { costPer1kInput, costPer1kOutput } = req.body;

    if (costPer1kInput === undefined || costPer1kOutput === undefined) {
      return res.status(400).json({
        error: {
          code: 'MISSING_PARAMS',
          message: 'costPer1kInput and costPer1kOutput are required',
        },
      });
    }

    await usageService.updatePricing(
      modelId,
      parseFloat(costPer1kInput),
      parseFloat(costPer1kOutput)
    );

    return res.json({ success: true, message: 'Pricing updated successfully' });
  } catch (error) {
    console.error('Pricing update error:', error);
    return res.status(500).json({
      error: {
        code: 'PRICING_UPDATE_FAILED',
        message: 'Failed to update pricing',
      },
    });
  }
});

/**
 * @route GET /api/usage/admin/top-users
 * @desc Get top users by usage (Admin only)
 * @access Private (Admin)
 */
router.get('/admin/top-users', requireRole(['ADMIN', 'BILLING_ADMIN']), async (req, res) => {
  try {
    const { limit, startDate, endDate } = req.query;
    
    const start = startDate ? new Date(startDate as string) : undefined;
    const end = endDate ? new Date(endDate as string) : undefined;

    const topUsers = await usageService.getTopUsers(
      parseInt(limit as string) || 10,
      start,
      end
    );

    return res.json({ topUsers });
  } catch (error) {
    console.error('Top users error:', error);
    return res.status(500).json({
      error: {
        code: 'TOP_USERS_FAILED',
        message: 'Failed to get top users',
      },
    });
  }
});

/**
 * @route GET /api/usage/admin/top-personas
 * @desc Get top personas by usage (Admin only)
 * @access Private (Admin)
 */
router.get('/admin/top-personas', requireRole(['ADMIN', 'BILLING_ADMIN']), async (req, res) => {
  try {
    const { limit, startDate, endDate } = req.query;
    
    const start = startDate ? new Date(startDate as string) : undefined;
    const end = endDate ? new Date(endDate as string) : undefined;

    const topPersonas = await usageService.getTopPersonas(
      parseInt(limit as string) || 10,
      start,
      end
    );

    return res.json({ topPersonas });
  } catch (error) {
    console.error('Top personas error:', error);
    return res.status(500).json({
      error: {
        code: 'TOP_PERSONAS_FAILED',
        message: 'Failed to get top personas',
      },
    });
  }
});

/**
 * @route GET /api/usage/admin/system-summary
 * @desc Get system-wide usage summary (Admin only)
 * @access Private (Admin)
 */
router.get('/admin/system-summary', requireRole(['ADMIN', 'BILLING_ADMIN']), async (_req, res) => {
  try {
    const summary = await usageService.getSystemUsageSummary();
    return res.json({ summary });
  } catch (error) {
    console.error('System summary error:', error);
    return res.status(500).json({
      error: {
        code: 'SYSTEM_SUMMARY_FAILED',
        message: 'Failed to get system summary',
      },
    });
  }
});

export default router;