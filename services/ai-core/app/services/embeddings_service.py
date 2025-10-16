from typing import List
from openai import AsyncOpenAI
from app.core.config import settings
from app.core.logging import app_logger


class EmbeddingsService:
    def __init__(self):
        self.client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY) if settings.OPENAI_API_KEY else None
    
    async def embed_text(self, text: str, model: str = "text-embedding-ada-002") -> List[float]:
        """Generate embedding for a single text"""
        if not self.client:
            app_logger.warning("OpenAI client not configured, returning mock embedding")
            return [0.0] * 1536  # Mock embedding
        
        try:
            response = await self.client.embeddings.create(
                input=text,
                model=model
            )
            return response.data[0].embedding
        except Exception as e:
            app_logger.error(f"Embedding generation failed: {e}")
            raise
    
    async def embed_texts(self, texts: List[str], model: str = "text-embedding-ada-002") -> List[List[float]]:
        """Generate embeddings for multiple texts"""
        if not self.client:
            app_logger.warning("OpenAI client not configured, returning mock embeddings")
            return [[0.0] * 1536 for _ in texts]  # Mock embeddings
        
        try:
            response = await self.client.embeddings.create(
                input=texts,
                model=model
            )
            return [data.embedding for data in response.data]
        except Exception as e:
            app_logger.error(f"Batch embedding generation failed: {e}")
            raise

