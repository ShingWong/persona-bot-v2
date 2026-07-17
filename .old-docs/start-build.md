# Persona-Bot v2: Build Start Guide

## Project Context

### Overview
**New Project**: `/usr/local/devel/persona-bot-v2/`  
**Goal**: Rebuild persona-bot from scratch with lessons learned, creating a comprehensive multi-persona AI assistant platform

### Key Requirements
1. **Multi-persona AI assistants** (Jane router, Yoda Toyota expert, Bobby IT support)
2. **Voice-enabled mobile + desktop interfaces**
3. **Real-world integrations** (cloud storage, email, calendar, SMS via MCP)
4. **Commercial-grade backend** (RBAC, logging, auditing, billing-ready)
5. **Containerized deployment** (Docker/Podman + HAProxy for SSL)

### Architecture Decisions
- **Backend**: Express.js + TypeScript + Prisma + PostgreSQL (with pgvector)
- **Frontend**: Next.js 14 (App Router) + TypeScript + Tailwind
- **Auth**: JWT with refresh tokens, bcrypt password hashing
- **LLM Support**: Global defaults + per-persona overrides (OpenAI, Anthropic, Gemini, OpenRouter, Ollama)
- **Patterns**: Progressive Disclosure (3-tier context), ACE (Generate→Reflect→Curate), Entity-Centric Memory

## Build Strategy: Option A (MVP First)

### Phase 1: Foundation + Core Auth (Week 1-2)
**Goal**: Working authentication system with basic UI

#### Backend Tasks:
1. **Initialize backend** (`package.json`, `tsconfig.json`, dependencies)
2. **Set up Express server** with middleware (CORS, helmet, rate limiting)
3. **Implement authentication**:
   - User model (Prisma schema already defined)
   - JWT token generation/validation
   - Login/register/logout endpoints
   - Password reset flow (basic)
4. **Basic user management**:
   - Get user profile
   - Update profile
   - Role-based access (admin/user)

#### Frontend Tasks:
1. **Initialize frontend** (`package.json`, `tsconfig.json`, dependencies)
2. **Create authentication pages**:
   - Login page (`/auth/login`)
   - Register page (`/auth/register`)
   - Forgot password flow
3. **Create dashboard** (`/dashboard`):
   - Welcome message
   - Basic stats (sessions, personas)
   - Navigation to core features
4. **Set up state management** (Zustand) for auth/user state
5. **Configure API client** with token handling

#### Database Tasks:
1. **Run Prisma migrations** (schema already defined)
2. **Seed database** with:
   - Admin user: `admin@personabot.com` / `AdminPassword123!`
   - Test user: `test@personabot.com` / `TestPassword123!`
   - Default personas (Jane router, Yoda Toyota expert)

### Phase 2: Persona System + Basic Chat (Week 3-4)
**Goal**: Working persona management and basic chat interface

#### Backend Tasks:
1. **Persona CRUD API**:
   - Create/read/update/delete personas
   - Persona model includes: identity, constraints, model overrides
2. **Session management**:
   - Create chat sessions
   - Store messages
   - Track token usage
3. **Basic LLM integration**:
   - OpenAI integration first (simplest)
   - Per-persona model override support
4. **Chat API**:
   - Send message to persona
   - Stream responses
   - Store conversation

#### Frontend Tasks:
1. **Persona management UI**:
   - List personas (`/personas`)
   - Create/edit persona (`/personas/create`, `/personas/[id]/edit`)
   - Set model overrides per persona
2. **Chat interface** (`/sessions/[id]`):
   - Message list
   - Input box
   - Persona selector
   - Streaming responses
3. **Session list** (`/sessions`):
   - View past sessions
   - Continue sessions
   - Delete sessions

### Phase 3: LLM Integration + Advanced Features (Week 5-6)
**Goal**: Full LLM support and advanced persona features

#### Backend Tasks:
1. **LLM provider abstraction**:
   - Support OpenAI, Anthropic, Gemini, OpenRouter
   - Local LLM support (Ollama)
   - Model discovery/configuration
2. **Advanced persona features**:
   - Tool definitions per persona
   - Memory system (entity-centric)
   - Context management (Progressive Disclosure)
3. **Usage tracking**:
   - Token counting per user
   - Cost estimation
   - Rate limiting

#### Frontend Tasks:
1. **Model configuration UI** (`/settings/ai-model`):
   - Add/remove LLM providers
   - Configure API keys
   - Set global defaults
2. **Advanced chat features**:
   - Tool calling UI
   - Context management
   - Memory visualization
3. **Admin dashboard** (`/admin`):
   - User management
   - Usage analytics
   - System settings

## Starting Point: Current State

