from pydantic_settings import BaseSettings
from typing import List, Union
from pydantic import field_validator


class Settings(BaseSettings):
    # Application
    APP_NAME: str = "AI Core Service"
    APP_VERSION: str = "0.1.0"
    DEBUG: bool = True
    
    # CORS
    ALLOWED_ORIGINS: Union[List[str], str] = ["http://localhost:5173", "http://localhost:3000"]
    
    @field_validator('ALLOWED_ORIGINS', mode='before')
    @classmethod
    def parse_origins(cls, v):
        """Parse ALLOWED_ORIGINS from string or list"""
        if isinstance(v, str):
            import json
            try:
                # Try to parse as JSON array
                return json.loads(v.replace("'", '"'))
            except:
                # If not JSON, split by comma
                return [origin.strip() for origin in v.split(',')]
        return v
    
    # Supabase
    SUPABASE_URL: str = ""
    SUPABASE_ANON_KEY: str = ""
    SUPABASE_SERVICE_ROLE_KEY: str = ""
    
    # Database
    DATABASE_URL: str = "postgresql://postgres:postgres@localhost:5432/ai_platform"
    
    # Vector Database
    QDRANT_URL: str = "http://localhost:6333"
    
    # Cache
    REDIS_URL: str = "redis://localhost:6379"
    
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

