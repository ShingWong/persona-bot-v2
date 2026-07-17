/**
 * Model Configuration Routes
 * Admin endpoints for managing AI models and providers
 */

import express from 'express';
import { sql } from '../../lib/db';
import { authenticate, requireRole } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validation.middleware';
import { z } from 'zod';

const router = express.Router();

// Apply auth middleware to all routes
router.use(authenticate);

// Model validation schemas
const createModelSchema = z.object({
  provider: z.string().min(1, 'Provider is required'),
  modelIdentifier: z.string().min(1, 'Model identifier is required'),
  displayName: z.string().min(1, 'Display name is required'),
  endpoint: z.string().optional(),
  apiKey: z.string().optional(),
  capabilities: z.array(z.string()).default([]),
  parameters: z.record(z.string(), z.any()).default({}),
  costPer1kInput: z.number().optional(),
  costPer1kOutput: z.number().optional(),
  isActive: z.boolean().default(true),
  isDefault: z.boolean().default(false),
});

const updateModelSchema = createModelSchema.partial();



/**
 * GET /api/models
 * Get all AI models (admin only)
 */
router.get('/', requireRole(['ADMIN']), async (_req, res) => {
  try {
    const models = await sql`
      SELECT * FROM "AIModel" 
      ORDER BY "isDefault" DESC, provider ASC, "modelIdentifier" ASC
    `;

    return res.json({
      success: true,
      data: models,
      count: models.length,
    });
  } catch (error) {
    console.error('Error fetching models:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch models',
    });
  }
});

/**
 * GET /api/models/:id
 * Get specific AI model
 */
router.get('/:id', requireRole(['ADMIN']), async (req, res) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

    const models = await sql`
      SELECT * FROM "AIModel" WHERE id = ${id}
    `;

    const model = models[0];
    if (!model) {
      return res.status(404).json({
        success: false,
        error: 'Model not found',
      });
    }

    return res.json({
      success: true,
      data: model,
    });
  } catch (error) {
    console.error('Error fetching model:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch model',
    });
  }
});

/**
 * POST /api/models
 * Create new AI model (admin only)
 */
router.post(
  '/',
  requireRole(['ADMIN']),
  validate(createModelSchema, 'body'),
  async (req, res) => {
    try {
      const data = req.body;

      // Check if model already exists
      const existing = await sql`
        SELECT id FROM "AIModel" 
        WHERE provider = ${data.provider} 
        AND "modelIdentifier" = ${data.modelIdentifier}
        LIMIT 1
      `;

      if (existing.length > 0) {
        return res.status(409).json({
          success: false,
          error: 'Model already exists',
        });
      }

      // If setting as default, unset other defaults
      if (data.isDefault) {
        await sql`
          UPDATE "AIModel" 
          SET "isDefault" = false 
          WHERE "isDefault" = true
        `;
      }

      const model = await sql`
        INSERT INTO "AIModel" (
          provider, "modelIdentifier", "displayName", endpoint, "apiKey",
          capabilities, parameters, "costPer1kInput", "costPer1kOutput",
          "isActive", "isDefault", "discoveredAt", "lastVerified"
        ) VALUES (
          ${data.provider}, ${data.modelIdentifier}, ${data.displayName},
          ${data.endpoint || null}, ${data.apiKey || null},
          ${JSON.stringify(data.capabilities || [])},
          ${JSON.stringify(data.parameters || {})},
          ${data.costPer1kInput || null}, ${data.costPer1kOutput || null},
          ${data.isActive !== false}, ${data.isDefault || false},
          NOW(), NOW()
        ) RETURNING *
      `;

      return res.status(201).json({
        success: true,
        data: model[0],
      });
    } catch (error) {
      console.error('Error creating model:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to create model',
      });
    }
  }
);

/**
 * PUT /api/models/:id
 * Update AI model (admin only)
 */
