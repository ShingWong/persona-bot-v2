# Persona-Bot v2 Project Documentation

## 📁 Document Structure

### Active Documentation (Read These):
- **`PROJECT-DOCS.md`** - This file: Current project status and guidelines
- **`docs/project-planning/master-plan.md`** - 30-week master development plan
- **`docs/build-system-design.md`** - Build system architecture
- **`docs/frontend-test-agent.md`** - Frontend testing strategy
- **`docs/templates/`** - API and deployment templates
- **`.orchestration/`** - Task orchestration and build tracking

### Archived Documentation (Avoid Unless Necessary):
- **`.old-docs/`** - Old build plans and deprecated documentation
  - `start-build.md` - Original build plan (superseded)
  - `revised-build-plan.md` - Intermediate revised plan (superseded)

### Skills Documentation:
- **`skills/`** - AI skill implementations and patterns
  - `progressive_disclosure/` - 3-tier context loading
  - `ace_project_manager/` - Generate → Reflect → Curate loops
  - `persona_prompt_engineering/` - Persona design patterns
  - `mcp_server_developer/` - MCP server development
  - `voice_ai/` - Speech-to-text/text-to-speech integration

## 🚀 Current Build Status

### ⚠️ MAJOR CHANGE: Prisma → postgres.js
**Date**: March 12, 2026

The project has migrated from **Prisma ORM** to **postgres.js** for the following reasons:
1. **Prisma 7 breaking changes** - Schema validation and migration issues
2. **Better pgvector support** - Direct SQL access for vector operations
3. **Simpler schema management** - No ORM abstraction layer
4. **Better scaling** - Direct connection pooling, more control

### Stage 0: Foundation (COMPLETED ✅)
**Goal**: Local development environment ready

#### Completed Tasks:
- **S0.1**: Project structure created (frontend/backend separation)
- **S0.2**: PostgreSQL + pgvector database configured
- **S0.6**: Database layer configured (postgres.js)

#### Database Status:
- PostgreSQL running on port 5434 with pgvector extension
- Database `personabot` - tables managed via postgres.js
- Direct SQL access for all operations
- Supports pgvector for semantic search (Phase 4+)

#### Backend Status:
- Express.js + TypeScript setup complete
- Using **postgres.js** for database operations (no ORM)
- Server runs on port 3001
- Health endpoint available at `/health`
- Authentication system fully implemented

#### Frontend Status:
- Next.js 15 + TypeScript + Tailwind setup complete
- App Router structure created
- Server runs on port 6080
- Authentication UI fully implemented

### Phase 1: Local Authentication System (COMPLETED ✅)
**Goal**: Working authentication running locally

#### Backend Authentication:
- User registration, login, logout endpoints
- JWT tokens with refresh tokens
- Password hashing with bcrypt
- Auth middleware for protected routes
- Session management
- Tested and working

#### Frontend Authentication:
- Login page at `/auth/login`
- Register page at `/auth/register`
- API client with token handling
- Zustand auth state management
- Protected route component
- Form validation with Zod
- Tested end-to-end flow

#### Test Credentials:
- Admin: `admin@personabot.com` / `AdminPassword123!`
- Test user: `test@personabot.com` / `TestPassword123!`
- Demo user: `demo@example.com` / `Demo123!` (can register)

## 🔧 Build Strategy

### Local Development First
**Principle**: Get code working locally before containerizing

#### Current Focus:
1. **Backend local server**: `cd backend && npm run dev`
2. **Frontend local server**: `cd frontend && npm run dev`
3. **Database**: Running in container (acceptable for local dev)

#### Docker Strategy:
- **Database**: Already containerized (PostgreSQL + pgvector)
- **Backend/Frontend**: Will be containerized AFTER local code works
- **Reason**: Easier debugging, faster iteration

### Build Loop Pattern
1. **Orchestrator**: Manages parallel subagents
2. **Subagents**: Execute specific tasks (backend, frontend, database, testing)
3. **Progressive Disclosure**: Load context in 3 tiers as needed
4. **ACE Pattern**: Generate → Reflect → Curate loops

