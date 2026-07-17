/**
 * Usage Tracker Tests
 */

import { UsageTracker } from '../usage.tracker';
import { CostCalculator } from '../cost.calculator';
import { sql } from '../../../lib/db';

// Mock dependencies
jest.mock('../cost.calculator');
jest.mock('../../../lib/db', () => ({
  sql: jest.fn(),
}));

describe('UsageTracker', () => {
  let tracker: UsageTracker;
  let mockCostCalculator: jest.Mocked<CostCalculator>;

  beforeEach(() => {
    tracker = UsageTracker.getInstance();
    mockCostCalculator = CostCalculator.getInstance() as jest.Mocked<CostCalculator>;
    jest.clearAllMocks();
  });

  describe('trackMessage', () => {
    it('should track message usage and update counters', async () => {
      const mockMessage = {
        id: 'msg-123',
        inputTokens: 100,
        outputTokens: 200,
        totalTokens: 300,
        modelId: 'model-123',
        createdAt: new Date(),
      };

      const mockCost = {
        inputTokens: 100,
        outputTokens: 200,
        inputCost: 0.003,
        outputCost: 0.012,
        totalCost: 0.015,
        costPerToken: 0.00005,
        modelId: 'model-123',
        provider: 'openai',
        modelIdentifier: 'gpt-4',
      };

      (sql as jest.Mock).mockImplementation((query) => {
        if (query.includes('FROM "Message"') && query.includes('WHERE id =')) {
          return Promise.resolve([mockMessage]);
        } else if (query.includes('UPDATE "Session"') && query.includes('SET "totalTokens"')) {
          return Promise.resolve([]);
        } else if (query.includes('FROM "User"') && query.includes('WHERE id =')) {
          return Promise.resolve([{
            id: 'user-123',
            monthly_token_limit: 1000000,
            monthly_cost_limit: 100,
          }]);
        } else if (query.includes('UPDATE "User"') && query.includes('SET "monthlyTokensUsed"')) {
          return Promise.resolve([]);
        } else if (query.includes('INSERT INTO "AuditLog"')) {
          return Promise.resolve([]);
        }
        return Promise.resolve([]);
      });
      mockCostCalculator.calculateMessageCost.mockResolvedValue(mockCost);

      await tracker.trackMessage('msg-123', 'session-123', 'user-123', 'persona-123');

      // Verify message was fetched
      expect(sql).toHaveBeenCalledWith(expect.stringContaining('FROM "Message"'));
      expect(sql).toHaveBeenCalledWith(expect.stringContaining('WHERE id ='));

      // Verify cost was calculated
      expect(mockCostCalculator.calculateMessageCost).toHaveBeenCalledWith('msg-123');

      // Verify session was updated
      expect(sql).toHaveBeenCalledWith(expect.stringContaining('UPDATE "Session"'));
      expect(sql).toHaveBeenCalledWith(expect.stringContaining('SET "totalTokens"'));

      // Verify user usage was updated
      expect(sql).toHaveBeenCalledWith(expect.stringContaining('UPDATE "User"'));
              apiCalls: 1,
              cost: 0.015,
            }),
          }),
        },
      });

      // Verify audit log was created
      expect(sql).toHaveBeenCalledWith(expect.stringContaining('INSERT INTO "AuditLog"'));
    });

    it('should throw error for non-existent message', async () => {
      (sql as jest.Mock).mockResolvedValue([]);

      await expect(
        tracker.trackMessage('non-existent', 'session-123', 'user-123')
      ).rejects.toThrow('Message non-existent not found');
    });
  });

  describe('trackApiCall', () => {
    it('should track API call usage', async () => {
      (sql as jest.Mock).mockImplementation((query) => {
        if (query.includes('FROM "User"') && query.includes('WHERE id =')) {
          return Promise.resolve([{
            id: 'user-123',
            settings_json: {},
          }]);
        } else if (query.includes('UPDATE "User"') && query.includes('SET "apiCallsUsed"')) {
          return Promise.resolve([]);
        } else if (query.includes('INSERT INTO "AuditLog"')) {
          return Promise.resolve([]);
        }
        return Promise.resolve([]);
      });

      await tracker.trackApiCall('user-123', '/api/test', { test: 'data' });

      // Verify user usage was updated
      expect(sql).toHaveBeenCalledWith(expect.stringContaining('UPDATE "User"'));
      expect(sql).toHaveBeenCalledWith(expect.stringContaining('SET "monthlyTokensUsed"'));

      // Verify audit log was created
      expect(sql).toHaveBeenCalledWith(expect.stringContaining('INSERT INTO "AuditLog"'));
          createdAt: expect.any(Date),
        },
      });
    });
  });

  describe('getRealTimeUsage', () => {
    it('should return real-time usage data', async () => {
      const mockHourlyUsage = [{ total_tokens: 1500, total_cost: 0.045 }];
      const mockApiKey = { rateLimit: 1000, lastUsedAt: new Date() };

      // Mock sql queries
      (sql as jest.Mock).mockImplementation((query) => {
        if (query.includes('SUM("totalTokens")') && query.includes('FROM "Message"')) {
          return Promise.resolve(mockHourlyUsage);
        } else if (query.includes('FROM "ApiKey"') && query.includes('WHERE "userId"')) {
          return Promise.resolve([mockApiKey]);
        }
        return Promise.resolve([]);
      });

      const result = await tracker.getRealTimeUsage('user-123');

      expect(result.userId).toBe('user-123');
      expect(result.currentTokens).toBe(1500);
      expect(result.currentCost).toBe(0.045);
      expect(result.rateLimit).toBe(1000);
      expect(result.rateLimitRemaining).toBe(1000); // Default calculation
      expect(result.rateLimitReset).toBeInstanceOf(Date);
    });
  });
});