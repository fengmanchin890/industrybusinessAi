# Migration Guide - Moving Modules to New Backend

This guide helps you migrate existing AI modules to use the new FastAPI backend instead of direct third-party API calls.

## Overview

**Before**: Modules called OpenAI/Anthropic APIs directly from frontend  
**After**: Modules call FastAPI AI Core, which orchestrates AI services

## Benefits of Migration

- ✅ **Centralized AI logic** - Easier to maintain and update
- ✅ **Multi-tenant isolation** - Better security and data separation
- ✅ **Caching & rate limiting** - Improved performance and cost control
- ✅ **Monitoring** - Track usage and performance
- ✅ **Unified API** - Consistent interface across all modules

## Step-by-Step Migration

### Step 1: Import the New Service

**Before:**
```typescript
import { getAIService } from '../lib/ai-service';

const aiService = getAIService();
```

**After:**
```typescript
import { aiServiceV2 } from '../lib/ai-service-v2';
```

### Step 2: Update Text Generation Calls

**Before:**
```typescript
const response = await aiService.generateText(prompt, {
  maxTokens: 1000,
  temperature: 0.7
});
```

**After:**
```typescript
const response = await aiServiceV2.generateText(prompt, {
  maxTokens: 1000,
  temperature: 0.7,
  model: 'gpt-3.5-turbo' // optional
});
```

### Step 3: Update Chat Calls

**Before:**
```typescript
const response = await aiService.chat(messages, {
  maxTokens: 1000
});
```

**After:**
```typescript
const response = await aiServiceV2.chat(messages, {
  maxTokens: 1000,
  temperature: 0.7
});
```

### Step 4: Update Image Analysis

**Before:**
```typescript
// Direct OpenAI API call
const result = await fetch('https://api.openai.com/v1/...', {
  // ... complex setup
});
```

**After:**
```typescript
const result = await aiServiceV2.qualityInspection(
  imageBase64,
  {
    camera_id: 'CAM001',
    line: 'A1',
    shift: 'morning'
  }
);
```

## Example: Migrating Quality Inspection Module

### Before (Old Implementation)

```typescript
// QualityInspection.tsx
import { getAIService } from '../lib/ai-service';

export function QualityInspection() {
  const [image, setImage] = useState('');
  const [results, setResults] = useState(null);

  const handleInspection = async () => {
    // Direct API call to OpenAI
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4-vision-preview',
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: 'Analyze this image for defects' },
              { type: 'image_url', image_url: { url: image } }
            ]
          }
        ]
      })
    });

    const data = await response.json();
    setResults(data);
  };

  // ... rest of component
}
```

### After (New Implementation)

```typescript
// QualityInspection.tsx
import { aiServiceV2 } from '../../../lib/ai-service-v2';

export function QualityInspection() {
  const [image, setImage] = useState('');
  const [results, setResults] = useState<DefectResult | null>(null);
  const [loading, setLoading] = useState(false);

  const handleInspection = async () => {
    setLoading(true);
    try {
      const result = await aiServiceV2.qualityInspection(
        image, // base64 image
        {
          camera_id: selectedCamera,
          line: productionLine,
          shift: currentShift
        }
      );
      
      setResults(result);
    } catch (error) {
      console.error('Inspection failed:', error);
      // Handle error
    } finally {
      setLoading(false);
    }
  };

  // ... rest of component
}
```

## Example: Migrating Marketing Assistant

### Before

```typescript
const generateContent = async (prompt: string) => {
  const aiService = getAIService();
  const response = await aiService.generateText(prompt, {
    maxTokens: 500
  });
  return response.content;
};
```

### After

```typescript
const generateContent = async (prompt: string) => {
  const response = await aiServiceV2.generateText(
    prompt,
    {
      maxTokens: 500,
      temperature: 0.8, // More creative for marketing
      model: 'gpt-4' // Use better model for quality
    }
  );
  return response.content;
};
```

## Example: Adding Semantic Search

**New capability not available before:**

