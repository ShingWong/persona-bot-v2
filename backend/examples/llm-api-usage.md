# LLM API Usage Examples

## Prerequisites
1. Backend server running on `http://localhost:3001`
2. Valid authentication token (obtain via login/register)
3. Session ID (create via `/api/sessions`)

## Basic Non-Streaming Request

### Request
```bash
curl -X POST http://localhost:3001/api/sessions/{sessionId}/messages/llm \
  -H "Authorization: Bearer {jwtToken}" \
  -H "Content-Type: application/json" \
  -d '{
    "content": "What is the capital of France?",
    "temperature": 0.7,
    "maxTokens": 500
  }'
```

### Response
```json
{
  "success": true,
  "data": {
    "message": {
      "id": "msg_123",
      "sessionId": "ses_123",
      "role": "ASSISTANT",
      "content": "The capital of France is Paris...",
      "inputTokens": 0,
      "outputTokens": 15,
      "totalTokens": 15,
      "modelUsed": "openai/gpt-4",
      "latencyMs": 1250,
      "createdAt": "2024-01-01T12:00:00.000Z"
    },
    "usage": {
      "inputTokens": 25,
      "outputTokens": 15,
      "totalTokens": 40,
      "latencyMs": 1250
    }
  }
}
```

## Streaming Request

### Request
```bash
curl -X POST http://localhost:3001/api/sessions/{sessionId}/messages/llm \
  -H "Authorization: Bearer {jwtToken}" \
  -H "Content-Type: application/json" \
  -d '{
    "content": "Write a short poem about AI",
    "stream": true,
    "temperature": 0.8
  }'
```

### Response (Streaming)
```
data: {"chunk":"In ","isComplete":false}

data: {"chunk":"silicon ","isComplete":false}

data: {"chunk":"minds ","isComplete":false}

data: {"chunk":"and ","isComplete":false}

data: {"chunk":"circuit ","isComplete":false}

data: {"chunk":"dreams","isComplete":false}

data: {"chunk":"","isComplete":true}
```

## JavaScript/TypeScript Example

### Using Fetch API
```javascript
async function sendMessageToLLM(sessionId, token, message, stream = false) {
  const response = await fetch(`http://localhost:3001/api/sessions/${sessionId}/messages/llm`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      content: message,
      stream: stream,
      temperature: 0.7,
      maxTokens: 1000
    })
  });

  if (stream) {
    // Handle streaming response
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      
      const chunk = decoder.decode(value);
      const lines = chunk.split('\n');
      
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = JSON.parse(line.substring(6));
          if (data.chunk) {
            process.stdout.write(data.chunk);
          }
          if (data.isComplete) {
            console.log('\nStream complete');
          }
        }
      }
    }
  } else {
    // Handle non-streaming response
    const result = await response.json();
    console.log('Response:', result.data.message.content);
    console.log('Tokens used:', result.data.usage.totalTokens);
  }
}
```

### Using axios
```javascript
import axios from 'axios';

async function sendLLMMessage(sessionId, token, message) {
  try {
    const response = await axios.post(
      `http://localhost:3001/api/sessions/${sessionId}/messages/llm`,
      {
        content: message,
        stream: false,
        temperature: 0.7
      },
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    return response.data.data;
  } catch (error) {
    console.error('Error sending message:', error.response?.data || error.message);
    throw error;
  }
}
```

## Python Example

### Using requests
```python
import requests
import json

def send_llm_message(session_id, token, message, stream=False):
    url = f"http://localhost:3001/api/sessions/{session_id}/messages/llm"
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    data = {
        "content": message,
        "stream": stream,
        "temperature": 0.7
    }
    
    if stream:
        response = requests.post(url, headers=headers, json=data, stream=True)
        for line in response.iter_lines():
            if line:
                line = line.decode('utf-8')
                if line.startswith('data: '):
                    event_data = json.loads(line[6:])
                    if event_data.get('chunk'):
                        print(event_data['chunk'], end='', flush=True)
                    if event_data.get('isComplete'):
                        print()  # New line after completion
    else:
        response = requests.post(url, headers=headers, json=data)
        result = response.json()
        return result['data']
```

## Error Handling Examples

### Invalid API Key
```json
{
  "success": false,
  "error": {
    "code": "LLM_PROVIDER_ERROR",
    "message": "Invalid OpenAI API key"
  }
}
```

### Rate Limit Exceeded
```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "OpenAI rate limit exceeded"
  }
}
```

### Session Not Found
```json
{
  "success": false,
  "error": {
    "code": "SESSION_NOT_FOUND",
    "message": "Session not found or access denied"
  }
}
```

## Advanced Usage

### With Persona Context
1. Create a session with a persona:
```bash
curl -X POST http://localhost:3001/api/sessions \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "personaId": "persona_123",
    "title": "Poetry Session"
  }'
```

2. Send messages to that session - they will automatically use the persona's:
   - Identity (system prompt)
   - Constraints
   - Examples (few-shot learning)
   - Model preferences (if configured)

### Custom Model Parameters
```json
{
  "content": "Explain quantum computing",
  "temperature": 0.3,  // More deterministic
  "maxTokens": 2000,   // Longer responses
  "topP": 0.9,         // Nucleus sampling
  "frequencyPenalty": 0.5,  // Reduce repetition
  "presencePenalty": 0.5    // Encourage new topics
}
```

## Testing with Mock Provider

When no API keys are configured, the system uses a mock provider:

```bash
# Response will be simulated without calling real API
curl -X POST http://localhost:3001/api/sessions/test-session/messages/llm \
  -H "Authorization: Bearer test-token" \
  -H "Content-Type: application/json" \
  -d '{
    "content": "Test message",
    "stream": true
  }'
```

Mock responses include:
- Simulated latency (100ms for non-streaming, 50ms per chunk for streaming)
- Realistic token counting
- Example responses based on input

## Best Practices

1. **Use streaming for interactive applications** - provides better user experience
2. **Set appropriate temperature** - 0.7 for creative tasks, 0.3 for factual responses
3. **Monitor token usage** - track costs and optimize prompts
4. **Handle errors gracefully** - implement retry logic for transient failures
5. **Use personas for specialized tasks** - leverage the persona system for consistent behavior
6. **Implement client-side debouncing** - prevent rapid successive requests