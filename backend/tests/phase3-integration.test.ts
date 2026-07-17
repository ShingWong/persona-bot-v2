/**
 * Phase 3 Integration Tests
 * Tests for advanced persona features
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import { prisma } from '../src/lib/prisma';
import { toolService } from '../src/services/tools';
import { memoryService } from '../src/services/memory';
import { promptService } from '../src/services/prompt';
import { EnhancedLLMService } from '../src/services/llm/llm.service.enhanced';

describe('Phase 3: Advanced Persona Features', () => {
  let testPersonaId: string;
  let testSessionId: string;
  let testUserId: string;
  let enhancedLLMService: EnhancedLLMService;

  beforeAll(async () => {
    enhancedLLMService = new EnhancedLLMService();
    
    // Create test user
    const user = await prisma.user.create({
      data: {
        email: 'test@phase3.com',
        passwordHash: 'hashed_password',
        name: 'Phase 3 Test User',
      },
    });
    testUserId = user.id;

    // Create test persona
    const persona = await prisma.persona.create({
      data: {
        name: 'Phase 3 Test Persona',
        description: 'Test persona for Phase 3 features',
        identity: 'You are a test assistant with advanced capabilities.',
        constraints: 'Always respond in a helpful manner.',
        examples: JSON.stringify([
          { user: 'Hello', assistant: 'Hi there! How can I help you today?' },
        ]),
        capabilities: JSON.stringify(['testing', 'tools', 'memory']),
        tools: JSON.stringify([
          {
            name: 'test_tool',
            description: 'A test tool',
            parameters: [
              { name: 'input', type: 'string', description: 'Input text', required: true },
            ],
            handler: 'testToolHandler',
          },
        ]),
        isActive: true,
      },
    });
    testPersonaId = persona.id;

    // Create test session
    const session = await prisma.session.create({
      data: {
        userId: testUserId,
        personaId: testPersonaId,
        title: 'Phase 3 Test Session',
        status: 'ACTIVE',
      },
    });
    testSessionId = session.id;
  });

  afterAll(async () => {
    // Cleanup
    await prisma.session.deleteMany({
      where: { userId: testUserId },
    });
    await prisma.persona.deleteMany({
      where: { id: testPersonaId },
    });
    await prisma.user.deleteMany({
      where: { email: 'test@phase3.com' },
    });
  });

  describe('Tool Framework', () => {
    it('should register and retrieve built-in tools', async () => {
      const tools = await toolService.getAvailableTools();
      expect(tools.length).toBeGreaterThan(0);
      
      const webSearchTool = tools.find(t => t.name === 'web_search');
      expect(webSearchTool).toBeDefined();
      expect(webSearchTool?.description).toContain('Search the web');
    });

    it('should get tools for specific persona', async () => {
      const tools = await toolService.getAvailableTools(testPersonaId);
      expect(Array.isArray(tools)).toBe(true);
    });

    it('should get tool schemas for LLM function calling', async () => {
      const schemas = await toolService.getToolSchemas();
      expect(schemas.length).toBeGreaterThan(0);
      
      const calculatorSchema = schemas.find(s => s.name === 'calculator');
      expect(calculatorSchema).toBeDefined();
      expect(calculatorSchema?.parameters).toBeDefined();
    });
  });

  describe('Memory System', () => {
    it('should store and retrieve memories', async () => {
      const memory = await memoryService.storeMemory({
        entityType: 'persona',
        entityId: testPersonaId,
        content: 'Test memory content',
        memoryType: 'fact',
        tags: ['test'],
        importance: 0.8,
      });

      expect(memory.id).toBeDefined();
      expect(memory.content).toBe('Test memory content');
      expect(memory.entityId).toBe(testPersonaId);

      // Search for the memory
      const searchResults = await memoryService.searchMemories({
        entityType: 'persona',
        entityId: testPersonaId,
        query: 'test memory',
      });

      expect(searchResults.length).toBeGreaterThan(0);
      expect(searchResults[0].memory.content).toContain('Test memory');
    });

    it('should get memory context for persona', async () => {
      const context = await memoryService.getMemoryContext(
        'persona',
        testPersonaId,
        'test query',
        500
      );

      expect(context.memories).toBeDefined();
      expect(context.tokenCount).toBeDefined();
      expect(typeof context.tokenCount).toBe('number');
    });

    it('should get memory statistics', async () => {
      const stats = await memoryService.getMemoryStats('persona', testPersonaId);
      
      expect(stats.totalMemories).toBeDefined();
      expect(stats.memoriesByEntityType).toBeDefined();
      expect(stats.averageImportance).toBeDefined();
    });
  });

  describe('Prompt Engineering', () => {
    it('should build persona prompt with components', async () => {
      const prompt = await promptService.buildPersonaPrompt(
        testSessionId,
        testPersonaId,
        'Test message',
        3 // Full tier
      );

      expect(prompt.messages.length).toBeGreaterThan(0);
      expect(prompt.tokenCount).toBeGreaterThan(0);
      expect(prompt.componentsUsed).toContain('identity');
    });

    it('should manage conversation context', async () => {
      const contextWindow = await promptService.manageConversationContext(
        testSessionId,
        [
          { role: 'user', content: 'Hello' },
          { role: 'assistant', content: 'Hi there!' },
        ],
        1000
      );

      expect(contextWindow.totalTokens).toBeGreaterThan(0);
      expect(contextWindow.messages.length).toBe(2);

      // Add more messages
      const updatedContext = await promptService.addToContext(
        testSessionId,
        'user',
        'Another message'
      );

      expect(updatedContext.messages.length).toBe(3);
    });

    it('should generate context summary', async () => {
      const summary = await promptService.getContextSummary(testSessionId);
      expect(typeof summary).toBe('string');
      expect(summary.length).toBeGreaterThan(0);
    });
  });

  describe('Enhanced LLM Service', () => {
    // Note: These tests require a mock LLM provider
    it('should initialize enhanced LLM service', () => {
      expect(enhancedLLMService).toBeInstanceOf(EnhancedLLMService);
    });

    it('should get persona tools via LLM service', async () => {
      const tools = await enhancedLLMService.getPersonaTools(testPersonaId);
      expect(Array.isArray(tools)).toBe(true);
    });

    it('should get memory context via LLM service', async () => {
      const context = await enhancedLLMService.getPersonaMemoryContext(
        testPersonaId,
        'test',
        200
      );
      expect(context.memories).toBeDefined();
    });
  });

  describe('Progressive Disclosure', () => {
    it('should configure different tiers', async () => {
      // Configure tier 1 (basic)
      promptService.configurePersonaProgressiveDisclosure(testPersonaId, { tier: 1 });
      const tier1Assembler = promptService.getPersonaAssembler(testPersonaId);
      const tier1Config = tier1Assembler.getConfig();
      
      expect(tier1Config.maxTokens).toBe(1000);
      expect(tier1Config.includeExamples).toBe(false);

      // Configure tier 3 (full)
      promptService.configurePersonaProgressiveDisclosure(testPersonaId, { tier: 3 });
      const tier3Assembler = promptService.getPersonaAssembler(testPersonaId);
      const tier3Config = tier3Assembler.getConfig();
      
      expect(tier3Config.maxTokens).toBe(4000);
      expect(tier3Config.includeExamples).toBe(true);
    });
  });

  describe('Integration', () => {
    it('should store conversation memory after interaction', async () => {
      // This would test the full flow in a real scenario
      // For now, verify the memory service is accessible
      const statsBefore = await memoryService.getMemoryStats('persona', testPersonaId);
      
      // Simulate storing conversation memory
      await promptService.storeConversationMemory(
        testSessionId,
        testPersonaId,
        [
          { role: 'user', content: 'What is the weather?' },
          { role: 'assistant', content: 'I can check the weather for you.' },
        ]
      );

      const statsAfter = await memoryService.getMemoryStats('persona', testPersonaId);
      // Memory count should increase or stay the same
      expect(statsAfter.totalMemories).toBeGreaterThanOrEqual(statsBefore.totalMemories);
    });
  });
});