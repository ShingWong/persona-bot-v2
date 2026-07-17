import { z } from 'zod';

export const createSessionSchema = z.object({
  title: z.string().min(1).max(100).optional(),
  personaId: z.string().cuid().optional(),
  aiModelId: z.string().cuid().optional(),
  modelOverride: z.string().max(100).optional(),
});

export const updateSessionSchema = z.object({
  title: z.string().min(1).max(100).optional(),
  status: z.enum(['ACTIVE', 'ARCHIVED', 'DELETED']).optional(),
});

export const createMessageSchema = z.object({
  role: z.enum(['USER', 'ASSISTANT', 'SYSTEM']),
  content: z.string().min(1).max(10000),
  contentJson: z.any().optional().nullable(),
  inputTokens: z.number().int().min(0).default(0),
  outputTokens: z.number().int().min(0).default(0),
  modelId: z.string().cuid().optional(),
  modelUsed: z.string().max(100).optional(),
  latencyMs: z.number().int().min(0).optional(),
});

export const getMessagesQuerySchema = z.object({
  limit: z.string().regex(/^\d+$/).optional().default('50'),
  offset: z.string().regex(/^\d+$/).optional().default('0'),
});

export const getSessionsQuerySchema = z.object({
  status: z.enum(['ACTIVE', 'ARCHIVED', 'DELETED']).optional(),
  limit: z.string().regex(/^\d+$/).optional().default('20'),
  offset: z.string().regex(/^\d+$/).optional().default('0'),
});

export const sendMessageToLLMSchema = z.object({
  content: z.string().min(1).max(10000),
  stream: z.boolean().optional().default(false),
  temperature: z.number().min(0).max(2).optional(),
  maxTokens: z.number().int().min(1).max(4000).optional(),
});