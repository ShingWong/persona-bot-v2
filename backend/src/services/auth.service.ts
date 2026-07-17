import { sql } from '../lib/db';
import { JwtService } from '../utils/jwt';
import { UserService } from './user.service';
import { AuthError, UserSession } from '../types/auth';

interface SessionRow {
  id: string;
  userId: string;
  personaId: string;
  title: string | null;
  status: string;
  refreshToken: string | null;
  expiresAt: Date | null;
  userAgent: string | null;
  ipAddress: string | null;
  modelId: string | null;
  aiModelId: string | null;
  modelOverride: string | null;
  tokensUsed: number;
  cost: number;
  contextTokens: number;
  lastActiveAt: Date | null;
  endedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export class AuthService {
  static async register(email: string, password: string, name?: string) {
    const user = await UserService.createUser(email, password, name);

    const accessToken = JwtService.generateAccessToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    const refreshToken = JwtService.generateRefreshToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    await this.createSession(user.id, refreshToken);

    return {
      user,
      access_token: accessToken,
      refresh_token: refreshToken,
      token_type: 'bearer',
    };
  }

  static async login(email: string, password: string, userAgent?: string, ipAddress?: string) {
    const user = await UserService.validateUserCredentials(email, password);

    const accessToken = JwtService.generateAccessToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    const refreshToken = JwtService.generateRefreshToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    await this.createSession(user.id, refreshToken, userAgent, ipAddress);

    return {
      user,
      access_token: accessToken,
      refresh_token: refreshToken,
      token_type: 'bearer',
    };
  }

  static async logout(refreshToken: string) {
    await this.invalidateSession(refreshToken);
  }

  static async refreshTokens(refreshToken: string) {
    let payload;
    try {
      payload = JwtService.verifyRefreshToken(refreshToken);
    } catch (error) {
      throw {
        code: 'INVALID_REFRESH_TOKEN',
        message: 'Invalid refresh token',
        statusCode: 401,
      } as AuthError;
    }

    const session = await this.findSessionByToken(refreshToken);
    if (!session) {
      throw {
        code: 'SESSION_NOT_FOUND',
        message: 'Session not found',
        statusCode: 401,
      } as AuthError;
    }

    if (session.expiresAt < new Date()) {
      await this.invalidateSession(refreshToken);
      throw {
        code: 'SESSION_EXPIRED',
        message: 'Session expired',
        statusCode: 401,
      } as AuthError;
    }

    const user = await UserService.findUserById(payload.userId);
    if (!user) {
      throw {
        code: 'USER_NOT_FOUND',
        message: 'User not found',
        statusCode: 404,
      } as AuthError;
    }

    const newAccessToken = JwtService.generateAccessToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    const newRefreshToken = JwtService.generateRefreshToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    await this.updateSession(refreshToken, newRefreshToken);

    return {
      user,
      access_token: newAccessToken,
      refresh_token: newRefreshToken,
      token_type: 'bearer',
    };
  }

  static async createSession(userId: string, refreshToken: string, userAgent?: string, ipAddress?: string) {
    const payload = JwtService.decodeToken(refreshToken);
    if (!payload || !payload.exp) {
      throw {
        code: 'INVALID_TOKEN',
        message: 'Invalid token',
        statusCode: 400,
      } as AuthError;
    }

    const expiresAt = new Date(payload.exp * 1000);

    // Get a default persona ID
    const personas = await sql<{ id: string }[]>`
      SELECT id FROM "Persona" WHERE "isActive" = true LIMIT 1
    `;
    
    const personaId = personas[0]?.id;
    
    if (!personaId) {
      throw {
        code: 'NO_PERSONA',
        message: 'No active persona found',
        statusCode: 500,
      } as AuthError;
    }

    await sql`
      INSERT INTO "Session" ("userId", "personaId", "title", "status", "lastActiveAt", "expiresAt", "userAgent", "ipAddress", "refreshToken")
      VALUES (${userId}, ${personaId}, 'Auth Session', 'ACTIVE', NOW(), ${expiresAt}, ${userAgent || null}, ${ipAddress || null}, ${refreshToken})
    `;
  }

  static async findSessionByToken(refreshToken: string): Promise<UserSession | null> {
    const sessions = await sql<SessionRow[]>`
      SELECT * FROM "Session" 
      WHERE "refreshToken" = ${refreshToken} AND status = 'ACTIVE'
    `;

    const session = sessions[0];

    if (!session || !session.refreshToken || !session.expiresAt) return null;

    return {
      id: session.id,
      userId: session.userId,
      refreshToken: session.refreshToken,
      userAgent: session.userAgent || undefined,
      ipAddress: session.ipAddress || undefined,
      expiresAt: session.expiresAt,
      createdAt: session.createdAt,
    };
  }

  static async updateSession(oldRefreshToken: string, newRefreshToken: string) {
    const payload = JwtService.decodeToken(newRefreshToken);
    if (!payload || !payload.exp) {
      throw {
        code: 'INVALID_TOKEN',
        message: 'Invalid token',
        statusCode: 400,
      } as AuthError;
    }

    const expiresAt = new Date(payload.exp * 1000);

    await sql`
      UPDATE "Session" 
      SET "refreshToken" = ${newRefreshToken}, 
          "expiresAt" = ${expiresAt}, 
          "lastActiveAt" = NOW()
      WHERE "refreshToken" = ${oldRefreshToken} AND status = 'ACTIVE'
    `;
  }

  static async invalidateSession(refreshToken: string) {
    await sql`
      UPDATE "Session" 
      SET status = 'ARCHIVED', "endedAt" = NOW()
      WHERE "refreshToken" = ${refreshToken} AND status = 'ACTIVE'
    `;
  }

  static async invalidateAllUserSessions(userId: string) {
    await sql`
      UPDATE "Session" 
      SET status = 'ARCHIVED', "endedAt" = NOW()
      WHERE "userId" = ${userId} AND status = 'ACTIVE'
    `;
  }

  static async validateAccessToken(accessToken: string) {
    try {
      return JwtService.verifyAccessToken(accessToken);
    } catch (error) {
      throw {
        code: 'INVALID_ACCESS_TOKEN',
        message: 'Invalid access token',
        statusCode: 401,
      } as AuthError;
    }
  }
}
