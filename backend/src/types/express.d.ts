/**
 * Express Type Definitions
 * Extend Express Request type with custom properties
 */

declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        email: string;
        role: string;
      };
      // prisma?: PrismaClient; // Removed - using postgres.js instead
    }
  }
}