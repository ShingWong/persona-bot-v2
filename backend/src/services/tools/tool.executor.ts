/**
 * Tool Executor
 * Handles tool execution and integration with LLM service
 */

import { ToolRegistryService } from './tool.registry';
import { ToolExecutionRequest, ToolExecutionResult, ToolContext } from './tool.types';

export class ToolExecutor {
  private registry = ToolRegistryService.getInstance();

  /**
   * Execute a tool request
   */
  async execute(request: ToolExecutionRequest): Promise<ToolExecutionResult> {
    const startTime = Date.now();
    
    try {
      // Create tool context
      const context: ToolContext = {
        sessionId: request.sessionId,
        userId: request.userId,
        personaId: request.personaId,
        messages: [], // Will be populated from session
        metadata: {
          executionTime: new Date().toISOString(),
        },
      };

      // Execute tool
      const result = await this.registry.executeTool(
        request.toolId,
        request.parameters,
        context
      );

      const executionTime = Date.now() - startTime;

      return {
        success: true,
        result,
        executionTime,
      };
    } catch (error) {
      const executionTime = Date.now() - startTime;
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        executionTime,
      };
    }
  }

  /**
   * Execute multiple tools in parallel
   */
  async executeMultiple(requests: ToolExecutionRequest[]): Promise<ToolExecutionResult[]> {
    return Promise.all(requests.map(request => this.execute(request)));
  }

  /**
   * Get available tools for a persona
   */
  getAvailableTools(personaId?: string): any[] {
    const tools = personaId 
      ? this.registry.getToolsByPersona(personaId)
      : this.registry.getAllTools();

    return tools.map(tool => ({
      id: tool.id,
      name: tool.name,
      description: tool.description,
      category: tool.category,
      parameters: tool.parameters,
    }));
  }

  /**
   * Get tool schemas for LLM function calling
   */
  getToolSchemas(personaId?: string): any[] {
    const tools = personaId 
      ? this.registry.getToolsByPersona(personaId)
      : this.registry.getAllTools();

    return tools.map(tool => this.registry.getToolSchema(tool.id));
  }

  /**
   * Parse LLM function call and execute appropriate tool
   */
  async handleFunctionCall(
    functionCall: any,
    sessionId: string,
    userId: string,
    personaId?: string
  ): Promise<ToolExecutionResult> {
    if (!functionCall || !functionCall.name) {
      throw new Error('Invalid function call: missing name');
    }

    // Find tool by name
    const tools = this.registry.getAllTools();
    const tool = tools.find(t => t.name === functionCall.name);
    
    if (!tool) {
      throw new Error(`Tool '${functionCall.name}' not found`);
    }

    const request: ToolExecutionRequest = {
      toolId: tool.id,
      parameters: functionCall.arguments || {},
      sessionId,
      userId,
      personaId,
    };

    return this.execute(request);
  }

  /**
   * Format tool result for LLM response
   */
  formatToolResultForLLM(result: ToolExecutionResult): string {
    if (!result.success) {
      return `Tool execution failed: ${result.error}`;
    }

    if (typeof result.result === 'string') {
      return result.result;
    }

    try {
      return JSON.stringify(result.result, null, 2);
    } catch {
      return String(result.result);
    }
  }

  /**
   * Check if a tool exists
   */
  toolExists(toolId: string): boolean {
    return this.registry.getTool(toolId) !== null;
  }

  /**
   * Validate tool parameters without execution
   */
  validateToolParameters(toolId: string, parameters: Record<string, any>): {
    isValid: boolean;
    errors: string[];
  } {
    const tool = this.registry.getTool(toolId);
    if (!tool) {
      return {
        isValid: false,
        errors: [`Tool '${toolId}' not found`],
      };
    }

    // Note: Actual validation happens in ToolRegistry.executeTool
    // This is a lightweight check
    const requiredParams = tool.parameters.filter(p => p.required);
    const missingParams = requiredParams.filter(
      p => parameters[p.name] === undefined
    );

    if (missingParams.length > 0) {
      return {
        isValid: false,
        errors: missingParams.map(p => `Missing required parameter: ${p.name}`),
      };
    }

    return {
      isValid: true,
      errors: [],
    };
  }
}