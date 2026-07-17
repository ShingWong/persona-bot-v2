import { sql } from './db';

export async function initializeDatabase() {
  console.log('Initializing database...');
  
  await sql`
    CREATE TABLE IF NOT EXISTS "User" (
      id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
      email TEXT UNIQUE NOT NULL,
      name TEXT,
      "passwordHash" TEXT NOT NULL,
      "avatarUrl" TEXT,
      role TEXT NOT NULL DEFAULT 'USER',
      "isActive" BOOLEAN NOT NULL DEFAULT true,
      "failedLoginAttempts" INTEGER NOT NULL DEFAULT 0,
      "lockedUntil" TIMESTAMP,
      "lockoutUntil" TIMESTAMP,
      "lastLoginAt" TIMESTAMP,
      "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
      "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS "Persona" (
      id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
      name TEXT NOT NULL,
      description TEXT,
      "systemPrompt" TEXT,
      "avatarUrl" TEXT,
      "isActive" BOOLEAN NOT NULL DEFAULT true,
      "isDefault" BOOLEAN NOT NULL DEFAULT false,
      "modelId" TEXT,
      temperature REAL,
      "maxTokens" INTEGER,
      "toolsEnabled" BOOLEAN NOT NULL DEFAULT false,
      "memoryEnabled" BOOLEAN NOT NULL DEFAULT false,
      "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
      "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS "AIModel" (
      id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
      name TEXT NOT NULL,
      provider TEXT NOT NULL,
      "modelIdentifier" TEXT NOT NULL,
      "displayName" TEXT,
      description TEXT,
      "contextWindow" INTEGER,
      "costPer1kInput" REAL NOT NULL,
      "costPer1kOutput" REAL NOT NULL,
      "maxTokens" INTEGER,
      "supportsVision" BOOLEAN NOT NULL DEFAULT false,
      "supportsTools" BOOLEAN NOT NULL DEFAULT false,
      "isActive" BOOLEAN NOT NULL DEFAULT true,
      "isDefault" BOOLEAN NOT NULL DEFAULT false,
      "createdAt" TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS "Session" (
      id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
      "userId" TEXT NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
      "personaId" TEXT NOT NULL REFERENCES "Persona"(id),
      title TEXT,
      status TEXT NOT NULL DEFAULT 'active',
      "refreshToken" TEXT,
      "expiresAt" TIMESTAMP,
      "userAgent" TEXT,
      "ipAddress" TEXT,
      "modelId" TEXT,
      "aiModelId" TEXT REFERENCES "AIModel"(id),
      "modelOverride" TEXT,
      "tokensUsed" INTEGER NOT NULL DEFAULT 0,
      cost REAL NOT NULL DEFAULT 0,
      "contextTokens" INTEGER NOT NULL DEFAULT 0,
      "lastActiveAt" TIMESTAMP,
      "endedAt" TIMESTAMP,
      "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
      "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS "Message" (
      id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
      "sessionId" TEXT NOT NULL REFERENCES "Session"(id) ON DELETE CASCADE,
      role TEXT NOT NULL,
      content TEXT NOT NULL,
      "inputTokens" INTEGER NOT NULL DEFAULT 0,
      "outputTokens" INTEGER NOT NULL DEFAULT 0,
      "modelId" TEXT,
      cost REAL NOT NULL DEFAULT 0,
      "createdAt" TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS "AuditLog" (
      id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
      "userId" TEXT,
      "userEmail" TEXT,
      action TEXT NOT NULL,
      resource TEXT,
      "resourceId" TEXT,
      details TEXT,
      "ipAddress" TEXT,
      "userAgent" TEXT,
      "errorMessage" TEXT,
      "createdAt" TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS "Setting" (
      id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
      key TEXT UNIQUE NOT NULL,
      value TEXT NOT NULL,
      "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
      "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS "ApiKey" (
      id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
      "userId" TEXT NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      key TEXT UNIQUE NOT NULL,
      provider TEXT NOT NULL,
      "expiresAt" TIMESTAMP,
      "lastUsedAt" TIMESTAMP,
      "isActive" BOOLEAN NOT NULL DEFAULT true,
      "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
      "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS "UserPreference" (
      id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
      "userId" TEXT UNIQUE NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
      theme TEXT NOT NULL DEFAULT 'dark',
      language TEXT NOT NULL DEFAULT 'en',
      timezone TEXT NOT NULL DEFAULT 'UTC',
      settings TEXT NOT NULL DEFAULT '{}',
      "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
      "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS "Organization" (
      id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
      name TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      plan TEXT NOT NULL DEFAULT 'free',
      settings TEXT NOT NULL DEFAULT '{}',
      "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
      "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS "OrganizationUser" (
      id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
      "organizationId" TEXT NOT NULL REFERENCES "Organization"(id) ON DELETE CASCADE,
      "userId" TEXT NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
      role TEXT NOT NULL DEFAULT 'member',
      "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
      UNIQUE("organizationId", "userId")
    )
  `;

  // Create indexes
  await sql`CREATE INDEX IF NOT EXISTS idx_session_user ON "Session"("userId")`;
  await sql`CREATE INDEX IF NOT EXISTS idx_session_persona ON "Session"("personaId")`;
  await sql`CREATE INDEX IF NOT EXISTS idx_session_lastActive ON "Session"("lastActiveAt")`;
  await sql`CREATE INDEX IF NOT EXISTS idx_message_session ON "Message"("sessionId")`;

  // Insert default persona
  await sql`
    INSERT INTO "Persona" (name, description, "systemPrompt", "isDefault", "isActive")
    VALUES ('AI Assistant', 'A helpful AI assistant', 'You are a helpful AI assistant.', true, true)
    ON CONFLICT DO NOTHING
  `;

  console.log('Database initialized successfully');
}

export default initializeDatabase;
