/**
 * Tool Service
 * Main service for tool management and execution
 */

import { sql } from '../../lib/db';
import { ToolRegistryService } from './tool.registry';
import { ToolExecutor } from './tool.executor';
import { BuiltinTools } from './builtin.tools';
import { ToolDefinition, ToolExecutionRequest, ToolExecutionResult } from './tool.types';

export class ToolService {
  private registry = ToolRegistryService.getInstance();
  private executor = new ToolExecutor();

  constructor() {
    this.initialize();
  }

  /**
   * Initialize tool service
   */
  private initialize(): void {
    // Register built-in tools
    BuiltinTools.registerAll();

    // Load persona-specific tools from database
    this.loadPersonaTools().catch(error => {
      console.error('Failed to load persona tools:', error);
    });
  }

  /**
   * Load persona-specific tools from database
   */
  private async loadPersonaTools(): Promise<void> {
    try {
      const personas = await sql`
        SELECT id, tools
        FROM "Persona"
        WHERE "isActive" = true
      `;

      for (const persona of personas) {
        if (persona.tools && Array.isArray(persona.tools)) {
          await this.registerPersonaTools(persona.id, persona.tools);
        }
      }
    } catch (error) {
      console.error('Error loading persona tools:', error);
    }
  }

  /**
   * Register tools for a persona
   */
  async registerPersonaTools(personaId: string, tools: any[]): Promise<void> {
    for (const toolData of tools) {
      try {
        const tool: ToolDefinition = {
          id: `persona_${personaId}_${toolData.name}`,
          name: toolData.name,
          description: toolData.description,
          parameters: toolData.parameters || [],
          returns: toolData.returns || { type: 'string', description: 'Tool result' },
          handler: toolData.handler,
          category: toolData.category,
          personaId,
          isActive: true,
        };

        // Register tool with a mock handler for now
        // In production, these would be loaded from modules
        this.registry.registerTool(tool, async (params, _context) => {
          return {
            tool: tool.name,
            parameters: params,
            personaId,
            note: 'Persona-specific tool handler not implemented',
          };
        });
      } catch (error) {
        console.error(`Failed to register tool for persona ${personaId}:`, error);
      }
    }
  }

  /**
   * Execute a tool
   */
  async executeTool(request: ToolExecutionRequest): Promise<ToolExecutionResult> {
    return this.executor.execute(request);
  }

  /**
   * Get available tools for a persona
   */
  async getAvailableTools(personaId?: string): Promise<any[]> {
    return this.executor.getAvailableTools(personaId);
  }

  /**
   * Get tool schemas for LLM function calling
   */
  async getToolSchemas(personaId?: string): Promise<any[]> {
    return this.executor.getToolSchemas(personaId);
  }

  /**
   * Handle LLM function call
   */
  async handleFunctionCall(
    functionCall: any,
    sessionId: string,
    userId: string,
    personaId?: string
  ): Promise<ToolExecutionResult> {
    return this.executor.handleFunctionCall(functionCall, sessionId, userId, personaId);
  }

  /**
   * Update persona tools in database
   */
  async updatePersonaTools(personaId: string, tools: any[]): Promise<void> {
    try {
      await sql`
        UPDATE "Persona"
        SET tools = ${JSON.stringify(tools)}
        WHERE id = ${personaId}
      `;

      // Unregister old tools for this persona
      const oldTools = this.registry.getAllTools().filter(t => t.personaId === personaId);
      oldTools.forEach(tool => this.registry.unregisterTool(tool.id));

      // Register new tools
      await this.registerPersonaTools(personaId, tools);
    } catch (error) {
      throw new Error(`Failed to update persona tools: ${error}`);
    }
  }

  /**
   * Create a new tool
   */
  async createTool(tool: ToolDefinition): Promise<void> {
    this.registry.registerTool(tool, async (params, _context) => {
      // Default handler - should be overridden by actual implementation
      return {
        tool: tool.name,
        parameters: params,
        note: 'Custom tool handler not implemented',
      };
    });
  }

  /**
   * Delete a tool
   */
  async deleteTool(toolId: string): Promise<void> {
    this.registry.unregisterTool(toolId);
  }

  /**
   * Get tool by ID
   */
  async getTool(toolId: string): Promise<any> {
    const tool = this.registry.getTool(toolId);
    if (!tool) {
      return null;
    }

    return {
      id: tool.id,
      name: tool.name,
      description: tool.description,
      parameters: tool.parameters,
      returns: tool.returns,
      category: tool.category,
      personaId: tool.personaId,
      isActive: tool.isActive,
    };
  }

  /**
   * Get all tools
   */
  async getAllTools(): Promise<any[]> {
    return this.registry.getAllTools().map(tool => ({
      id: tool.id,
      name: tool.name,
      description: tool.description,
      category: tool.category,
      personaId: tool.personaId,
      isActive: tool.isActive,
    }));
  }

  /**
   * Validate tool execution
   */
  async validateToolExecution(
    toolId: string,
    parameters: Record<string, any>
  ): Promise<{ isValid: boolean; errors: string[] }> {
    return this.executor.validateToolParameters(toolId, parameters);
  }

  /**
   * Format tool result for display
   */
  formatResult(result: ToolExecutionResult): string {
    return this.executor.formatToolResultForLLM(result);
  }
}