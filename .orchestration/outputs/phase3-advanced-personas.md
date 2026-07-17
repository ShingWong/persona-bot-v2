# Phase 3: Advanced Persona Features

## Overview
Phase 3 implements advanced persona capabilities including tool definitions, entity-centric memory, advanced prompt engineering, and context management systems.

## Architecture

### 1. Tool Framework (`backend/src/services/tools/`)
**Purpose**: Enable personas to define and use custom tools/functions.

#### Components:
- **`tool.types.ts`**: Type definitions for tools, parameters, and execution
- **`tool.validator.ts`**: Schema validation for tool parameters
- **`tool.registry.ts`**: Central registry for tool definitions and handlers
- **`tool.executor.ts`**: Execution engine for tool calls
- **`tool.service.ts`**: Main service orchestrating tool operations
- **`builtin.tools.ts`**: Default tools available to all personas

#### Built-in Tools:
1. **Web Search**: Search the web for current information
2. **Calculator**: Perform mathematical calculations
3. **Current Time**: Get current date and time
4. **Memory Store**: Store information in persona memory
5. **Memory Retrieve**: Retrieve information from persona memory
6. **Session Context**: Get context from current session

#### Key Features:
- Tool schema validation with JSON Schema support
- Persona-specific tool definitions
- LLM function calling integration
- Tool execution with context awareness
- Error handling and validation

### 2. Memory System (`backend/src/services/memory/`)
**Purpose**: Entity-centric memory with semantic search using pgvector.

#### Components:
- **`memory.types.ts`**: Type definitions for memories and embeddings
- **`embedding.service.ts`**: Vector embedding generation (OpenAI, local, HuggingFace)
- **`memory.service.ts`**: Core memory storage and retrieval with semantic search

#### Database Schema Updates:
```prisma
model EntityMemory {
  id          String    @id @default(cuid())
  entityType  String    // "persona", "session", "user", "conversation"
  entityId    String
  content     String    @db.Text
  summary     String?   @db.Text
  embedding   String?   @db.Text  // JSON array for pgvector
  memoryType  String    // "fact", "preference", "conversation", "instruction"
  tags        String[]
  importance  Float     @default(1.0)
  accessCount Int       @default(0)
  lastAccessedAt DateTime?
  metadata    Json      @default("{}")
}

model MemoryAssociation {
  id          String    @id @default(cuid())
  memoryId    String
  associatedMemoryId String
  associationType String  // "related", "contradicts", "supports", "context"
  strength    Float     @default(1.0)
}

model MemoryAccessLog {
  id          String    @id @default(cuid())
  memoryId    String
  sessionId   String?
  userId      String?
  accessType  String    // "read", "update", "reference"
  relevanceScore Float?
}
```

#### Key Features:
- Vector embeddings for semantic search
- Memory importance scoring and auto-pruning
- Memory associations and relationships
- Access logging for learning relevance
- Context-aware memory retrieval

### 3. Prompt Engineering (`backend/src/services/prompt/`)
**Purpose**: Dynamic prompt assembly with Progressive Disclosure and token optimization.

#### Components:
- **`prompt.types.ts`**: Type definitions for prompt components and context
- **`prompt.assembler.ts`**: Dynamic prompt assembly with token optimization
- **`context.manager.ts`**: Conversation context management with summarization
- **`prompt.service.ts`**: Main service integrating all prompt engineering features

#### Progressive Disclosure Tiers:
1. **Tier 1 (Basic)**: Essential components only (identity, constraints)
2. **Tier 2 (Enhanced)**: Add memory and basic tools
3. **Tier 3 (Full)**: All components including examples and full context

#### Key Features:
- Dynamic component selection based on tier
- Token counting and optimization
- Context window management
- Conversation summarization
- Few-shot example selection
- Tool result integration

### 4. Enhanced LLM Service (`backend/src/services/llm/llm.service.enhanced.ts`)
**Purpose**: Integrate all advanced features into the LLM interaction flow.

#### Key Features:
- Tool-aware LLM calls with function calling
- Memory context injection
- Progressive Disclosure implementation
- Conversation memory storage
- Context management integration

## Integration Points

### 1. Persona Model Updates
The existing Persona model already includes fields for:
- `tools`: JSON array of tool definitions
- `capabilities`: JSON array of persona capabilities
- `memoryEnabled`: Boolean flag for memory system
- `memoryLimit`: Maximum memories per persona

