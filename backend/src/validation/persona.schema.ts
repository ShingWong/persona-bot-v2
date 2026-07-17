import { z } from 'zod';

export const createPersonaSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
  description: z.string().max(500, 'Description too long').optional(),
  avatarUrl: z.string().url('Invalid URL').optional(),
  identity: z.string().min(1, 'Identity is required').max(5000, 'Identity too long'),
  constraints: z.string().max(5000, 'Constraints too long').optional(),
  examples: z.any().optional(),
  modelId: z.string().optional(),
  modelParams: z.any().optional(),
  capabilities: z.any().optional(),
  tools: z.any().optional(),
  memoryEnabled: z.boolean().optional(),
  memoryLimit: z.number().int().min(1).max(100).optional(),
  routingRules: z.any().optional(),
  isActive: z.boolean().optional(),
  isDefault: z.boolean().optional(),
});

export const updatePersonaSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name too long').optional(),
  description: z.string().max(500, 'Description too long').optional(),
  avatarUrl: z.string().url('Invalid URL').optional(),
  identity: z.string().min(1, 'Identity is required').max(5000, 'Identity too long').optional(),
  constraints: z.string().max(5000, 'Constraints too long').optional(),
  examples: z.any().optional(),
  modelId: z.string().optional(),
  modelParams: z.any().optional(),
  capabilities: z.any().optional(),
  tools: z.any().optional(),
  memoryEnabled: z.boolean().optional(),
  memoryLimit: z.number().int().min(1).max(100).optional(),
  routingRules: z.any().optional(),
  isActive: z.boolean().optional(),
  isDefault: z.boolean().optional(),
});

export const personaIdSchema = z.object({
  id: z.string().min(1, 'Persona ID is required'),
});