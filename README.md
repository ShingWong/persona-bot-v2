# Agentic Template

Reusable project template for building AI assistant platforms with multi-persona support, voice integration, and real-world connections.

## What's Included

### Backend Template
- **Express.js** REST API with TypeScript
- **Prisma** ORM with PostgreSQL + pgvector
- **JWT** authentication with refresh tokens
- **RBAC** (Role-Based Access Control)
- **Structured logging** (Winston/Pino)
- **API key management** with encryption
- **LLM abstraction layer** (OpenAI, Anthropic, Gemini, OpenRouter, Ollama)
- **MCP server infrastructure**

### Frontend Template
- **Next.js 14** (App Router)
- **TypeScript** throughout
- **Tailwind CSS** for styling
- **React Query** for data fetching
- **Authentication** flows (login, register, password reset)
- **Admin dashboards**
- **Chat interface** with persona switching

### Containerization
- **Docker/Podman** ready
- **docker-compose.yml** for local development
- **Production Dockerfiles** optimized for size and security
- **Multi-stage builds**

### Project Management
- **Progressive Disclosure** context pattern
- **ACE** (Agentic Context Engineering) workflow
- **Entity-Centric Memory** system
- **Semantic Dynamic Routing** engine

## Quick Start

```bash
# Clone and customize
cp -r agentic-template my-project
cd my-project

# Update project name in:
# - package.json
# - docker-compose.yml
# - prisma/schema.prisma

# Start local development
docker-compose up -d

# Run migrations
docker-compose exec backend npx prisma migrate dev
```

## Directory Structure

```
agentic-template/
├── .github/workflows/     # CI/CD pipelines
├── backend/             # Express.js API
│   └── src/
│       ├── api/         # Route handlers
│       ├── middleware/  # Auth, logging, validation
│       ├── models/      # Prisma models
│       ├── services/    # Business logic
│       └── utils/       # Helpers
├── frontend/           # Next.js app
├── containers/         # Database configs
├── scripts/           # Deployment scripts
├── configs/           # Configuration templates
├── skills/           # AI skill templates
└── docs/templates/   # Documentation templates
```

## Features

### Commercial-Grade Backend
- User & role management (admin, user, developer, billing_admin)
- Full audit logging
- API key management with encryption
- Usage tracking per user/persona
- Billing-ready architecture

### LLM Integration
- Global default model selection
- Per-persona model override
- Custom parameters (temperature, max_tokens)
- Support for: OpenAI, Anthropic, Gemini, OpenRouter, Ollama

### Persona System
- Multiple AI personas with unique prompts
- Semantic dynamic routing
- Entity-centric memory
- Context management via Progressive Disclosure

### Real-World Connections (MCP)
- Cloud storage (OneDrive, Google Drive, Nextcloud)
- Email (Gmail, SMTP)
- Calendar (Google, Outlook)
- SMS (VoIP.ms)

### Voice
- Speech-to-Text integration
- Text-to-Speech integration
- Mobile PWA support

## Skills

See `skills/` directory for AI skill templates:
- `progressive_disclosure/` - 3-tier context loading
- `ace_project_manager/` - Self-improving project management
- `entity_centric_memory/` - Entity tracking
- `semantic_dynamic_routing/` - Auto-routing
- `mcp_server_developer/` - MCP server builder
- `persona_prompt_engineering/` - Persona design
- `voice_ai/` - STT/TTS integration
- `real_world_integrations/` - External APIs

## Documentation

- [Master Project Plan](./docs/project-planning/master-plan.md)
- [API Documentation](./docs/templates/api-template.md)
- [Database Schema](./docs/templates/schema-template.md)
- [Deployment Guide](./docs/templates/deployment-template.md)

## Requirements

- Docker or Podman
- PostgreSQL 15+ with pgvector extension
- Node.js 20+ (for local development)

## License

MIT
