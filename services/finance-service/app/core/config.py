from pydantic_settings import BaseSettings
from typing import List, Union
from pydantic import field_validator


class Settings(BaseSettings):
    # Application
    APP_NAME: str = "Finance Service"
    APP_VERSION: str = "0.1.0"
    DEBUG: bool = True
    
    # CORS
    ALLOWED_ORIGINS: Union[List[str], str] = ["http://localhost:5173", "http://localhost:3000", "*"]
    
    @field_validator('ALLOWED_ORIGINS', mode='before')
    @classmethod
    def parse_origins(cls, v):
        """Parse ALLOWED_ORIGINS from string or list"""
        if isinstance(v, str):
            import json
            try:
                return json.loads(v.replace("'", '"'))
            except:
                return [origin.strip() for origin in v.split(',')]
        return v
    
    # Database
    DATABASE_URL: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/finance_db"
    
    # Redis
    REDIS_URL: str = "redis://localhost:6379/2"
    
    # AI Core Service
    AI_CORE_URL: str = "http://localhost:8000"
    
    # Data Connector
    DATA_CONNECTOR_URL: str = "http://localhost:8001"
    
    # JWT
    SECRET_KEY: str = "your-secret-key-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    class Config:
        env_file = ".env"
        case_sensitive = False


settings = Settings()

