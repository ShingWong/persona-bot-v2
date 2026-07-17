import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';

export const validate = (schema: ZodSchema, target: 'body' | 'query' = 'body') => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = target === 'body' ? req.body : req.query;
      const result = schema.safeParse(data);
      
      if (!result.success) {
        const errors = (result as any).error.errors.map((err: any) => ({
          path: err.path.join('.'),
          message: err.message,
        }));
        
        return res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Validation failed',
            details: errors,
          },
        });
      }
      
      if (target === 'body') {
        req.body = result.data;
      } else {
        req.query = result.data as any;
      }
      return next();
    } catch (error: any) {
      return res.status(500).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Validation failed',
        },
      });
    }
  };
};