### What Exists (Template):
```
/usr/local/devel/persona-bot-v2/
├── backend/
│   ├── Dockerfile                    # Multi-stage build
│   ├── prisma/schema.prisma         # Complete schema (User, Persona, Session, AIModel, etc.)
│   └── src/                         # Empty directories (api/, middleware/, etc.)
├── frontend/
│   ├── Dockerfile                    # Next.js multi-stage build
│   └── app/                         # Empty Next.js app directory
├── docker-compose.yml               # Full service orchestration
├── configs/
│   ├── .env.example                 # Complete environment template
│   └── haproxy.cfg                  # SSL termination config
├── docs/
│   ├── project-planning/master-plan.md  # 9-stage, 30-week plan
│   └── templates/                   # API, deployment templates
└── skills/                          # 10+ AI skills with Progressive Disclosure
```

### What's Missing (To Build):
1. **Backend code**: Express server, routes, services, utilities
2. **Frontend code**: Next.js pages, components, stores, libs
3. **Package.json files**: Dependencies for both backend and frontend
4. **Implementation**: All business logic and UI

## First Build Steps (Today)

### Step 1: Initialize Backend
```bash
cd /usr/local/devel/persona-bot-v2/backend
# Create package.json with dependencies:
# - express, cors, helmet, bcrypt, jsonwebtoken, prisma, zod, etc.
# - TypeScript, ts-node, nodemon, jest for dev
npm init -y
# Install dependencies
npm install express cors helmet bcrypt jsonwebtoken @prisma/client zod dotenv
npm install -D typescript @types/node @types/express ts-node nodemon jest @types/jest
# Initialize TypeScript
npx tsc --init
# Generate Prisma client
npx prisma generate
```

### Step 2: Create Basic Express Server
```typescript
// src/index.ts
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { config } from './core/config';
import { errorHandler } from './middleware/errorHandler';
import { authRoutes } from './api/auth';
import { userRoutes } from './api/users';

const app = express();
app.use(helmet());
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use(errorHandler);

app.listen(config.PORT, () => {
  console.log(`Server running on port ${config.PORT}`);
});
```

### Step 3: Initialize Frontend
```bash
cd /usr/local/devel/persona-bot-v2/frontend
# Create Next.js app
npx create-next-app@latest . --typescript --tailwind --app --no-eslint
# Install additional dependencies
npm install zustand axios lucide-react
npm install -D @types/node
```

### Step 4: Create Basic Authentication Flow
1. **Backend**: Implement `/api/auth/login`, `/api/auth/register`, JWT middleware
2. **Frontend**: Create login/register pages with API integration
3. **Database**: Run migrations and seed with test users

## Success Criteria for Phase 1

### Backend:
- ✅ Express server runs on port 6081
- ✅ Database migrations applied
- ✅ Users can register/login (JWT tokens)
- ✅ Admin/test users seeded
- ✅ Health endpoint works
- ✅ Basic error handling

### Frontend:
- ✅ Next.js dev server runs on port 6080
- ✅ Login/register pages functional
- ✅ JWT token stored in cookies
- ✅ Dashboard accessible after login
- ✅ Basic navigation working

### Docker:
- ✅ `docker-compose up` starts all services
- ✅ Frontend accessible at `http://localhost:6080`
- ✅ Backend API accessible at `http://localhost:6081`
- ✅ Database persists data

## Progressive Disclosure Implementation

As we build, apply the 3-tier context pattern:

### Tier 1 (Essential):
- Current task focus
- Immediate dependencies
- Critical constraints

### Tier 2 (Contextual):
- Related code patterns
- Architecture decisions
- Domain knowledge

### Tier 3 (Reference):
- Full documentation
- Examples
- Edge cases

## Next Session Instructions

When starting the build session:
1. **Review this document** for context
2. **Start with Step 1** (Initialize backend)
3. **Follow MVP approach** - build working auth first
4. **Use template files** as reference (schema.prisma, Dockerfiles, etc.)
5. **Apply Progressive Disclosure** - focus on one component at a time
6. **Test incrementally** - verify each component works

## Key Files to Reference

1. **Schema**: `/usr/local/devel/persona-bot-v2/backend/prisma/schema.prisma`
2. **Environment**: `/usr/local/devel/persona-bot-v2/configs/.env.example`
3. **Docker config**: `/usr/local/devel/persona-bot-v2/docker-compose.yml`
4. **Skills**: `/usr/local/devel/persona-bot-v2/skills/` for patterns

## Notes for Build Agent

- **Start simple**: Basic auth → persona management → chat → advanced features
- **Use existing patterns**: Follow schema structure, use template configs
- **Test with Docker**: Verify `docker-compose up` works at each stage
- **Document decisions**: Update this file with progress and changes
- **Ask for clarification**: If requirements are unclear, pause and ask

---

**Ready to start building Phase 1: Foundation + Core Auth**
