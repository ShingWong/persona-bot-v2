/**
 * Admin Middleware
 * Restricts access to admin users only
 */

import { Request, Response, NextFunction } from 'express';

export const adminMiddleware = (req: Request, res: Response, next: NextFunction) => {
  // Check if user is authenticated and has admin role
  const user = (req as any).user;

  if (!user) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required',
    });
  }

  if (user.role !== 'ADMIN') {
    return res.status(403).json({
      success: false,
      error: 'Admin access required',
    });
  }

  next();
};