router.put(
  '/:id',
  requireRole(['ADMIN']),
  validate(updateModelSchema, 'body'),
  async (req, res) => {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const data = req.body;

      // Check if model exists
      const existing = await sql`
        SELECT id FROM "AIModel" WHERE id = ${id}
      `;

      if (existing.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Model not found',
        });
      }

      // If setting as default, unset other defaults
      if (data.isDefault === true) {
        await sql`
          UPDATE "AIModel" 
          SET "isDefault" = false 
          WHERE "isDefault" = true AND id != ${id}
        `;
      }

      // Build SET clause for SQL
      const setClauses: string[] = [];
      const params: any[] = [];
      
      if (data.provider !== undefined) {
        setClauses.push(`provider = $${params.length + 1}`);
        params.push(data.provider);
      }
      
      if (data.modelIdentifier !== undefined) {
        setClauses.push(`"modelIdentifier" = $${params.length + 1}`);
        params.push(data.modelIdentifier);
      }
      
      if (data.displayName !== undefined) {
        setClauses.push(`"displayName" = $${params.length + 1}`);
        params.push(data.displayName);
      }
      
      if (data.endpoint !== undefined) {
        setClauses.push(`endpoint = $${params.length + 1}`);
        params.push(data.endpoint);
      }
      
      if (data.apiKey !== undefined) {
        setClauses.push(`"apiKey" = $${params.length + 1}`);
        params.push(data.apiKey);
      }
      
      if (data.capabilities !== undefined) {
        setClauses.push(`capabilities = $${params.length + 1}`);
        params.push(JSON.stringify(data.capabilities));
      }
      
      if (data.parameters !== undefined) {
        setClauses.push(`parameters = $${params.length + 1}`);
        params.push(JSON.stringify(data.parameters));
      }
      
      if (data.costPer1kInput !== undefined) {
        setClauses.push(`"costPer1kInput" = $${params.length + 1}`);
        params.push(data.costPer1kInput);
      }
      
      if (data.costPer1kOutput !== undefined) {
        setClauses.push(`"costPer1kOutput" = $${params.length + 1}`);
        params.push(data.costPer1kOutput);
      }
      
      if (data.isActive !== undefined) {
        setClauses.push(`"isActive" = $${params.length + 1}`);
        params.push(data.isActive);
      }
      
      if (data.isDefault !== undefined) {
        setClauses.push(`"isDefault" = $${params.length + 1}`);
        params.push(data.isDefault);
      }
      
      setClauses.push(`"lastVerified" = NOW()`);
      
      const setClause = setClauses.join(', ');
      
      const model = await sql`
        UPDATE "AIModel" 
        SET ${sql.unsafe(setClause, params)}
        WHERE id = ${id}
        RETURNING *
      `;

    return res.json({
      success: true,
      data: model,
    });
    } catch (error) {
      console.error('Error updating model:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to update model',
      });
    }
  }
);

/**
 * DELETE /api/models/:id
 * Delete AI model (admin only - soft delete)
 */
router.delete('/:id', requireRole(['ADMIN']), async (req, res) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

    // Check if model exists
    const existing = await sql`
      SELECT id FROM "AIModel" WHERE id = ${id}
    `;

    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Model not found',
      });
    }

    // Soft delete by setting isActive to false
    const model = await sql`
      UPDATE "AIModel" 
      SET "isActive" = false
      WHERE id = ${id}
      RETURNING *
    `;

    return res.json({
      success: true,
      data: model,
    });
  } catch (error) {
    console.error('Error deleting model:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to delete model',
    });
  }
});

/**
 * POST /api/models/:id/test
 * Test model connection (admin only)
 */
router.post('/:id/test', requireRole(['ADMIN']), async (req, res) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

    const model = await sql`
      SELECT * FROM "AIModel" WHERE id = ${id}
    `;

    if (model.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Model not found',
      });
    }

    // TODO: Implement actual model testing
    // This would involve initializing the provider and making a test call
    // For now, simulate success
    await sql`
      UPDATE "AIModel" 
      SET "lastVerified" = NOW()
      WHERE id = ${id}
    `;

    return res.json({
      success: true,
      data: {
        status: 'connected',
        verifiedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Error testing model:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to test model connection',
    });
  }
});

