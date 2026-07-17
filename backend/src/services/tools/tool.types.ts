/**
 * Tool Framework Types
 * Defines tool schemas, validation, and execution types
 */

export interface ToolParameter {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  description: string;
  required: boolean;
  enum?: string[];
  default?: any;
  schema?: Record<string, any>; // JSON Schema for object/array types
}

export interface ToolDefinition {
  id: string;
  name: string;
  description: string;
  parameters: ToolParameter[];
  returns: {
    type: 'string' | 'number' | 'boolean' | 'object' | 'array';
    description: string;
  };
  handler: string; // Function name or identifier
  category?: string;
  personaId?: string; // If tool is persona-specific
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ToolExecutionRequest {
  toolId: string;
  parameters: Record<string, any>;
  sessionId: string;
  userId: string;
  personaId?: string;
}

export interface ToolExecutionResult {
  success: boolean;
  result?: any;
  error?: string;
  executionTime: number;
  tokensUsed?: number;
}

export interface ToolRegistry {
  [toolId: string]: ToolDefinition;
}

export interface ToolContext {
  sessionId: string;
  userId: string;
  personaId?: string;
  messages: any[]; // Session messages for context
  metadata: Record<string, any>;
}

export interface ToolHandler {
  (parameters: Record<string, any>, context: ToolContext): Promise<any>;
}

export interface ToolValidationError {
  field: string;
  message: string;
}

export interface ToolValidationResult {
  isValid: boolean;
  errors: ToolValidationError[];
  validatedParameters: Record<string, any>;
}