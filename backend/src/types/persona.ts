export interface PersonaCreateInput {
  name: string;
  description?: string;
  avatarUrl?: string;
  identity?: string;
  constraints?: string;
  examples?: any;
  modelId?: string;
  modelParams?: any;
  capabilities?: any;
  tools?: any;
  memoryEnabled?: boolean;
  memoryLimit?: number;
  routingRules?: any;
  isActive?: boolean;
  isDefault?: boolean;
  systemPrompt?: string;
  temperature?: number;
  maxTokens?: number;
  toolsEnabled?: boolean;
}

export interface PersonaUpdateInput {
  name?: string;
  description?: string;
  avatarUrl?: string;
  identity?: string;
  constraints?: string;
  examples?: any;
  modelId?: string;
  modelParams?: any;
  capabilities?: any;
  tools?: any;
  memoryEnabled?: boolean;
  memoryLimit?: number;
  routingRules?: any;
  isActive?: boolean;
  isDefault?: boolean;
  systemPrompt?: string;
  temperature?: number;
  maxTokens?: number;
  toolsEnabled?: boolean;
}

export interface PersonaResponse {
  id: string;
  name: string;
  description: string | null;
  avatarUrl: string | null;
  identity: string;
  constraints: string | null;
  examples: any;
  modelId: string | null;
  modelParams: any;
  capabilities: any;
  tools: any;
  memoryEnabled: boolean;
  memoryLimit: number;
  routingRules: any;
  isActive: boolean;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface PersonaError {
  code: string;
  message: string;
  statusCode: number;
}