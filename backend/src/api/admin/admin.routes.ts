/**
 * Admin API Routes
 * Endpoints for admin dashboard functionality
 */

import { Router } from 'express';
import { authenticate, requireRole } from '../../middleware/auth.middleware';
import { sql } from '../../lib/db';
import { usageService } from '../../services/usage';

const router = Router();

// Apply authentication and admin role to all routes
router.use(authenticate);
router.use(requireRole(['ADMIN']));

// =============================================================================
// User Management Endpoints
// =============================================================================

/**
 * @route GET /api/admin/users
 * @desc Get all users with pagination and filtering
 * @access Private (Admin)
 */
router.get('/users', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      search,
      role,
      isActive,
    } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const where: any = {};

    if (search) {
      where.OR = [
        { email: { contains: search as string, mode: 'insensitive' } },
        { name: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    if (role) {
      where.role = role;
    }

    if (isActive !== undefined) {
      where.isActive = isActive === 'true';
    }

    // Build WHERE clause for SQL
    let whereClause = 'WHERE 1=1';
    const params: any[] = [];
    
    if (search) {
      whereClause += ` AND (email ILIKE $${params.length + 1} OR name ILIKE $${params.length + 2})`;
      params.push(`%${search}%`, `%${search}%`);
    }
    
    if (role) {
      whereClause += ` AND role = $${params.length + 1}`;
      params.push(role);
    }
    
    if (isActive !== undefined) {
      whereClause += ` AND "isActive" = $${params.length + 1}`;
      params.push(isActive === 'true');
    }
    
    // Get users with pagination
    const usersQuery = sql`
      SELECT 
        id, email, name, role, "avatarUrl", "isActive", 
        "createdAt", "updatedAt", "lastLoginAt", "failedLoginAttempts"
      FROM "User" 
      ${sql.unsafe(whereClause, params)}
      ORDER BY "createdAt" DESC
      LIMIT ${limitNum} OFFSET ${skip}
    `;
    
    // Get total count
    const countQuery = sql`
      SELECT COUNT(*) as count
      FROM "User" 
      ${sql.unsafe(whereClause, params)}
    `;
    
    const [users, countResult] = await Promise.all([
      usersQuery,
      countQuery
    ]);
    
    const total = parseInt(countResult[0]?.count || '0');

    res.json({
      users,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      error: {
        code: 'USERS_FETCH_FAILED',
        message: 'Failed to fetch users',
      },
    });
  }
});

/**
 * @route GET /api/admin/users/:userId
 * @desc Get user details
 * @access Private (Admin)
 */
