import { sql } from '../lib/db';

export interface CreateMessageData {
  sessionId: string;
  role: string;
  content: string;
  inputTokens: number;
  outputTokens: number;
  modelId?: string;
  userId?: string;
}

export interface MessageFilters {
  limit: number;
  offset: number;
}

interface MessageRow {
  id: string;
  sessionId: string;
  role: string;
  content: string;
  inputTokens: number;
  outputTokens: number;
  modelId: string | null;
  cost: number;
  createdAt: Date;
}

interface SessionRow {
  id: string;
  userId: string;
  personaId: string;
  title: string | null;
  status: string;
  tokensUsed: number;
}

export class MessageService {
  static async createMessage(data: CreateMessageData) {
    const totalTokens = data.inputTokens + data.outputTokens;

    // Verify session belongs to user if userId is provided
    if (data.userId) {
      const sessions = await sql<SessionRow[]>`
        SELECT * FROM "Session" WHERE id = ${data.sessionId} AND "userId" = ${data.userId}
      `;

      if (!sessions[0]) {
        throw {
          code: 'SESSION_NOT_FOUND',
          message: 'Session not found',
          statusCode: 404,
        };
      }
    }

    const result = await sql<MessageRow[]>`
      INSERT INTO "Message" ("sessionId", role, content, "inputTokens", "outputTokens", "modelId")
      VALUES (${data.sessionId}, ${data.role}, ${data.content}, ${data.inputTokens}, ${data.outputTokens}, ${data.modelId || null})
      RETURNING *
    `;

    const message = result[0];

    // Update session
    await sql`
      UPDATE "Session" 
      SET "lastActiveAt" = NOW(), 
          "tokensUsed" = "tokensUsed" + ${totalTokens},
          "updatedAt" = NOW()
      WHERE id = ${data.sessionId}
    `;

    return message;
  }

  static async getSessionMessages(sessionId: string, userId: string, filters: MessageFilters) {
    // Verify session belongs to user
    const sessions = await sql<SessionRow[]>`
      SELECT * FROM "Session" WHERE id = ${sessionId} AND "userId" = ${userId}
    `;

    if (!sessions[0]) {
      throw {
        code: 'SESSION_NOT_FOUND',
        message: 'Session not found',
        statusCode: 404,
      };
    }

    // Get messages
    const messages = await sql<MessageRow[]>`
      SELECT * FROM "Message" 
      WHERE "sessionId" = ${sessionId}
      ORDER BY "createdAt" ASC
      LIMIT ${filters.limit} OFFSET ${filters.offset}
    `;

    // Get total count
    const countResult = await sql<{ count: string }[]>`SELECT COUNT(*) as count FROM "Message" WHERE "sessionId" = ${sessionId}`;
    const total = parseInt(countResult[0]?.count || '0', 10);

    return {
      messages,
      total,
      limit: filters.limit,
      offset: filters.offset,
    };
  }

  static async getMessageById(id: string, sessionId: string, userId: string) {
    // Verify session belongs to user
    const sessions = await sql<SessionRow[]>`
      SELECT * FROM "Session" WHERE id = ${sessionId} AND "userId" = ${userId}
    `;

    if (!sessions[0]) {
      throw {
        code: 'SESSION_NOT_FOUND',
        message: 'Session not found',
        statusCode: 404,
      };
    }

    const messages = await sql<MessageRow[]>`
      SELECT * FROM "Message" WHERE id = ${id} AND "sessionId" = ${sessionId}
    `;

    if (!messages[0]) {
      throw {
        code: 'MESSAGE_NOT_FOUND',
        message: 'Message not found',
        statusCode: 404,
      };
    }

    return messages[0];
  }

  static async getSessionTokenUsage(sessionId: string, userId: string) {
    // Verify session belongs to user
    const sessions = await sql<SessionRow[]>`
      SELECT s.*, 
             m."inputTokens" as "m_inputTokens", m."outputTokens" as "m_outputTokens"
      FROM "Session" s
      LEFT JOIN "Message" m ON m."sessionId" = s.id
      WHERE s.id = ${sessionId} AND s."userId" = ${userId}
    `;

    if (!sessions[0]) {
      throw {
        code: 'SESSION_NOT_FOUND',
        message: 'Session not found',
        statusCode: 404,
      };
    }

    const session = sessions[0];

    // Get all messages for the session
    const messages = await sql<{ inputTokens: number; outputTokens: number }[]>`
      SELECT "inputTokens", "outputTokens" FROM "Message" WHERE "sessionId" = ${sessionId}
    `;

    const tokenUsage = messages.reduce(
      (acc, message) => ({
        inputTokens: acc.inputTokens + message.inputTokens,
        outputTokens: acc.outputTokens + message.outputTokens,
      }),
      { inputTokens: 0, outputTokens: 0 }
    );

    return {
      sessionTokens: session.tokensUsed,
      messageTokens: tokenUsage,
      messageCount: messages.length,
    };
  }

  static async updateMessageTokens(
    messageId: string,
    inputTokens: number,
    outputTokens: number
  ) {
    const totalTokens = inputTokens + outputTokens;

    // Get the message first to find sessionId
    const messages = await sql<MessageRow[]>`SELECT * FROM "Message" WHERE id = ${messageId}`;
    const message = messages[0];

    if (!message) {
      throw {
        code: 'MESSAGE_NOT_FOUND',
        message: 'Message not found',
        statusCode: 404,
      };
    }

    // Update message
    const result = await sql<MessageRow[]>`
      UPDATE "Message" 
      SET "inputTokens" = ${inputTokens}, "outputTokens" = ${outputTokens}
      WHERE id = ${messageId}
      RETURNING *
    `;

    // Update session token count
    await sql`
      UPDATE "Session" 
      SET "tokensUsed" = "tokensUsed" + ${totalTokens},
          "updatedAt" = NOW()
      WHERE id = ${message.sessionId}
    `;

    return result[0];
  }
}
