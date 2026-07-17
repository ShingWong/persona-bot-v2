# Persona-Bot Master Project Plan

## Project Overview

**Project Name**: persona-bot  
**Domain**: persona-bot.com  
**Goal**: Rebuild from scratch with lessons learned, creating a comprehensive multi-persona AI assistant platform

### Core Features
- Multi-persona AI assistants (Jane as router, Yoda for Toyota, Bobby for IT support, etc.)
- Voice-enabled mobile interface + desktop power interface
- Real-world integrations (cloud storage, email, calendar, SMS)
- Modular, extensible architecture with advanced AI patterns
- Commercial-grade backend (user/role management, logging, auditing, billing-ready)

### Technical Requirements
- **Containerization**: Podman/Docker deployment
- **Database**: PostgreSQL with pgvector for embeddings
- **LLM Support**: Global defaults + per-persona overrides
  - Local models (Gwen 3.5 9b) for simple routing
  - Cloud models (Gemini 3.1 Flash, GPT-4, Claude) for complex tasks

### Architecture Patterns
- Progressive Disclosure (3-tier context loading)
- ACE (Agentic Context Engineering): Generate → Reflect → Curate
- Entity-Centric Memory
- Semantic Dynamic Routing
- MCP servers for external integrations

---

## Development Stages

### Stage 0: Foundation (Weeks 1-2)
**Goal**: Project setup, containerization, basic architecture

#### Tasks
| ID | Task | Dependencies | Est. Hours |
|----|------|--------------|------------|
| S0.1 | Create project structure (frontend/backend分离) | - | 4 |
| S0.2 | Set up PostgreSQL + pgvector in Docker/Podman | S0.1 | 8 |
| S0.3 | Create base Dockerfile for backend (Node.js) | S0.1 | 4 |
| S0.4 | Create base Dockerfile for frontend (Next.js) | S0.1 | 4 |
| S0.5 | Set up docker-compose.yml for local dev | S0.2, S0.3, S0.4 | 8 |
| S0.6 | Configure Prisma schema with User, Role, Session models | S0.2 | 8 |
| S0.7 | Set up environment-based configuration | S0.1 | 4 |
| S0.8 | Create CI/CD pipeline (GitHub Actions) | S0.3, S0.4, S0.5 | 8 |

**Milestone**: Local development environment runs via `docker-compose up`

---

### Stage 1: Core Platform - User & Role Management (Weeks 3-4)
**Goal**: Commercial-grade user management and RBAC

#### Tasks
| ID | Task | Dependencies | Est. Hours |
|----|------|--------------|------------|
| S1.1 | User registration, authentication (JWT, bcrypt) | S0.6 | 12 |
| S1.2 | Password reset flow | S1.1 | 6 |
| S1.3 | Role-Based Access Control (RBAC) system | S1.1 | 16 |
| S1.4 | Predefined roles: admin, user, developer, billing_admin | S1.3 | 8 |
| S1.5 | Permission matrix implementation | S1.3 | 8 |
| S1.6 | Organization/tenant support (future scaling) | S1.3 | 12 |
| S1.7 | User profile management | S1.1 | 6 |

**Milestone**: Users can register, login, and have role-based permissions

---

### Stage 2: Core Platform - LLM Integration (Weeks 5-6)
**Goal**: LLM model management with global defaults + per-persona overrides

#### Tasks
| ID | Task | Dependencies | Est. Hours |
|----|------|--------------|------------|
| S2.1 | LLM provider abstraction layer | S0.6 | 16 |
| S2.2 | OpenAI integration | S2.1 | 8 |
| S2.3 | Anthropic (Claude) integration | S2.1 | 8 |
| S2.4 | Google Gemini integration | S2.1 | 8 |
| S2.5 | OpenRouter integration (unified API) | S2.1 | 8 |
| S2.6 | Local LLM support (Ollama/lm studio) | S2.1 | 8 |
| S2.7 | Global model selection UI (admin) | S1.3 | 8 |
| S2.8 | Per-persona model override system | S2.7 | 12 |
| S2.9 | Model parameters (temperature, max_tokens) per persona | S2.8 | 8 |
| S2.10 | Model usage tracking per user/persona | S2.8 | 8 |

**Milestone**: Admin can set global default model; each persona can override with custom model/parameters

