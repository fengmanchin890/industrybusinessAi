# AI Core Service

FastAPI-based AI orchestration service for the AI Business Platform.

## Features

- **Multi-tenant architecture** - Secure data isolation per company
- **Vector search** - Qdrant integration for semantic search
- **LLM integration** - OpenAI and Anthropic support
- **Vision AI** - Image analysis and defect detection
- **NLP services** - Text generation, summarization, translation
- **Module registry** - Dynamic plugin system
- **Observability** - Prometheus metrics and structured logging

## Quick Start

### Local Development

```bash
# Create virtual environment
python -m venv .venv

# Activate virtual environment
# Windows
.venv\Scripts\activate
# Linux/Mac
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run the service
uvicorn app.main:app --reload --port 8000
```

### Docker

```bash
# Build image
docker build -t ai-core:latest .

# Run container
docker run -p 8000:8000 --env-file .env ai-core:latest
```

## Environment Variables

Create a `.env` file:

```env
# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/ai_platform

# Vector Database
QDRANT_URL=http://localhost:6333

# Cache
REDIS_URL=redis://localhost:6379

# AI Providers
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-...

# CORS
ALLOWED_ORIGINS=["http://localhost:5173","http://localhost:3000"]
```

## API Endpoints

### Health Check
- `GET /health` - Service health status

### Embeddings
- `POST /api/v1/embeddings/upsert` - Store document embeddings
- `POST /api/v1/embeddings/search` - Semantic search
- `GET /api/v1/embeddings/collections` - List collections

### Vision
- `POST /api/v1/vision/inspect` - Quality inspection
- `POST /api/v1/vision/analyze` - General image analysis
- `POST /api/v1/vision/upload` - Upload image

### NLP
- `POST /api/v1/nlp/generate` - Generate text
- `POST /api/v1/nlp/chat` - Chat with LLM
- `POST /api/v1/nlp/summarize` - Summarize text
- `POST /api/v1/nlp/translate` - Translate text

### Modules
- `GET /api/v1/modules/registry` - Get all modules
- `GET /api/v1/modules/by-industry/{industry_id}` - Filter by industry
- `GET /api/v1/modules/{module_id}` - Get specific module

## Authentication

All endpoints require Supabase JWT token in Authorization header:

```
Authorization: Bearer <supabase-jwt-token>
```

## Monitoring

- Prometheus metrics: `http://localhost:8000/metrics`
- API docs: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

