import request from 'supertest';
import { prisma } from '../src/lib/prisma';
import { app } from '../src/index';

describe('Session API', () => {
  let authToken: string;
  let userId: string;
  let testPersonaId: string;
  let testAIModelId: string;

  beforeAll(async () => {
    await prisma.$connect();
    
    const user = await prisma.user.create({
      data: {
        email: 'test-session@example.com',
        passwordHash: 'hashed_password',
        name: 'Test User',
      },
    });
    userId = user.id;

    const persona = await prisma.persona.create({
      data: {
        name: 'Test Persona',
        identity: 'A test persona',
      },
    });
    testPersonaId = persona.id;

    const aiModel = await prisma.aIModel.create({
      data: {
        provider: 'openai',
        modelIdentifier: 'gpt-4',
        displayName: 'GPT-4',
      },
    });
    testAIModelId = aiModel.id;

    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'test-session@example.com',
        password: 'password123',
      });

    authToken = loginResponse.body.data.accessToken;
  });

  afterAll(async () => {
    await prisma.message.deleteMany({});
    await prisma.session.deleteMany({});
    await prisma.persona.deleteMany({});
    await prisma.aIModel.deleteMany({});
    await prisma.user.deleteMany({});
    await prisma.$disconnect();
  });

  describe('POST /api/sessions', () => {
    it('should create a new session', async () => {
      const response = await request(app)
        .post('/api/sessions')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Test Session',
          personaId: testPersonaId,
          aiModelId: testAIModelId,
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data.title).toBe('Test Session');
      expect(response.body.data.persona).toBeDefined();
      expect(response.body.data.aiModel).toBeDefined();
    });

    it('should create a session with minimal data', async () => {
      const response = await request(app)
        .post('/api/sessions')
        .set('Authorization', `Bearer ${authToken}`)
        .send({});

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.title).toBe('New Chat');
    });

    it('should reject unauthorized requests', async () => {
      const response = await request(app)
        .post('/api/sessions')
        .send({
          title: 'Test Session',
        });

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/sessions', () => {
    beforeEach(async () => {
      await prisma.session.create({
        data: {
          userId,
          title: 'Test Session for List',
          status: 'ACTIVE',
        },
      });
    });

    afterEach(async () => {
      await prisma.session.deleteMany({
        where: { userId },
      });
    });

    it('should list user sessions', async () => {
      const response = await request(app)
        .get('/api/sessions')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('sessions');
      expect(response.body.data).toHaveProperty('total');
      expect(Array.isArray(response.body.data.sessions)).toBe(true);
    });

    it('should filter sessions by status', async () => {
      await prisma.session.create({
        data: {
          userId,
          title: 'Archived Session',
          status: 'ARCHIVED',
        },
      });

      const response = await request(app)
        .get('/api/sessions?status=ARCHIVED')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.sessions.every((s: any) => s.status === 'ARCHIVED')).toBe(true);
    });

    it('should paginate sessions', async () => {
      for (let i = 0; i < 5; i++) {
        await prisma.session.create({
          data: {
            userId,
            title: `Session ${i}`,
            status: 'ACTIVE',
          },
        });
      }

      const response = await request(app)
        .get('/api/sessions?limit=2&offset=1')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.sessions).toHaveLength(2);
      expect(response.body.data.limit).toBe(2);
      expect(response.body.data.offset).toBe(1);
    });
  });

  describe('GET /api/sessions/:id', () => {
    let sessionId: string;

    beforeEach(async () => {
      const session = await prisma.session.create({
        data: {
          userId,
          title: 'Test Session Details',
          personaId: testPersonaId,
        },
      });
      sessionId = session.id;
    });

    afterEach(async () => {
      await prisma.session.deleteMany({
        where: { userId },
      });
    });

    it('should get session by id', async () => {
      const response = await request(app)
        .get(`/api/sessions/${sessionId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(sessionId);
      expect(response.body.data.title).toBe('Test Session Details');
      expect(response.body.data.persona).toBeDefined();
    });

    it('should return 404 for non-existent session', async () => {
      const response = await request(app)
        .get('/api/sessions/nonexistent')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });

    it('should not allow accessing other users sessions', async () => {
      const otherUser = await prisma.user.create({
        data: {
          email: 'other@example.com',
          passwordHash: 'hashed_password',
          name: 'Other User',
        },
      });

      const otherSession = await prisma.session.create({
        data: {
          userId: otherUser.id,
          title: 'Other User Session',
        },
      });

      const response = await request(app)
        .get(`/api/sessions/${otherSession.id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);

      await prisma.user.delete({ where: { id: otherUser.id } });
    });
  });

  describe('PUT /api/sessions/:id', () => {
    let sessionId: string;

    beforeEach(async () => {
      const session = await prisma.session.create({
        data: {
          userId,
          title: 'Session to Update',
          status: 'ACTIVE',
        },
      });
      sessionId = session.id;
    });

    afterEach(async () => {
      await prisma.session.deleteMany({
        where: { userId },
      });
    });

    it('should update session title', async () => {
      const response = await request(app)
        .put(`/api/sessions/${sessionId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Updated Title',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.title).toBe('Updated Title');
    });

    it('should archive session', async () => {
      const response = await request(app)
        .put(`/api/sessions/${sessionId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          status: 'ARCHIVED',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('ARCHIVED');
      expect(response.body.data.endedAt).toBeDefined();
    });

    it('should return 404 for non-existent session', async () => {
      const response = await request(app)
        .put('/api/sessions/nonexistent')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Updated',
        });

      expect(response.status).toBe(404);
    });
  });

  describe('DELETE /api/sessions/:id', () => {
    let sessionId: string;

    beforeEach(async () => {
      const session = await prisma.session.create({
        data: {
          userId,
          title: 'Session to Delete',
          status: 'ACTIVE',
        },
      });
      sessionId = session.id;
    });

    afterEach(async () => {
      await prisma.session.deleteMany({
        where: { userId },
      });
    });

    it('should soft delete session', async () => {
      const response = await request(app)
        .delete(`/api/sessions/${sessionId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      const deletedSession = await prisma.session.findUnique({
        where: { id: sessionId },
      });

      expect(deletedSession?.status).toBe('DELETED');
      expect(deletedSession?.endedAt).toBeDefined();
    });

    it('should return 404 for non-existent session', async () => {
      const response = await request(app)
        .delete('/api/sessions/nonexistent')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
    });
  });
});

describe('Message API', () => {
  let authToken: string;
  let userId: string;
  let sessionId: string;
  let testAIModelId: string;

  beforeAll(async () => {
    await prisma.$connect();
    
    const user = await prisma.user.create({
      data: {
        email: 'test-message@example.com',
        passwordHash: 'hashed_password',
        name: 'Test User',
      },
    });
    userId = user.id;

    const aiModel = await prisma.aIModel.create({
      data: {
        provider: 'openai',
        modelIdentifier: 'gpt-4',
        displayName: 'GPT-4',
      },
    });
    testAIModelId = aiModel.id;

    const session = await prisma.session.create({
      data: {
        userId,
        title: 'Test Session for Messages',
      },
    });
    sessionId = session.id;

    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'test-message@example.com',
        password: 'password123',
      });

    authToken = loginResponse.body.data.accessToken;
  });

  afterAll(async () => {
    await prisma.message.deleteMany({});
    await prisma.session.deleteMany({});
    await prisma.aIModel.deleteMany({});
    await prisma.user.deleteMany({});
    await prisma.$disconnect();
  });

  describe('POST /api/sessions/:id/messages', () => {
    it('should create a new message', async () => {
      const response = await request(app)
        .post(`/api/sessions/${sessionId}/messages`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          role: 'USER',
          content: 'Hello, world!',
          inputTokens: 5,
          outputTokens: 0,
          modelId: testAIModelId,
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data.role).toBe('USER');
      expect(response.body.data.content).toBe('Hello, world!');
      expect(response.body.data.totalTokens).toBe(5);
    });

    it('should create assistant message', async () => {
      const response = await request(app)
        .post(`/api/sessions/${sessionId}/messages`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          role: 'ASSISTANT',
          content: 'Hello! How can I help you?',
          inputTokens: 0,
          outputTokens: 8,
          modelUsed: 'gpt-4',
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.role).toBe('ASSISTANT');
      expect(response.body.data.totalTokens).toBe(8);
    });

    it('should update session token count', async () => {
      const beforeSession = await prisma.session.findUnique({
        where: { id: sessionId },
      });

      await request(app)
        .post(`/api/sessions/${sessionId}/messages`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          role: 'USER',
          content: 'Test message',
          inputTokens: 10,
          outputTokens: 0,
        });

      const afterSession = await prisma.session.findUnique({
        where: { id: sessionId },
      });

      expect(afterSession?.tokensUsed).toBe((beforeSession?.tokensUsed || 0) + 10);
    });

    it('should reject invalid message data', async () => {
      const response = await request(app)
        .post(`/api/sessions/${sessionId}/messages`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          role: 'INVALID_ROLE',
          content: '',
        });

      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/sessions/:id/messages', () => {
    beforeEach(async () => {
      await prisma.message.deleteMany({
        where: { sessionId },
      });

      for (let i = 0; i < 5; i++) {
        await prisma.message.create({
          data: {
            sessionId,
            role: i % 2 === 0 ? 'USER' : 'ASSISTANT',
            content: `Message ${i}`,
            inputTokens: 5,
            outputTokens: 5,
            totalTokens: 10,
          },
        });
      }
    });

    it('should list session messages', async () => {
      const response = await request(app)
        .get(`/api/sessions/${sessionId}/messages`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('messages');
      expect(response.body.data).toHaveProperty('total');
      expect(response.body.data.messages).toHaveLength(5);
    });

    it('should paginate messages', async () => {
      const response = await request(app)
        .get(`/api/sessions/${sessionId}/messages?limit=2&offset=1`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.messages).toHaveLength(2);
      expect(response.body.data.limit).toBe(2);
      expect(response.body.data.offset).toBe(1);
    });

    it('should return 404 for non-existent session', async () => {
      const response = await request(app)
        .get('/api/sessions/nonexistent/messages')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
    });
  });

  describe('GET /api/sessions/:id/messages/usage/tokens', () => {
    beforeEach(async () => {
      await prisma.message.deleteMany({
        where: { sessionId },
      });

      await prisma.message.createMany({
        data: [
          {
            sessionId,
            role: 'USER',
            content: 'Message 1',
            inputTokens: 10,
            outputTokens: 0,
            totalTokens: 10,
          },
          {
            sessionId,
            role: 'ASSISTANT',
            content: 'Response 1',
            inputTokens: 0,
            outputTokens: 20,
            totalTokens: 20,
          },
        ],
      });
    });

    it('should get token usage', async () => {
      const response = await request(app)
        .get(`/api/sessions/${sessionId}/messages/usage/tokens`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('sessionTokens');
      expect(response.body.data).toHaveProperty('messageTokens');
      expect(response.body.data.messageTokens.inputTokens).toBe(10);
      expect(response.body.data.messageTokens.outputTokens).toBe(20);
      expect(response.body.data.messageTokens.totalTokens).toBe(30);
      expect(response.body.data.messageCount).toBe(2);
    });
  });
});