# API Documentation Template

Copy this template and fill in your API details.

## Base URL

```
Production: https://api.persona-bot.com
Staging: https://api-staging.persona-bot.com
Development: http://localhost:3001
```

## Authentication

### JWT Authentication

```http
Authorization: Bearer <access_token>
```

### Obtaining Tokens

#### POST /api/auth/login

**Request:**
```json
{
  "email": "user@example.com",
  "password": "your-password"
}
```

**Response:**
```json
{
  "accessToken": "eyJhbGc...",
  "refreshToken": "eyJhbGc...",
  "expiresIn": 900,
  "user": {
    "id": "user_123",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "USER"
  }
}
```

#### POST /api/auth/refresh

**Request:**
```json
{
  "refreshToken": "eyJhbGc..."
}
```

**Response:**
```json
{
  "accessToken": "eyJhbGc...",
  "expiresIn": 900
}
```

## Rate Limiting

| Tier | Requests/minute |
|------|-----------------|
| Free | 60 |
| Pro | 300 |
| Enterprise | Unlimited |

Rate limit headers:
```
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 45
X-RateLimit-Reset: 1640000000
```

## Error Responses

### 400 Bad Request
```json
{
  "error": "VALIDATION_ERROR",
  "message": "Invalid email format",
  "details": [
    { "field": "email", "message": "Must be a valid email" }
  ]
}
```

### 401 Unauthorized
```json
{
  "error": "UNAUTHORIZED",
  "message": "Invalid or expired token"
}
```

### 403 Forbidden
```json
{
  "error": "FORBIDDEN",
  "message": "Insufficient permissions"
}
```

### 429 Too Many Requests
```json
{
  "error": "RATE_LIMITED",
  "message": "Too many requests",
  "retryAfter": 60
}
```

### 500 Internal Server Error
```json
{
  "error": "INTERNAL_ERROR",
  "message": "An unexpected error occurred",
  "requestId": "req_abc123"
}
```

## Endpoints

### Users

#### GET /api/users/me

Get current user profile.

**Response:**
```json
{
  "id": "user_123",
  "email": "user@example.com",
  "name": "John Doe",
  "avatarUrl": "https://...",
  "role": "USER",
  "createdAt": "2024-01-01T00:00:00Z"
}
```

#### PUT /api/users/me

Update current user profile.

**Request:**
```json
{
  "name": "Jane Doe",
  "avatarUrl": "https://..."
}
```

---

### Personas

#### GET /api/personas

List all available personas.

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| active | boolean | Filter by active status |

**Response:**
```json
[
  {
    "id": "persona_jane",
    "name": "Jane",
    "description": "Router and coordinator",
    "avatarUrl": "https://...",
    "isDefault": true
  }
]
```

#### POST /api/personas

Create a new persona (admin only).

**Request:**
```json
{
  "name": "Yoda",
  "description": "Toyota expert",
  "identity": "You are Yoda, a Toyota vehicle expert...",
  "modelId": "claude-sonnet",
  "modelParams": {
    "temperature": 0.7
  }
}
```

---

### Chat

#### POST /api/chat/message

Send a message to a persona.

**Request:**
```json
{
  "personaId": "persona_yoda",
  "message": "How do I change my oil?",
  "stream": false
}
```

**Response:**
```json
{
  "sessionId": "session_123",
  "message": {
    "id": "msg_456",
    "role": "ASSISTANT",
    "content": "To change your oil...",
    "createdAt": "2024-01-01T00:00:00Z"
  }
}
```

#### WebSocket /api/chat/stream

Real-time streaming chat.

```javascript
const ws = new WebSocket('wss://api.persona-bot.com/api/chat/stream');

ws.onopen = () => {
  ws.send(JSON.stringify({
    type: 'message',
    personaId: 'persona_yoda',
    message: 'Hello!'
  }));
};

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  // { type: 'chunk', content: 'Hello' }
  // { type: 'done' }
};
```

---

### Models

#### GET /api/models

List available AI models.

**Response:**
```json
[
  {
    "id": "model_123",
    "provider": "openai",
    "modelIdentifier": "gpt-4",
    "displayName": "GPT-4",
    "capabilities": ["chat", "streaming"],
    "isActive": true,
    "isDefault": false
  }
]
```

---

### API Keys

#### GET /api/keys

List user's API keys.

**Response:**
```json
[
  {
    "id": "key_123",
    "name": "My App",
    "keyPrefix": "pk_live_...",
    "rateLimit": 60,
    "lastUsedAt": "2024-01-01T00:00:00Z",
    "createdAt": "2024-01-01T00:00:00Z"
  }
]
```

#### POST /api/keys

Create a new API key.

**Request:**
```json
{
  "name": "My App",
  "rateLimit": 60
}
```

**Response:**
```json
{
  "id": "key_123",
  "key": "pk_live_abc123...",  // Only shown once!
  "name": "My App",
  "keyPrefix": "pk_live_",
  "rateLimit": 60,
  "createdAt": "2024-01-01T00:00:00Z"
}
```

---

## Webhooks

### Configuring Webhooks

#### POST /api/webhooks

**Request:**
```json
{
  "url": "https://your-server.com/webhook",
  "events": ["chat.started", "chat.ended"],
  "secret": "your-webhook-secret"
}
```

### Event Types

| Event | Description |
|-------|-------------|
| `user.registered` | New user registered |
| `chat.started` | New chat session started |
| `chat.ended` | Chat session ended |
| `usage.exceeded` | User exceeded quota |

### Webhook Payload

```json
{
  "event": "chat.ended",
  "timestamp": "2024-01-01T00:00:00Z",
  "data": {
    "sessionId": "session_123",
    "userId": "user_123",
    "personaId": "persona_yoda",
    "messagesCount": 10,
    "tokensUsed": 5000
  }
}
```

### Verifying Webhooks

```javascript
const crypto = require('crypto');

function verifyWebhook(payload, signature, secret) {
  const expected = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
  
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expected)
  );
}
```