## 📋 Next Development Phase

### Phase 2: Persona Management & Basic Chat (Week 3-4)
**Goal**: Working persona management and basic chat interface

#### Backend Tasks:
1. **Persona CRUD API**: Create/read/update/delete personas
2. **Session management**: Create chat sessions, store messages
3. **Basic LLM integration**: OpenAI integration first
4. **Chat API**: Send messages to persona, stream responses

#### Frontend Tasks:
1. **Persona management UI**: List, create, edit personas
2. **Chat interface**: Message list, input box, persona selector
3. **Session list**: View past sessions, continue sessions
4. **Model configuration**: Set model overrides per persona

### Success Criteria:
- Users can create and manage personas
- Basic chat interface works with personas
- Messages are stored and retrievable
- Persona-specific model overrides work

### Phase 3: LLM Integration & Advanced Features (Week 5-6)
**Goal**: Full LLM support and advanced persona features

#### Backend Tasks:
1. **LLM provider abstraction**: OpenAI, Anthropic, Gemini, OpenRouter, Ollama
2. **Advanced persona features**: Tool definitions, memory system
3. **Usage tracking**: Token counting, cost estimation

#### Frontend Tasks:
1. **Model configuration UI**: Add/remove LLM providers
2. **Advanced chat features**: Tool calling, context management
3. **Admin dashboard**: User management, usage analytics

## 🛠️ Development Commands

### Database (postgres.js - no migrations needed):
```bash
# Start PostgreSQL + pgvector
podman-compose up -d postgres

# Database auto-initializes on backend start
# Tables created via src/lib/init-db.ts
```

### Backend:
```bash
# Install dependencies
cd backend && npm install

# Start development server
cd backend && npm run dev

# Run tests
cd backend && npm test

# Build for production
cd backend && npm run build
```

### Frontend:
```bash
# Install dependencies
cd frontend && npm install

# Start development server
cd frontend && npm run dev

# Build for production
cd frontend && npm run build
```

## ⚠️ Important Notes

### Documentation Guidelines:
1. **DO NOT READ** `.old-docs/` unless absolutely necessary
2. **REFER TO** `docs/project-planning/master-plan.md` for overall timeline
3. **USE** `.orchestration/` for current task tracking
4. **FOLLOW** Progressive Disclosure patterns from `skills/`

### Build Agent Instructions:
1. **Focus on local development** first
2. **Test each component** before integration
3. **Use subagents** for parallel work
4. **Apply ACE patterns**: Generate → Reflect → Curate
5. **Document decisions** in `.orchestration/outputs/`

### Code Quality Standards:
1. **TypeScript** strict mode enabled
2. **ESLint** configured for code quality
3. **Prettier** for code formatting
4. **Modular architecture** with clear separation
5. **Comprehensive testing** with Jest/Vitest

## 🔗 Related Resources

### Project Planning:
- `docs/project-planning/master-plan.md` - 30-week development plan
- Stage 0-9 breakdown with dependencies

### Architecture:
- `docs/build-system-design.md` - Build system architecture
- `skills/progressive_disclosure/` - Context management patterns

### Testing:
- `docs/frontend-test-agent.md` - Frontend testing strategy
- Backend testing patterns in `backend/tests/`

## 📞 Getting Help

### For Build Agents:
1. Check `.orchestration/status/` for current task status
2. Review `PROJECT-DOCS.md` for current guidelines
3. Refer to `skills/` for implementation patterns
4. Use Progressive Disclosure: Load only needed context

### For Project Understanding:
1. Read `docs/project-planning/master-plan.md` for overall vision
2. Check `.orchestration/outputs/` for implementation details
3. Examine existing code structure for patterns

---

**Last Updated**: 2026-03-11  
**Current Phase**: Stage 0 Complete, Starting Phase 1  
**Build Strategy**: Local Development First  
**Next Goal**: Local Authentication System