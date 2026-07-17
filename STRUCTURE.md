# Persona Bot v2 - Project Structure

## Overview
This document describes the project structure for persona-bot-v2, a multi-persona AI assistant platform.

## Quick Start

### Backend Development
```bash
cd backend
npm install
npm run dev
```

### Frontend Development
```bash
cd frontend
npm install
npm run dev
```

## Architecture

### Backend (Express.js + TypeScript)
- **Location**: `/backend/`
- **Framework**: Express.js with TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **API Style**: RESTful with potential GraphQL extension

### Frontend (Next.js 15 + App Router)
- **Location**: `/frontend/`
- **Framework**: Next.js 15 with App Router
- **Styling**: Tailwind CSS + shadcn/ui
- **State Management**: React hooks + server components

## Directory Details

### Backend Structure
```
backend/
├── src/
│   ├── api/           # API routes and controllers
│   ├── middleware/    # Authentication, validation, logging
│   ├── models/        # Data models, interfaces, DTOs
│   ├── services/      # Business logic, external integrations
│   └── utils/         # Helpers, constants, validators
├── config/            # Environment configurations
├── prisma/            # Database schema and migrations
├── tests/             # Unit and integration tests
└── [config files]     # package.json, tsconfig.json, etc.
```

### Frontend Structure
```
frontend/
├── app/               # Next.js App Router
│   ├── (auth)/        # Authentication routes
│   ├── dashboard/     # User dashboard
│   ├── admin/         # Admin interface
│   ├── personas/      # Persona management
│   ├── chat/          # Chat interface
│   ├── voice/         # Voice interface
│   ├── api/           # API routes (serverless)
│   ├── components/    # Page-specific components
│   ├── lib/           # Page-specific libraries
│   └── styles/        # Page-specific styles
├── components/        # Shared UI components
├── lib/               # Shared utilities and APIs
├── hooks/             # Custom React hooks
└── [config files]     # Next.js, Tailwind, etc.
```

## Development Workflow

### 1. Local Development
```bash
# Start backend
cd backend && npm run dev

# Start frontend (in another terminal)
cd frontend && npm run dev
```

### 2. Building for Production
```bash
# Build backend
cd backend && npm run build

# Build frontend
cd frontend && npm run build
```

### 3. Testing
```bash
# Backend tests
cd backend && npm test

# Frontend tests
cd frontend && npm test
```

## Configuration

### Environment Variables
- Backend: `.env` in `/backend/`
- Frontend: `.env.local` in `/frontend/`
- Shared: `/configs/` directory

### TypeScript Path Aliases
- Backend: `@/`, `@api/`, `@models/`, etc.
- Frontend: `@/`, `@components/`, `@lib/`, etc.

## Containerization

### Docker Setup
- Backend: `backend/Dockerfile`
- Frontend: `frontend/Dockerfile`
- Orchestration: `docker-compose.yml`

### Running with Docker
```bash
docker-compose up --build
```

## Progressive Disclosure Pattern

This project follows a 3-tier Progressive Disclosure pattern:

1. **Tier 1 (Essential)**: Core instructions, immediate task context
2. **Tier 2 (Contextual)**: Relevant background, domain knowledge  
3. **Tier 3 (Reference)**: Detailed documentation, examples, edge cases

See `/skills/progressive_disclosure/` for implementation details.

## Next Steps

Refer to `.orchestration/tasks/` for the complete development roadmap, starting with:
1. S0.2: Database setup
2. S0.3: Backend Docker configuration
3. S0.4: Frontend Docker configuration
4. S0.5: docker-compose orchestration

---

**Project Status**: Stage 0.1 Complete - Foundation Established
**Last Updated**: 2026-03-11