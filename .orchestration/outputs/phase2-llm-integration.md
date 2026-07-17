# Phase 2: Basic LLM Integration (OpenAI)

## Overview
Implemented LLM provider abstraction layer with OpenAI integration for persona-bot-v2. The system now supports sending messages to LLMs with persona-aware prompts, streaming responses, and token tracking.

## Architecture

### 1. LLM Provider Abstraction Layer
- **Location**: `backend/src/services/llm/`
- **Key Components**:
  - `llm.types.ts`: TypeScript interfaces for LLM providers
  - `llm.service.ts`: Main service for persona-aware LLM interactions
  - `llm.factory.ts`: Provider factory and configuration management
  - `providers/openai.service.ts`: OpenAI provider implementation
  - `providers/mock.service.ts`: Mock provider for testing

### 2. Data Model Updates
- **AIModel table**: Stores provider configurations (OpenAI, Anthropic, Google, etc.)
- **Message table**: Enhanced with token counts and model information
- **Persona table**: Supports model overrides and persona-specific parameters

### 3. API Endpoints
- **POST `/api/sessions/:id/messages/llm`**: Send message to LLM with optional streaming
  - Supports both streaming (`stream: true`) and non-streaming responses
  - Applies persona identity, constraints, and examples
  - Tracks token usage and latency

## Implementation Details

### LLM Provider Interface
```typescript
interface LLMProvider {
  initialize(config: LLMProviderConfig): void;
  createCompletion(messages: LLMMessage[], options: LLMCompletionOptions): Promise<LLMCompletionResponse>;
  createStreamingCompletion(messages: LLMMessage[], options: LLMCompletionOptions, onChunk: (chunk: LLMStreamChunk) => void): Promise<LLMCompletionResponse>;
  countTokens(messages: LLMMessage[]): Promise<number>;
  getAvailableModels(): Promise<string[]>;
  validateConfig(): Promise<boolean>;
}
```

### Persona-Aware Prompt Building
The system automatically constructs prompts using:
1. **System prompt**: Persona identity + constraints
2. **Few-shot examples**: From persona configuration
3. **Session history**: Previous messages in the conversation
4. **Current user message**

### Token Tracking
- Input tokens: Counted for entire prompt (system + examples + history + user message)
- Output tokens: Counted for LLM response
- Token counts are stored in the database and aggregated per session

### Streaming Support
- Server-Sent Events (SSE) for real-time response streaming
- Chunk-by-chunk delivery with proper completion signaling
- Maintains connection for interactive conversations

## Configuration

### Environment Variables
```bash
# OpenAI Configuration
OPENAI_API_KEY=your-api-key-here
OPENAI_BASE_URL=https://api.openai.com/v1  # Optional: for custom endpoints
OPENAI_TIMEOUT=30000  # Optional: timeout in ms
OPENAI_MAX_RETRIES=3  # Optional: retry attempts

# Other Providers (future implementation)
ANTHROPIC_API_KEY=
GOOGLE_GEMINI_API_KEY=
OPENROUTER_API_KEY=
OLLAMA_BASE_URL=http://localhost:11434
```

### Database Configuration
Run the seed script to create default AI models:
```bash
cd backend
npx tsx scripts/seed-ai-models.ts
```

## Usage Examples

### 1. Non-Streaming Request
```bash
curl -X POST http://localhost:3001/api/sessions/{sessionId}/messages/llm \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "content": "Hello, how are you?",
    "temperature": 0.7,
    "maxTokens": 1000
  }'
```

### 2. Streaming Request
```bash
curl -X POST http://localhost:3001/api/sessions/{sessionId}/messages/llm \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "content": "Hello, how are you?",
    "stream": true,
    "temperature": 0.7
  }'
```

### 3. With Persona Context
When a session has a persona assigned, the LLM automatically:
- Uses the persona's identity as system prompt
- Applies persona constraints
- Includes few-shot examples if provided
- Respects persona model overrides

## Testing

### Mock Provider
For development without API keys, the system includes a mock provider:
- Simulates API responses with realistic delays
- Supports both streaming and non-streaming modes
- Useful for testing persona logic and API integration

### Test Scripts
```bash
# Test LLM service logic
npx tsx test-llm-service.ts

# Test full integration (requires database)
npx tsx test-llm-integration.ts
```

## Error Handling
- **Invalid API keys**: Returns 401 with descriptive error
- **Rate limiting**: Exponential backoff with retries
- **Network errors**: Graceful degradation with fallback options
- **Token limits**: Prevents requests that exceed context windows

## Future Enhancements

### Tier 2: Multiple Provider Support
1. **Anthropic Claude integration**
2. **Google Gemini integration**
3. **OpenRouter unified API**
4. **Local LLMs (Ollama, LM Studio)**

### Tier 3: Advanced Features
1. **Function calling**: Tool integration for personas
2. **Vision models**: Image understanding capabilities
3. **Audio models**: Speech-to-text and text-to-speech
4. **Fine-tuned models**: Custom model deployments

### Tier 4: Optimization
1. **Token counting**: Integration with tiktoken for accurate counts
2. **Response caching**: Reduce latency for common queries
3. **Cost optimization**: Smart model selection based on query complexity
4. **Batch processing**: Efficient handling of multiple requests

## Success Criteria Met
- [x] LLM provider abstraction layer implemented
- [x] OpenAI integration with streaming support
- [x] Persona-aware prompt building
- [x] Token counting and tracking
- [x] Error handling for API failures
- [x] Integration with existing Message service
- [x] Database schema for AI models
- [x] Mock provider for testing
- [x] API endpoint for LLM interactions
- [x] Documentation and examples

## Next Steps
1. **Add authentication** to LLM endpoints (already integrated with existing auth)
2. **Implement rate limiting** per user/session
3. **Add cost tracking** with billing integration
4. **Create admin interface** for model management
5. **Implement provider fallback** when primary provider fails
6. **Add model performance metrics** for optimization

## Files Created/Modified
```
backend/src/services/llm/
├── llm.types.ts              # Type definitions
├── llm.service.ts            # Main LLM service
├── llm.factory.ts            # Provider factory
├── index.ts                  # Exports and initialization
└── providers/
    ├── openai.service.ts     # OpenAI implementation
    └── mock.service.ts       # Mock provider for testing

backend/src/api/sessions/messages/message.routes.ts
backend/src/validation/session.schema.ts
backend/src/services/message.service.ts
backend/scripts/seed-ai-models.ts
backend/src/utils/encryption.ts
```

## Dependencies Added
- `openai`: ^4.0.0 (OpenAI SDK)

## Notes
- The system defaults to mock provider when no API keys are configured (development only)
- Production deployments require valid API keys for real LLM providers
- Token counting uses estimation (4 chars per token); consider tiktoken for production accuracy
- Streaming uses Server-Sent Events (SSE) which works well with modern browsers and HTTP clients