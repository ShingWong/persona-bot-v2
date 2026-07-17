import { sql } from '../lib/db';
import { PersonaCreateInput, PersonaUpdateInput } from '../types/persona';

interface PersonaRow {
  id: string;
  name: string;
  description: string | null;
  systemPrompt: string | null;
  avatarUrl: string | null;
  isActive: boolean;
  isDefault: boolean;
  modelId: string | null;
  temperature: number | null;
  maxTokens: number | null;
  toolsEnabled: boolean;
  memoryEnabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class PersonaService {
  static async createPersona(data: PersonaCreateInput): Promise<PersonaRow> {
    const result = await sql<PersonaRow[]>`
      INSERT INTO "Persona" (name, description, "systemPrompt", "avatarUrl", "isActive", "isDefault", "modelId", temperature, "maxTokens", "toolsEnabled", "memoryEnabled")
      VALUES (${data.name}, ${data.description || null}, ${data.systemPrompt || null}, ${data.avatarUrl || null}, ${data.isActive ?? true}, ${data.isDefault ?? false}, ${data.modelId || null}, ${data.temperature || null}, ${data.maxTokens || null}, ${data.toolsEnabled ?? false}, ${data.memoryEnabled ?? false})
      RETURNING *
    `;
    return result[0];
  }

  static async getPersonas(): Promise<PersonaRow[]> {
    return sql<PersonaRow[]>`
      SELECT * FROM "Persona"
      WHERE "isActive" = true
      ORDER BY "createdAt" DESC
    `;
  }

  static async getPersonaById(id: string): Promise<PersonaRow | null> {
    const personas = await sql<PersonaRow[]>`SELECT * FROM "Persona" WHERE id = ${id}`;
    return personas[0] || null;
  }

  static async updatePersona(id: string, data: PersonaUpdateInput): Promise<PersonaRow> {
    const persona = await this.getPersonaById(id);
    if (!persona) {
      throw {
        code: 'PERSONA_NOT_FOUND',
        message: 'Persona not found',
        statusCode: 404,
      };
    }

    const result = await sql<PersonaRow[]>`
      UPDATE "Persona" 
      SET name = ${data.name || persona.name},
          description = ${data.description !== undefined ? data.description : persona.description},
          "systemPrompt" = ${data.systemPrompt !== undefined ? data.systemPrompt : persona.systemPrompt},
          "avatarUrl" = ${data.avatarUrl !== undefined ? data.avatarUrl : persona.avatarUrl},
          "isActive" = ${data.isActive !== undefined ? data.isActive : persona.isActive},
          "isDefault" = ${data.isDefault !== undefined ? data.isDefault : persona.isDefault},
          "modelId" = ${data.modelId !== undefined ? data.modelId : persona.modelId},
          temperature = ${data.temperature !== undefined ? data.temperature : persona.temperature},
          "maxTokens" = ${data.maxTokens !== undefined ? data.maxTokens : persona.maxTokens},
          "toolsEnabled" = ${data.toolsEnabled !== undefined ? data.toolsEnabled : persona.toolsEnabled},
          "memoryEnabled" = ${data.memoryEnabled !== undefined ? data.memoryEnabled : persona.memoryEnabled},
          "updatedAt" = NOW()
      WHERE id = ${id}
      RETURNING *
    `;
    return result[0];
  }

  static async deletePersona(id: string): Promise<PersonaRow> {
    const result = await sql<PersonaRow[]>`
      UPDATE "Persona" 
      SET "isActive" = false, "updatedAt" = NOW()
      WHERE id = ${id}
      RETURNING *
    `;
    return result[0];
  }

  static async hardDeletePersona(id: string): Promise<void> {
    await sql`DELETE FROM "Persona" WHERE id = ${id}`;
  }

  static async createDefaultPersonas(): Promise<PersonaRow[]> {
    const defaultPersonas = [
      {
        name: 'Jane',
        description: 'AI Router - Helps direct queries to the right persona',
        systemPrompt: 'You are Jane, an AI router assistant. Your job is to analyze user queries and determine which specialized persona would be best suited to handle them. You should ask clarifying questions when needed and then route to the appropriate expert persona.',
        isDefault: true,
      },
      {
        name: 'Yoda',
        description: 'Toyota Expert - Specialized in Toyota vehicles and automotive advice',
        systemPrompt: 'You are Yoda, a Toyota automotive expert with decades of experience. You know everything about Toyota vehicles - from maintenance and repairs to model specifications and troubleshooting.',
        isDefault: true,
      },
      {
        name: 'Bobby',
        description: 'IT Support Specialist - Helps with computer and tech issues',
        systemPrompt: 'You are Bobby, an IT support specialist with 15 years of experience. You are friendly, patient, and great at explaining technical concepts in simple terms.',
        isDefault: true,
      },
    ];

    const createdPersonas: PersonaRow[] = [];
    
    for (const personaData of defaultPersonas) {
      // Check if persona already exists
      const existing = await sql<PersonaRow[]>`
        SELECT * FROM "Persona" WHERE name = ${personaData.name} AND "isDefault" = true
      `;

      if (existing.length === 0) {
        const result = await sql<PersonaRow[]>`
          INSERT INTO "Persona" (name, description, "systemPrompt", "isDefault", "isActive")
          VALUES (${personaData.name}, ${personaData.description}, ${personaData.systemPrompt}, true, true)
          RETURNING *
        `;
        createdPersonas.push(result[0]);
      }
    }

    return createdPersonas;
  }
}