#### Example Persona Model Configuration
| Persona | Use Case | Recommended Model |
|---------|----------|-------------------|
| Jane (router) | Simple routing, low reasoning | Local: Gwen 3.5 9b (fast, cheap) |
| Yoda (Toyota) | Domain knowledge, quick responses | Gemini 3.1 Flash |
| Bobby (IT) | Complex reasoning 3.5, code | Claude Sonnet |
| Custom | High reasoning, complex tasks | GPT-4o |

---

### Stage 3: Core Platform - Logging, Auditing & API Keys (Weeks 7-8)
**Goal**: Enterprise-grade logging, auditing, API key management

#### Tasks
| ID | Task | Dependencies | Est. Hours |
|----|------|--------------|------------|
| S3.1 | Structured JSON logging (Winston/Pino) | S0.6 | 12 |
| S3.2 | Request/response logging middleware | S3.1 | 8 |
| S3.3 | Audit trail system (who did what, when) | S3.1 | 16 |
| S3.4 | Log retention policies | S3.1 | 8 |
| S3.5 | API key management system | S1.3 | 16 |
| S3.6 | Encrypted API key storage | S3.5 | 12 |
| S3.7 | API key rotation support | S3.5 | 8 |
| S3.8 | API key usage tracking & limits | S3.5 | 12 |

**Milestone**: Full audit trail, encrypted API keys, usage tracking

---

### Stage 4: Persona System & Routing (Weeks 9-12)
**Goal**: Multi-persona system with semantic dynamic routing

#### Tasks
| ID | Task | Dependencies | Est. Hours |
|----|------|--------------|------------|
| S4.1 | Persona schema and storage | S2.8 | 12 |
| S4.2 | Persona prompt engineering system | S4.1 | 16 |
| S4.3 | Entity-centric memory for personas | S4.1 | 20 |
| S4.4 | Semantic dynamic routing engine | S2.8, S4.3 | 24 |
| S4.5 | Create default personas (Jane, Yoda, Bobby) | S4.2 | 16 |
| S4.6 | Persona-specific tool definitions | S4.5 | 16 |
| S4.7 | Context management per persona (Progressive Disclosure) | S4.1 | 20 |

**Milestone**: Users can interact with multiple personas; routing works intelligently

---

### Stage 5: Real-World Integrations (Weeks 13-16)
**Goal**: External service integrations via MCP

#### Tasks
| ID | Task | Dependencies | Est. Hours |
|----|------|--------------|------------|
| S5.1 | MCP server infrastructure | S4.1 | 16 |
| S5.2 | Cloud storage integration (OneDrive, Google Drive, Nextcloud) | S5.1 | 24 |
| S5.3 | Email integration (Gmail, SMTP) | S5.1 | 20 |
| S5.4 | Calendar integration (Google, Outlook) | S5.1 | 20 |
| S5.5 | SMS integration (VoIP.ms) | S5.1 | 16 |
| S5.6 | File upload/download handling | S0.6 | 12 |

**Milestone**: Personas can access user's cloud storage, email, calendar, SMS

---

### Stage 6: Frontend - Desktop Power Interface (Weeks 17-20)
**Goal**: Full-featured desktop web interface

#### Tasks
| ID | Task | Dependencies | Est. Hours |
|----|------|--------------|------------|
| S6.1 | Next.js frontend setup | S0.4 | 8 |
| S6.2 | Authentication UI (login, register, profile) | S1.1 | 16 |
| S6.3 | Admin dashboard (users, roles, settings) | S1.7 | 24 |
| S6.4 | Persona management UI | S4.5 | 20 |
| S6.5 | Chat interface with persona switching | S4.4 | 24 |
| S6.6 | Settings page (API keys, model preferences) | S3.5, S2.9 | 16 |
| S6.7 | Usage analytics dashboard | S2.10 | 16 |
| S6.8 | Audit log viewer (admin) | S3.3 | 12 |

**Milestone**: Full-featured desktop web application

---

### Stage 7: Mobile & Voice (Weeks 21-24)
**Goal**: Voice-enabled mobile interface

#### Tasks
| ID | Task | Dependencies | Est. Hours |
|----|------|--------------|------------|
| S7.1 | Mobile-responsive design (PWA) | S6.5 | 20 |
| S7.2 | Speech-to-Text (STT) integration | S6.5 | 16 |
| S7.3 | Text-to-Speech (TTS) integration | S7.2 | 16 |
| S7.4 | Push notification support | S7.1 | 12 |
| S7.5 | Offline capability (service workers) | S7.1 | 16 |
| S7.6 | Mobile-native features (biometric auth) | S7.1 | 12 |

**Milestone**: Mobile app with voice input/output

---