### 2. Database Integration
- **pgvector**: Used for semantic search via vector embeddings
- **Prisma**: Updated schema for memory system
- **Raw SQL**: For vector operations (Prisma doesn't natively support vector types)

### 3. API Integration
The enhanced LLM service provides backward-compatible APIs while adding:
- Tool execution results in responses
- Memory context in prompts
- Progressive Disclosure configuration
- Context management endpoints

## Configuration

### Environment Variables
```bash
# OpenAI for embeddings (optional)
OPENAI_API_KEY=sk-...

# Memory system configuration
MEMORY_EMBEDDING_MODEL=text-embedding-3-small
MEMORY_MAX_MEMORIES_PER_ENTITY=100
MEMORY_RELEVANCE_THRESHOLD=0.7

# Prompt engineering
PROMPT_MAX_TOKENS=4000
PROMPT_INCLUDE_EXAMPLES=true
PROMPT_INCLUDE_TOOLS=true
```

### Persona Configuration
Personas can be configured with:
- Tool definitions (JSON schema)
- Memory preferences (enabled/disabled, limits)
- Progressive Disclosure tier
- Example selection strategy

## Usage Examples

### 1. Defining Persona-Specific Tools
```typescript
const personaTools = [
  {
    name: 'search_database',
    description: 'Search the internal database',
    parameters: [
      { name: 'query', type: 'string', description: 'Search query', required: true },
      { name: 'limit', type: 'number', description: 'Result limit', required: false, default: 10 },
    ],
    handler: 'databaseSearchHandler',
  },
];

await toolService.updatePersonaTools(personaId, personaTools);
```

### 2. Storing and Retrieving Memories
```typescript
// Store memory
const memory = await memoryService.storeMemory({
  entityType: 'persona',
  entityId: personaId,
  content: 'User prefers dark mode interface',
  memoryType: 'preference',
  tags: ['ui', 'preference'],
  importance: 0.9,
});

// Retrieve relevant memories
const memories = await memoryService.searchMemories({
  entityType: 'persona',
  entityId: personaId,
  query: 'user interface preferences',
  limit: 5,
});
```

### 3. Using Progressive Disclosure
```typescript
// Tier 1: Basic (for simple queries)
const basicPrompt = await promptService.buildPersonaPrompt(
  sessionId, personaId, userMessage, 1
);

// Tier 3: Full (for complex queries)
const fullPrompt = await promptService.buildPersonaPrompt(
  sessionId, personaId, userMessage, 3
);
```

### 4. Enhanced LLM Interaction
```typescript
const response = await enhancedLLMService.sendMessage(
  sessionId,
  userId,
  userMessage,
  { temperature: 0.7, maxTokens: 1000 },
  3 // Tier 3
);

// Response includes tool results if tools were used
if (response.toolResults && response.toolResults.length > 0) {
  console.log('Tools executed:', response.toolResults);
}
```

## Testing

### Integration Tests
Located in `backend/tests/phase3-integration.test.ts`:
1. Tool framework registration and validation
2. Memory storage and semantic search
3. Prompt assembly with Progressive Disclosure
4. Enhanced LLM service integration

### Test Coverage
- Tool parameter validation
- Memory embedding generation
- Prompt token optimization
- Context management
- Progressive Disclosure tiers

## Performance Considerations

### 1. Vector Embeddings
- Cache embeddings for frequently accessed memories
- Use batch embedding generation
- Consider local embedding models for reduced latency

### 2. Token Optimization
- Implement efficient token counting (tiktoken)
- Use message summarization for long conversations
- Implement smart truncation strategies

### 3. Memory Management
- Auto-prune low-importance memories
- Implement memory compression for long-term storage
- Use lazy loading for memory retrieval

## Security Considerations

### 1. Tool Execution
- Validate all tool parameters
- Implement execution timeouts
- Sandbox tool execution where possible
- Log all tool executions

### 2. Memory Storage
- Encrypt sensitive memory content
- Implement access controls for shared memories
- Regular privacy audits of stored memories

### 3. Prompt Security
- Sanitize user input in prompts
- Implement prompt injection protections
- Validate tool schemas before execution

## Future Enhancements

### 1. Advanced Tool Features
- Tool chaining and workflows
- Tool learning from usage patterns
- Tool versioning and updates

### 2. Memory System
- Cross-persona memory sharing
- Memory inference and reasoning
- Temporal memory organization

### 3. Prompt Engineering
- Adaptive Progressive Disclosure
- Dynamic few-shot learning
- Multi-modal prompt support

### 4. Integration
- External API tool integration
- Real-time memory updates
- Distributed memory systems

## Migration Notes

### From Phase 2 to Phase 3
1. Database migration required for new memory tables
2. Existing personas automatically get basic tool access
3. Backward compatibility maintained for existing APIs
4. Gradual rollout recommended for new features

### Database Migration
```sql
-- Run Prisma migration for new tables
npx prisma migrate dev --name add_phase3_features

-- Optional: Initialize pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;
```

## Conclusion
Phase 3 significantly enhances the persona-bot-v2 platform with:
- **Tool Framework**: Personas can define and use custom tools
- **Memory System**: Entity-centric memory with semantic search
- **Prompt Engineering**: Advanced prompt assembly with Progressive Disclosure
- **Context Management**: Efficient conversation context handling

These features enable more capable, context-aware, and personalized AI assistants while maintaining scalability and performance.