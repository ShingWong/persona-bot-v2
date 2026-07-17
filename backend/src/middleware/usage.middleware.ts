/**
 * Usage Tracking Middleware
 * Automatically tracks API usage and enforces quotas
 */

import { Request, Response, NextFunction } from 'express';
import { usageService } from '../services/usage';

export const trackUsage = async (req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();
  const originalSend = res.send;

  // Skip tracking for certain endpoints
  const skipEndpoints = ['/health', '/metrics', '/usage'];
  if (skipEndpoints.some(endpoint => req.path.startsWith(endpoint))) {
    return next();
  }

  // Get user ID if authenticated
  const userId = req.user?.userId;
  if (!userId) {
    return next();
  }

  try {
    // Check quota before processing request
    const action = getActionFromRequest(req);
    if (action) {
      const quotaCheck = await usageService.canPerformAction(userId, action);
      
      if (!quotaCheck.allowed) {
        return res.status(429).json({
          error: {
            code: 'QUOTA_EXCEEDED',
            message: quotaCheck.reason || 'Quota exceeded',
            quotaUsage: quotaCheck.quotaUsage,
          },
        });
      }
    }

    // Track API call
    res.send = function(body: any): any {
      const responseTime = Date.now() - startTime;
      
      // Track the API call asynchronously (don't block response)
      usageService.trackApiCall(userId, req.path, {
        method: req.method,
        statusCode: res.statusCode,
        responseTime,
        userAgent: req.get('user-agent'),
        ipAddress: req.ip,
      }).catch(err => {
        console.error('Failed to track API usage:', err);
      });

      return originalSend.call(this, body);
    };

    next();
  } catch (error) {
    console.error('Usage tracking error:', error);
    next(); // Don't block request if tracking fails
  }
};

export const trackMessageUsage = async (req: Request, res: Response, next: NextFunction) => {
  // This middleware is specifically for tracking message creation
  const originalSend = res.send;

  res.send = function(body: any): any {
    try {
      const response = JSON.parse(body);
      
      // Check if this is a message creation response
      if (response.message && req.user?.userId && req.body?.sessionId) {
        const { message } = response;
        
        // Track message usage asynchronously
        usageService.trackMessage(
          message.id,
          req.body.sessionId,
          req.user.userId,
          req.body.personaId,
          message.modelId
        ).catch(err => {
          console.error('Failed to track message usage:', err);
        });

        // Check quota alerts after message creation
        usageService.checkQuotaAlerts(req.user.userId).catch(err => {
          console.error('Failed to check quota alerts:', err);
        });
      }
    } catch (error) {
      // Ignore parsing errors
    }

    return originalSend.call(this, body);
  };

  next();
};

export const enforceQuota = (action: 'send_message' | 'create_session' | 'create_persona' | 'upload_file') => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
        },
      });
    }

    try {
      // Estimate tokens/cost if applicable
      let estimatedTokens: number | undefined;
      let estimatedCost: number | undefined;

      if (action === 'send_message' && req.body.content) {
        // Rough token estimation (4 chars per token)
        estimatedTokens = Math.ceil(req.body.content.length / 4);
        
        // Estimate cost (rough average)
        estimatedCost = estimatedTokens * 0.00002; // $0.00002 per token
      }

      const quotaCheck = await usageService.canPerformAction(
        userId,
        action,
        estimatedTokens,
        estimatedCost
      );

      if (!quotaCheck.allowed) {
        return res.status(429).json({
          error: {
            code: 'QUOTA_EXCEEDED',
            message: quotaCheck.reason || 'Quota exceeded',
            quotaUsage: quotaCheck.quotaUsage,
          },
        });
      }

      next();
    } catch (error) {
      console.error('Quota enforcement error:', error);
      return res.status(500).json({
        error: {
          code: 'QUOTA_CHECK_FAILED',
          message: 'Failed to check quota',
        },
      });
    }
  };
};

export const usageLimiter = (limit: number, windowMs: number = 60000) => {
  const requests = new Map<string, { count: number; resetTime: number }>();

  return (req: Request, res: Response, next: NextFunction) => {
    const userId = req.user?.userId;
    if (!userId) {
      return next();
    }

    const now = Date.now();
    const userRequests = requests.get(userId);

    if (!userRequests || now > userRequests.resetTime) {
      // First request or window expired
      requests.set(userId, {
        count: 1,
        resetTime: now + windowMs,
      });
      return next();
    }

    if (userRequests.count >= limit) {
      return res.status(429).json({
        error: {
          code: 'RATE_LIMITED',
          message: `Rate limit exceeded. Try again in ${Math.ceil((userRequests.resetTime - now) / 1000)} seconds.`,
          retryAfter: Math.ceil((userRequests.resetTime - now) / 1000),
        },
      });
    }

    // Increment count
    userRequests.count++;
    requests.set(userId, userRequests);

    // Add rate limit headers
    res.setHeader('X-RateLimit-Limit', limit.toString());
    res.setHeader('X-RateLimit-Remaining', (limit - userRequests.count).toString());
    res.setHeader('X-RateLimit-Reset', Math.ceil(userRequests.resetTime / 1000).toString());

    next();
  };
};

// Helper function to determine action from request
function getActionFromRequest(req: Request): 'send_message' | 'create_session' | 'create_persona' | 'upload_file' | null {
  const { method, path } = req;

  if (method === 'POST') {
    if (path.includes('/messages')) {
      return 'send_message';
    } else if (path.includes('/sessions')) {
      return 'create_session';
    } else if (path.includes('/personas')) {
      return 'create_persona';
    } else if (path.includes('/upload') || path.includes('/files')) {
      return 'upload_file';
    }
  }

  return null;
}

// Export middleware
export default {
  trackUsage,
  trackMessageUsage,
  enforceQuota,
  usageLimiter,
};