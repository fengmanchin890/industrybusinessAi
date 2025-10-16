from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    # Application
    APP_NAME: str = "AI Core Service"
    APP_VERSION: str = "0.1.0"
    DEBUG: bool = True
    
    # CORS
    ALLOWED_ORIGINS: List[str] = ["http://localhost:5173", "http://localhost:3000"]
    
    # Supabase
    SUPABASE_URL: str = ""
    SUPABASE_ANON_KEY: str = ""
    SUPABASE_SERVICE_ROLE_KEY: str = ""
    
    # Database
    DATABASE_URL: str = "postgresql://postgres:postgres@postgres:5432/ai_platform"
    
    # Vector Database
    QDRANT_URL: str = "http://qdrant:6333"
    
    # Cache
    REDIS_URL: str = "redis://redis:6379"
    
    # AI Providers
    OPENAI_API_KEY: str = ""
    OPENAI_BASE_URL: str = "https://api.openai.com/v1"
    ANTHROPIC_API_KEY: str = ""
    
    # Local AI
    LOCAL_AI_URL: str = ""
    
    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()

