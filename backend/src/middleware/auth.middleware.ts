import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service';
import { AuthError } from '../types/auth';

export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw {
        code: 'NO_TOKEN',
        message: 'No authentication token provided',
        statusCode: 401,
      } as AuthError;
    }

    const token = authHeader.substring(7);
    const payload = await AuthService.validateAccessToken(token);

    req.user = payload;
    next();
  } catch (error) {
    const authError = error as AuthError;
    res.status(authError.statusCode || 401).json({
      error: {
        code: authError.code || 'AUTH_ERROR',
        message: authError.message || 'Authentication failed',
      },
    });
  }
};

export const requireRole = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw {
          code: 'NO_USER',
          message: 'User not authenticated',
          statusCode: 401,
        } as AuthError;
      }

      if (!roles.includes(req.user.role)) {
        throw {
          code: 'INSUFFICIENT_PERMISSIONS',
          message: 'Insufficient permissions',
          statusCode: 403,
        } as AuthError;
      }

      next();
    } catch (error) {
      const authError = error as AuthError;
      res.status(authError.statusCode || 403).json({
        error: {
          code: authError.code || 'PERMISSION_ERROR',
          message: authError.message || 'Permission denied',
        },
      });
    }
  };
};

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        email: string;
        role: string;
      };
    }
  }
}