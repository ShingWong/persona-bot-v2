'use client';

import { Message } from '@/lib/api/session';
import { cn } from '@/lib/utils';
import { Bot, User } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface MessageBubbleProps {
  message: Message;
  isStreaming?: boolean;
}

export function MessageBubble({ message, isStreaming = false }: MessageBubbleProps) {
  const isUser = message.role === 'USER';
  const isAssistant = message.role === 'ASSISTANT';

  return (
    <div
      className={cn(
        'flex gap-4 p-4',
        isUser ? 'bg-muted/50' : 'bg-background',
        isStreaming && 'animate-pulse'
      )}
    >
      <div className="flex-shrink-0">
        <div
          className={cn(
            'flex h-8 w-8 items-center justify-center rounded-full',
            isUser ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'
          )}
        >
          {isUser ? (
            <User className="h-4 w-4" />
          ) : (
            <Bot className="h-4 w-4" />
          )}
        </div>
      </div>

      <div className="flex-1 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">
            {isUser ? 'You' : 'Assistant'}
          </span>
          <span className="text-xs text-muted-foreground">
            {new Date(message.createdAt).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </span>
        </div>

        <div className="prose prose-sm max-w-none dark:prose-invert">
          <ReactMarkdown>{message.content}</ReactMarkdown>
        </div>

        {isAssistant && (
          <div className="flex items-center gap-4 pt-2 text-xs text-muted-foreground">
            {message.modelUsed && (
              <span className="rounded-full bg-secondary px-2 py-1">
                {message.modelUsed}
              </span>
            )}
            {message.outputTokens > 0 && (
              <span>Tokens: {message.outputTokens}</span>
            )}
            {message.latencyMs && (
              <span>Latency: {message.latencyMs}ms</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}