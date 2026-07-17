import { Router } from 'express';
import { PersonaService } from '../../services/persona.service';
import { validate } from '../../middleware/validation.middleware';
import { authenticate, requireRole } from '../../middleware/auth.middleware';
import { createPersonaSchema, updatePersonaSchema } from '../../validation/persona.schema';

const router = Router();

// All persona routes require authentication
router.use(authenticate);

// GET /api/personas - Get all personas
router.get('/', async (_req, res) => {
  try {
    const personas = await PersonaService.getPersonas();
    
    res.json({
      success: true,
      data: personas,
      count: personas.length,
    });
  } catch (error) {
    console.error('Error fetching personas:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'FETCH_PERSONAS_FAILED',
        message: 'Failed to fetch personas',
      },
    });
  }
});

// GET /api/personas/:id - Get persona by ID
router.get('/:id', async (req, res) => {
  try {
    const id = req.params.id as string;
    const persona = await PersonaService.getPersonaById(id);
    
    if (!persona) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'PERSONA_NOT_FOUND',
          message: 'Persona not found',
        },
      });
    }
    
    return res.json({
      success: true,
      data: persona,
    });
  } catch (error) {
    console.error('Error fetching persona:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'FETCH_PERSONA_FAILED',
        message: 'Failed to fetch persona',
      },
    });
  }
});

// POST /api/personas - Create new persona
router.post('/', validate(createPersonaSchema), async (req, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'NOT_AUTHENTICATED',
          message: 'Not authenticated',
        },
      });
    }

    const persona = await PersonaService.createPersona(req.body);
    
    return res.status(201).json({
      success: true,
      data: persona,
    });
  } catch (error) {
    console.error('Error creating persona:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'CREATE_PERSONA_FAILED',
        message: 'Failed to create persona',
      },
    });
  }
});

// PUT /api/personas/:id - Update persona
router.put('/:id', validate(updatePersonaSchema), async (req, res) => {
  try {
    const id = req.params.id as string;
    
    // Check if persona exists
    const existingPersona = await PersonaService.getPersonaById(id);
    if (!existingPersona) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'PERSONA_NOT_FOUND',
          message: 'Persona not found',
        },
      });
    }
    
    const updatedPersona = await PersonaService.updatePersona(id, req.body);
    
    return res.json({
      success: true,
      data: updatedPersona,
    });
  } catch (error) {
    console.error('Error updating persona:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'UPDATE_PERSONA_FAILED',
        message: 'Failed to update persona',
      },
    });
  }
});

// DELETE /api/personas/:id - Soft delete persona (set isActive to false)
router.delete('/:id', async (req, res) => {
  try {
    const id = req.params.id as string;
    
    // Check if persona exists
    const existingPersona = await PersonaService.getPersonaById(id);
    if (!existingPersona) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'PERSONA_NOT_FOUND',
          message: 'Persona not found',
        },
      });
    }
    
    const deletedPersona = await PersonaService.deletePersona(id);
    
    return res.json({
      success: true,
      data: deletedPersona,
      message: 'Persona deactivated successfully',
    });
  } catch (error) {
    console.error('Error deleting persona:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'DELETE_PERSONA_FAILED',
        message: 'Failed to delete persona',
      },
    });
  }
});

// POST /api/personas/seed - Seed default personas (admin only)
router.post('/seed', requireRole(['ADMIN']), async (_req, res) => {
  try {
    const defaultPersonas = await PersonaService.createDefaultPersonas();
    
    res.status(201).json({
      success: true,
      data: defaultPersonas,
      message: `Created ${defaultPersonas.length} default personas`,
    });
  } catch (error) {
    console.error('Error seeding default personas:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'SEED_PERSONAS_FAILED',
        message: 'Failed to seed default personas',
      },
    });
  }
});

export default router;