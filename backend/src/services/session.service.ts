import { sql } from '../lib/db';

export interface CreateSessionData {
  userId: string;
  title?: string;
  personaId: string;
  aiModelId?: string;
  modelOverride?: string;
  userAgent?: string;
  ipAddress?: string;
}

export interface UpdateSessionData {
  title?: string;
  status?: string;
}

export interface SessionFilters {
  status?: string;
  limit: number;
  offset: number;
}

interface PersonaRow {
  id: string;
  name: string;
  description: string | null;
  avatarUrl: string | null;
}

interface AIModelRow {
  id: string;
  displayName: string | null;
  provider: string;
  modelIdentifier: string;
}

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
  p_id?: string;
  p_name?: string;
  p_description?: string;
  p_avatarUrl?: string;
  m_id?: string;
  m_displayName?: string;
  m_provider?: string;
  m_modelIdentifier?: string;
}

export class SessionService {
  static async createSession(data: CreateSessionData) {
    // First, get persona info
    const personas = await sql<PersonaRow[]>`
      SELECT id, name, description, "avatarUrl" FROM "Persona" WHERE id = ${data.personaId}
    `;
    const persona = personas[0];

    // Get AI model info if provided
    let aiModel: AIModelRow | null = null;
    if (data.aiModelId) {
      const aiModels = await sql<AIModelRow[]>`
        SELECT id, "displayName", provider, "modelIdentifier" FROM "AIModel" WHERE id = ${data.aiModelId}
      `;
      aiModel = aiModels[0] || null;
    }

    const sessions = await sql<SessionRow[]>`
      INSERT INTO "Session" (id, "userId", "title", "personaId", "aiModelId", "modelOverride", "userAgent", "ipAddress", "status", "lastActiveAt")
      VALUES (gen_random_uuid()::text, ${data.userId}, ${data.title || 'New Chat'}, ${data.personaId}, ${data.aiModelId || null}, ${data.modelOverride || null}, ${data.userAgent || null}, ${data.ipAddress || null}, 'ACTIVE', NOW())
      RETURNING *
    `;

    const session = sessions[0];

    return {
      ...session,
      persona: persona ? {
        id: persona.id,
        name: persona.name,
        description: persona.description,
        avatarUrl: persona.avatarUrl,
      } : null,
      aiModel: aiModel ? {
        id: aiModel.id,
        displayName: aiModel.displayName,
        provider: aiModel.provider,
        modelIdentifier: aiModel.modelIdentifier,
      } : null,
      _count: { messages: 0 },
    };
  }

  static async getUserSessions(userId: string, filters: SessionFilters) {
    // Build the base query
    let query = sql`
      SELECT s.*, 
             p.id as "p_id", p.name as "p_name", p.description as "p_description", p."avatarUrl" as "p_avatarUrl",
             m.id as "m_id", m."displayName" as "m_displayName", m.provider as "m_provider", m."modelIdentifier" as "m_modelIdentifier"
      FROM "Session" s
      LEFT JOIN "Persona" p ON s."personaId" = p.id
      LEFT JOIN "AIModel" m ON s."aiModelId" = m.id
      WHERE s."userId" = ${userId}
    `;

    if (filters.status) {
      query = sql`${query} AND s.status = ${filters.status}`;
    }

    // Get total count
    const countResult = await sql<{ count: string }[]>`SELECT COUNT(*) as count FROM "Session" WHERE "userId" = ${userId}`;
    const total = parseInt(countResult[0]?.count || '0', 10);

    // Get sessions with pagination
    query = sql`${query} ORDER BY s."lastActiveAt" DESC LIMIT ${filters.limit} OFFSET ${filters.offset}`;

    const sessions = await query;

    // Get message counts for each session
    const sessionsWithCounts = await Promise.all(
      sessions.map(async (s: any) => {
        const msgCount = await sql<{ count: string }[]>`SELECT COUNT(*) as count FROM "Message" WHERE "sessionId" = ${s.id}`;
        return {
          id: s.id,
          userId: s.userId,
          personaId: s.personaId,
          title: s.title,
          status: s.status,
          refreshToken: s.refreshToken,
          expiresAt: s.expiresAt,
          userAgent: s.userAgent,
          ipAddress: s.ipAddress,
          modelId: s.modelId,
          aiModelId: s.aiModelId,
          modelOverride: s.modelOverride,
          tokensUsed: s.tokensUsed,
          cost: s.cost,
          contextTokens: s.contextTokens,
          lastActiveAt: s.lastActiveAt,
          endedAt: s.endedAt,
          createdAt: s.createdAt,
          updatedAt: s.updatedAt,
          persona: s.p_id ? {
            id: s.p_id,
            name: s.p_name,
            avatarUrl: s.p_avatarUrl,
          } : null,
          aiModel: s.m_id ? {
            id: s.m_id,
            displayName: s.m_displayName,
          } : null,
          _count: {
            messages: parseInt(msgCount[0]?.count || '0', 10),
          },
        };
      })
    );

    return {
      sessions: sessionsWithCounts,
      total,
      limit: filters.limit,
      offset: filters.offset,
    };
  }

