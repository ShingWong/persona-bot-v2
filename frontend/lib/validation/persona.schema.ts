import { z } from 'zod';

export const personaSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
  description: z.string().max(500, 'Description too long').optional(),
  avatarUrl: z.string().url('Invalid URL').optional(),
  identity: z.string().min(1, 'Identity is required').max(5000, 'Identity too long'),
  constraints: z.string().max(5000, 'Constraints too long').optional(),
  examples: z.unknown().optional(),
  modelId: z.string().optional(),
  modelParams: z.unknown().optional(),
  capabilities: z.unknown().optional(),
  tools: z.unknown().optional(),
  memoryEnabled: z.boolean().optional(),
  memoryLimit: z.number().int().min(1).max(100).optional(),
  routingRules: z.unknown().optional(),
  isActive: z.boolean().optional(),
  isDefault: z.boolean().optional(),
});

export const createPersonaSchema = personaSchema;

export const updatePersonaSchema = personaSchema.partial();

export type PersonaFormData = z.infer<typeof personaSchema>;
export type CreatePersonaFormData = z.infer<typeof createPersonaSchema>;
export type UpdatePersonaFormData = z.infer<typeof updatePersonaSchema>;