```typescript
// Add semantic search to your module
const searchProducts = async (query: string) => {
  const results = await aiServiceV2.searchEmbeddings(
    'products', // collection name
    query,
    5 // limit
  );
  
  return results.map(r => ({
    id: r.id,
    content: r.content,
    relevance: r.score
  }));
};

// First, upsert your product catalog
const indexProducts = async (products: Product[]) => {
  await aiServiceV2.upsertEmbeddings(
    'products',
    products.map(p => ({
      id: p.id,
      content: `${p.name} ${p.description}`,
      metadata: {
        category: p.category,
        price: p.price
      }
    }))
  );
};
```

## Authentication Handling

The new service automatically handles authentication using Supabase:

```typescript
// No need to manually pass tokens - handled internally
const result = await aiServiceV2.generateText('Hello');

// The service automatically:
// 1. Gets current session from Supabase
// 2. Extracts JWT token
// 3. Adds Authorization header
// 4. Sends request to AI Core
```

## Error Handling

```typescript
try {
  const result = await aiServiceV2.generateText(prompt);
  // Handle success
} catch (error) {
  if (error.message.includes('401')) {
    // Authentication error - redirect to login
    redirectToLogin();
  } else if (error.message.includes('429')) {
    // Rate limit - show friendly message
    showRateLimitMessage();
  } else {
    // Other errors
    showErrorMessage(error.message);
  }
}
```

## Testing Your Migration

### 1. Unit Testing

```typescript
// Mock the AI service
jest.mock('../lib/ai-service-v2', () => ({
  aiServiceV2: {
    generateText: jest.fn().mockResolvedValue({
      content: 'Mock response',
      model: 'gpt-3.5-turbo'
    })
  }
}));

// Test your component
test('generates marketing content', async () => {
  // ... test code
});
```

### 2. Integration Testing

```bash
# Start all services
.\scripts\start-services.ps1

# Test API directly
curl -X POST http://localhost:8000/api/v1/nlp/generate \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"prompt": "Test"}'
```

### 3. Frontend Testing

1. Start development server: `npm run dev`
2. Open browser DevTools
3. Test your migrated module
4. Check Network tab for API calls to `localhost:8000`

## Checklist

Use this checklist when migrating a module:

- [ ] Import `aiServiceV2` instead of `getAIService()`
- [ ] Update all `generateText()` calls
- [ ] Update all `chat()` calls
- [ ] Update all image analysis calls
- [ ] Remove direct API key usage
- [ ] Add proper error handling
- [ ] Test authentication flow
- [ ] Test with real data
- [ ] Update module documentation
- [ ] Add loading states
- [ ] Handle edge cases

## Common Issues

### Issue: "Authorization header missing"

**Cause**: User not logged in  
**Solution**: Ensure user is authenticated before calling AI services

```typescript
const { data: { session } } = await supabase.auth.getSession();
if (!session) {
  router.push('/login');
  return;
}
```

### Issue: "AI Core error: Connection refused"

**Cause**: AI Core service not running  
**Solution**: Start the service

```powershell
cd services/ai-core
.\.venv\Scripts\Activate.ps1
uvicorn app.main:app --reload --port 8000
```

### Issue: "OpenAI API key not configured"

**Cause**: Missing environment variable  
**Solution**: Add to `.env` file

```env
OPENAI_API_KEY=sk-your-key-here
```

## Performance Considerations

### Caching

The AI Core automatically caches responses. You can also implement client-side caching:

```typescript
const cache = new Map();

const getCachedContent = async (key: string, generator: () => Promise<string>) => {
  if (cache.has(key)) {
    return cache.get(key);
  }
  
  const result = await generator();
  cache.set(key, result);
  return result;
};
```

### Batch Operations

For multiple requests, consider batching:

```typescript
// Instead of multiple sequential calls
for (const item of items) {
  await processItem(item); // ❌ Slow
}

// Use Promise.all for parallel processing
await Promise.all(
  items.map(item => processItem(item)) // ✅ Fast
);
```

## Getting Help

- Check the API documentation: http://localhost:8000/docs
- Review service logs: `docker-compose logs ai-core`
- See `QUICKSTART.md` for setup issues
- Open GitHub issue for bugs

---

**Need help migrating a specific module?** Contact the development team or open a GitHub discussion.

