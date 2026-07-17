# Task Orchestrator Skill

A robust task orchestration pattern with timeout detection, checkpointing, and graceful error recovery. Integrates with the project's `.orchestration/scripts/orchestrator.sh`.

## Problem with Simple Task Delegation

1. **Hanging subagents** - No timeout detection
2. **No recovery** - Can't resume from failure  
3. **Silent failures** - Don't know what went wrong

## Workflow Pattern

### Use with Subagents

When delegating to subagents, use explicit timeouts and checkpoints:

```typescript
// ❌ BAD - Can hang indefinitely
await task('Fix all TypeScript errors', 'CoderAgent');

// ✅ GOOD - With timeout and checkpoint
const result = await runWithTimeout(
  () => task('Fix auth service TypeScript errors', 'CoderAgent'),
  180000, // 3 min max
  'auth-ts-fix'
);

if (result.status === 'timeout') {
  console.log('Agent timed out - task too large, break into smaller pieces');
  // Save checkpoint for resume
}
```

### Timeout Wrapper Pattern

```typescript
async function runWithTimeout<T>(
  fn: () => Promise<T>, 
  ms: number,
  taskName: string
): Promise<{ status: 'success' | 'timeout' | 'error'; data?: T; error?: string }> {
  return new Promise((resolve) => {
    const timeout = setTimeout(() => {
      resolve({ status: 'timeout', error: `${taskName} timed out after ${ms}ms` });
    }, ms);
    
    fn()
      .then(data => { clearTimeout(timeout); resolve({ status: 'success', data }); })
      .catch(err => { clearTimeout(timeout); resolve({ status: 'error', error: String(err) }); });
  });
}
```

### Sequential Phases with Checkpoints

```typescript
async function orchestrate(phases: Array<{name: string; task: () => Promise<any>}>) {
  const checkpoint = { 
    taskId: 'migration-v2', 
    phase: 'running',
    started: Date.now(),
    progress: [] 
  };
  
  for (const {name, task} of phases) {
    console.log(`[PHASE] Starting: ${name}`);
    checkpoint.progress.push({ name, status: 'running' });
    
    const result = await runWithTimeout(task, 180000, name);
    
    if (result.status === 'success') {
      checkpoint.progress.find(p => p.name === name).status = 'complete';
      console.log(`[PHASE] ✅ Complete: ${name}`);
    } else {
      checkpoint.progress.find(p => p.name === name).status = 'failed';
      checkpoint.progress.find(p => p.name === name).error = result.error;
      console.error(`[PHASE] ❌ Failed: ${name}`, result.error);
      break; // Stop on failure
    }
  }
  
  return checkpoint;
}
```

## Integration with orchestrator.sh

The project has `.orchestration/scripts/orchestrator.sh` which handles:
- Task queuing and execution
- Context loading
- Quality gates
- Metrics collection

Use it for larger workflows:
```bash
.orchestration/scripts/orchestrator.sh run --task backend-migration
```

## Best Practices

1. **Set explicit timeouts** - 3-5 min per subagent task
2. **Break large tasks** - Split into sequential phases  
3. **Checkpoint frequently** - Save progress after each phase
4. **Handle timeouts gracefully** - Return user to safe state
5. **Log errors with context** - Include for resume capability

## When to Use

| Situation | Approach |
|-----------|----------|
| Quick fix (< 1 min) | Direct code edit |
| Medium task (1-5 min) | Task with timeout |
| Large feature | orchestrator.sh + phases |
| Research | Load tier 3 docs on demand |
