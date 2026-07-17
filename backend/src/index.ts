import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { sql } from './lib/db';
import initializeDatabase from './lib/init-db';
import { SessionService } from './services/session.service';
import { MessageService } from './services/message.service';
import { AuthService } from './services/auth.service';
import { authenticate } from './middleware/auth.middleware';
import adminRoutes from './api/admin/admin.routes';

// Type definitions for authenticated requests
interface AuthUser {
  userId: string;
  email: string;
  role: string;
}

// Helper to get user from request with type safety
function getAuthUser(req: any): AuthUser {
  const user = req.user;
  if (!user || !user.userId) {
    throw new Error('Authentication required');
  }
  
  // Ensure userId is a string, not an array
  const userId = Array.isArray(user.userId) ? user.userId[0] : user.userId;
  if (!userId || typeof userId !== 'string') {
    throw new Error('Authentication required');
  }
  
  return {
    userId,
    email: Array.isArray(user.email) ? user.email[0] : user.email,
    role: Array.isArray(user.role) ? user.role[0] : user.role,
  };
}

dotenv.config();

export const app = express();
const PORT = process.env.PORT || 6081;

app.use(helmet());
// Simple CORS configuration for development
const corsOptions = {
  origin: function (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) {
      return callback(null, true);
    }
    
    const allowedOrigins = [
      'http://localhost:6080',  // Frontend port
      'http://localhost:6081',  // Backend port (for direct API testing)
      'http://192.168.4.22',
      'http://192.168.4.22:6080',  // Frontend on network IP
      'http://192.168.4.22:6081',  // Backend on network IP
    ];
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      // In development, allow all origins for testing
      if (process.env.NODE_ENV !== 'production') {
        console.log(`Allowing origin in development: ${origin}`);
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    }
  },
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(morgan('combined'));

app.get('/health', async (_req, res) => {
  try {
    await sql`SELECT 1`;
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  } catch (error) {
    res.status(503).json({ status: 'error', message: 'Database unavailable' });
  }
});

app.post('/api/auth/register', async (req, res): Promise<void> => {
  try {
    const { email, password, name } = req.body;
    
    const result = await AuthService.register(email, password, name);
    
    res.status(201).json({
      data: {
        access_token: result.access_token,
        refresh_token: result.refresh_token,
        token_type: result.token_type,
        user: {
          id: result.user.id,
          email: result.user.email,
          name: result.user.name,
          role: result.user.role,
          is_active: true,
          email_verified: false,
          avatar_url: result.user.avatarUrl,
        },
      },
    });
  } catch (error: any) {
    console.error('Register error:', error);
    if (error.code === 'USER_EXISTS') {
      res.status(409).json({ error: error.message });
    } else {
      res.status(500).json({ error: error.message });
    }
  }
});

app.post('/api/auth/login', async (req, res): Promise<void> => {
  try {
    const { email, password } = req.body;
    
    const result = await AuthService.login(
      email,
      password,
      req.headers['user-agent'],
      req.ip
    );
    
    res.json({
      access_token: result.access_token,
      refresh_token: result.refresh_token,
      token_type: result.token_type,
      user: {
        id: result.user.id,
        email: result.user.email,
        name: result.user.name,
        role: result.user.role,
        is_active: true,
        email_verified: false,
        avatar_url: result.user.avatarUrl,
      },
    });
  } catch (error: any) {
    console.error('Login error:', error);
    if (error.code === 'INVALID_CREDENTIALS') {
      res.status(401).json({ error: error.message });
    } else {
      res.status(500).json({ error: error.message });
    }
  }
});

app.post('/api/auth/refresh', async (req, res): Promise<void> => {
  try {
    const { refreshToken } = req.body;
    
    if (!refreshToken) {
      res.status(400).json({ error: 'Refresh token is required' });
      return;
    }
    
    const result = await AuthService.refreshTokens(refreshToken);
    
    res.json({
      access_token: result.access_token,
      refresh_token: result.refresh_token,
      token_type: result.token_type,
      user: {
        id: result.user.id,
        email: result.user.email,
        name: result.user.name,
        role: result.user.role,
        is_active: true,
        email_verified: false,
        avatar_url: result.user.avatarUrl,
      },
    });
  } catch (error: any) {
    console.error('Refresh token error:', error);
    if (error.code === 'INVALID_REFRESH_TOKEN' || error.code === 'SESSION_EXPIRED') {
      res.status(401).json({ error: error.message });
    } else {
      res.status(500).json({ error: error.message });
    }
  }
});

