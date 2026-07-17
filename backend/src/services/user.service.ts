import { sql } from '../lib/db';
import { PasswordService } from '../utils/password';
import { AuthError } from '../types/auth';

export interface UserRow {
  id: string;
  email: string;
  name: string | null;
  passwordHash: string;
  avatarUrl: string | null;
  role: string;
  isActive: boolean;
  failedLoginAttempts: number;
  lockedUntil: Date | null;
  lockoutUntil: Date | null;
  lastLoginAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export class UserService {
  static async createUser(email: string, password: string, name?: string) {
    // Check if user exists
    const existingUsers = await sql<UserRow[]>`SELECT id FROM "User" WHERE email = ${email}`;
    
    if (existingUsers.length > 0) {
      throw {
        code: 'USER_EXISTS',
        message: 'User with this email already exists',
        statusCode: 409,
      } as AuthError;
    }

    const passwordHash = await PasswordService.hashPassword(password);

    const result = await sql<UserRow[]>`
      INSERT INTO "User" (email, "passwordHash", name, role, "isActive")
      VALUES (${email}, ${passwordHash}, ${name || null}, 'USER', true)
      RETURNING id, email, name, role, "avatarUrl", "createdAt", "updatedAt"
    `;

    const user = result[0];
    return user;
  }

  static async findUserByEmail(email: string): Promise<UserRow | null> {
    const users = await sql<UserRow[]>`
      SELECT * FROM "User" WHERE email = ${email}
    `;
    return users.length > 0 ? users[0] : null;
  }

  static async findUserById(id: string) {
    const users = await sql<UserRow[]>`
      SELECT id, email, name, role, "avatarUrl", "isActive", "createdAt", "updatedAt"
      FROM "User" WHERE id = ${id}
    `;
    return users.length > 0 ? users[0] : null;
  }

  static async validateUserCredentials(email: string, password: string) {
    const user = await this.findUserByEmail(email);

    if (!user) {
      throw {
        code: 'INVALID_CREDENTIALS',
        message: 'Invalid email or password',
        statusCode: 401,
      } as AuthError;
    }

    if (!user.isActive) {
      throw {
        code: 'ACCOUNT_DISABLED',
        message: 'Account is disabled',
        statusCode: 403,
      } as AuthError;
    }

    const isValidPassword = await PasswordService.comparePassword(password, user.passwordHash);

    if (!isValidPassword) {
      await this.recordFailedLoginAttempt(user.id);
      throw {
        code: 'INVALID_CREDENTIALS',
        message: 'Invalid email or password',
        statusCode: 401,
      } as AuthError;
    }

    await this.recordSuccessfulLogin(user.id);

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      avatarUrl: user.avatarUrl,
    };
  }

  static async recordFailedLoginAttempt(userId: string) {
    await sql`
      UPDATE "User" 
      SET "failedLoginAttempts" = "failedLoginAttempts" + 1, "updatedAt" = NOW()
      WHERE id = ${userId}
    `;
  }

  static async recordSuccessfulLogin(userId: string) {
    await sql`
      UPDATE "User" 
      SET "lastLoginAt" = NOW(), 
          "failedLoginAttempts" = 0, 
          "lockoutUntil" = NULL,
          "updatedAt" = NOW()
      WHERE id = ${userId}
    `;
  }

  static async updateUserProfile(userId: string, data: { name?: string; avatarUrl?: string }) {
    const users = await sql<UserRow[]>`
      UPDATE "User" 
      SET name = ${data.name || null}, 
          "avatarUrl" = ${data.avatarUrl || null},
          "updatedAt" = NOW()
      WHERE id = ${userId}
      RETURNING id, email, name, role, "avatarUrl", "createdAt", "updatedAt"
    `;
    return users[0];
  }
}
