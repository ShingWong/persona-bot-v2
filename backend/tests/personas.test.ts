import request from 'supertest';
import express from 'express';
import { PersonaService } from '../src/services/persona.service';
import personaRoutes from '../src/api/personas/persona.routes';

// Mock the PersonaService
jest.mock('../src/services/persona.service');

const app = express();
app.use(express.json());
app.use('/api/personas', personaRoutes);

describe('Persona API', () => {
  const mockUserId = 'user-123';
  const mockPersona = {
    id: 'persona-123',
    name: 'Test Persona',
    description: 'Test Description',
    identity: 'Test Identity',
    constraints: 'Test Constraints',
    examples: {},
    capabilities: [],
    tools: [],
    memoryEnabled: true,
    memoryLimit: 10,
    isActive: true,
    isDefault: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/personas', () => {
    it('should return all personas', async () => {
      const mockPersonas = [mockPersona];
      (PersonaService.getPersonas as jest.Mock).mockResolvedValue(mockPersonas);

      const response = await request(app)
        .get('/api/personas')
        .set('Authorization', 'Bearer mock-token');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockPersonas);
      expect(response.body.count).toBe(1);
    });

    it('should handle errors when fetching personas', async () => {
      (PersonaService.getPersonas as jest.Mock).mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .get('/api/personas')
        .set('Authorization', 'Bearer mock-token');

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('FETCH_PERSONAS_FAILED');
    });
  });

  describe('GET /api/personas/:id', () => {
    it('should return persona by ID', async () => {
      (PersonaService.getPersonaById as jest.Mock).mockResolvedValue(mockPersona);

      const response = await request(app)
        .get('/api/personas/persona-123')
        .set('Authorization', 'Bearer mock-token');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockPersona);
    });

    it('should return 404 when persona not found', async () => {
      (PersonaService.getPersonaById as jest.Mock).mockResolvedValue(null);

      const response = await request(app)
        .get('/api/personas/nonexistent')
        .set('Authorization', 'Bearer mock-token');

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('PERSONA_NOT_FOUND');
    });

    it('should handle errors when fetching persona', async () => {
      (PersonaService.getPersonaById as jest.Mock).mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .get('/api/personas/persona-123')
        .set('Authorization', 'Bearer mock-token');

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('FETCH_PERSONA_FAILED');
    });
  });

  describe('POST /api/personas', () => {
    const createData = {
      name: 'New Persona',
      identity: 'New Identity',
      description: 'New Description',
    };

    it('should create a new persona', async () => {
      (PersonaService.createPersona as jest.Mock).mockResolvedValue({
        ...mockPersona,
        ...createData,
      });

      const response = await request(app)
        .post('/api/personas')
        .set('Authorization', 'Bearer mock-token')
        .send(createData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe(createData.name);
    });

    it('should validate request body', async () => {
      const invalidData = {
        name: '', // Empty name should fail validation
        identity: 'Test',
      };

      const response = await request(app)
        .post('/api/personas')
        .set('Authorization', 'Bearer mock-token')
        .send(invalidData);

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should handle errors when creating persona', async () => {
      (PersonaService.createPersona as jest.Mock).mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .post('/api/personas')
        .set('Authorization', 'Bearer mock-token')
        .send(createData);

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('CREATE_PERSONA_FAILED');
    });
  });

  describe('PUT /api/personas/:id', () => {
    const updateData = {
      name: 'Updated Persona',
      description: 'Updated Description',
    };

    it('should update an existing persona', async () => {
      (PersonaService.getPersonaById as jest.Mock).mockResolvedValue(mockPersona);
      (PersonaService.updatePersona as jest.Mock).mockResolvedValue({
        ...mockPersona,
        ...updateData,
      });

      const response = await request(app)
        .put('/api/personas/persona-123')
        .set('Authorization', 'Bearer mock-token')
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe(updateData.name);
    });

    it('should return 404 when persona not found', async () => {
      (PersonaService.getPersonaById as jest.Mock).mockResolvedValue(null);

      const response = await request(app)
        .put('/api/personas/nonexistent')
        .set('Authorization', 'Bearer mock-token')
        .send(updateData);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('PERSONA_NOT_FOUND');
    });

    it('should handle errors when updating persona', async () => {
      (PersonaService.getPersonaById as jest.Mock).mockResolvedValue(mockPersona);
      (PersonaService.updatePersona as jest.Mock).mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .put('/api/personas/persona-123')
        .set('Authorization', 'Bearer mock-token')
        .send(updateData);

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('UPDATE_PERSONA_FAILED');
    });
  });

  describe('DELETE /api/personas/:id', () => {
    it('should soft delete a persona', async () => {
      (PersonaService.getPersonaById as jest.Mock).mockResolvedValue(mockPersona);
      (PersonaService.deletePersona as jest.Mock).mockResolvedValue({
        ...mockPersona,
        isActive: false,
      });

      const response = await request(app)
        .delete('/api/personas/persona-123')
        .set('Authorization', 'Bearer mock-token');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.isActive).toBe(false);
      expect(response.body.message).toBe('Persona deactivated successfully');
    });

    it('should return 404 when persona not found', async () => {
      (PersonaService.getPersonaById as jest.Mock).mockResolvedValue(null);

      const response = await request(app)
        .delete('/api/personas/nonexistent')
        .set('Authorization', 'Bearer mock-token');

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('PERSONA_NOT_FOUND');
    });

    it('should handle errors when deleting persona', async () => {
      (PersonaService.getPersonaById as jest.Mock).mockResolvedValue(mockPersona);
      (PersonaService.deletePersona as jest.Mock).mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .delete('/api/personas/persona-123')
        .set('Authorization', 'Bearer mock-token');

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('DELETE_PERSONA_FAILED');
    });
  });
});