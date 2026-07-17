# Frontend Test Agent Design

## Playwright Test Agents - Overview

Playwright v1.56+ (Oct 2025) introduced AI-powered test agents:

```
┌─────────────────────────────────────────────────────────────────┐
│                  PLAYWRIGHT TEST AGENTS                          │
│                                                                  │
│  ┌──────────────┐     ┌──────────────┐     ┌──────────────┐  │
│  │   PLANNER    │────▶│  GENERATOR   │────▶│   HEALER     │  │
│  │              │     │              │     │              │  │
│  │ • Explores   │     │ • Creates    │     │ • Auto-fixes │  │
│  │ • Analyzes   │     │ • Generates  │     │ • Updates    │  │
│  │ • Plans      │     │ • Writes     │     │ • Repairs    │  │
│  └──────────────┘     └──────────────┘     └──────────────┘  │
│                                                                  │
│  Workflow: Planner → Generator → Healer                         │
└─────────────────────────────────────────────────────────────────┘
```

---

## Setup

### 1. Install Playwright Agents

```bash
# Initialize agents for your project
npx playwright init-agents --loop=opencode
# or for Claude/Cursor
npx playwright init-agents --loop=claude
npx playwright init-agents --loop=cursor
```

### 2. MCP Server (Optional but Recommended)

```bash
# Install Playwright MCP
npm install -D @playwright/mcp-server
# or use npx
npx @playwright/mcp-server
```

---

## Test Agent Workflow

### Traditional (Manual)
```
Write Test → Run → Fix → Run → Fix → Run → Done
```

### With Playwright Agents
```
Describe Goal → Planner creates plan → Generator writes tests → Healer fixes
```

---

## Commands

### Planner - Explore and Plan
```bash
npx playwright test-agent planner \
  --url "http://localhost:6080" \
  --goal "Test the login and dashboard flow" \
  --output "test-plan.md"
```

### Generator - Generate Tests
```bash
npx playwright test-agent generator \
  --plan "test-plan.md" \
  --output "tests/login.spec.ts"
```

### Healer - Auto-fix
```bash
npx playwright test-agent healer \
  --test "tests/login.spec.ts" \
  --auto-fix
```

### Full Agentic Loop
```bash
npx playwright test-agent run \
  --goal "Test user authentication flow" \
  --output "tests/"
```

---

## Integration with OpenCode

### Frontend Test Agent Skill

Create a skill that:
1. Understands test goals in natural language
2. Uses Playwright agents to explore and generate tests
3. Runs tests automatically
4. Heals broken tests
5. Reports results

### Skill Structure
```
frontend-test-agent/
├── SKILL.md              # Main skill definition
├── prompts/
│   ├── planner.md       # How to use planner
│   ├── generator.md     # How to use generator
│   └── healer.md       # How to use healer
├── scripts/
│   ├── setup.sh        # Initialize agents
│   ├── run-test.sh    # Run test workflow
│   └── heal.sh        # Auto-heal tests
└── examples/
    └── workflows.md    # Example workflows
```

---

## Usage Examples

### 1. Quick Smoke Test
```
User: "Run a quick test to verify login works"

Agent:
1. Uses Planner to explore login page
2. Uses Generator to create basic login test
3. Runs test
4. Reports: "✅ Login test passed"
```

### 2. Full Feature Test
```
User: "Test the entire checkout flow including:
- Login
- Add to cart
- Checkout
- Payment confirmation"

Agent:
1. Planner explores each page
2. Generator creates comprehensive test
3. Runs full suite
4. Reports results with screenshots
```

### 3. Auto-Heal After UI Change
```
User: "The login test is failing after our UI update"

Agent:
1. Runs failing test to see error
2. Uses Healer to analyze failure
3. Healer auto-updates selectors
4. Runs test again
5. Reports: "✅ Fixed! Test now passing"
```

---

## Configuration

### playwright.config.ts
```typescript
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  use: {
    // ... existing config
  },
  
  // Agent configuration
  agents: {
    planner: {
      model: 'claude-sonnet-4-20250514',
      temperature: 0.7,
    },
    generator: {
      model: 'claude-sonnet-4-20250514',
      maxTokens: 4000,
    },
    healer: {
      autoFix: true,
      maxRetries: 3,
    },
  },
  
  // MCP configuration (optional)
  mcpServers: {
    playwright: {
      command: 'npx',
      args: ['@playwright/mcp-server'],
    },
  },
});
```

---

## Benefits

| Aspect | Before | After |
|--------|--------|-------|
| **Test Creation** | Manual, slow | AI generates in seconds |
| **Maintenance** | Manual fixes | Auto-healer fixes |
| **Coverage** | Often missed | Planner finds edge cases |
| **Debugging** | Trial and error | Healer identifies issues |

---

## Skills to Create

### 1. playwright-test-agent Skill
- Setup and configure Playwright agents
- Run planner → generator → healer workflows
- Interpret results
- Handle failures

### 2. test-designer Skill
- Write effective test goals
- Define acceptance criteria
- Review generated tests

---

## Workflow in Persona-Bot Project

```
┌─────────────────────────────────────────────────────────────┐
│                  PERSONA-BOT TEST WORKFLOW                    │
│                                                              │
│  Development                                                │
│      │                                                       │
│      ▼                                                       │
│  ┌─────────────────┐                                        │
│  │ Write Code      │                                        │
│  └────────┬────────┘                                         │
│           │                                                  │
│           ▼                                                  │
│  ┌─────────────────┐     ┌─────────────────┐               │
│  │ Push to Branch  │────▶│ CI/CD Trigger   │               │
│  └─────────────────┘     └────────┬────────┘               │
│                                   │                         │
│           ┌───────────────────────┼───────────────────────┐ │
│           ▼                       ▼                       ▼ │
│  ┌─────────────────┐  ┌─────────────────┐  ┌───────────┐ │
│  │ Test Planner     │  │ Test Generator  │  │Test Healer│ │
│  │ Explores app    │  │ Creates tests   │  │Fixes fails│ │
│  └────────┬────────┘  └────────┬────────┘  └─────┬─────┘ │
│           │                   │                   │        │
│           └───────────────────┼───────────────────┘        │
│                               │                            │
│                               ▼                            │
│                    ┌─────────────────┐                     │
│                    │ Test Results    │                     │
│                    │ + Reports      │                     │
│                    └─────────────────┘                     │
└─────────────────────────────────────────────────────────────┘
```

---

## Next Steps

1. Install Playwright agents in persona-bot
2. Create frontend-test-agent skill
3. Configure MCP if needed
4. Test with simple goal: "Test login page"
5. Scale up to full test suite
