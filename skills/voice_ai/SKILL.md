# Voice AI Skill

Speech-to-Text and Text-to-Speech integration for persona-bot.

## Architecture

```
┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐
│  User   │───▶│   STT   │───▶│ Persona │───▶│   TTS   │───▶│  User  │
│ (Voice) │    │ (Speech)│    │  (LLM)  │    │ (Speech)│    │ (Voice)│
└─────────┘    └─────────┘    └─────────┘    └─────────┘
                   │                              │
                   ▼                              ▼
            ┌──────────┐                  ┌──────────┐
            │  Whisper │                  │  ElevenLabs│
            │ (Local)  │                  │  (Cloud)  │
            └──────────┘                  └──────────┘
```

## STT Options

### Cloud Providers
- **OpenAI Whisper API** - High accuracy, paid
- **Google Cloud Speech** - Fast, accurate
- **AWS Transcribe** - Enterprise features

### Local (Self-Hosted)
- **Whisper.cpp** - OpenAI Whisper local
- **Faster Whisper** - Optimized version
- **Coqui** - Open source alternative

## TTS Options

### Cloud Providers
- **ElevenLabs** - Highest quality, natural voices
- **OpenAI TTS** - Good quality, integrated
- **Google Cloud TTS** - Multiple voices, languages

### Local (Self-Hosted)
- **Coqui TTS** - Open source
- **Piper** - Fast, low resource
- **VITS** - High quality, training required

## Integration

### Backend Service

```typescript
// services/voice.ts
export class VoiceService {
  async speechToText(audioBuffer: Buffer): Promise<string> {
    // Use configured STT provider
    switch (process.env.STT_PROVIDER) {
      case 'whisper':
        return this.whisperTranscribe(audioBuffer);
      case 'google':
        return this.googleTranscribe(audioBuffer);
      default:
        throw new Error('Unknown STT provider');
    }
  }

  async textToSpeech(text: string, voiceId?: string): Promise<Buffer> {
    // Use configured TTS provider
    switch (process.env.TTS_PROVIDER) {
      case 'elevenlabs':
        return this.elevenLabsSpeak(text, voiceId);
      case 'openai':
        return this.openaiSpeak(text);
      default:
        throw new Error('Unknown TTS provider');
    }
  }
}
```

### WebRTC for Real-Time

```typescript
// For real-time voice interaction
const peerConnection = new RTCPeerConnection({
  iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
});

// Audio stream from microphone
const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
audioStream.getTracks().forEach(track => peerConnection.addTrack(track, audioStream));
```

## Persona Voice Configuration

```json
{
  "persona": {
    "name": "Yoda",
    "voice": {
      "provider": "elevenlabs",
      "voice_id": "rachel",
      "settings": {
        "stability": 0.5,
        "similarity_boost": 0.75
      }
    }
  }
}
```

## Mobile Considerations

1. **Streaming** - Use streaming STT/TTS for lower latency
2. **Offline** - Cache common responses
3. **Background** - Handle app backgrounding gracefully
4. **Battery** - Optimize audio processing

## Testing

```bash
# Test STT
curl -X POST http://localhost:3001/api/voice/stt \
  --data-binary @audio.wav

# Test TTS
curl -X POST http://localhost:3001/api/voice/tts \
  -H 'Content-Type: application/json' \
  -d '{"text": "Hello, I am Yoda.", "voice_id": "rachel"}'
```

## Cost Optimization

| Provider | STT/min | TTS/1k chars |
|----------|---------|--------------|
| Whisper API | $0.006 | - |
| ElevenLabs | - | $0.03 |
| Local Whisper.cpp | $0 (GPU) | - |
