/**
 * Tool Registry
 * Manages tool definitions and handlers
 */

import { ToolDefinition, ToolRegistry, ToolHandler, ToolContext } from './tool.types';
import { ToolValidator } from './tool.validator';

export class ToolRegistryService {
  private static instance: ToolRegistryService;
  private registry: ToolRegistry = {};
  private handlers: Map<string, ToolHandler> = new Map();

  private constructor() {}

  static getInstance(): ToolRegistryService {
    if (!ToolRegistryService.instance) {
      ToolRegistryService.instance = new ToolRegistryService();
    }
    return ToolRegistryService.instance;
  }

  /**
   * Register a tool
   */
  registerTool(tool: ToolDefinition, handler: ToolHandler): void {
    // Validate tool definition
    const errors = ToolValidator.validateToolDefinition(tool);
    if (errors.length > 0) {
      throw new Error(`Invalid tool definition: ${errors.map(e => e.message).join(', ')}`);
    }

    // Check for duplicate tool ID
    if (this.registry[tool.id]) {
      throw new Error(`Tool with ID '${tool.id}' already registered`);
    }

    // Register tool
    this.registry[tool.id] = tool;
    this.handlers.set(tool.id, handler);
  }

  /**
   * Unregister a tool
   */
  unregisterTool(toolId: string): void {
    delete this.registry[toolId];
    this.handlers.delete(toolId);
  }

  /**
   * Get tool by ID
   */
  getTool(toolId: string): ToolDefinition | null {
    return this.registry[toolId] || null;
  }

  /**
   * Get all tools
   */
  getAllTools(): ToolDefinition[] {
    return Object.values(this.registry);
  }

  /**
   * Get tools by persona ID
   */
  getToolsByPersona(personaId: string): ToolDefinition[] {
    return Object.values(this.registry).filter(
      tool => tool.personaId === personaId || !tool.personaId
    );
  }

  /**
   * Get tools by category
   */
  getToolsByCategory(category: string): ToolDefinition[] {
    return Object.values(this.registry).filter(
      tool => tool.category === category
    );
  }

  /**
   * Execute a tool
   */
  async executeTool(
    toolId: string,
    parameters: Record<string, any>,
    context: ToolContext
  ): Promise<any> {
    const tool = this.getTool(toolId);
    if (!tool) {
      throw new Error(`Tool '${toolId}' not found`);
    }

    const handler = this.handlers.get(toolId);
    if (!handler) {
      throw new Error(`Handler for tool '${toolId}' not found`);
    }

    // Validate parameters
    const validation = ToolValidator.validateParameters(tool, parameters);
    if (!validation.isValid) {
      throw new Error(`Invalid parameters: ${validation.errors.map(e => e.message).join(', ')}`);
    }

    // Execute handler
    try {
      const result = await handler(validation.validatedParameters, context);
      return result;
    } catch (error) {
      throw new Error(`Tool execution failed: ${error}`);
    }
  }

  /**
   * Get tool schema for LLM function calling
   */
  getToolSchema(toolId: string): any {
    const tool = this.getTool(toolId);
    if (!tool) {
      return null;
    }

    return {
      name: tool.name,
      description: tool.description,
      parameters: {
        type: 'object',
        properties: tool.parameters.reduce((acc, param) => {
          acc[param.name] = {
            type: param.type,
            description: param.description,
            enum: param.enum,
          };
          return acc;
        }, {} as Record<string, any>),
        required: tool.parameters.filter(p => p.required).map(p => p.name),
      },
    };
  }

  /**
   * Get all tool schemas for LLM function calling
   */
  getAllToolSchemas(): any[] {
    return Object.values(this.registry).map(tool => this.getToolSchema(tool.id));
  }

  /**
   * Clear registry (for testing)
   */
  clear(): void {
    this.registry = {};
    this.handlers.clear();
  }
}