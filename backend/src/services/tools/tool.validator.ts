/**
 * Tool Validator
 * Validates tool parameters against schemas
 */

import { ToolDefinition, ToolParameter, ToolValidationResult, ToolValidationError } from './tool.types';

export class ToolValidator {
  /**
   * Validate parameters against tool definition
   */
  static validateParameters(
    tool: ToolDefinition,
    parameters: Record<string, any>
  ): ToolValidationResult {
    const errors: ToolValidationError[] = [];
    const validatedParameters: Record<string, any> = {};

    // Check required parameters
    for (const param of tool.parameters) {
      const value = parameters[param.name];
      
      if (param.required && (value === undefined || value === null)) {
        errors.push({
          field: param.name,
          message: `Required parameter '${param.name}' is missing`
        });
        continue;
      }

      // If parameter has a default and value is not provided, use default
      if (value === undefined && param.default !== undefined) {
        validatedParameters[param.name] = param.default;
        continue;
      }

      // Skip validation for optional parameters that are not provided
      if (!param.required && value === undefined) {
        continue;
      }

      // Type validation
      const typeError = this.validateType(param, value);
      if (typeError) {
        errors.push(typeError);
        continue;
      }

      // Enum validation
      if (param.enum && !param.enum.includes(value)) {
        errors.push({
          field: param.name,
          message: `Parameter '${param.name}' must be one of: ${param.enum.join(', ')}`
        });
        continue;
      }

      // Schema validation for objects/arrays
      if (param.schema && (param.type === 'object' || param.type === 'array')) {
        const schemaError = this.validateSchema(param, value);
        if (schemaError) {
          errors.push(schemaError);
          continue;
        }
      }

      validatedParameters[param.name] = value;
    }

    // Check for extra parameters not defined in schema
    const definedParamNames = new Set(tool.parameters.map(p => p.name));
    for (const paramName in parameters) {
      if (!definedParamNames.has(paramName)) {
        errors.push({
          field: paramName,
          message: `Unexpected parameter '${paramName}'`
        });
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      validatedParameters
    };
  }

  /**
   * Validate parameter type
   */
  private static validateType(param: ToolParameter, value: any): ToolValidationError | null {
    const type = param.type;
    
    switch (type) {
      case 'string':
        if (typeof value !== 'string') {
          return {
            field: param.name,
            message: `Parameter '${param.name}' must be a string`
          };
        }
        break;
      
      case 'number':
        if (typeof value !== 'number' || isNaN(value)) {
          return {
            field: param.name,
            message: `Parameter '${param.name}' must be a number`
          };
        }
        break;
      
      case 'boolean':
        if (typeof value !== 'boolean') {
          return {
            field: param.name,
            message: `Parameter '${param.name}' must be a boolean`
          };
        }
        break;
      
      case 'object':
        if (typeof value !== 'object' || value === null || Array.isArray(value)) {
          return {
            field: param.name,
            message: `Parameter '${param.name}' must be an object`
          };
        }
        break;
      
      case 'array':
        if (!Array.isArray(value)) {
          return {
            field: param.name,
            message: `Parameter '${param.name}' must be an array`
          };
        }
        break;
    }

    return null;
  }

  /**
   * Validate against JSON schema
   */
  private static validateSchema(param: ToolParameter, value: any): ToolValidationError | null {
    // Basic schema validation - can be extended with full JSON Schema validation
    if (!param.schema) return null;

    try {
      // For objects, check required properties
      if (param.type === 'object' && param.schema.required) {
        const requiredProps = param.schema.required || [];
        for (const prop of requiredProps) {
          if (value[prop] === undefined) {
            return {
              field: param.name,
              message: `Object parameter '${param.name}' missing required property: ${prop}`
            };
          }
        }
      }

      // For arrays, check item type if specified
      if (param.type === 'array' && param.schema.items) {
        const itemSchema = param.schema.items;
        for (let i = 0; i < value.length; i++) {
          const item = value[i];
          // Basic type checking for array items
          if (itemSchema.type && typeof item !== itemSchema.type) {
            return {
              field: param.name,
              message: `Array parameter '${param.name}' item at index ${i} must be of type ${itemSchema.type}`
            };
          }
        }
      }
    } catch (error) {
      return {
        field: param.name,
        message: `Failed to validate schema for parameter '${param.name}': ${error}`
      };
    }

    return null;
  }

  /**
   * Validate tool definition
   */
  static validateToolDefinition(tool: Partial<ToolDefinition>): ToolValidationError[] {
    const errors: ToolValidationError[] = [];

    if (!tool.id) {
      errors.push({ field: 'id', message: 'Tool ID is required' });
    }

    if (!tool.name) {
      errors.push({ field: 'name', message: 'Tool name is required' });
    }

    if (!tool.description) {
      errors.push({ field: 'description', message: 'Tool description is required' });
    }

    if (!tool.handler) {
      errors.push({ field: 'handler', message: 'Tool handler is required' });
    }

    if (!tool.parameters || !Array.isArray(tool.parameters)) {
      errors.push({ field: 'parameters', message: 'Tool parameters must be an array' });
    } else {
      // Validate each parameter
      tool.parameters.forEach((param, index) => {
        if (!param.name) {
          errors.push({ field: `parameters[${index}].name`, message: 'Parameter name is required' });
        }
        if (!param.type) {
          errors.push({ field: `parameters[${index}].type`, message: 'Parameter type is required' });
        }
        if (!param.description) {
          errors.push({ field: `parameters[${index}].description`, message: 'Parameter description is required' });
        }
        if (param.required === undefined) {
          errors.push({ field: `parameters[${index}].required`, message: 'Parameter required flag is required' });
        }
      });
    }

    if (!tool.returns) {
      errors.push({ field: 'returns', message: 'Tool return type is required' });
    } else {
      if (!tool.returns.type) {
        errors.push({ field: 'returns.type', message: 'Return type is required' });
      }
      if (!tool.returns.description) {
        errors.push({ field: 'returns.description', message: 'Return description is required' });
      }
    }

    return errors;
  }
}