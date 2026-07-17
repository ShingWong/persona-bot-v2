# MCP Server Developer Skill

Build custom Model Context Protocol (MCP) servers for external integrations.

## MCP Architecture

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   User      │────▶│  Persona    │────▶│  MCP Server │
│   Request   │     │  (LLM)      │     │  (Tool)     │
└─────────────┘     └─────────────┘     └─────────────┘
                                              │
                                              ▼
                                       ┌─────────────┐
                                       │ External    │
                                       │ Service     │
                                       │ (API)       │
                                       └─────────────┘
```

## MCP Server Structure

```typescript
// src/mcp/server-name.ts
import { McpServer, Tool } from '@modelcontextprotocol/sdk';

export const server = new McpServer({
  name: 'server-name',
  version: '1.0.0',
});

// Define tools
server.tool('tool_name', {
  description: 'What this tool does',
  parameters: {
    type: 'object',
    properties: {
      param1: { type: 'string', description: 'Parameter description' }
    },
    required: ['param1']
  }
}, async ({ param1 }) => {
  // Implementation
  return {
    content: [{
      type: 'text',
      text: 'Result'
    }]
  };
});
```

## Example: VoIP.ms SMS

```typescript
// src/mcp/voipms.ts
import { McpServer } from '@modelcontextprotocol/sdk';

const server = new McpServer({
  name: 'voipms',
  version: '1.0.0',
});

server.tool('send_sms', {
  description: 'Send an SMS message',
  parameters: {
    type: 'object',
    properties: {
      to: { type: 'string', description: 'Recipient phone number' },
      message: { type: 'string', description: 'Message content' }
    },
    required: ['to', 'message']
  }
}, async ({ to, message }) => {
  const response = await fetch('https://voip.ms/api/v1/rest.php', {
    method: 'POST',
    body: JSON.stringify({
      api_username: process.env.VOIP_MS_EMAIL,
      api_password: process.env.VOIP_MS_PASSWORD,
      method: 'sendSMS',
      to,
      message
    })
  });
  
  return {
    content: [{ type: 'text', text: JSON.stringify(await response.json()) }]
  };
});
```

## Integration Categories

### Cloud Storage
- **OneDrive**: Microsoft Graph API
- **Google Drive**: Google Drive API
- **Nextcloud**: WebDAV

### Communication
- **Email**: Gmail API, SMTP
- **Calendar**: Google Calendar, Microsoft Graph
- **SMS**: VoIP.ms, Twilio

### Productivity
- **Notion**: Notion API
- **Slack**: Slack API
- **Discord**: Discord API

## Security Best Practices

1. **Never expose credentials** - Use environment variables
2. **Validate input** - Sanitize all parameters
3. **Rate limiting** - Prevent abuse
4. **Error handling** - Don't leak sensitive info
5. **Logging** - Track usage without logging secrets

## Testing MCP Servers

```bash
# Test with npx
npx @modelcontextprotocol/inspector node dist/server.js

# Test tool invocation
curl -X POST http://localhost:3000/tools/execute \
  -H 'Content-Type: application/json' \
  -d '{"name": "send_sms", "parameters": {"to": "+1234", "message": "Hello"}}'
```

## Resources

- [MCP Specification](https://spec.modelcontextprotocol.io/)
- [MCP SDK](https://github.com/modelcontextprotocol/typescript-sdk)
