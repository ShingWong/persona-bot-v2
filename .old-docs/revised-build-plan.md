# Revised Build Plan: Local Development First

## Problem Identified
Original plan was building Docker containers too early, making debugging difficult. We should focus on local development first, then containerize working code.

## Revised Stage 0: Local Foundation

### Phase 1: Local Development Setup (Week 1)
**Goal**: Get backend and frontend running locally with hot reload

#### Backend Local Setup:
1. **Initialize Express server** with TypeScript
2. **Configure Prisma client** with local PostgreSQL
3. **Set up development scripts** (nodemon, ts-node)
4. **Create basic API routes** (health, test endpoints)
5. **Configure environment variables** for local dev

#### Frontend Local Setup:
1. **Initialize Next.js dev server**
2. **Configure API client** to connect to local backend
3. **Set up development scripts** (next dev)
4. **Create basic pages** (home, login placeholder)
5. **Configure Tailwind CSS** for development

#### Database Local Setup:
1. **Start PostgreSQL locally** (Docker OK for DB only)
2. **Run Prisma migrations**
3. **Seed database** with test data
4. **Test database connections**

### Phase 2: Core Authentication (Week 2)
**Goal**: Working authentication system running locally

#### Backend:
1. **Implement User model** with Prisma
2. **Create auth routes** (register, login, logout)
3. **Implement JWT tokens** with refresh
4. **Add password hashing** (bcrypt)
5. **Create auth middleware**

#### Frontend:
1. **Create auth pages** (login, register)
2. **Implement API client** with token handling
3. **Add auth state management** (Zustand)
4. **Create protected routes**

### Phase 3: Basic UI & Testing (Week 3)
**Goal**: Testable local application

#### Backend:
1. **Add unit tests** (Jest)
2. **Create API documentation**
3. **Add request validation** (Zod)
4. **Implement error handling**

#### Frontend:
1. **Create dashboard layout**
2. **Add basic components**
3. **Implement form validation**
4. **Add basic styling**

## Dockerization Strategy

### When to Dockerize:
1. **After Phase 3** - When we have working local code
2. **Before Stage 1** - Containerize for development consistency
3. **Production Docker** - Separate optimization later

### Docker Build Order:
1. **Database container** (already done - S0.2)
2. **Backend container** (after backend works locally)
3. **Frontend container** (after frontend works locally)
4. **docker-compose** (orchestrate all services)

## Current Status (Stage 0 Progress)

### ✅ Completed:
- S0.1: Project structure created
- S0.2: PostgreSQL + pgvector configured (Docker OK for DB)
- S0.6: Prisma schema fixed for Prisma 7

### ⚠️ Partially Done (needs local focus):
- S0.3: Backend Dockerfile created (delay build)
- S0.4: Frontend Dockerfile created (delay build)
- S0.5: docker-compose.yml updated (delay full orchestration)

### 🔄 Next Steps (Local First):

#### Immediate (Today):
1. **Backend local setup**:
   - Install dependencies: `cd backend && npm install`
   - Start dev server: `npm run dev`
   - Test Prisma connection

2. **Frontend local setup**:
   - Install dependencies: `cd frontend && npm install`
   - Start dev server: `npm run dev`
   - Test basic pages

3. **Database setup**:
   - Start PostgreSQL: `podman-compose up -d postgres`
   - Run migrations: `cd backend && npx prisma migrate dev`
   - Seed database

#### Short-term (This week):
1. **Implement basic Express server** with health endpoint
2. **Create Next.js landing page**
3. **Test local development workflow**
4. **Fix any environment issues**

## Build Loop Strategy

### Orchestrator Role:
1. **Monitor subagent progress**
2. **Coordinate parallel tasks**
3. **Run tests after each phase**
4. **Debug issues locally before containerizing**

### Subagent Allocation:
- **Backend Agent**: Local Express.js development
- **Frontend Agent**: Local Next.js development  
- **Database Agent**: PostgreSQL setup and migrations
- **Testing Agent**: Run tests and validate

### Progressive Disclosure:
- **Tier 1**: Current task focus
- **Tier 2**: Related code patterns
- **Tier 3**: Reference documentation (load as needed)

## Success Criteria for Local Setup

### Backend:
- ✅ Express server runs on `localhost:6081`
- ✅ Prisma connects to local PostgreSQL
- ✅ Health endpoint returns `{status: "ok"}`
- ✅ Hot reload works with `npm run dev`

### Frontend:
- ✅ Next.js runs on `localhost:6080`
- ✅ Pages load without errors
- ✅ API calls to backend work
- ✅ Hot reload works with `npm run dev`

### Database:
- ✅ PostgreSQL accessible on `localhost:5432`
- ✅ Prisma migrations applied
- ✅ Test data seeded
- ✅ pgvector extension loaded

## Risk Mitigation

### Local Development Risks:
1. **Environment issues**: Use `.env` files with examples
2. **Port conflicts**: Document port assignments
3. **Dependency conflicts**: Use exact versions in package.json
4. **Database connection**: Test connection early

### Debugging Strategy:
1. **Local logs**: Console output for debugging
2. **Error boundaries**: Catch and display errors
3. **Step-by-step validation**: Test each component
4. **Rollback capability**: Git commits at each milestone

## Next Actions

### 1. Start Backend Local Development:
```bash
cd /usr/local/devel/persona-bot-v2/backend
npm install
npm run dev
```

### 2. Start Frontend Local Development:
```bash
cd /usr/local/devel/persona-bot-v2/frontend  
npm install
npm run dev
```

### 3. Test Database Connection:
```bash
cd /usr/local/devel/persona-bot-v2
podman-compose up -d postgres
cd backend
npx prisma migrate dev
```

### 4. Launch Build Loop:
- Backend agent: Implement basic Express server
- Frontend agent: Create landing page
- Test agent: Validate local setup

---

**Updated**: 2026-03-11  
**Status**: Stage 0 foundation ready for local development  
**Next Phase**: Implement local backend and frontend servers