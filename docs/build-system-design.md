# Persona-Bot Build System Design

## Current Setup

### Available Skills
| Skill | Status | Purpose |
|-------|--------|---------|
| task-orchestrator | ✅ Available | Task execution & tracking |
| webapp-testing | ✅ Available | Playwright testing |
| frontend-design | ✅ Installed | UI creation |
| web-artifacts-builder | ✅ Available | React components |
| mcp-builder | ✅ Available | MCP server creation |
| skill-creator | ✅ Available | Create new skills |

#### Custom Skills Created (Progressive Disclosure)
| Skill | Status | Purpose |
|-------|--------|---------|
| progressive_disclosure | ✅ Created | Context management pattern |
| ace_project_manager | ✅ Created | Self-improving project management |
| entity_centric_memory | ✅ Created | Entity tracking & relationships |
| semantic_dynamic_router | ✅ Created | Auto-route to right persona |
| mcp_server_developer | ✅ Created | Build custom MCP servers |
| database_mcp | ✅ Created | PostgreSQL MCP integration |
| ai_code_security | ✅ Created | Code security best practices |
| persona_prompt_engineering | ✅ Created | Persona prompt structure |
| agent_framework | ✅ Created | LangGraph/CrewAI/AutoGen |
| voice_ai | ✅ Created | Voice input/output |

### Available MCP Servers
| Server | Status | Purpose |
|--------|--------|---------|
| jcodemunch-mcp | ✅ Installed | Code exploration, AST parsing |
| context7 | ✅ Configured | Up-to-date library documentation |

### Playwright Test Agents
| Agent | Purpose |
|-------|---------|
| 🎭 planner | Explore app, create test plan |
| 🎭 generator | Write test code |
| 🎭 healer | Auto-fix broken tests |

---

## Design Patterns Implemented

### 1. Progressive Disclosure
- Three-tier information structure
- Trigger-based loading
- Reference files for deep dives

### 2. Agentic Context Engineering (ACE)
- Self-improving project playbook
- Generate → Reflect → Curate loop
- Track patterns over time

---

## Proposed Build Loop Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     BUILD ORCHESTRATION                          │
│                                                                  │
│  ┌─────────────────┐  ┌─────────────────┐  ┌───────────────┐  │
│  │  Task Master    │  │  PRD Writer     │  │  Code Gen    │  │
│  │  (Orchestrates) │  │  (Documents)    │  │  (Writes)    │  │
│  └────────┬────────┘  └────────┬────────┘  └──────┬───────┘  │
│           │                    │                    │           │
│  ┌────────▼────────────────────▼────────────────────▼───────┐   │
│  │              Subagent Pool (Parallel)                     │   │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐      │   │
│  │  │Researcher│ │Planner  │ │Coder    │ │Tester   │      │   │
│  │  └─────────┘ └─────────┘ └─────────┘ └─────────┘      │   │
│  └──────────────────────────────────────────────────────────┘   │
│           │                    │                    │           │
│  ┌────────▼────────────────────▼────────────────────▼───────┐   │
│  │                    Git Branches                            │   │
│  │  planning/ │ stage-0/ │ stage-1/ │ stage-2/ │ etc.     │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

---

## Skills to Create

### 1. project-manager Skill
**Purpose**: Overall project coordination, tracking, milestone management

**Capabilities**:
- Create/manage task lists
- Track progress across stages
- Generate status reports
- Coordinate subagents
- Manage git branches

**Location**: `/home/swong/.config/opencode/skills/project-manager/`

---

### 2. prd-writer Skill
**Purpose**: Generate Product Requirements Documents

**Capabilities**:
- Write structured PRDs
- Create feature specifications
- Define acceptance criteria
- Generate technical requirements

**Location**: `/home/swong/.config/opencode/skills/prd-writer/`

---

### 3. architecture-designer Skill
**Purpose**: Design system architecture

**Capabilities**:
- Create architecture diagrams
- Define module boundaries
- Design data flows
- Document system components

**Location**: `/home/swong/.config/opencode/skills/architecture-designer/`

---

### 4. research-planner Skill
**Purpose**: Research and evaluate technologies

**Capabilities**:
- Compare technologies
- Research best practices
- Generate recommendations
- Document trade-offs

**Location**: `/home/swong/.config/opencode/skills/research-planner/`

---

## MCP Servers to Install

### 1. playwright-test-agent ✅ (Created)
**Purpose**: AI-powered frontend testing

**Capabilities**:
- Generate tests from natural language
- Auto-heal broken tests
- Explore app and create test plans
- Run and report results

