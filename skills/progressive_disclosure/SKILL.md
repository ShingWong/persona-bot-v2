# Progressive Disclosure Skill

A context management pattern that loads information progressively based on task complexity and user needs.

## Overview

Progressive Disclosure manages context efficiently by loading information in three tiers:

- **Tier 1 (Essential)**: Core instructions, immediate task context
- **Tier 2 (Contextual)**: Relevant background, domain knowledge
- **Tier 3 (Reference)**: Detailed documentation, examples, edge cases

## Three-Tier Structure

### Tier 1: Essential Context (~500 tokens)
```
# Task: [Brief description]

## Immediate Context
- [Current working file]
- [Function/class being modified]
- [Recent changes]

## Constraints
- [Hard requirements]
- [Must avoid]
```

### Tier 2: Contextual Background (~2000 tokens)
```
## Domain Context
- [Relevant domain knowledge]
- [Architecture decisions]
- [Pattern usage in codebase]

## Related Code
- [File paths to related modules]
- [Key functions to understand]
```

### Tier 3: Reference Material (on-demand)
```
## Full Documentation
- [Link to detailed docs]

## Examples
- [Code examples]

## Edge Cases
- [Known edge cases]
```

## Usage

### In Code Files

Add tier markers as comments:

```typescript
// === TIER 1: ESSENTIAL ===
// Task: Implement user authentication
// Focus: JWT token generation and validation

// === TIER 2: CONTEXTUAL ===
// Related: src/auth/middleware.ts
// Pattern: Bearer token in Authorization header

// === TIER 3: REFERENCE ===
// See: docs/authentication.md
// Example: src/auth/__tests__/jwt.test.ts
```

### In Skills

Structure skill files with tiers:

```markdown
# Skill: [Name]

## Quick Reference (Tier 1)
[Essential commands, key concepts]

## Detailed Context (Tier 2)
[Background, patterns, related skills]

## Full Documentation (Tier 3)
[Complete reference, examples, troubleshooting]
```

## When to Use

| Task Type | Load Tier |
|-----------|-----------|
| Quick fix | 1 only |
| New feature | 1 + 2 |
| Complex feature | 1 + 2 + 3 |
| Research | 3 (load on demand) |

## Benefits

1. **Token Efficiency**: Stay within LLM context limits
2. **Faster Responses**: Less context = faster processing
3. **Focused Work**: Start with essential, expand as needed
4. **On-Demand Loading**: MCP servers load reference only when needed

## Integration with MCP

Use MCP servers for Tier 3:

```typescript
// Load reference documentation on-demand
const docs = await mcp.context7.loadDocs({
  topic: 'authentication',
  detail: 'comprehensive'
});
```

## Examples

See: `skills/progressive_disclosure/examples/`