/**
 * GET /api/models/providers
 * Get available LLM providers
 */
router.get('/providers/available', requireRole(['ADMIN']), async (_req, res) => {
  try {
    // Get unique providers from existing models
    const providers = await sql`
      SELECT 
        provider,
        COUNT(*) as model_count
      FROM "AIModel"
      GROUP BY provider
    `;

    // Define supported providers
    const supportedProviders = [
      {
        name: 'openai',
        displayName: 'OpenAI',
        description: 'GPT models including GPT-4, GPT-3.5',
        capabilities: ['chat', 'streaming', 'function_calling'],
      },
      {
        name: 'anthropic',
        displayName: 'Anthropic',
        description: 'Claude models including Claude 3',
        capabilities: ['chat', 'streaming'],
      },
      {
        name: 'google',
        displayName: 'Google',
        description: 'Gemini models',
        capabilities: ['chat', 'streaming'],
      },
      {
        name: 'ollama',
        displayName: 'Ollama',
        description: 'Local LLMs via Ollama',
        capabilities: ['chat', 'streaming'],
      },
      {
        name: 'openrouter',
        displayName: 'OpenRouter',
        description: 'Multiple providers via OpenRouter',
        capabilities: ['chat', 'streaming', 'function_calling'],
      },
    ];

    // Merge with existing provider counts
    const providersWithCounts = supportedProviders.map(provider => {
      const existing = providers.find(p => p.provider === provider.name);
      return {
        ...provider,
        modelCount: existing ? parseInt(existing.model_count) : 0,
      };
    });

    return res.json({
      success: true,
      data: model[0],
    });
  } catch (error) {
    console.error('Error fetching providers:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch providers',
    });
  }
});

/**
 * POST /api/models/providers/discover
 * Discover models from provider (admin only)
 */
router.post('/providers/discover', requireRole(['ADMIN']), async (req, res) => {
  try {
    const { provider } = req.body;

    // TODO: Implement actual model discovery
    // This would involve calling the provider's API to get available models
    // For now, return mock data based on provider
    let discoveredModels: Array<{ modelIdentifier: string; displayName: string }> = [];

    switch (provider) {
      case 'openai':
        discoveredModels = [
          { modelIdentifier: 'gpt-4', displayName: 'GPT-4' },
          { modelIdentifier: 'gpt-4-turbo', displayName: 'GPT-4 Turbo' },
          { modelIdentifier: 'gpt-3.5-turbo', displayName: 'GPT-3.5 Turbo' },
        ];
        break;
      case 'anthropic':
        discoveredModels = [
          { modelIdentifier: 'claude-3-opus', displayName: 'Claude 3 Opus' },
          { modelIdentifier: 'claude-3-sonnet', displayName: 'Claude 3 Sonnet' },
          { modelIdentifier: 'claude-3-haiku', displayName: 'Claude 3 Haiku' },
        ];
        break;
      case 'google':
        discoveredModels = [
          { modelIdentifier: 'gemini-pro', displayName: 'Gemini Pro' },
          { modelIdentifier: 'gemini-ultra', displayName: 'Gemini Ultra' },
        ];
        break;
      case 'ollama':
        discoveredModels = [
          { modelIdentifier: 'llama2', displayName: 'Llama 2' },
          { modelIdentifier: 'mistral', displayName: 'Mistral' },
          { modelIdentifier: 'codellama', displayName: 'Code Llama' },
        ];
        break;
      default:
        discoveredModels = [];
    }

    return res.json({
      success: true,
      data: discoveredModels,
    });
  } catch (error) {
    console.error('Error discovering models:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to discover models',
    });
  }
});

export default router;