app.post('/api/auth/logout', async (req, res): Promise<void> => {
  try {
    const { refreshToken } = req.body;
    
    if (!refreshToken) {
      res.status(400).json({ error: 'Refresh token is required' });
      return;
    }
    
    await AuthService.logout(refreshToken);
    
    res.json({ success: true });
  } catch (error: any) {
    console.error('Logout error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/auth/me', authenticate, async (req, res) => {
  try {
    const user = getAuthUser(req);
    
    res.json({
      data: {
        user: {
          id: user.userId,
          email: user.email,
          role: user.role,
          is_active: true,
          email_verified: false,
        },
      },
    });
  } catch (error: any) {
    console.error('Get current user error:', error);
    if (error.message === 'Authentication required') {
      res.status(401).json({ error: error.message });
    } else {
      res.status(500).json({ error: error.message });
    }
  }
});

app.get('/api/personas', authenticate, async (_req, res) => {
  try {
    const personas = await sql`SELECT * FROM "Persona" WHERE "isActive" = true`;
    res.json(personas);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Session APIs
app.post('/api/sessions', authenticate, async (req, res) => {
  try {
    const { personaId, title, aiModelId } = req.body;
    const user = getAuthUser(req);
    
    if (!personaId) {
      res.status(400).json({ error: 'personaId is required' });
      return;
    }
    
    const session = await SessionService.createSession({
      userId: user.userId,
      personaId,
      title,
      aiModelId,
      userAgent: Array.isArray(req.headers['user-agent']) ? req.headers['user-agent'][0] : req.headers['user-agent'],
      ipAddress: Array.isArray(req.ip) ? req.ip[0] : req.ip,
    });
    
    res.status(201).json(session);
  } catch (error: any) {
    console.error('Create session error:', error);
    if (error.message === 'Authentication required') {
      res.status(401).json({ error: error.message });
    } else {
      res.status(500).json({ error: error.message });
    }
  }
});

app.get('/api/sessions', authenticate, async (req, res) => {
  try {
    const statusParam = req.query.status;
    const status = typeof statusParam === 'string' ? statusParam : 
                   Array.isArray(statusParam) ? statusParam[0] as string : undefined;
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = parseInt(req.query.offset as string) || 0;
    const user = getAuthUser(req);
    
    const result = await SessionService.getUserSessions(user.userId, {
      status,
      limit,
      offset,
    });
    
    res.json(result);
  } catch (error: any) {
    console.error('Get sessions error:', error);
    if (error.message === 'Authentication required') {
      res.status(401).json({ error: error.message });
    } else {
      res.status(500).json({ error: error.message });
    }
  }
});

app.get('/api/sessions/:id', authenticate, async (req, res) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const user = getAuthUser(req);
    
    const session = await SessionService.getSessionById(id, user.userId);
    res.json(session);
  } catch (error: any) {
    console.error('Get session error:', error);
    if (error.message === 'Authentication required') {
      res.status(401).json({ error: error.message });
    } else if (error.statusCode === 404) {
      res.status(404).json({ error: error.message });
    } else {
      res.status(500).json({ error: error.message });
    }
  }
});

app.put('/api/sessions/:id', authenticate, async (req, res) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const { title, status } = req.body;
    const user = getAuthUser(req);
    
    const session = await SessionService.updateSession(id, user.userId, { title, status });
    res.json(session);
  } catch (error: any) {
    console.error('Update session error:', error);
    if (error.message === 'Authentication required') {
      res.status(401).json({ error: error.message });
    } else if (error.statusCode === 404) {
      res.status(404).json({ error: error.message });
    } else {
      res.status(500).json({ error: error.message });
    }
  }
});

app.delete('/api/sessions/:id', authenticate, async (req, res) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const user = getAuthUser(req);
    
    await SessionService.deleteSession(id, user.userId);
    res.json({ success: true });
  } catch (error: any) {
    console.error('Delete session error:', error);
    if (error.message === 'Authentication required') {
      res.status(401).json({ error: error.message });
    } else if (error.statusCode === 404) {
      res.status(404).json({ error: error.message });
    } else {
      res.status(500).json({ error: error.message });
    }
  }
});

// Message APIs
app.post('/api/messages', authenticate, async (req, res) => {
  try {
    const { sessionId, role, content, inputTokens = 0, outputTokens = 0, modelId } = req.body;
    const user = getAuthUser(req);
    
    if (!sessionId || !role || !content) {
      res.status(400).json({ error: 'sessionId, role, and content are required' });
      return;
    }
    
    const message = await MessageService.createMessage({
      sessionId,
      role,
      content,
      inputTokens,
      outputTokens,
      modelId,
      userId: user.userId,
    });
    
    res.status(201).json(message);
  } catch (error: any) {
    console.error('Create message error:', error);
    if (error.message === 'Authentication required') {
      res.status(401).json({ error: error.message });
    } else if (error.statusCode === 404) {
      res.status(404).json({ error: error.message });
    } else {
      res.status(500).json({ error: error.message });
    }
  }
});

app.get('/api/messages', authenticate, async (req, res) => {
  try {
    const sessionId = req.query.sessionId as string;
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;
    const user = getAuthUser(req);
    
    if (!sessionId) {
      res.status(400).json({ error: 'sessionId is required' });
      return;
    }
    
    const result = await MessageService.getSessionMessages(sessionId, user.userId, {
      limit,
      offset,
    });
    
    res.json(result);
  } catch (error: any) {
    console.error('Get messages error:', error);
    if (error.message === 'Authentication required') {
      res.status(401).json({ error: error.message });
    } else if (error.statusCode === 404) {
      res.status(404).json({ error: error.message });
    } else {
      res.status(500).json({ error: error.message });
    }
  }
});

// Mount admin routes
app.use('/api/admin', adminRoutes);

app.get('/api', (_req, res) => {
  res.json({ message: 'Persona Bot API' });
});

async function startServer() {
  try {
    await initializeDatabase();
    console.log('Database initialized');
    
    app.listen(PORT, () => {
      console.log(`🚀 Persona Bot Backend running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