  static async getSessionById(id: string, userId: string) {
    const sessions = await sql<SessionRow[]>`
      SELECT s.*, 
             p.id as "p_id", p.name as "p_name", p.description as "p_description", p."avatarUrl" as "p_avatarUrl",
             m.id as "m_id", m."displayName" as "m_displayName", m.provider as "m_provider", m."modelIdentifier" as "m_modelIdentifier"
      FROM "Session" s
      LEFT JOIN "Persona" p ON s."personaId" = p.id
      LEFT JOIN "AIModel" m ON s."aiModelId" = m.id
      WHERE s.id = ${id} AND s."userId" = ${userId}
    `;

    const s = sessions[0];

    if (!s) {
      throw {
        code: 'SESSION_NOT_FOUND',
        message: 'Session not found',
        statusCode: 404,
      };
    }

    const msgCount = await sql<{ count: string }[]>`SELECT COUNT(*) as count FROM "Message" WHERE "sessionId" = ${id}`;

    return {
      id: s.id,
      userId: s.userId,
      personaId: s.personaId,
      title: s.title,
      status: s.status,
      refreshToken: s.refreshToken,
      expiresAt: s.expiresAt,
      userAgent: s.userAgent,
      ipAddress: s.ipAddress,
      modelId: s.modelId,
      aiModelId: s.aiModelId,
      modelOverride: s.modelOverride,
      tokensUsed: s.tokensUsed,
      cost: s.cost,
      contextTokens: s.contextTokens,
      lastActiveAt: s.lastActiveAt,
      endedAt: s.endedAt,
      createdAt: s.createdAt,
      updatedAt: s.updatedAt,
      persona: s.p_id ? {
        id: s.p_id,
        name: s.p_name,
        description: s.p_description,
        avatarUrl: s.p_avatarUrl,
      } : null,
      aiModel: s.m_id ? {
        id: s.m_id,
        displayName: s.m_displayName,
        provider: s.m_provider,
        modelIdentifier: s.m_modelIdentifier,
      } : null,
      _count: {
        messages: parseInt(msgCount[0]?.count || '0', 10),
      },
    };
  }

  static async updateSession(id: string, userId: string, data: UpdateSessionData) {
    // First verify ownership
    const sessions = await sql<SessionRow[]>`SELECT * FROM "Session" WHERE id = ${id} AND "userId" = ${userId}`;
    const session = sessions[0];

    if (!session) {
      throw {
        code: 'SESSION_NOT_FOUND',
        message: 'Session not found',
        statusCode: 404,
      };
    }

    const updateData: any = { ...data };
    if (data.status === 'ARCHIVED' || data.status === 'DELETED') {
      updateData.endedAt = new Date();
    }

    const updatedSessions = await sql<SessionRow[]>`
      UPDATE "Session" 
      SET "title" = ${updateData.title || session.title}, 
          "status" = ${updateData.status || session.status},
          "endedAt" = ${updateData.endedAt || null},
          "updatedAt" = NOW()
      WHERE id = ${id}
      RETURNING *
    `;

    const s = updatedSessions[0];

    // Get persona and aiModel info
    const personas = await sql<PersonaRow[]>`SELECT id, name, "avatarUrl" FROM "Persona" WHERE id = ${s.personaId}`;
    const aiModels = await sql<AIModelRow[]>`SELECT id, "displayName" FROM "AIModel" WHERE id = ${s.aiModelId}`;

    return {
      id: s.id,
      userId: s.userId,
      personaId: s.personaId,
      title: s.title,
      status: s.status,
      lastActiveAt: s.lastActiveAt,
      endedAt: s.endedAt,
      createdAt: s.createdAt,
      updatedAt: s.updatedAt,
      persona: personas[0] ? {
        id: personas[0].id,
        name: personas[0].name,
        avatarUrl: personas[0].avatarUrl,
      } : null,
      aiModel: aiModels[0] ? {
        id: aiModels[0].id,
        displayName: aiModels[0].displayName,
      } : null,
    };
  }

  static async deleteSession(id: string, userId: string) {
    // First verify ownership
    const sessions = await sql<SessionRow[]>`SELECT * FROM "Session" WHERE id = ${id} AND "userId" = ${userId}`;

    if (!sessions[0]) {
      throw {
        code: 'SESSION_NOT_FOUND',
        message: 'Session not found',
        statusCode: 404,
      };
    }

    await sql`
      UPDATE "Session" 
      SET status = 'DELETED', "endedAt" = NOW(), "updatedAt" = NOW()
      WHERE id = ${id}
    `;

    return { success: true };
  }

  static async updateSessionTokens(sessionId: string, inputTokens: number, outputTokens: number) {
    const totalTokens = inputTokens + outputTokens;
    
    await sql`
      UPDATE "Session" 
      SET "tokensUsed" = "tokensUsed" + ${totalTokens},
          "lastActiveAt" = NOW(),
          "updatedAt" = NOW()
      WHERE id = ${sessionId}
    `;
  }
}
