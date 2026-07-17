# ACE Project Manager Skill

Self-improving project management using Generate → Reflect → Curate loops.

## Overview

ACE (Agentic Context Engineering) applies the same AI principles to project management:

1. **Generate**: Create tasks, plans, docs
2. **Reflect**: Review, critique, identify gaps
3. **Curate**: Improve, consolidate, maintain

## The Loop

```
Generate → Reflect → Curate → (next iteration)
   ↑                    ↓
   └────────────────────┘
```

### Generate
- Create task lists from requirements
- Write PRDs, specs, docs
- Generate code, tests

### Reflect
- Review: Does this meet requirements?
- Critique: What's missing or wrong?
- Identify: Gaps, risks, edge cases

### Curate
- Improve based on reflection
- Consolidate duplicates
- Update documentation

## Task Generation

```typescript
// Generate tasks from feature description
const tasks = await generateTasks({
  feature: "User authentication system",
  requirements: [
    "JWT-based auth",
    "Refresh tokens",
    "Password reset flow"
  ]
});

// Output: Structured task list with dependencies
```

## Reflection Prompts

```markdown
## Reflection: [What are we reviewing?]

### Questions
- Does this meet the original requirement?
- What edge cases are missed?
- Are there security concerns?
- Is the code testable?

### Critique
[Detailed feedback]

### Gaps
[What's missing]
```

## Task Structure

```json
{
  "id": "task-001",
  "title": "Implement JWT authentication",
  "description": "Add JWT-based auth with refresh tokens",
  "dependencies": ["task-000"],
  "status": "pending",
  "priority": "high",
  "estimates": {
    "hours": 8,
    "complexity": "medium"
  },
  "acceptance_criteria": [
    "Users can login with email/password",
    "JWT tokens expire in 15 minutes",
    "Refresh tokens last 7 days"
  ]
}
```

## Integration with TodoWrite

Use OpenCode's TodoWrite tool:

```typescript
// Track tasks
todowrite({
  todos: [
    { content: "Task 1", status: "in_progress", priority: "high" },
    { content: "Task 2", status: "pending", priority: "medium" }
  ]
});
```

## Best Practices

1. **Generate comprehensively** - Don't hold back
2. **Reflect honestly** - Be critical
3. **Curate continuously** - Keep things clean
4. **Document decisions** - Why did we choose X?
5. **Track dependencies** - Know what blocks what