### Stage 8: Billing & Monetization Ready (Weeks 25-28)
**Goal**: Architecture ready for billing integration

#### Tasks
| ID | Task | Dependencies | Est. Hours |
|----|------|--------------|------------|
| S8.1 | Usage tracking module (calls, tokens, storage) | S2.10 | 16 |
| S8.2 | Quota management system | S8.1 | 16 |
| S8.3 | Subscription tier framework | S8.2 | 20 |
| S8.4 | Billing webhook system (Stripe-ready) | S8.3 | 16 |
| S8.5 | Invoice generation foundation | S8.3 | 12 |
| S8.6 | Usage reporting per organization | S8.1 | 12 |

**Milestone**: Platform ready for billing integration (Stripe, etc.)

---

### Stage 9: Launch Preparation (Weeks 29-30)
**Goal**: Production readiness

#### Tasks
| ID | Task | Dependencies | Est. Hours |
|----|------|--------------|------------|
| S9.1 | Production Docker configuration | S0.5 | 12 |
| S9.2 | Environment hardening (security) | S3.5 | 16 |
| S9.3 | Performance optimization | S8.6 | 16 |
| S9.4 | Load testing | S9.3 | 12 |
| S9.5 | Documentation (API, deployment, user guides) | All | 24 |
| S9.6 | Domain setup (persona-bot.com) | - | 4 |
| S9.7 | SSL/TLS configuration | S9.6 | 8 |

**Milestone**: Production deployment ready

---

## Timeline Summary

| Stage | Focus | Duration | Cumulative |
|-------|-------|----------|------------|
| S0 | Foundation | 2 weeks | 2 weeks |
| S1 | User & Roles | 2 weeks | 4 weeks |
| S2 | LLM Integration | 2 weeks | 6 weeks |
| S3 | Logging, Auditing, API Keys | 2 weeks | 8 weeks |
| S4 | Persona System | 4 weeks | 12 weeks |
| S5 | Real-World Integrations | 4 weeks | 16 weeks |
| S6 | Desktop Frontend | 4 weeks | 20 weeks |
| S7 | Mobile & Voice | 4 weeks | 24 weeks |
| S8 | Billing Ready | 4 weeks | 28 weeks |
| S9 | Launch Prep | 2 weeks | 30 weeks |

**Total Estimated Timeline**: ~30 weeks (7-8 months)

---

## Skills to Implement (Progressive Disclosure)

These skills will be developed alongside the stages:

1. **progressive_disclosure** - Implemented from S0
2. **ace_project_manager** - Used throughout
3. **entity_centric_memory** - S4
4. **semantic_dynamic_routing** - S4
5. **mcp_server_developer** - S5
6. **database_mcp** - S0
7. **ai_code_security** - S3
8. **persona_prompt_engineering** - S4
9. **agent_framework** - S4
10. **voice_ai** - S7
11. **real_world_integrations** - S5

---

## Key Dependencies

```
S0 (Foundation)
  ├── PostgreSQL + pgvector
  ├── Docker/Podman setup
  └── Prisma schema

S1 (Users/Roles) ← S0
  ├── JWT authentication
  └── RBAC system

S2 (LLM) ← S1
  ├── Provider abstraction
  └── Model selection UI

S3 (Logging/Keys) ← S1
  ├── Audit system
  └── API key management

S4 (Personas) ← S2, S3
  ├── Persona CRUD
  ├── Routing engine
  └── Memory system

S5 (Integrations) ← S4
  ├── MCP servers
  └── External APIs

S6 (Frontend) ← S4, S5
  ├── Next.js app
  └── Admin dashboards

S7 (Mobile/Voice) ← S6
  ├── PWA
  └── STT/TTS

S8 (Billing) ← S7
  ├── Usage tracking
  └── Quota system

S9 (Launch) ← All
  ├── Production config
  └── Documentation
```

---

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| LLM API costs | High | Implement per-persona model limits, usage tracking |
| Context overflow | Medium | Progressive Disclosure from S0 |
| MCP security | High | ai_code_security skill, input validation |
| Voice latency | Medium | Local STT option, streaming TTS |
| Database performance | Medium | pgvector indexing, query optimization |

---

## Next Steps

1. **Start Stage 0: Foundation**
   - Create project structure
   - Set up Docker/Podman
   - Initialize PostgreSQL + pgvector

2. **Set up task tracking** (GitHub Issues or file-based)

3. **Begin parallel development** where possible

---

*Last Updated: 2026-03-10*  
*Version: 1.0*
