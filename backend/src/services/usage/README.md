# Usage Tracking Service

## Overview
The Usage Tracking Service provides comprehensive monitoring, cost calculation, quota management, and analytics for persona-bot-v2. It tracks LLM usage per user, persona, and session while providing real-time cost calculations and quota enforcement.

## Architecture

### Core Components
1. **Cost Calculator** - Real-time cost calculation based on model pricing
2. **Usage Tracker** - Monitors and records usage metrics
3. **Quota Manager** - Defines and enforces usage quotas
4. **Usage Analytics** - Generates reports and forecasts
5. **Middleware** - Automatic tracking and quota enforcement
6. **API Routes** - REST endpoints for usage data

## Quick Start

### Basic Usage
```typescript
import { usageService } from './services/usage';

// Calculate cost for tokens
const cost = await usageService.calculateCost(1000, 500, 'model-123');

// Track message usage
await usageService.trackMessage('msg-123', 'session-123', 'user-123');

// Check quota
const canSend = await usageService.canPerformAction('user-123', 'send_message', 100);

// Get usage report
const report = await usageService.generateUsageReport('user-123');
```

### Middleware Integration
```typescript
import { trackUsage, enforceQuota } from '../middleware/usage.middleware';

// Apply to routes
app.use('/api/sessions', trackUsage);
app.post('/api/sessions/:id/messages', enforceQuota('send_message'));
```

## API Endpoints

### Cost Calculation
- `GET /api/usage/cost/estimate` - Estimate cost for tokens
- `GET /api/usage/cost/message/:messageId` - Calculate message cost
- `GET /api/usage/cost/session/:sessionId` - Calculate session cost
- `GET /api/usage/cost/user` - Calculate user cost

### Usage Tracking
- `GET /api/usage/metrics` - Get usage metrics
- `GET /api/usage/realtime` - Get real-time usage
- `GET /api/usage/trends` - Get usage trends

### Quota Management
- `GET /api/usage/quota` - Get quota information
- `POST /api/usage/quota/check` - Check quota for action
- `GET /api/usage/quota/alerts` - Get quota alerts

### Budget Management
- `GET /api/usage/budget` - Get budget information
- `POST /api/usage/budget` - Set/update budget

### Analytics & Reporting
- `GET /api/usage/report` - Generate usage report
- `GET /api/usage/forecast` - Forecast future usage
- `GET /api/usage/export` - Export usage data (CSV)

## Database Schema

### New Tables
- `UsageAggregation` - Time-series usage data
- `UserQuota` - Quota definitions and current usage
- `UsageAlert` - Quota and budget alerts
- `UserBudget` - Budget tracking and configuration

### Migration
Run Prisma migration to create tables:
```bash
npx prisma migrate dev --name add_usage_tracking
```

## Configuration

### Default Quotas
```typescript
const defaultQuota = {
  maxTokensPerMonth: 100000,      // 100K tokens
  maxApiCallsPerMonth: 1000,      // 1K API calls
  maxStorageBytes: 100 * 1024 * 1024, // 100MB
  maxCostPerMonth: 10,            // $10
  maxSessionsPerMonth: 100,
  maxMessagesPerMonth: 1000,
  maxPersonas: 5,
};
```

### Environment Variables
```bash
# Enable/disable features
USAGE_TRACKING_ENABLED=true
QUOTA_ENFORCEMENT_ENABLED=true

# Cache settings
PRICING_CACHE_TTL=300000  # 5 minutes
```

## Testing

### Unit Tests
```bash
cd backend
npm test -- src/services/usage/__tests__
```

### Integration Tests
Tests cover:
- Cost calculation with various pricing models
- Usage tracking for messages and API calls
- Quota enforcement logic
- Analytics and forecasting

## Performance Considerations

### Caching
- Pricing cache with 5-minute TTL
- Aggregated usage data for fast queries
- Real-time counters for quota checking

### Database Optimizations
- Indexed usage aggregations by period, user, persona, session
- Time-series data partitioning (hourly/daily)
- Efficient query patterns for common analytics

## Monitoring

### Key Metrics
- Quota check latency (< 100ms)
- Cost calculation accuracy
- Alert generation rate
- API usage patterns

### Logging
- All quota violations logged to audit log
- Cost calculation details for debugging
- Usage pattern analysis

## Troubleshooting

### Common Issues
1. **Quota not updating** - Check message tracking middleware
2. **Cost calculation incorrect** - Verify model pricing in database
3. **Alerts not firing** - Check alert thresholds and user preferences
4. **Performance issues** - Review caching configuration

### Debugging
Enable debug logging:
```typescript
console.log('Usage tracking:', await usageService.getRealTimeUsage(userId));
```

## Future Enhancements

### Planned Features
1. Advanced forecasting with machine learning
2. Custom quota templates per organization
3. Billing system integration
4. Multi-currency support
5. Usage anomaly detection

### Performance Improvements
1. Real-time streaming updates
2. Predictive caching
3. Columnar storage optimization
4. Distributed counting for high volume