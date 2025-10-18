# AI Business Platform - Enhancement Guide

This guide documents the new features and enhancements implemented in the platform.

## Table of Contents

1. [Unified AI Adapter](#unified-ai-adapter)
2. [API Gateway](#api-gateway)
3. [Tenant Management](#tenant-management)
4. [Data Connectors](#data-connectors)
5. [Model Registry & AutoML](#model-registry--automl)
6. [Cost Analytics](#cost-analytics)

---

## Unified AI Adapter

### Overview

The unified AI Adapter provides a single interface for all AI operations with automatic model selection, caching, error handling, and usage tracking.

### Features

- **Automatic Model Selection**: Chooses the best model based on task, budget, and priority
- **Intelligent Caching**: Reduces costs by caching similar requests
- **Fallback Support**: Automatically retries with alternative models on failure
- **Usage Tracking**: Logs all AI calls to Supabase for analytics
- **Cost Optimization**: Real-time cost calculation and optimization

### Usage

```typescript
import { aiAdapter } from './lib/ai-adapter';

// Simple text generation
const response = await aiAdapter.generate(prompt, {
  provider: 'auto',      // Auto-select best model
  caching: true,         // Enable caching
  fallback: true,        // Enable fallback
  priority: 'balanced'   // speed | accuracy | cost | balanced
});

// Chat with context
const chatResponse = await aiAdapter.chat([
  { role: 'system', content: 'You are a helpful assistant' },
  { role: 'user', content: 'Hello!' }
], { caching: true });

// Vision analysis
const visionResponse = await aiAdapter.vision(imageBase64, 'Describe this image');

// Get usage statistics
const stats = await aiAdapter.getUsageStats(startDate, endDate);
```

### Configuration

Models are automatically selected based on:
- Company subscription tier (free/pro/enterprise)
- Task complexity
- Priority setting (speed/accuracy/cost/balanced)
- Budget constraints
- Historical performance

---

## API Gateway

### Overview

Lightweight API Gateway using Supabase Edge Functions for unified API access with rate limiting and request logging.

### Features

- **Single Entry Point**: Unified API access for all services
- **Rate Limiting**: Tier-based rate limits (free: 100/day, pro: 1000/day, enterprise: 10000/day)
- **Request Logging**: All requests logged for monitoring and analytics
- **Authentication**: JWT token verification via Supabase
- **Service Routing**: Automatic routing to AI Core or Data Connector

### Deployment

```bash
# Deploy to Supabase
supabase functions deploy api-gateway

# Test locally
supabase functions serve api-gateway
```

### Usage

```typescript
// Instead of calling AI Core directly
const response = await fetch('http://ai-core:8000/api/v1/nlp/generate', {...});

// Use API Gateway
const response = await fetch('https://your-project.functions.supabase.co/api-gateway/ai/nlp/generate', {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({...})
});
```

### Rate Limit Handling

```typescript
const response = await fetch(apiUrl);
if (response.status === 429) {
  // Rate limit exceeded
  const retryAfter = response.headers.get('Retry-After');
  console.log(`Rate limited. Retry after ${retryAfter} seconds`);
}
```

---

## Tenant Management

### Overview

Complete tenant management system with user roles, usage analytics, and company settings.

### Features

- **Company Profile Management**: Edit company details, industry, settings
- **User Management**: Invite users, assign roles (Admin/Member/Viewer)
- **Usage Analytics**: View API calls, AI usage, costs by period
- **Role-Based Access**: Control permissions based on user roles
- **Data Isolation**: RLS policies ensure data isolation between tenants

### UI Components

#### TenantManagement.tsx
Main dashboard showing:
- Company overview
- User count and module count
- Subscription tier
- Usage statistics tabs

#### API Endpoints

```typescript
// Get company info
GET /api/v1/tenant/info

// Get users
GET /api/v1/tenant/users

// Invite user
POST /api/v1/tenant/users/invite
{
  "email": "user@example.com",
  "role": "member",
  "name": "John Doe"
}

// Update user role
PUT /api/v1/tenant/users/{user_id}/role
{
  "role": "admin"
}

// Get usage statistics
GET /api/v1/tenant/usage?period=day|week|month
```

---

## Data Connectors

### Database Connectors

Connect to external databases: MySQL, PostgreSQL, SQL Server, MongoDB

```python
# Test connection
POST /api/v1/connectors/database/test-connection
{
  "connection_type": "mysql",
  "host": "localhost",
  "port": 3306,
  "database": "mydb",
  "username": "user",
  "password": "pass",
  "ssl": false
}

# Execute query
POST /api/v1/connectors/database/query
{
  "company_id": "...",
  "config": {...},
  "query": "SELECT * FROM orders WHERE date > ?",
  "params": ["2024-01-01"]
}

# Sync table to Supabase
POST /api/v1/connectors/database/sync-table
{
  "company_id": "...",
  "config": {...},
  "table_name": "orders",
  "batch_size": 1000
}
```

### Cloud Storage Connectors

Connect to cloud storage: AWS S3, Azure Blob Storage, Google Cloud Storage

```python
# Test connection
POST /api/v1/connectors/cloud-storage/test-connection
{
  "provider": "s3",
  "credentials": {
    "access_key_id": "...",
    "secret_access_key": "..."
  },
  "bucket_name": "my-bucket",
  "region": "us-east-1"
}

# Upload file
POST /api/v1/connectors/cloud-storage/upload
- file: multipart/form-data
- config_json: JSON string

# List files
POST /api/v1/connectors/cloud-storage/list
{
  "company_id": "...",
  "config": {...},
  "prefix": "images/",
  "max_results": 100
}
```

### Taiwan-Specific APIs

#### LINE Messaging API

```python
# Send text message
POST /api/v1/connectors/taiwan/line/send-text
{
  "company_id": "...",
  "config": {
    "channel_access_token": "...",
    "channel_secret": "..."
  },
  "to": "U1234567890",
  "text": "Hello from AI Platform!"
}

# Send template message
POST /api/v1/connectors/taiwan/line/send-message
{
  "company_id": "...",
  "config": {...},
  "to": "U1234567890",
  "messages": [
    {
      "type": "template",
      "altText": "Button template",
      "template": {
        "type": "buttons",
        "text": "Choose action",
        "actions": [...]
      }
    }
  ]
}
```

#### ECPay Payment Gateway

```python
# Create payment
POST /api/v1/connectors/taiwan/ecpay/create-payment
{
  "company_id": "...",
  "config": {
    "merchant_id": "...",
    "hash_key": "...",
    "hash_iv": "...",
    "is_production": false
  },
  "merchant_trade_no": "ORDER123",
  "merchant_trade_date": "2024/01/01 10:00:00",
  "total_amount": 1000,
  "trade_desc": "商品描述",
  "item_name": "商品名稱",
  "return_url": "https://your-site.com/payment/callback"
}

# Verify callback
POST /api/v1/connectors/taiwan/ecpay/verify-callback
{
  "config": {...},
  "callback_data": {...}
}
```

---

## Model Registry & AutoML

### Model Registry

Central registry of all available AI models with performance metrics.

```typescript
// List all models
GET /api/v1/models/list?category=chat&provider=openai

// Get model info
GET /api/v1/models/info/gpt-3.5-turbo

// Select best model
POST /api/v1/models/select
{
  "task_type": "text_generation",
  "priority": "balanced",
  "max_budget_per_1k": 0.01
}

// Get recommendation
POST /api/v1/models/recommend
{
  "task_type": "chat"
}
```

### AutoML Service

Automated model evaluation and optimization.

```typescript
// Evaluate models
POST /api/v1/models/evaluate
{
  "task_type": "chat",
  "sample_data": [
    {"input": "...", "expected_output": "..."},
    ...
  ],
  "model_list": ["gpt-3.5-turbo", "claude-instant"],
  "metric": "accuracy"
}

// Optimize hyperparameters
POST /api/v1/models/optimize-hyperparameters
{
  "model_name": "gpt-3.5-turbo",
  "task_type": "chat",
  "sample_data": [...],
  "n_trials": 20
}

// Run A/B test
POST /api/v1/models/ab-test
{
  "model_a": "gpt-3.5-turbo",
  "model_b": "claude-instant",
  "task_type": "chat",
  "sample_data": [...],
  "metric": "accuracy"
}

// Suggest upgrade
POST /api/v1/models/suggest-upgrade
{
  "current_model": "gpt-3.5-turbo",
  "task_type": "chat",
  "monthly_budget": 100,
  "sample_data": [...]
}
```

---

## Cost Analytics

### Overview

Comprehensive cost tracking and optimization dashboard.

### Features

- **Real-time Cost Tracking**: Track AI spending in real-time
- **Model Usage Distribution**: See which models consume the most budget
- **Cache Performance**: Monitor cache hit rates and savings
- **Optimization Recommendations**: AI-powered suggestions to reduce costs
- **Period Comparison**: Compare costs across different time periods

### Dashboard Components

#### CostAnalytics.tsx

Shows:
- Total cost and trend
- Request count
- Cache hit rate
- Cost savings from caching
- Model usage pie chart
- Operation type distribution
- Optimization recommendations

### Cost Optimization Strategies

1. **Enable Caching**
   - Cache hit rate > 70% = excellent
   - Each cache hit saves API cost
   - Recommend enabling for all modules

2. **Choose Appropriate Models**
   - Use GPT-3.5 for simple tasks
   - Reserve GPT-4 for complex reasoning
   - Consider Claude Haiku for speed

3. **Batch Requests**
   - Combine multiple requests when possible
   - Use prompt templates to maximize cache hits

4. **Monitor Usage**
   - Set budget alerts
   - Review top spending modules monthly
   - A/B test cheaper alternatives

### Database Schema

```sql
-- AI usage logs
CREATE TABLE ai_usage_logs (
  id uuid PRIMARY KEY,
  company_id uuid NOT NULL,
  user_id uuid,
  operation text NOT NULL,
  model text NOT NULL,
  provider text NOT NULL,
  prompt_tokens int,
  completion_tokens int,
  total_tokens int,
  cost_usd numeric(10, 6),
  latency_ms int,
  cached boolean,
  created_at timestamptz DEFAULT now()
);

-- Model experiments (A/B testing)
CREATE TABLE model_experiments (
  id uuid PRIMARY KEY,
  company_id uuid NOT NULL,
  module_id text NOT NULL,
  model_a text NOT NULL,
  model_b text NOT NULL,
  traffic_split numeric(3, 2),
  metrics jsonb,
  winner text,
  status text,
  started_at timestamptz,
  ended_at timestamptz
);

-- API request logs
CREATE TABLE api_requests (
  id uuid PRIMARY KEY,
  company_id uuid,
  user_id uuid,
  endpoint text NOT NULL,
  method text NOT NULL,
  status_code int NOT NULL,
  latency_ms int,
  created_at timestamptz DEFAULT now()
);
```

---

## Migration Guide

### Updating Existing Modules

1. **Replace Old AI Service**

```typescript
// Before
import { generateText } from '../../../lib/ai-service';
const response = await generateText(prompt, options);

// After
import { aiAdapter } from '../../../lib/ai-adapter';
const response = await aiAdapter.generate(prompt, {
  provider: 'auto',
  caching: true,
  fallback: true,
  priority: 'balanced'
});
```

2. **Update Import Statements**

```typescript
// Old imports
import { generateText, chat, summarize } from '../../../lib/ai-service';

// New unified import
import { aiAdapter } from '../../../lib/ai-adapter';
```

3. **Handle New Response Format**

```typescript
// Response includes metadata
const response = await aiAdapter.generate(prompt);
console.log(response.content);      // Generated text
console.log(response.model);        // Model used
console.log(response.provider);     // Provider (openai/anthropic)
console.log(response.latency_ms);   // Response time
console.log(response.usage);        // Token usage and cost
console.log(response.cached);       // Whether from cache
```

---

## Best Practices

### AI Adapter

1. **Always enable caching** for production
2. **Use 'auto' provider** to leverage best available model
3. **Set appropriate priority** based on use case:
   - 'speed': Real-time chat, simple tasks
   - 'accuracy': Content generation, analysis
   - 'cost': High-volume operations
   - 'balanced': Most use cases

4. **Monitor usage** regularly via Cost Analytics dashboard

### Data Connectors

1. **Test connections** before deployment
2. **Use batch operations** for large data syncs
3. **Implement error handling** for network issues
4. **Secure credentials** using environment variables

### Tenant Management

1. **Assign roles carefully**: Admin has full access
2. **Monitor usage** by user to identify anomalies
3. **Set up rate limits** appropriate for subscription tier
4. **Review access logs** periodically

---

## Troubleshooting

### AI Adapter Issues

**Cache not working?**
- Check if `caching: true` is set
- Verify cache size limits
- Clear cache if needed: `aiAdapter.clearCache()`

**High costs?**
- Review model usage in Cost Analytics
- Enable caching if not already
- Consider switching to cheaper models for simple tasks

### Connector Issues

**Database connection fails?**
- Verify credentials
- Check network connectivity
- Ensure firewall allows connections
- Test with database client first

**Cloud storage errors?**
- Verify IAM permissions
- Check bucket/container exists
- Ensure credentials have read/write access

### Rate Limiting

**429 errors?**
- Check subscription tier limits
- Consider upgrading plan
- Implement request queuing
- Optimize high-frequency operations

---

## Next Steps

1. **Deploy Services**: Follow deployment guide for each service
2. **Configure Settings**: Set up company preferences in tenant management
3. **Monitor Usage**: Set up dashboards and alerts
4. **Optimize Costs**: Review recommendations and implement optimizations
5. **Train Team**: Ensure team understands new features

---

For additional support, see:
- [API Documentation](./api-docs.md)
- [Architecture Overview](./architecture/README.md)
- [Deployment Guide](./deployment.md)



