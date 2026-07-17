/**
 * Cost Calculator Tests
 */

import { CostCalculator } from '../cost.calculator';
import { sql } from '../../../lib/db';

// Mock sql (postgres.js)
jest.mock('../../../lib/db', () => ({
  sql: jest.fn(),
}));

describe('CostCalculator', () => {
  let calculator: CostCalculator;

  beforeEach(() => {
    calculator = CostCalculator.getInstance();
    jest.clearAllMocks();
  });

  describe('calculateCost', () => {
    it('should calculate cost with model pricing', async () => {
      const mockModel = {
        id: 'model-123',
        provider: 'openai',
        modelIdentifier: 'gpt-4',
        costPer1kInput: 0.03,
        costPer1kOutput: 0.06,
        updatedAt: new Date(),
      };

      (sql as jest.Mock).mockResolvedValue([mockModel]);

      const result = await calculator.calculateCost(1000, 500, 'model-123');

      expect(result.inputTokens).toBe(1000);
      expect(result.outputTokens).toBe(500);
      expect(result.inputCost).toBe(0.03); // 1K input * $0.03/1K
      expect(result.outputCost).toBe(0.03); // 0.5K output * $0.06/1K
      expect(result.totalCost).toBe(0.06);
      expect(result.provider).toBe('openai');
      expect(result.modelIdentifier).toBe('gpt-4');
    });

    it('should use default pricing when model not found', async () => {
      (prisma.aIModel.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await calculator.calculateCost(1000, 500);

      expect(result.inputCost).toBe(0.01); // Default $0.01/1K
      expect(result.outputCost).toBe(0.015); // Default $0.03/1K * 0.5
      expect(result.totalCost).toBe(0.025);
      expect(result.provider).toBe('unknown');
    });

    it('should handle zero tokens', async () => {
      const result = await calculator.calculateCost(0, 0, 'model-123');

      expect(result.inputCost).toBe(0);
      expect(result.outputCost).toBe(0);
      expect(result.totalCost).toBe(0);
      expect(result.costPerToken).toBe(0);
    });
  });

  describe('calculateMessageCost', () => {
    it('should calculate cost for a message', async () => {
      const mockMessage = {
        id: 'msg-123',
        inputTokens: 100,
        outputTokens: 200,
        modelId: 'model-123',
        aiModel: {
          provider: 'openai',
          modelIdentifier: 'gpt-4',
          costPer1kInput: 0.03,
          costPer1kOutput: 0.06,
        },
      };

      (prisma.message.findUnique as jest.Mock).mockResolvedValue(mockMessage);

      const result = await calculator.calculateMessageCost('msg-123');

      expect(result.inputTokens).toBe(100);
      expect(result.outputTokens).toBe(200);
      expect(result.inputCost).toBe(0.003); // 0.1K * $0.03
      expect(result.outputCost).toBe(0.012); // 0.2K * $0.06
      expect(result.totalCost).toBe(0.015);
    });

    it('should throw error for non-existent message', async () => {
      (prisma.message.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(calculator.calculateMessageCost('non-existent')).rejects.toThrow(
        'Message non-existent not found'
      );
    });
  });

  describe('updatePricing', () => {
    it('should update pricing for a model', async () => {
      const updateMock = jest.fn().mockResolvedValue({});
      (prisma.aIModel.update as jest.Mock).mockImplementation(updateMock);

      await calculator.updatePricing('model-123', 0.02, 0.04);

      expect(updateMock).toHaveBeenCalledWith({
        where: { id: 'model-123' },
        data: {
          costPer1kInput: 0.02,
          costPer1kOutput: 0.04,
          updatedAt: expect.any(Date),
        },
      });
    });
  });
});