**Location**: `/home/swong/.config/opencode/skills/frontend-test-agent/`

**Setup**:
```bash
cd frontend && npx playwright init-agents --loop=opencode
```

### 2. filesystem-mcp (Optional)
- File operations
- Project scaffolding

### 3. github-mcp (Optional)
- GitHub integration
- PR management

---

## Tools to Configure

### 1. Task Tracking
# .person
```yamla-bot/tasks/tracker.json
{
  "project": "persona-bot",
  "stages": ["stage-0", "stage-1", "stage-2", "stage-3", "stage-4", "stage-5"],
  "tasksPerStage": 10-20,
  "status": "not_started"
}
```

### 2. Branch Management
```
planning/
├── stage-0-foundation/     # Infrastructure
├── stage-1-core/          # Platform + Chat
├── stage-2-mobile/        # Mobile + Voice
├── stage-3-desktop/       # Desktop Features
├── stage-4-advanced/      # Advanced Capabilities
└── stage-5-launch/       # Polish + Launch
```

### 3. Session Management
- Each stage gets its own git branch
- Each major feature gets its own branch
- Merge to master after stage complete

---

## Workflow: Parallel Stage Planning

### Step 1: Create Stage Plans (Parallel)
Using subagents to create PRDs for each stage simultaneously:

```
Subagent 1: Stage 0 PRD (Foundation)
Subagent 2: Stage 1 PRD (Core Platform)
Subagent 3: Stage 2 PRD (Mobile/Voice)
Subagent 4: Stage 3 PRD (Desktop)
Subagent 5: Stage 4 PRD (Advanced)
Subagent 6: Stage 5 PRD (Launch)
```

### Step 2: Merge to Master Plan
- Combine all stage PRDs into master plan
- Identify dependencies
- Create milestone schedule

### Step 3: Execute
- Work on stages in parallel (where possible)
- Each stage: research → design → implement → test → document

---

## Task Tracking Format

### Master Task File
```markdown
# Persona-Bot Master Task List

## Stage 0: Foundation
- [ ] 0.1 Project setup
- [ ] 0.2 PostgreSQL + pgvector
- [ ] 0.3 Backend setup
- [ ] 0.4 Frontend setup
- [ ] 0.5 Auth system
- [ ] 0.6 Logging
- [ ] 0.7 CI/CD

## Stage 1: Core Platform
- [ ] 1.1 Platform Assistant
- [ ] 1.2 Routing system
- [ ] 1.3 Session management
- [ ] 1.4 Chat interface
- [ ] 1.5 Memory system
- [ ] 1.6 Web tools
- [ ] 1.7 Persona API

## Stage 2: Mobile & Voice
- [ ] 2.1 Mobile UI
- [ ] 2.2 Voice input
- [ ] 2.3 Voice output
- [ ] 2.4 Push notifications
- [ ] 2.5 Offline mode
```

---

## Parallel Execution Strategy

### Tasks That Can Run Parallel
- Stage 0.3 (Backend) + Stage 0.4 (Frontend)
- Stage 1.6 (Web tools) + Stage 1.7 (Persona API)
- Stage 2.x (all depend on Stage 1)
- Stage 3.x (can start after Stage 1)

### Tasks That Must Run Sequential
- Stage 0 must complete before Stage 1
- Stage 1 must mostly complete before Stage 2/3
- Stage 3 depends on Stage 2 for mobile UI

---

## Quality Gates

Each stage must pass before moving on:

```
┌─────────────┐
│   Research  │ ──► PRD Review
└─────────────┘
      │
      ▼
┌─────────────┐
│   Design    │ ──► Architecture Review
└─────────────┘
      │
      ▼
┌─────────────┐
│Implement    │ ──► Code Review + Tests
└─────────────┘
      │
      ▼
┌─────────────┐
│   Verify    │ ──► Acceptance Testing
└─────────────┘
      │
      ▼
┌─────────────┐
│   Document  │ ──► Documentation Complete
└─────────────┘
```

---

## Next Steps

1. ✅ Review this proposal
2. [ ] Create skills (project-manager, prd-writer, architecture-designer)
3. [ ] Set up task tracking system
4. [ ] Create git branch structure
5. [ ] Launch parallel PRD creation

---

## Questions for Decision

| Decision | Options |
|----------|---------|
| Task tracking | File-based, Notion, Linear, GitHub Projects? |
| Documentation | Markdown files, Wiki, Confluence? |
| Branch strategy | One branch per stage? Feature branches? |
| Testing | Jest + Playwright? Other? |