router.get('/users/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const users = await sql`
      SELECT 
        id, email, name, role, "avatarUrl", "isActive", 
        "createdAt", "updatedAt", "lastLoginAt", "failedLoginAttempts"
      FROM "User" 
      WHERE id = ${userId}
    `;

    const user = users[0];
    
    // Get sessions separately if user exists
    let userSessions: any[] = [];
    if (user) {
      userSessions = await sql`
        SELECT 
          id, "userAgent", "ipAddress", "createdAt", "lastActivityAt"
        FROM "Session" 
        WHERE "userId" = ${userId}
        ORDER BY "createdAt" DESC
        LIMIT 10
      `;
    }

    if (!user) {
      return res.status(404).json({
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User not found',
        },
      });
    }

    // Get usage stats for the user
    const usageStats = await usageService.calculateUserCost(userId);

    return res.json({
      user,
      sessions: userSessions,
      usageStats,
    });
  } catch (error) {
    console.error('Get user error:', error);
    return res.status(500).json({
      error: {
        code: 'USER_FETCH_FAILED',
        message: 'Failed to fetch user',
      },
    });
  }
});

/**
 * @route PUT /api/admin/users/:userId
 * @desc Update user
 * @access Private (Admin)
 */
router.put('/users/:userId', async (req, res) => {
  try {
    const userId = Array.isArray(req.params.userId) ? req.params.userId[0] : req.params.userId;
    if (!userId) {
      return res.status(400).json({
        error: {
          code: 'USER_ID_REQUIRED',
          message: 'User ID is required',
        },
      });
    }
    const { role, isActive, name } = req.body;

    const updateData: any = {};
    if (role !== undefined) updateData.role = role;
    if (isActive !== undefined) updateData.isActive = isActive;
    if (name !== undefined) updateData.name = name;

    // Build SET clause for SQL
    const setClauses: string[] = [];
    const params: any[] = [];
    
    if (role !== undefined) {
      setClauses.push(`role = $${params.length + 1}`);
      params.push(role);
    }
    
    if (isActive !== undefined) {
      setClauses.push(`"isActive" = $${params.length + 1}`);
      params.push(isActive);
    }
    
    if (name !== undefined) {
      setClauses.push(`name = $${params.length + 1}`);
      params.push(name);
    }
    
    setClauses.push(`"updatedAt" = NOW()`);
    
    const setClause = setClauses.join(', ');
    
    let users;
    if (params.length > 0) {
      users = await sql`
        UPDATE "User" 
        SET ${sql.unsafe(setClause, params)}
        WHERE id = ${userId}
        RETURNING 
          id, email, name, role, "avatarUrl", "isActive", 
          "createdAt", "updatedAt"
      `;
    } else {
      // If no fields to update, just return the user
      users = await sql`
        SELECT 
          id, email, name, role, "avatarUrl", "isActive", 
          "createdAt", "updatedAt"
        FROM "User" 
        WHERE id = ${userId}
      `;
    }
    
    const user = users[0];

    // Log the action
    await sql`
      INSERT INTO "AuditLog" (
        "userId", "userEmail", "action", "resourceType", 
        "resourceId", "metadata", "ipAddress", "userAgent"
      ) VALUES (
        ${(req.user as any).id},
        ${(req.user as any).email},
        'user_update',
        'user',
        ${userId},
        ${JSON.stringify({
          updatedFields: Object.keys(updateData),
          previousData: req.body.previousData,
        })},
         ${req.ip || null},
         ${req.get('user-agent') || null}
      )
    `;

    return res.json({ user });
  } catch (error) {
    console.error('Update user error:', error);
    return res.status(500).json({
      error: {
        code: 'USER_UPDATE_FAILED',
        message: 'Failed to update user',
      },
    });
  }
});

/**
 * @route GET /api/admin/users/:userId/sessions
 * @desc Get user sessions
 * @access Private (Admin)
 */
router.get('/users/:userId/sessions', async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 50 } = req.query;

    const sessions = await sql`
      SELECT 
        s.id, s."userAgent", s."ipAddress", s."createdAt", 
        s."lastActivityAt", s."expiresAt",
        (
          SELECT json_agg(
            json_build_object(
              'id', m.id,
              'content', m.content,
              'role', m.role,
              'createdAt', m."createdAt"
            )
            ORDER BY m."createdAt" DESC
          )
          FROM "Message" m
          WHERE m."sessionId" = s.id
          LIMIT 5
        ) as messages
      FROM "Session" s
      WHERE s."userId" = ${userId}
      ORDER BY s."lastActivityAt" DESC
      LIMIT ${parseInt(limit as string)}
    `;

    res.json({ sessions });
  } catch (error) {
    console.error('Get user sessions error:', error);
    res.status(500).json({
      error: {
        code: 'SESSIONS_FETCH_FAILED',
        message: 'Failed to fetch user sessions',
      },
    });
  }
});

// =============================================================================
// Analytics Endpoints
// =============================================================================

/**
 * @route GET /api/admin/analytics/trends
 * @desc Get usage trends
 * @access Private (Admin)
 */
router.get('/analytics/trends', async (req, res) => {
  try {
    const { period = 'daily', days = 30 } = req.query;

    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days as string));

    let dateFormat = 'DATE("createdAt")';
    if (period === 'weekly') {
      dateFormat = `DATE_TRUNC('week', "createdAt")`;
    } else if (period === 'monthly') {
      dateFormat = `DATE_TRUNC('month', "createdAt")`;
    }

    // Get usage data grouped by period
    const usageData = await sql`
      SELECT 
        ${sql.unsafe(dateFormat)} as date,
        COALESCE(SUM("inputTokens"), 0) as total_input_tokens,
        COALESCE(SUM("outputTokens"), 0) as total_output_tokens,
        COALESCE(SUM("cost"), 0) as total_cost,
        COUNT(*) as request_count
      FROM "UsageLog"
      WHERE "createdAt" >= ${startDate} AND "createdAt" <= ${endDate}
      GROUP BY ${sql.unsafe(dateFormat)}
      ORDER BY date ASC
    `;

    // Format data for charts
    const trends = usageData.map(day => ({
      date: day.date.toISOString().split('T')[0],
      totalTokens: (parseInt(day.total_input_tokens) || 0) + (parseInt(day.total_output_tokens) || 0),
      totalCost: parseFloat(day.total_cost) || 0,
      requestCount: parseInt(day.request_count) || 0,
    }));

    res.json({ trends });
  } catch (error) {
    console.error('Get trends error:', error);
    res.status(500).json({
      error: {
        code: 'TRENDS_FETCH_FAILED',
        message: 'Failed to fetch usage trends',
      },
    });
  }
});

/**
 * @route GET /api/admin/analytics/cost-breakdown
 * @desc Get cost breakdown by provider/model
 * @access Private (Admin)
 */
router.get('/analytics/cost-breakdown', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const start = startDate ? new Date(startDate as string) : undefined;
    const end = endDate ? new Date(endDate as string) : undefined;

    const where: any = {};
    if (start || end) {
      where.createdAt = {};
      if (start) where.createdAt.gte = start;
      if (end) where.createdAt.lte = end;
    }

    // Build WHERE clause for SQL
    let whereClause = '';
    const params: any[] = [];
    
    if (start) {
      whereClause += ` AND "createdAt" >= $${params.length + 1}`;
      params.push(start);
    }
    
    if (end) {
      whereClause += ` AND "createdAt" <= $${params.length + 1}`;
      params.push(end);
    }
    
    // Get cost breakdown by model
    const costBreakdown = await sql`
      SELECT 
        provider,
        "modelIdentifier",
        COALESCE(SUM("cost"), 0) as total_cost,
        COALESCE(SUM("inputTokens"), 0) as total_input_tokens,
        COALESCE(SUM("outputTokens"), 0) as total_output_tokens,
        COUNT(*) as request_count
      FROM "UsageLog"
      WHERE 1=1 ${sql.unsafe(whereClause, params)}
      GROUP BY provider, "modelIdentifier"
      ORDER BY total_cost DESC
    `;

    // Calculate total cost for percentages
    const totalCost = costBreakdown.reduce((sum, item) => sum + parseFloat(item.total_cost), 0);

    const formattedBreakdown = costBreakdown.map(item => ({
      provider: item.provider,
      model: item.model_identifier,
      totalCost: parseFloat(item.total_cost) || 0,
      totalTokens: (parseInt(item.total_input_tokens) || 0) + (parseInt(item.total_output_tokens) || 0),
      requestCount: parseInt(item.request_count) || 0,
      percentage: totalCost > 0 ? (parseFloat(item.total_cost) / totalCost) * 100 : 0,
    }));

    res.json({ breakdown: formattedBreakdown });
  } catch (error) {
    console.error('Get cost breakdown error:', error);
    res.status(500).json({
      error: {
        code: 'COST_BREAKDOWN_FAILED',
        message: 'Failed to fetch cost breakdown',
      },
    });
  }
});

// =============================================================================
// Audit Log Endpoints
// =============================================================================

/**
 * @route GET /api/admin/audit-logs
 * @desc Get audit logs with filtering
 * @access Private (Admin)
 */
router.get('/audit-logs', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 50,
      userId,
      action,
      resourceType,
      startDate,
      endDate,
      search,
    } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const where: any = {};

    if (userId) {
      where.userId = userId;
    }

    if (action) {
      where.action = action;
    }

    if (resourceType) {
      where.resourceType = resourceType;
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate as string);
      if (endDate) where.createdAt.lte = new Date(endDate as string);
    }

    if (search) {
      where.OR = [
        { userEmail: { contains: search as string, mode: 'insensitive' } },
        { action: { contains: search as string, mode: 'insensitive' } },
        { resourceType: { contains: search as string, mode: 'insensitive' } },
        { metadata: { path: ['$'], string_contains: search as string } },
      ];
    }

    // Build WHERE clause for SQL
    let whereClause = 'WHERE 1=1';
    const params: any[] = [];
    
    if (userId) {
      whereClause += ` AND "userId" = $${params.length + 1}`;
      params.push(userId);
    }
    
    if (action) {
      whereClause += ` AND "action" = $${params.length + 1}`;
      params.push(action);
    }
    
    if (resourceType) {
      whereClause += ` AND "resourceType" = $${params.length + 1}`;
      params.push(resourceType);
    }
    
    if (startDate) {
      whereClause += ` AND "createdAt" >= $${params.length + 1}`;
      params.push(new Date(startDate as string));
    }
    
    if (endDate) {
      whereClause += ` AND "createdAt" <= $${params.length + 1}`;
      params.push(new Date(endDate as string));
    }
    
    if (search) {
      whereClause += ` AND (
        "userEmail" ILIKE $${params.length + 1} OR 
        "action" ILIKE $${params.length + 2} OR 
        "resourceType" ILIKE $${params.length + 3} OR
        "metadata"::text ILIKE $${params.length + 4}
      )`;
      params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
    }
    
    const [logs, countResult] = await Promise.all([
      sql`
        SELECT 
          al.*,
          json_build_object(
            'email', u.email,
            'name', u.name
          ) as user
        FROM "AuditLog" al
        LEFT JOIN "User" u ON al."userId" = u.id
        ${sql.unsafe(whereClause, params)}
        ORDER BY al."createdAt" DESC
        LIMIT ${limitNum} OFFSET ${skip}
      `,
      sql`
        SELECT COUNT(*) as count
        FROM "AuditLog" al
        ${sql.unsafe(whereClause, params)}
      `
    ]);
    
    const total = parseInt(countResult[0]?.count || '0');

    res.json({
      logs,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    console.error('Get audit logs error:', error);
    res.status(500).json({
      error: {
        code: 'AUDIT_LOGS_FETCH_FAILED',
        message: 'Failed to fetch audit logs',
      },
    });
  }
});

/**
 * @route GET /api/admin/audit-logs/export
 * @desc Export audit logs as CSV
 * @access Private (Admin)
 */
router.get('/audit-logs/export', async (req, res) => {
  try {
    const { userId, action, resourceType, startDate, endDate } = req.query;

    const where: any = {};

    if (userId) {
      where.userId = userId;
    }

    if (action) {
      where.action = action;
    }

    if (resourceType) {
      where.resourceType = resourceType;
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate as string);
      if (endDate) where.createdAt.lte = new Date(endDate as string);
    }

    // Build WHERE clause for SQL
    let whereClause = 'WHERE 1=1';
    const params: any[] = [];
    
    if (userId) {
      whereClause += ` AND "userId" = $${params.length + 1}`;
      params.push(userId);
    }
    
    if (action) {
      whereClause += ` AND "action" = $${params.length + 1}`;
      params.push(action);
    }
    
    if (resourceType) {
      whereClause += ` AND "resourceType" = $${params.length + 1}`;
      params.push(resourceType);
    }
    
    if (startDate) {
      whereClause += ` AND "createdAt" >= $${params.length + 1}`;
      params.push(new Date(startDate as string));
    }
    
    if (endDate) {
      whereClause += ` AND "createdAt" <= $${params.length + 1}`;
      params.push(new Date(endDate as string));
    }
    
    const logs = await sql`
      SELECT 
        al.*,
        json_build_object(
          'email', u.email,
          'name', u.name
        ) as user
      FROM "AuditLog" al
      LEFT JOIN "User" u ON al."userId" = u.id
      ${sql.unsafe(whereClause, params)}
      ORDER BY al."createdAt" DESC
    `;

    // Convert to CSV
    const headers = ['Timestamp', 'Action', 'Resource Type', 'Resource ID', 'User', 'IP Address', 'User Agent', 'Metadata'];
    const csvRows = logs.map(log => [
      log.created_at.toISOString(),
      log.action,
      log.resource_type,
      log.resource_id || '',
      log.user?.email || 'System',
      log.ip_address || '',
      log.user_agent || '',
      JSON.stringify(log.metadata),
    ]);

    const csv = [headers, ...csvRows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=audit-logs.csv');
    res.send(csv);
  } catch (error) {
    console.error('Export audit logs error:', error);
    res.status(500).json({
      error: {
        code: 'AUDIT_LOGS_EXPORT_FAILED',
        message: 'Failed to export audit logs',
      },
    });
  }
});

// =============================================================================
// Monitoring Endpoints
// =============================================================================

/**
 * @route GET /api/admin/monitoring/health
 * @desc Get system health status
 * @access Private (Admin)
 */
router.get('/monitoring/health', async (_req, res) => {
  try {
    // Check database connection
    let databaseStatus = false;
    try {
      await sql`SELECT 1`;
      databaseStatus = true;
    } catch (error) {
      console.error('Database health check failed:', error);
    }

    // Check Redis (if configured)
    const redisStatus = false; // Implement Redis check if available

    // Check LLM providers (simplified check)
    const llmProviders = {
      'OpenAI': true, // Implement actual checks
      'Anthropic': true,
      'Google': true,
      'Azure': true,
    };

    // Get recent performance metrics
    const recentMetrics = await sql`
      SELECT 
        "responseTime", "error"
      FROM "UsageLog"
      WHERE "createdAt" >= ${new Date(Date.now() - 5 * 60 * 1000)}
      LIMIT 100
    `;

    const responseTimes = recentMetrics.filter(m => m.responseTime).map(m => m.responseTime!);
    const avgResponseTime = responseTimes.length > 0 
      ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length 
      : 0;

    const errorRate = recentMetrics.length > 0
      ? (recentMetrics.filter(m => m.error).length / recentMetrics.length) * 100
      : 0;

    // Determine overall status
    let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
    if (!databaseStatus) {
      status = 'unhealthy';
    } else if (errorRate > 10 || avgResponseTime > 5) {
      status = 'degraded';
    }

    res.json({
      status,
      services: {
        database: databaseStatus,
        redis: redisStatus,
        llmProviders,
      },
      metrics: {
        responseTime: avgResponseTime,
        errorRate,
        activeConnections: 0, // Implement connection tracking if available
      },
      lastUpdated: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Get system health error:', error);
    res.status(500).json({
      error: {
        code: 'HEALTH_CHECK_FAILED',
        message: 'Failed to check system health',
      },
    });
  }
});

/**
 * @route GET /api/admin/monitoring/metrics
 * @desc Get performance metrics
 * @access Private (Admin)
 */
router.get('/monitoring/metrics', async (req, res) => {
  try {
    const { timeframe = '1h' } = req.query;

    let intervalMinutes: number;
    let dataPoints: number;

    switch (timeframe) {
      case '1h':
        intervalMinutes = 1;
        dataPoints = 60;
        break;
      case '24h':
        intervalMinutes = 60;
        dataPoints = 24;
        break;
      case '7d':
        intervalMinutes = 24 * 60;
        dataPoints = 7;
        break;
      default:
        intervalMinutes = 1;
        dataPoints = 60;
    }

    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - dataPoints * intervalMinutes * 60 * 1000);

    // Get aggregated metrics
    const metrics = await sql`
      SELECT 
        DATE_TRUNC('minute', "createdAt") as timestamp,
        AVG("responseTime") as avg_response_time,
        COUNT(CASE WHEN "error" IS NOT NULL THEN 1 END) * 100.0 / COUNT(*) as error_rate,
        COUNT(*) as request_count
      FROM "UsageLog"
      WHERE "createdAt" >= ${startDate} AND "createdAt" <= ${endDate}
      GROUP BY DATE_TRUNC('minute', "createdAt")
      ORDER BY timestamp
    `;

    res.json({ metrics });
  } catch (error) {
    console.error('Get metrics error:', error);
    res.status(500).json({
      error: {
        code: 'METRICS_FETCH_FAILED',
        message: 'Failed to fetch performance metrics',
      },
    });
  }
});

// =============================================================================
// Dashboard Endpoints
// =============================================================================

/**
 * @route GET /api/admin/dashboard/stats
 * @desc Get dashboard statistics
 * @access Private (Admin)
 */
router.get('/dashboard/stats', async (_req, res) => {
  try {
    const [
      totalUsersResult,
      activeUsersResult,
      totalSessionsResult,
      totalMessagesResult,
      totalCostResult,
      recentAlertsResult,
    ] = await Promise.all([
      sql`SELECT COUNT(*) as count FROM "User"`,
      sql`SELECT COUNT(*) as count FROM "User" WHERE "isActive" = true`,
      sql`SELECT COUNT(*) as count FROM "Session"`,
      sql`SELECT COUNT(*) as count FROM "Message"`,
      sql`SELECT COALESCE(SUM("cost"), 0) as total_cost FROM "UsageLog"`,
      sql`
        SELECT COUNT(*) as count 
        FROM "AuditLog" 
        WHERE "action" = 'quota_alert' 
        AND "createdAt" >= ${new Date(Date.now() - 24 * 60 * 60 * 1000)}
      `,
    ]);
    
    const totalUsers = parseInt(totalUsersResult[0]?.count || '0');
    const activeUsers = parseInt(activeUsersResult[0]?.count || '0');
    const totalSessions = parseInt(totalSessionsResult[0]?.count || '0');
    const totalMessages = parseInt(totalMessagesResult[0]?.count || '0');
    const totalCost = parseFloat(totalCostResult[0]?.total_cost || '0');
    const recentAlerts = parseInt(recentAlertsResult[0]?.count || '0');

    // Get average response time from recent usage
    const recentUsage = await sql`
      SELECT "responseTime"
      FROM "UsageLog"
      WHERE "createdAt" >= ${new Date(Date.now() - 60 * 60 * 1000)}
      AND "responseTime" IS NOT NULL
      LIMIT 100
    `;

    const avgResponseTime = recentUsage.length > 0
      ? recentUsage.reduce((sum, log) => sum + (log.responseTime || 0), 0) / recentUsage.length
      : 0;

    // Determine system health (simplified)
    const systemHealth: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';

    res.json({
      totalUsers,
      activeUsers,
      totalSessions,
      totalMessages,
      totalCost,
      systemHealth,
      recentAlerts,
      avgResponseTime,
    });
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({
      error: {
        code: 'DASHBOARD_STATS_FAILED',
        message: 'Failed to fetch dashboard statistics',
      },
    });
  }
});

/**
 * @route GET /api/admin/dashboard/activity
 * @desc Get recent activity for dashboard
 * @access Private (Admin)
 */
router.get('/dashboard/activity', async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    const activity = await sql`
      SELECT 
        al.*,
        json_build_object(
          'email', u.email,
          'name', u.name
        ) as user
      FROM "AuditLog" al
      LEFT JOIN "User" u ON al."userId" = u.id
      ORDER BY al."createdAt" DESC
      LIMIT ${parseInt(limit as string)}
    `;

    res.json({ activity });
  } catch (error) {
    console.error('Get activity error:', error);
    res.status(500).json({
      error: {
        code: 'ACTIVITY_FETCH_FAILED',
        message: 'Failed to fetch recent activity',
      },
    });
  }
});

export default router;